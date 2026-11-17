import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Subject under test: the Estimate → Lead → Job handoff.
//   1. the runtime literals (event name, field name, option values, join
//      columns) match the manifest definitions they mirror — the handler cannot
//      import SDK/manifest values at runtime, so drift must be caught here
//   2. only a transition INTO Accepted hands off
//   3. the API payloads carry exactly what the handoff should write
//   4. the handler is retry-safe: the lead update always runs, a job is created
//      only when the estimate has none

import estimateObject from 'src/objects/estimate.object';
import jobObject from 'src/objects/job.object';
import leadStageField from 'src/fields/opportunity/lead-stage.field';
import jobEstimateField from 'src/fields/job/estimate.field';
import jobCustomerField from 'src/fields/job/customer.field';
import estimateLeadField from 'src/fields/estimate/lead.field';
import estimateCustomerField from 'src/fields/estimate/customer.field';

import estimateAcceptedFunction, {
  handler,
} from './on-estimate-accepted';
import {
  buildCreateJobVariables,
  buildJobName,
  buildMarkLeadWonVariables,
  CREATE_JOB_MUTATION,
  DEFAULT_JOB_NAME,
  ESTIMATE_STATUS_ACCEPTED,
  ESTIMATE_STATUS_FIELD_NAME,
  FIND_JOBS_FOR_ESTIMATE_QUERY,
  JOB_STATUS_SCHEDULED,
  LEAD_STAGE_WON,
  MARK_LEAD_WON_MUTATION,
  planEstimateHandoff,
  type EstimateUpdatedEvent,
} from './estimate-accepted';

type SelectFieldManifest = {
  name: string;
  options?: Array<{ value: string }>;
};

const optionValuesOf = (field: SelectFieldManifest | undefined) =>
  (field?.options ?? []).map((option) => option.value);

const objectField = (
  object: { config: { fields: unknown[] } },
  name: string,
) =>
  (object.config.fields as SelectFieldManifest[]).find(
    (field) => field.name === name,
  );

const joinColumnOf = (field: { config: unknown }) =>
  (field.config as { universalSettings?: { joinColumnName?: string } })
    .universalSettings?.joinColumnName;

const acceptedEvent = (
  overrides: Partial<{
    beforeStatus: string;
    name: string | null;
    leadId: string | null;
    customerId: string | null;
  }> = {},
): EstimateUpdatedEvent => ({
  recordId: 'estimate-1',
  properties: {
    before: { status: overrides.beforeStatus ?? 'SENT' },
    after: {
      id: 'estimate-1',
      name: overrides.name === undefined ? 'Kitchen rewire' : overrides.name,
      status: ESTIMATE_STATUS_ACCEPTED,
      leadId: overrides.leadId === undefined ? 'lead-1' : overrides.leadId,
      customerId:
        overrides.customerId === undefined
          ? 'person-1'
          : overrides.customerId,
    },
  },
});

describe('runtime literals match the manifest', () => {
  it('triggers on estimate updates that touch the status field', () => {
    const settings = estimateAcceptedFunction.config.databaseEventTriggerSettings;

    expect(settings?.eventName).toBe(
      `${estimateObject.config.nameSingular}.updated`,
    );
    expect(settings?.updatedFields).toEqual([ESTIMATE_STATUS_FIELD_NAME]);
    expect(objectField(estimateObject, ESTIMATE_STATUS_FIELD_NAME)).toBeDefined();
  });

  it('uses option values that exist on the Estimate, Lead and Job select fields', () => {
    expect(optionValuesOf(objectField(estimateObject, 'status'))).toContain(
      ESTIMATE_STATUS_ACCEPTED,
    );
    expect(
      optionValuesOf(leadStageField.config as SelectFieldManifest),
    ).toContain(LEAD_STAGE_WON);
    expect(optionValuesOf(objectField(jobObject, 'status'))).toContain(
      JOB_STATUS_SCHEDULED,
    );
  });

  it('reads and writes relations through their declared join columns', () => {
    expect(joinColumnOf(estimateLeadField)).toBe('leadId');
    expect(joinColumnOf(estimateCustomerField)).toBe('customerId');

    const jobData = buildCreateJobVariables({
      kind: 'handoff',
      estimateId: 'estimate-1',
      leadId: 'lead-1',
      customerId: 'person-1',
      jobName: 'Job',
    }).data;

    expect(Object.keys(jobData)).toContain(joinColumnOf(jobEstimateField));
    expect(Object.keys(jobData)).toContain(joinColumnOf(jobCustomerField));
    expect(FIND_JOBS_FOR_ESTIMATE_QUERY).toContain(
      `${joinColumnOf(jobEstimateField)}: { eq: $estimateId }`,
    );
  });

  it('targets the resolvers generated for the opportunity and job objects', () => {
    expect(MARK_LEAD_WON_MUTATION).toContain('updateOpportunity(id: $id');
    expect(MARK_LEAD_WON_MUTATION).toContain('OpportunityUpdateInput!');
    expect(CREATE_JOB_MUTATION).toContain('createServiceJob(data: $data)');
    expect(CREATE_JOB_MUTATION).toContain('ServiceJobCreateInput!');
    expect(FIND_JOBS_FOR_ESTIMATE_QUERY).toContain(
      `${jobObject.config.namePlural}(filter:`,
    );
  });
});

describe('planEstimateHandoff', () => {
  it('hands off when an estimate moves into Accepted', () => {
    expect(planEstimateHandoff(acceptedEvent())).toEqual({
      kind: 'handoff',
      estimateId: 'estimate-1',
      leadId: 'lead-1',
      customerId: 'person-1',
      jobName: 'Job for Kitchen rewire',
    });
  });

  it('skips when the new status is not Accepted', () => {
    const event = acceptedEvent();

    event.properties!.after!.status = 'DECLINED';

    expect(planEstimateHandoff(event).kind).toBe('skip');
  });

  it('skips when the estimate was already Accepted (re-save, not a transition)', () => {
    expect(
      planEstimateHandoff(acceptedEvent({ beforeStatus: ESTIMATE_STATUS_ACCEPTED }))
        .kind,
    ).toBe('skip');
  });

  it('falls back to the record id inside the event and skips without one', () => {
    const withoutRecordId = { ...acceptedEvent(), recordId: undefined };

    expect(planEstimateHandoff(withoutRecordId)).toMatchObject({
      kind: 'handoff',
      estimateId: 'estimate-1',
    });

    withoutRecordId.properties!.after!.id = null;

    expect(planEstimateHandoff(withoutRecordId).kind).toBe('skip');
  });

  it('still hands off when the estimate has no lead or customer', () => {
    expect(
      planEstimateHandoff(acceptedEvent({ leadId: null, customerId: null })),
    ).toMatchObject({ kind: 'handoff', leadId: null, customerId: null });
  });

  it('names the job after the estimate, with a default for unnamed ones', () => {
    expect(buildJobName('  Roof repair ')).toBe('Job for Roof repair');
    expect(buildJobName('')).toBe(DEFAULT_JOB_NAME);
    expect(buildJobName(null)).toBe(DEFAULT_JOB_NAME);
  });
});

describe('API payloads', () => {
  it('marks the lead Won and changes nothing else', () => {
    expect(buildMarkLeadWonVariables('lead-1')).toEqual({
      id: 'lead-1',
      data: { leadStage: LEAD_STAGE_WON },
    });
  });

  it('creates a Scheduled job linked to the estimate and customer, tech and times left blank', () => {
    expect(
      buildCreateJobVariables({
        kind: 'handoff',
        estimateId: 'estimate-1',
        leadId: 'lead-1',
        customerId: 'person-1',
        jobName: 'Job for Kitchen rewire',
      }),
    ).toEqual({
      data: {
        name: 'Job for Kitchen rewire',
        status: JOB_STATUS_SCHEDULED,
        estimateId: 'estimate-1',
        customerId: 'person-1',
      },
    });
  });

  it('omits customerId when the estimate has no customer', () => {
    const { data } = buildCreateJobVariables({
      kind: 'handoff',
      estimateId: 'estimate-1',
      leadId: null,
      customerId: null,
      jobName: DEFAULT_JOB_NAME,
    });

    expect(data).not.toHaveProperty('customerId');
  });
});

describe('handler (mock workspace API)', () => {
  type RecordedCall = { query: string; variables: Record<string, unknown> };

  let calls: RecordedCall[];
  let existingJobId: string | null;

  beforeEach(() => {
    calls = [];
    existingJobId = null;
    vi.stubEnv('TWENTY_API_URL', 'https://crm.example.com');
    vi.stubEnv('TWENTY_APP_APPLICATION_ACCESS_TOKEN', 'app-token');
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string, init: { body: string; headers: Record<string, string> }) => {
        expect(url).toBe('https://crm.example.com/graphql');
        expect(init.headers.Authorization).toBe('Bearer app-token');

        const call = JSON.parse(init.body) as RecordedCall;

        calls.push(call);

        const data = call.query.includes('updateOpportunity')
          ? { updateOpportunity: { id: 'lead-1', leadStage: LEAD_STAGE_WON } }
          : call.query.includes('serviceJobs(filter')
            ? {
                serviceJobs: {
                  edges: existingJobId ? [{ node: { id: existingJobId } }] : [],
                },
              }
            : { createServiceJob: { id: 'job-new', name: 'Job' } };

        return new Response(JSON.stringify({ data }), { status: 200 });
      }),
    );
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('marks the lead Won, then creates the job', async () => {
    const summary = await handler(acceptedEvent());

    expect(calls.map((call) => call.query.match(/(updateOpportunity|serviceJobs|createServiceJob)\(/)?.[1])).toEqual([
      'updateOpportunity',
      'serviceJobs',
      'createServiceJob',
    ]);
    expect(calls[0].variables).toEqual(buildMarkLeadWonVariables('lead-1'));
    expect(calls[2].variables).toMatchObject({
      data: { estimateId: 'estimate-1', customerId: 'person-1' },
    });
    expect(summary).toContain('job job-new created');
  });

  it('does not create a second job when the estimate already has one (retry or re-accept)', async () => {
    existingJobId = 'job-existing';

    const summary = await handler(acceptedEvent());

    expect(calls.some((call) => call.query.includes('createServiceJob('))).toBe(false);
    expect(calls[0].query).toContain('updateOpportunity');
    expect(summary).toContain('job job-existing already exists');
  });

  it('skips the lead update when the estimate has no lead', async () => {
    await handler(acceptedEvent({ leadId: null }));

    expect(calls.some((call) => call.query.includes('updateOpportunity'))).toBe(false);
    expect(calls.some((call) => call.query.includes('createServiceJob('))).toBe(true);
  });

  it('makes no API calls when the update is not a move into Accepted', async () => {
    const summary = await handler(
      acceptedEvent({ beforeStatus: ESTIMATE_STATUS_ACCEPTED }),
    );

    expect(calls).toHaveLength(0);
    expect(summary).toContain('skipped');
  });

  it('throws on API errors so the server re-queues the run', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        new Response(
          JSON.stringify({ errors: [{ message: 'Permission denied' }] }),
          { status: 200 },
        ),
      ),
    );

    await expect(handler(acceptedEvent())).rejects.toThrow('Permission denied');
  });
});
