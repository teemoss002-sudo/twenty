/**
 * Pure decision + payload builders for the "accepted estimate → Job" automation,
 * split out of estimate-accepted.ts so every hard invariant is unit-testable
 * without a Twenty server or a database:
 *
 *   1. the trigger only reacts to the estimate.status transition TO accepted —
 *      never to a re-save of an already-accepted estimate, never to edits of
 *      other fields (the server-side `updatedFields` filter is defence in depth,
 *      not the only guard);
 *   2. the Job is created from the accepted estimate alone: the estimate it came
 *      from, plus the estimate's customer when one is set. Nothing else is
 *      copied (scheduling and technician assignment stay manual);
 *   3. the Lead is moved to Won only when it is not already Won, so a retried or
 *      duplicated event cannot cause a second write.
 *
 * RUNTIME CONSTRAINT (same as lead-labels.ts): the SDK build stubs every
 * non-`define*` export of `twenty-sdk/define` inside function bundles, so handler
 * code must not read SDK constants (FieldType, STANDARD_OBJECT_UNIVERSAL_…).
 * Every value this module compares against is a literal string that mirrors the
 * manifest definitions in src/objects/*.object.ts and src/fields/*.
 */

/** Server-side event name: `${nameSingular}.${action}` (see the manifest build). */
export const ESTIMATE_EVENT_NAME = 'estimate.updated';

/** Field name on the Estimate object (src/objects/estimate.object.ts). */
export const ESTIMATE_STATUS_FIELD_NAME = 'status';

/** Select option value in src/objects/estimate.object.ts. */
export const ESTIMATE_STATUS_ACCEPTED = 'ACCEPTED';

/** Select option value in src/fields/opportunity/lead-stage.field.ts. */
export const LEAD_STAGE_WON = 'WON';

/** Select option value in src/objects/job.object.ts. */
export const JOB_STATUS_SCHEDULED = 'SCHEDULED';

/** Fallback when the estimate has an empty name (its default is ''). */
export const DEFAULT_JOB_NAME = 'Job from accepted estimate';

export type EstimateEventRecord = {
  id?: string | null;
  name?: string | null;
  status?: string | null;
  leadId?: string | null;
  customerId?: string | null;
};

/**
 * The subset of the database-event payload this automation reads. Declared
 * structurally so tests can build a payload without the server's full event
 * (which also carries workspaceId, objectMetadata, user ids, …).
 */
export type EstimateUpdateEvent = {
  name?: string | null;
  recordId?: string | null;
  properties?: {
    before?: EstimateEventRecord | null;
    after?: EstimateEventRecord | null;
    updatedFields?: string[] | null;
    diff?: Record<
      string,
      { before?: unknown; after?: unknown } | undefined
    > | null;
  } | null;
};

export type EstimateAcceptedDecision =
  | { shouldRun: true; estimateId: string }
  | { shouldRun: false; reason: string };

const skip = (reason: string): EstimateAcceptedDecision => ({
  shouldRun: false,
  reason,
});

/**
 * Decide whether this event is the accepted transition the automation owns.
 * Returns the estimate id to load (the event's `after.id`, falling back to
 * `recordId`) so the handler re-reads the authoritative record.
 */
export const decideEstimateAcceptedAutomation = (
  event: EstimateUpdateEvent,
): EstimateAcceptedDecision => {
  const eventName = event.name ?? ESTIMATE_EVENT_NAME;

  if (eventName !== ESTIMATE_EVENT_NAME) {
    return skip(`${eventName} is not an ${ESTIMATE_EVENT_NAME} event`);
  }

  const properties = event.properties ?? {};
  const after = properties.after ?? null;

  if (!after) {
    return skip('event carries no after snapshot');
  }

  if (after.status !== ESTIMATE_STATUS_ACCEPTED) {
    return skip(`estimate status is ${after.status ?? 'unknown'}`);
  }

  // `before` is present on the full event; slim payloads only carry the diff.
  const diffPreviousStatus =
    properties.diff?.[ESTIMATE_STATUS_FIELD_NAME]?.before;
  const previousStatus =
    properties.before !== null && properties.before !== undefined
      ? (properties.before.status ?? null)
      : typeof diffPreviousStatus === 'string'
        ? diffPreviousStatus
        : null;

  if (previousStatus === ESTIMATE_STATUS_ACCEPTED) {
    return skip('estimate was already accepted');
  }

  const updatedFields = properties.updatedFields ?? null;

  if (
    Array.isArray(updatedFields) &&
    updatedFields.length > 0 &&
    !updatedFields.includes(ESTIMATE_STATUS_FIELD_NAME)
  ) {
    return skip('status was not among the updated fields');
  }

  const estimateId = after.id ?? event.recordId ?? null;

  if (!estimateId) {
    return skip('event carries no estimate id');
  }

  return { shouldRun: true, estimateId };
};

export type JobCreateInput = {
  name: string;
  status: string;
  estimateId: string;
  customerId?: string;
};

/** The estimate name, or a stable fallback when it is empty/whitespace. */
export const resolveJobName = (estimateName?: string | null): string => {
  const trimmedName = estimateName?.trim() ?? '';

  return trimmedName.length > 0 ? trimmedName : DEFAULT_JOB_NAME;
};

/**
 * Build the createServiceJob input. The payload is deliberately exact: name + status +
 * the estimate join column, and the customer join column only when the estimate
 * has a customer. Tests pin the key set so future edits cannot silently start
 * copying fields (e.g. a start date) that dispatch has to own.
 */
export const buildJobCreateInput = (
  estimate: EstimateEventRecord & { id: string },
): JobCreateInput => ({
  name: resolveJobName(estimate.name),
  status: JOB_STATUS_SCHEDULED,
  estimateId: estimate.id,
  ...(estimate.customerId ? { customerId: estimate.customerId } : {}),
});

export type LeadStageRecord = {
  id?: string | null;
  leadStage?: string | null;
};

/** True only when the lead exists and is not already Won. */
export const shouldMarkLeadWon = (
  lead: LeadStageRecord | null | undefined,
): boolean => {
  if (!lead?.id) {
    return false;
  }

  return lead.leadStage !== LEAD_STAGE_WON;
};

export const buildLeadWonUpdate = (): { leadStage: string } => ({
  leadStage: LEAD_STAGE_WON,
});
