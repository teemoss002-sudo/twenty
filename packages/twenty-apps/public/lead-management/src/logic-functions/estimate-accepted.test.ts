import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// The handler performs I/O through CoreApiClient, which the Twenty runtime
// injects (twenty-sdk stubs nothing here — the client is external to the built
// bundle). Mock the module so the tests exercise the real control flow:
//   1. accepted transition → create the Job (linked) + move the lead to Won;
//   2. retried event → reuse the existing Job, never create a second one;
//   3. estimate reverted before the run → no writes;
//   4. already-Won lead → job only, no opportunity write;
//   5. failed create → rejects (queue retries) and never writes the lead;
//   6. missing estimate / deleted lead → safe no-ops.
// The query order asserted here is the handler's contract:
//   estimates → serviceJobs → createServiceJob? → opportunities → updateOpportunity?

const { queryMock, mutationMock } = vi.hoisted(() => ({
  queryMock: vi.fn(),
  mutationMock: vi.fn(),
}));

vi.mock('twenty-client-sdk/core', () => ({
  CoreApiClient: vi.fn(function () {
    return { query: queryMock, mutation: mutationMock };
  }),
}));

import estimateAccepted, { handler } from './estimate-accepted';

const ESTIMATE_ID = '11111111-1111-1111-1111-111111111111';
const LEAD_ID = '22222222-2222-2222-2222-222222222222';
const CUSTOMER_ID = '33333333-3333-3333-3333-333333333333';
const JOB_ID = '44444444-4444-4444-4444-444444444444';

type HandlerEvent = Parameters<typeof handler>[0];

const buildEvent = (
  overrides: Partial<{ status: string; beforeStatus: string }> = {},
): HandlerEvent =>
  ({
    name: 'estimate.updated',
    workspaceId: 'workspace-id',
    recordId: ESTIMATE_ID,
    properties: {
      before: { id: ESTIMATE_ID, status: overrides.beforeStatus ?? 'SENT' },
      after: {
        id: ESTIMATE_ID,
        name: 'Replace water heater',
        status: overrides.status ?? 'ACCEPTED',
        leadId: LEAD_ID,
        customerId: CUSTOMER_ID,
      },
      updatedFields: ['status'],
    },
  }) as unknown as HandlerEvent;

const mockEstimateQuery = (
  node: Record<string, unknown> | null,
): void => {
  queryMock.mockResolvedValueOnce({
    estimates: { edges: node ? [{ node }] : [] },
  });
};

const mockJobsQuery = (node: Record<string, unknown> | null): void => {
  queryMock.mockResolvedValueOnce({
    serviceJobs: { edges: node ? [{ node }] : [] },
  });
};

const mockLeadQuery = (node: Record<string, unknown> | null): void => {
  queryMock.mockResolvedValueOnce({
    opportunities: { edges: node ? [{ node }] : [] },
  });
};

const acceptedEstimate = {
  id: ESTIMATE_ID,
  name: 'Replace water heater',
  status: 'ACCEPTED',
  leadId: LEAD_ID,
  customerId: CUSTOMER_ID,
};

beforeEach(() => {
  queryMock.mockReset();
  mutationMock.mockReset();
  mutationMock.mockResolvedValue({});
  vi.spyOn(console, 'log').mockImplementation(() => undefined);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('estimate-accepted-to-job wiring', () => {
  it('validates and listens to estimate status updates only', () => {
    expect(estimateAccepted.success).toBe(true);
    expect(estimateAccepted.config.name).toBe('estimate-accepted-to-job');
    expect(estimateAccepted.config.databaseEventTriggerSettings).toEqual({
      eventName: 'estimate.updated',
      updatedFields: ['status'],
    });
  });

  it('keeps the runtime budget pinned', () => {
    expect(estimateAccepted.config.timeoutSeconds).toBe(30);
  });
});

describe('accepted transition', () => {
  it('creates the linked job and moves the lead to Won', async () => {
    mockEstimateQuery(acceptedEstimate);
    mockJobsQuery(null);
    mockLeadQuery({ id: LEAD_ID, leadStage: 'QUALIFIED' });
    mutationMock
      .mockResolvedValueOnce({ createServiceJob: { id: JOB_ID } })
      .mockResolvedValueOnce({ updateOpportunity: { id: LEAD_ID } });

    const result = await handler(buildEvent());

    expect(result).toEqual({
      skipped: false,
      estimateId: ESTIMATE_ID,
      jobId: JOB_ID,
      jobCreated: true,
      leadId: LEAD_ID,
      leadStageUpdated: true,
    });

    const jobQuery = queryMock.mock.calls[1][0].serviceJobs;

    expect(jobQuery.__args).toEqual({
      filter: { estimateId: { eq: ESTIMATE_ID } },
      first: 1,
    });

    expect(mutationMock.mock.calls[0][0]).toEqual({
      createServiceJob: {
        __args: {
          data: {
            name: 'Replace water heater',
            status: 'SCHEDULED',
            estimateId: ESTIMATE_ID,
            customerId: CUSTOMER_ID,
          },
        },
        id: true,
      },
    });

    expect(mutationMock.mock.calls[1][0]).toEqual({
      updateOpportunity: {
        __args: { id: LEAD_ID, data: { leadStage: 'WON' } },
        id: true,
      },
    });
  });

  it('reuses a job already linked to the estimate (retry safety)', async () => {
    mockEstimateQuery(acceptedEstimate);
    mockJobsQuery({ id: JOB_ID, status: 'SCHEDULED' });
    mockLeadQuery({ id: LEAD_ID, leadStage: 'QUALIFIED' });
    mutationMock.mockResolvedValueOnce({ updateOpportunity: { id: LEAD_ID } });

    const result = await handler(buildEvent());

    expect(result).toMatchObject({
      skipped: false,
      jobId: JOB_ID,
      jobCreated: false,
      leadStageUpdated: true,
    });
    expect(mutationMock).toHaveBeenCalledTimes(1);
    expect(mutationMock.mock.calls[0][0]).toHaveProperty('updateOpportunity');
  });

  it('does not rewrite a lead that is already Won', async () => {
    mockEstimateQuery(acceptedEstimate);
    mockJobsQuery(null);
    mockLeadQuery({ id: LEAD_ID, leadStage: 'WON' });
    mutationMock.mockResolvedValueOnce({ createServiceJob: { id: JOB_ID } });

    const result = await handler(buildEvent());

    expect(result).toMatchObject({
      skipped: false,
      jobCreated: true,
      leadStageUpdated: false,
    });
    expect(mutationMock).toHaveBeenCalledTimes(1);
    expect(mutationMock.mock.calls[0][0]).toHaveProperty('createServiceJob');
  });

  it('creates the job without a customer link when the estimate has none', async () => {
    mockEstimateQuery({ ...acceptedEstimate, customerId: null, leadId: null });
    mockJobsQuery(null);
    mutationMock.mockResolvedValueOnce({ createServiceJob: { id: JOB_ID } });

    const result = await handler(buildEvent());

    expect(result).toMatchObject({
      skipped: false,
      jobCreated: true,
      leadId: null,
      leadStageUpdated: false,
    });
    expect(queryMock).toHaveBeenCalledTimes(2);
    expect(mutationMock.mock.calls[0][0].createServiceJob.__args.data).toEqual({
      name: 'Replace water heater',
      status: 'SCHEDULED',
      estimateId: ESTIMATE_ID,
    });
  });
});

describe('safe no-ops', () => {
  it('makes no API call for an event that is not an accepted transition', async () => {
    const result = await handler(buildEvent({ status: 'SENT' }));

    expect(result).toMatchObject({ skipped: true, reason: 'estimate status is SENT' });
    expect(queryMock).not.toHaveBeenCalled();
    expect(mutationMock).not.toHaveBeenCalled();
  });

  it('makes no API call when the estimate was already accepted', async () => {
    const result = await handler(buildEvent({ beforeStatus: 'ACCEPTED' }));

    expect(result).toMatchObject({
      skipped: true,
      reason: 'estimate was already accepted',
    });
    expect(queryMock).not.toHaveBeenCalled();
  });

  it('does nothing when the estimate was reverted before the run', async () => {
    mockEstimateQuery({ ...acceptedEstimate, status: 'DECLINED' });

    const result = await handler(buildEvent());

    expect(result).toMatchObject({
      skipped: true,
      reason: 'estimate status is DECLINED',
    });
    expect(queryMock).toHaveBeenCalledTimes(1);
    expect(mutationMock).not.toHaveBeenCalled();
  });

  it('does nothing when the estimate no longer exists', async () => {
    mockEstimateQuery(null);

    const result = await handler(buildEvent());

    expect(result).toEqual({
      skipped: true,
      reason: `estimate ${ESTIMATE_ID} not found`,
    });
    expect(mutationMock).not.toHaveBeenCalled();
  });

  it('still creates the job when the linked lead was deleted', async () => {
    mockEstimateQuery(acceptedEstimate);
    mockJobsQuery(null);
    mockLeadQuery(null);
    mutationMock.mockResolvedValueOnce({ createServiceJob: { id: JOB_ID } });

    const result = await handler(buildEvent());

    expect(result).toMatchObject({
      skipped: false,
      jobCreated: true,
      leadStageUpdated: false,
    });
    expect(mutationMock).toHaveBeenCalledTimes(1);
  });
});

describe('failure policy', () => {
  it('rethrows a failed job create and never writes the lead', async () => {
    mockEstimateQuery(acceptedEstimate);
    mockJobsQuery(null);
    mutationMock.mockRejectedValueOnce(
      new Error('permission denied on createServiceJob'),
    );
    const consoleError = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);

    await expect(handler(buildEvent())).rejects.toThrow(
      'permission denied on createServiceJob',
    );

    expect(mutationMock).toHaveBeenCalledTimes(1);
    expect(queryMock).toHaveBeenCalledTimes(2);
    expect(consoleError).toHaveBeenCalledWith(
      expect.stringContaining(ESTIMATE_ID),
      expect.any(Error),
    );
  });
});
