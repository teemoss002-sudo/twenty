import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Subject under test: the tech double-booking check.
//   1. runtime literals (event name, trigger fields, active statuses, flag
//      fields, join column, resolver names) match the manifests, and the flag
//      fields can never re-trigger the check
//   2. the conflict rules: overlaps, back-to-back, ends-before-start, untimed
//   3. which techs and which job an event affects (reassign, delete, destroy)
//   4. the handler writes only changed flags, clears stale ones, pages through
//      large schedules, and propagates API errors

import jobObject from 'src/objects/job.object';
import jobAssignedTechField from 'src/fields/job/assigned-tech.field';

import jobScheduleFunction, { handler } from './on-job-schedule-changed';
import {
  ACTIVE_JOB_STATUSES,
  ENDS_BEFORE_START_DETAIL,
  evaluateStandaloneJob,
  evaluateTechSchedule,
  FIND_ACTIVE_JOBS_FOR_TECH_QUERY,
  formatOverlapDetail,
  NO_CONFLICT,
  planScheduleCheck,
  SCHEDULE_TRIGGER_FIELDS,
  type JobScheduleEvent,
  type ScheduledJob,
  UNTITLED_JOB_NAME,
  UPDATE_JOB_CONFLICT_MUTATION,
} from './job-schedule';

type FieldManifest = {
  name: string;
  type?: string;
  options?: Array<{ value: string }>;
};

const jobField = (name: string) =>
  (jobObject.config.fields as FieldManifest[]).find(
    (field) => field.name === name,
  );

const assignedTechJoinColumn = (
  jobAssignedTechField.config as { universalSettings?: { joinColumnName?: string } }
).universalSettings?.joinColumnName;

const job = (
  id: string,
  start: string | null,
  end: string | null,
  extra: Partial<ScheduledJob> = {},
): ScheduledJob => ({
  id,
  name: `Job ${id}`,
  status: 'SCHEDULED',
  scheduledStart: start,
  scheduledEnd: end,
  scheduleConflict: false,
  conflictDetails: '',
  ...extra,
});

const NINE = '2026-11-18T09:00:00.000Z';
const TEN = '2026-11-18T10:00:00.000Z';
const ELEVEN = '2026-11-18T11:00:00.000Z';
const NOON = '2026-11-18T12:00:00.000Z';

describe('runtime literals match the manifest', () => {
  it('runs on every job event and only on schedule-relevant updates', () => {
    const settings = jobScheduleFunction.config.databaseEventTriggerSettings;

    expect(settings?.eventName).toBe(`${jobObject.config.nameSingular}.*`);
    expect(settings?.updatedFields).toEqual(SCHEDULE_TRIGGER_FIELDS);

    for (const name of ['scheduledStart', 'scheduledEnd', 'status']) {
      expect(jobField(name), name).toBeDefined();
      expect(SCHEDULE_TRIGGER_FIELDS).toContain(name);
    }
    expect(SCHEDULE_TRIGGER_FIELDS).toContain(assignedTechJoinColumn);
  });

  it('never re-triggers itself: the flag fields it writes are not trigger fields', () => {
    expect(SCHEDULE_TRIGGER_FIELDS).not.toContain('scheduleConflict');
    expect(SCHEDULE_TRIGGER_FIELDS).not.toContain('conflictDetails');
  });

  it('treats every Job status except Completed and Cancelled as active', () => {
    const allStatuses = (jobField('status')?.options ?? []).map(
      (option) => option.value,
    );

    expect([...ACTIVE_JOB_STATUSES].sort()).toEqual(
      allStatuses.filter((status) => !['COMPLETED', 'CANCELLED'].includes(status)).sort(),
    );
  });

  it('writes flag fields that exist on Job with the expected types', () => {
    expect(jobField('scheduleConflict')?.type).toBe('BOOLEAN');
    expect(jobField('conflictDetails')?.type).toBe('TEXT');
  });

  it('targets the generated job resolvers and the tech join column', () => {
    expect(FIND_ACTIVE_JOBS_FOR_TECH_QUERY).toContain(
      `${jobObject.config.namePlural}(`,
    );
    expect(FIND_ACTIVE_JOBS_FOR_TECH_QUERY).toContain(
      `{ ${assignedTechJoinColumn}: { eq: $techId } }`,
    );
    expect(FIND_ACTIVE_JOBS_FOR_TECH_QUERY).toContain(
      'status: { in: [SCHEDULED, EN_ROUTE, IN_PROGRESS] }',
    );
    expect(UPDATE_JOB_CONFLICT_MUTATION).toContain('updateServiceJob(id: $id, data: $data)');
    expect(UPDATE_JOB_CONFLICT_MUTATION).toContain('ServiceJobUpdateInput!');
  });
});

describe('evaluateTechSchedule', () => {
  it('flags both jobs when they overlap, naming the other job', () => {
    const result = evaluateTechSchedule([
      job('a', NINE, ELEVEN),
      job('b', TEN, NOON),
    ]);

    expect(result.get('a')).toEqual({
      scheduleConflict: true,
      conflictDetails: 'Overlaps Job b',
    });
    expect(result.get('b')).toEqual({
      scheduleConflict: true,
      conflictDetails: 'Overlaps Job a',
    });
  });

  it('allows back-to-back jobs (one ends exactly when the next starts)', () => {
    const result = evaluateTechSchedule([
      job('a', NINE, TEN),
      job('b', TEN, ELEVEN),
    ]);

    expect(result.get('a')).toEqual(NO_CONFLICT);
    expect(result.get('b')).toEqual(NO_CONFLICT);
  });

  it('flags a job that ends before it starts, without counting it as an overlap', () => {
    const result = evaluateTechSchedule([
      job('a', ELEVEN, NINE),
      job('b', NINE, NOON),
    ]);

    expect(result.get('a')).toEqual({
      scheduleConflict: true,
      conflictDetails: ENDS_BEFORE_START_DETAIL,
    });
    expect(result.get('b')).toEqual(NO_CONFLICT);
  });

  it('ignores jobs missing a start or end time', () => {
    const result = evaluateTechSchedule([
      job('a', NINE, null),
      job('b', null, null),
      job('c', NINE, NOON),
    ]);

    expect([...result.values()]).toEqual([NO_CONFLICT, NO_CONFLICT, NO_CONFLICT]);
  });

  it('finds every overlap in a chain, not just neighbours', () => {
    const result = evaluateTechSchedule([
      job('long', NINE, NOON),
      job('first', NINE, TEN),
      job('second', TEN, ELEVEN),
    ]);

    expect(result.get('long')?.conflictDetails).toBe('Overlaps Job first, Job second');
    expect(result.get('first')?.conflictDetails).toBe('Overlaps Job long');
    expect(result.get('second')?.conflictDetails).toBe('Overlaps Job long');
  });

  it('keeps details short and names untitled jobs', () => {
    expect(formatOverlapDetail(['A', 'B', 'C', 'D', 'E'])).toBe(
      'Overlaps A, B, C and 2 more',
    );

    const result = evaluateTechSchedule([
      job('a', NINE, ELEVEN),
      job('b', TEN, NOON, { name: '  ' }),
    ]);

    expect(result.get('a')?.conflictDetails).toBe(`Overlaps ${UNTITLED_JOB_NAME}`);
  });
});

describe('evaluateStandaloneJob', () => {
  it('clears completed or cancelled jobs whatever their times', () => {
    expect(
      evaluateStandaloneJob(job('a', ELEVEN, NINE, { status: 'COMPLETED' })),
    ).toEqual(NO_CONFLICT);
  });

  it('flags an active job that ends before it starts', () => {
    expect(evaluateStandaloneJob(job('a', ELEVEN, NINE))).toEqual({
      scheduleConflict: true,
      conflictDetails: ENDS_BEFORE_START_DETAIL,
    });
  });
});

describe('planScheduleCheck', () => {
  it('checks both the old and new tech when a job is reassigned', () => {
    const plan = planScheduleCheck({
      name: 'serviceJob.updated',
      recordId: 'a',
      properties: {
        before: { assignedTechId: 'tech-1' },
        after: { id: 'a', assignedTechId: 'tech-2', status: 'SCHEDULED' },
      },
    });

    expect(plan.techIds).toEqual(['tech-2', 'tech-1']);
    expect(plan.triggerJob).toMatchObject({ id: 'a', assignedTechId: 'tech-2' });
  });

  it('rechecks the tech but not the job itself when a job is deleted or destroyed', () => {
    const deleted = planScheduleCheck({
      name: 'serviceJob.deleted',
      recordId: 'a',
      properties: {
        before: { assignedTechId: 'tech-1' },
        after: { id: 'a', assignedTechId: 'tech-1', deletedAt: NOON },
      },
    });
    const destroyed = planScheduleCheck({
      name: 'serviceJob.destroyed',
      recordId: 'a',
      properties: { before: { assignedTechId: 'tech-1' } },
    });

    expect(deleted).toEqual({ techIds: ['tech-1'], triggerJob: null });
    expect(destroyed).toEqual({ techIds: ['tech-1'], triggerJob: null });
  });

  it('handles a newly created job with no tech', () => {
    expect(
      planScheduleCheck({
        name: 'serviceJob.created',
        recordId: 'a',
        properties: { after: { id: 'a', status: 'SCHEDULED' } },
      }),
    ).toMatchObject({ techIds: [], triggerJob: { id: 'a', assignedTechId: null } });
  });
});

describe('handler (mock workspace API)', () => {
  type RecordedCall = { query: string; variables: Record<string, unknown> };

  let calls: RecordedCall[];
  let schedules: Record<string, ScheduledJob[][]>;

  const updatesSent = () =>
    calls
      .filter((call) => call.query.includes('updateServiceJob('))
      .map((call) => call.variables as { id: string; data: Record<string, unknown> });

  const updatedEvent = (
    after: Record<string, unknown>,
    before: Record<string, unknown> = {},
  ): JobScheduleEvent => ({
    name: 'serviceJob.updated',
    recordId: after.id as string,
    properties: { before, after },
  });

  beforeEach(() => {
    calls = [];
    schedules = {};
    vi.stubEnv('TWENTY_API_URL', 'https://crm.example.com');
    vi.stubEnv('TWENTY_APP_APPLICATION_ACCESS_TOKEN', 'app-token');
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.stubGlobal(
      'fetch',
      vi.fn(async (_url: string, init: { body: string }) => {
        const call = JSON.parse(init.body) as RecordedCall;

        calls.push(call);

        if (call.query.includes('updateServiceJob(')) {
          return new Response(
            JSON.stringify({ data: { updateServiceJob: { id: call.variables.id } } }),
            { status: 200 },
          );
        }

        const pages = schedules[call.variables.techId as string] ?? [[]];
        const pageIndex = call.variables.after ? Number(call.variables.after) : 0;
        const hasNextPage = pageIndex + 1 < pages.length;

        return new Response(
          JSON.stringify({
            data: {
              serviceJobs: {
                edges: (pages[pageIndex] ?? []).map((node) => ({ node })),
                pageInfo: {
                  hasNextPage,
                  endCursor: hasNextPage ? String(pageIndex + 1) : null,
                },
              },
            },
          }),
          { status: 200 },
        );
      }),
    );
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('flags both jobs when a reschedule creates a double-booking', async () => {
    schedules['tech-1'] = [[job('a', NINE, ELEVEN), job('b', TEN, NOON)]];

    const summary = await handler(
      updatedEvent({ id: 'a', assignedTechId: 'tech-1', status: 'SCHEDULED' }),
    );

    expect(updatesSent()).toEqual([
      { id: 'a', data: { scheduleConflict: true, conflictDetails: 'Overlaps Job b' } },
      { id: 'b', data: { scheduleConflict: true, conflictDetails: 'Overlaps Job a' } },
    ]);
    expect(summary).toContain('2 flagged, 0 cleared');
  });

  it('clears both flags once the clash is fixed', async () => {
    const flagged = { scheduleConflict: true, conflictDetails: 'Overlaps something' };

    schedules['tech-1'] = [[job('a', NINE, TEN, flagged), job('b', TEN, NOON, flagged)]];

    await handler(updatedEvent({ id: 'a', assignedTechId: 'tech-1', status: 'SCHEDULED' }));

    expect(updatesSent()).toEqual([
      { id: 'a', data: NO_CONFLICT },
      { id: 'b', data: NO_CONFLICT },
    ]);
  });

  it('writes nothing when every flag is already right', async () => {
    schedules['tech-1'] = [[job('a', NINE, TEN), job('b', TEN, NOON)]];

    await handler(updatedEvent({ id: 'a', assignedTechId: 'tech-1', status: 'SCHEDULED' }));

    expect(updatesSent()).toEqual([]);
  });

  it('rechecks the old tech after a reassignment so the left-behind job is cleared', async () => {
    schedules['tech-2'] = [[job('a', NINE, ELEVEN)]];
    schedules['tech-1'] = [[
      job('b', TEN, NOON, { scheduleConflict: true, conflictDetails: 'Overlaps Job a' }),
    ]];

    await handler(
      updatedEvent(
        { id: 'a', assignedTechId: 'tech-2', status: 'SCHEDULED' },
        { assignedTechId: 'tech-1' },
      ),
    );

    expect(calls.filter((call) => call.query.includes('serviceJobs(')).map((call) => call.variables.techId)).toEqual([
      'tech-2',
      'tech-1',
    ]);
    expect(updatesSent()).toEqual([{ id: 'b', data: NO_CONFLICT }]);
  });

  it('clears a completed job and the job it used to clash with', async () => {
    // The completed job is no longer in the tech's active schedule.
    schedules['tech-1'] = [[
      job('b', TEN, NOON, { scheduleConflict: true, conflictDetails: 'Overlaps Job a' }),
    ]];

    await handler(
      updatedEvent(
        {
          id: 'a',
          name: 'Job a',
          assignedTechId: 'tech-1',
          status: 'COMPLETED',
          scheduledStart: NINE,
          scheduledEnd: ELEVEN,
          scheduleConflict: true,
          conflictDetails: 'Overlaps Job b',
        },
        { status: 'IN_PROGRESS', assignedTechId: 'tech-1' },
      ),
    );

    expect(updatesSent()).toEqual([
      { id: 'b', data: NO_CONFLICT },
      { id: 'a', data: NO_CONFLICT },
    ]);
  });

  it('makes no API calls for a new job with no tech and no flag', async () => {
    const summary = await handler({
      name: 'serviceJob.created',
      recordId: 'a',
      properties: { after: { id: 'a', status: 'SCHEDULED', scheduleConflict: false } },
    });

    expect(calls).toHaveLength(0);
    expect(summary).toContain('skipped');
  });

  it('pages through a large schedule before deciding', async () => {
    schedules['tech-1'] = [[job('a', NINE, ELEVEN)], [job('b', TEN, NOON)]];

    await handler(updatedEvent({ id: 'a', assignedTechId: 'tech-1', status: 'SCHEDULED' }));

    expect(calls.filter((call) => call.query.includes('serviceJobs(')).map((call) => call.variables.after)).toEqual([
      null,
      '1',
    ]);
    expect(updatesSent().map((update) => update.id)).toEqual(['a', 'b']);
  });

  it('throws on API errors so the server re-queues the run', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        new Response(JSON.stringify({ errors: [{ message: 'Permission denied' }] }), {
          status: 200,
        }),
      ),
    );

    await expect(
      handler(updatedEvent({ id: 'a', assignedTechId: 'tech-1', status: 'SCHEDULED' })),
    ).rejects.toThrow('Permission denied');
  });
});
