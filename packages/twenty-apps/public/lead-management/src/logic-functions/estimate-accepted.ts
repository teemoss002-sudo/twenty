/**
 * Estimate → Lead → Job handoff: constants, decision logic and API payload
 * builders, split out of on-estimate-accepted.ts so every piece the app owns is
 * unit-tested (estimate-accepted.test.ts) without network I/O.
 *
 * When an Estimate's status changes to Accepted:
 *   1. its linked Lead (standard Opportunity) moves to stage Won
 *   2. a Job is created for it (status Scheduled, linked to the estimate and
 *      customer) unless the estimate already has one
 *
 * Server-verified (twenty-server source):
 *  - Database event triggers match `<objectNameSingular>.<operation>`, so
 *    `estimate.updated`; `updatedFields` keeps only update events whose
 *    `properties.updatedFields` include one of the listed field names
 *    (logic-function-trigger/triggers/database-event/).
 *  - A failed run is re-queued up to 3 times (retryLimit: 3), so the handler
 *    must be idempotent: the lead update is idempotent by nature, and job
 *    creation is guarded by an existing-job lookup on `estimateId`.
 *  - Workspace GraphQL names (get-resolver-name.util.ts, input-type
 *    generators): findMany `jobs`, createOne `createJob(data: JobCreateInput!)`,
 *    updateOne `updateOpportunity(id: UUID!, data: OpportunityUpdateInput!)`.
 *    MANY_TO_ONE relations are written through their join column
 *    (`estimateId`, `customerId`).
 *  - Record inserts are authorised by `canUpdateObjectRecords`
 *    (twenty-orm/repository/permissions.utils.ts), which is what the function
 *    role grants on Opportunity and Job (src/roles/default-role.ts).
 *  - The handler calls the API with the app's own token (see ./api-access.ts),
 *    so it works whoever accepted the estimate — a Sales Rep, for instance,
 *    has no Job permissions of their own.
 *
 * RUNTIME CONSTRAINT: like lead-labels.ts, this file must not import runtime
 * values from twenty-sdk — SDK constants are stubbed to empty strings inside
 * built function bundles. Select-option values are therefore literals here, and
 * estimate-accepted.test.ts pins each one to the manifest definitions.
 */

// Trigger: Estimate updates that touch `status`.
export const ESTIMATE_UPDATED_EVENT_NAME = 'estimate.updated';
export const ESTIMATE_STATUS_FIELD_NAME = 'status';

// Select-option values (pinned to the manifests by estimate-accepted.test.ts).
export const ESTIMATE_STATUS_ACCEPTED = 'ACCEPTED';
export const LEAD_STAGE_WON = 'WON';
export const JOB_STATUS_SCHEDULED = 'SCHEDULED';

export const DEFAULT_JOB_NAME = 'Job from accepted estimate';

/** The Estimate fields the handoff reads from a database event. */
export type EstimateSnapshot = {
  id?: string | null;
  name?: string | null;
  status?: string | null;
  leadId?: string | null;
  customerId?: string | null;
};

/** The subset of an `estimate.updated` event payload the handoff reads. */
export type EstimateUpdatedEvent = {
  recordId?: string | null;
  properties?: {
    before?: EstimateSnapshot | null;
    after?: EstimateSnapshot | null;
  } | null;
};

export type EstimateHandoffPlan =
  | { kind: 'skip'; reason: string }
  | {
      kind: 'handoff';
      estimateId: string;
      leadId: string | null;
      customerId: string | null;
      jobName: string;
    };

export const buildJobName = (estimateName?: string | null): string => {
  const trimmed = estimateName?.trim();

  return trimmed ? `Job for ${trimmed}` : DEFAULT_JOB_NAME;
};

/**
 * Decide what to do with one `estimate.updated` event. Only a transition INTO
 * Accepted hands off; re-saving an already-accepted estimate does nothing.
 */
export const planEstimateHandoff = (
  event: EstimateUpdatedEvent,
): EstimateHandoffPlan => {
  const before = event.properties?.before ?? null;
  const after = event.properties?.after ?? null;

  if (after?.status !== ESTIMATE_STATUS_ACCEPTED) {
    return { kind: 'skip', reason: 'estimate status is not Accepted' };
  }

  if (before?.status === ESTIMATE_STATUS_ACCEPTED) {
    return {
      kind: 'skip',
      reason: 'estimate was already Accepted before this update',
    };
  }

  const estimateId = event.recordId ?? after.id ?? null;

  if (!estimateId) {
    return { kind: 'skip', reason: 'event carries no estimate id' };
  }

  return {
    kind: 'handoff',
    estimateId,
    leadId: after.leadId ?? null,
    customerId: after.customerId ?? null,
    jobName: buildJobName(after.name),
  };
};

// -----------------------------------------------------------------------------
// Workspace GraphQL documents (POST {TWENTY_API_URL}/graphql). Values travel as
// variables, never interpolated into the document.
// -----------------------------------------------------------------------------

export const MARK_LEAD_WON_MUTATION = `mutation JobFlowMarkLeadWon($id: UUID!, $data: OpportunityUpdateInput!) {
  updateOpportunity(id: $id, data: $data) { id leadStage }
}`;

export const FIND_JOBS_FOR_ESTIMATE_QUERY = `query JobFlowFindJobsForEstimate($estimateId: UUID!) {
  jobs(filter: { estimateId: { eq: $estimateId } }, first: 1) { edges { node { id } } }
}`;

export const CREATE_JOB_MUTATION = `mutation JobFlowCreateJobFromEstimate($data: JobCreateInput!) {
  createJob(data: $data) { id name }
}`;

export const buildMarkLeadWonVariables = (leadId: string) => ({
  id: leadId,
  data: { leadStage: LEAD_STAGE_WON },
});

export const buildFindJobsForEstimateVariables = (estimateId: string) => ({
  estimateId,
});

export const buildCreateJobVariables = (
  plan: Extract<EstimateHandoffPlan, { kind: 'handoff' }>,
) => ({
  data: {
    name: plan.jobName,
    status: JOB_STATUS_SCHEDULED,
    estimateId: plan.estimateId,
    ...(plan.customerId ? { customerId: plan.customerId } : {}),
  },
});
