import { describe, expect, it } from 'vitest';

// Pure guards for the accepted-estimate → Job automation. The handler itself
// performs I/O (mocked in ./estimate-accepted.test.ts); this file pins the rules
// that must never regress, because each one prevents a duplicate or spurious
// write against a real workspace:
//   1. only the estimate.status transition TO ACCEPTED runs;
//   2. a re-save of an already-accepted estimate never runs;
//   3. an update that does not touch status never runs;
//   4. the job payload is exactly name + status + estimate link (+ customer when
//      the estimate has one) — nothing else is copied from the estimate;
//   5. a lead is moved to Won only when it is not already Won.

import {
  DEFAULT_JOB_NAME,
  ESTIMATE_EVENT_NAME,
  ESTIMATE_STATUS_ACCEPTED,
  JOB_STATUS_SCHEDULED,
  LEAD_STAGE_WON,
  buildJobCreateInput,
  buildLeadWonUpdate,
  decideEstimateAcceptedAutomation,
  resolveJobName,
  shouldMarkLeadWon,
  type EstimateUpdateEvent,
} from './estimate-accepted-to-job';

const ESTIMATE_ID = '11111111-1111-1111-1111-111111111111';
const LEAD_ID = '22222222-2222-2222-2222-222222222222';
const CUSTOMER_ID = '33333333-3333-3333-3333-333333333333';

const buildAcceptedEvent = (
  overrides: Partial<EstimateUpdateEvent> = {},
): EstimateUpdateEvent => ({
  name: ESTIMATE_EVENT_NAME,
  recordId: ESTIMATE_ID,
  properties: {
    before: { id: ESTIMATE_ID, status: 'SENT' },
    after: {
      id: ESTIMATE_ID,
      name: 'Replace water heater',
      status: ESTIMATE_STATUS_ACCEPTED,
      leadId: LEAD_ID,
      customerId: CUSTOMER_ID,
    },
    updatedFields: ['status'],
  },
  ...overrides,
});

describe('accepted-estimate trigger decision', () => {
  it('runs on the transition to accepted and returns the estimate id', () => {
    expect(decideEstimateAcceptedAutomation(buildAcceptedEvent())).toEqual({
      shouldRun: true,
      estimateId: ESTIMATE_ID,
    });
  });

  it('falls back to recordId when the after snapshot omits the id', () => {
    const event = buildAcceptedEvent();

    event.properties = {
      ...event.properties,
      after: { status: ESTIMATE_STATUS_ACCEPTED },
    };

    expect(decideEstimateAcceptedAutomation(event)).toEqual({
      shouldRun: true,
      estimateId: ESTIMATE_ID,
    });
  });

  it('skips a status change that is not accepted', () => {
    const event = buildAcceptedEvent();

    event.properties = {
      ...event.properties,
      after: { id: ESTIMATE_ID, status: 'DECLINED' },
    };

    expect(decideEstimateAcceptedAutomation(event)).toEqual({
      shouldRun: false,
      reason: 'estimate status is DECLINED',
    });
  });

  it('skips a re-save of an already-accepted estimate', () => {
    const event = buildAcceptedEvent();

    event.properties = {
      ...event.properties,
      before: { id: ESTIMATE_ID, status: ESTIMATE_STATUS_ACCEPTED },
    };

    expect(decideEstimateAcceptedAutomation(event)).toMatchObject({
      shouldRun: false,
      reason: 'estimate was already accepted',
    });
  });

  it('reads the previous status from the diff when the before snapshot is missing', () => {
    const event = buildAcceptedEvent();

    event.properties = {
      after: { id: ESTIMATE_ID, status: ESTIMATE_STATUS_ACCEPTED },
      updatedFields: ['status'],
      diff: { status: { before: ESTIMATE_STATUS_ACCEPTED, after: ESTIMATE_STATUS_ACCEPTED } },
    };

    expect(decideEstimateAcceptedAutomation(event)).toMatchObject({
      shouldRun: false,
      reason: 'estimate was already accepted',
    });
  });

  it('skips an update that did not touch status', () => {
    const event = buildAcceptedEvent();

    event.properties = {
      ...event.properties,
      updatedFields: ['name', 'totalAmount'],
    };

    expect(decideEstimateAcceptedAutomation(event)).toMatchObject({
      shouldRun: false,
      reason: 'status was not among the updated fields',
    });
  });

  it('still runs when the payload omits updatedFields (slim event)', () => {
    const event = buildAcceptedEvent();

    event.properties = {
      ...event.properties,
      updatedFields: undefined,
    };

    expect(decideEstimateAcceptedAutomation(event)).toEqual({
      shouldRun: true,
      estimateId: ESTIMATE_ID,
    });
  });

  it('skips events for another object', () => {
    expect(
      decideEstimateAcceptedAutomation(
        buildAcceptedEvent({ name: 'opportunity.updated' }),
      ),
    ).toMatchObject({
      shouldRun: false,
      reason: 'opportunity.updated is not an estimate.updated event',
    });
  });

  it('skips a payload with no after snapshot', () => {
    expect(
      decideEstimateAcceptedAutomation(
        buildAcceptedEvent({
          properties: { before: { id: ESTIMATE_ID, status: 'SENT' } },
        }),
      ),
    ).toMatchObject({ shouldRun: false, reason: 'event carries no after snapshot' });
  });

  it('skips a payload with no estimate id anywhere', () => {
    expect(
      decideEstimateAcceptedAutomation({
        name: ESTIMATE_EVENT_NAME,
        properties: {
          after: { status: ESTIMATE_STATUS_ACCEPTED },
        },
      }),
    ).toMatchObject({
      shouldRun: false,
      reason: 'event carries no estimate id',
    });
  });
});

describe('job create payload', () => {
  it('links the estimate and copies the name as the job name', () => {
    expect(
      buildJobCreateInput({
        id: ESTIMATE_ID,
        name: '  Replace water heater  ',
        leadId: LEAD_ID,
        customerId: CUSTOMER_ID,
      }),
    ).toEqual({
      name: 'Replace water heater',
      status: JOB_STATUS_SCHEDULED,
      estimateId: ESTIMATE_ID,
      customerId: CUSTOMER_ID,
    });
  });

  it('omits the customer link when the estimate has no customer', () => {
    const input = buildJobCreateInput({
      id: ESTIMATE_ID,
      name: 'Repair fence',
      customerId: null,
    });

    expect(input).toEqual({
      name: 'Repair fence',
      status: JOB_STATUS_SCHEDULED,
      estimateId: ESTIMATE_ID,
    });
    expect(Object.keys(input).sort()).toEqual([
      'estimateId',
      'name',
      'status',
    ]);
  });

  it('never copies other estimate fields into the job', () => {
    const input = buildJobCreateInput({
      id: ESTIMATE_ID,
      name: 'Install sink',
      leadId: LEAD_ID,
      customerId: CUSTOMER_ID,
      // @ts-expect-error — fields the automation must not forward
      validUntil: '2026-12-01',
    });

    expect(Object.keys(input).sort()).toEqual([
      'customerId',
      'estimateId',
      'name',
      'status',
    ]);
  });

  it.each([
    [undefined],
    [null],
    [''],
    ['   '],
  ])('falls back to the default job name for %p', (estimateName) => {
    expect(resolveJobName(estimateName)).toBe(DEFAULT_JOB_NAME);
  });
});

describe('lead Won guard', () => {
  it('marks a lead that is still in the pipeline', () => {
    expect(shouldMarkLeadWon({ id: LEAD_ID, leadStage: 'QUALIFIED' })).toBe(true);
  });

  it('does not rewrite a lead that is already Won', () => {
    expect(
      shouldMarkLeadWon({ id: LEAD_ID, leadStage: LEAD_STAGE_WON }),
    ).toBe(false);
  });

  it.each([[null], [undefined], [{}], [{ id: null, leadStage: 'NEW' }]])(
    'does nothing without a lead record (%p)',
    (lead) => {
      expect(shouldMarkLeadWon(lead)).toBe(false);
    },
  );

  it('builds exactly the stage update', () => {
    expect(buildLeadWonUpdate()).toEqual({ leadStage: 'WON' });
  });
});
