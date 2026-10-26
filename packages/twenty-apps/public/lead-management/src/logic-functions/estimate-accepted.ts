import { CoreApiClient } from 'twenty-client-sdk/core';
import {
  defineLogicFunction,
  type DatabaseEventPayload,
  type ObjectRecordUpdateEvent,
} from 'twenty-sdk/define';

import { ESTIMATE_ACCEPTED_TO_JOB_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';

import {
  ESTIMATE_EVENT_NAME,
  ESTIMATE_STATUS_ACCEPTED,
  ESTIMATE_STATUS_FIELD_NAME,
  buildJobCreateInput,
  buildLeadWonUpdate,
  decideEstimateAcceptedAutomation,
  shouldMarkLeadWon,
  type EstimateEventRecord,
  type JobCreateInput,
  type LeadStageRecord,
} from './estimate-accepted-to-job';

/**
 * Estimate accepted → Job automation.
 *
 * Trigger: `estimate.updated`, filtered server-side to `updatedFields: ['status']`
 * (src/objects/estimate.object.ts declares the status select).
 *
 * On a transition to ACCEPTED (and only that transition — see
 * ./estimate-accepted-to-job.ts):
 *   1. re-read the estimate (the event may be a retry and the record is the
 *      source of truth for name / lead / customer / status);
 *   2. reuse the Job already linked to this estimate, or create one:
 *      name = estimate name (fallback: "Job from accepted estimate"),
 *      status = Scheduled, estimate + customer linked, nothing else copied;
 *   3. move the Lead (standard Opportunity) to leadStage = Won unless it is
 *      already Won.
 *
 * Idempotency: database-event triggers retry (the platform queues them with 3
 * retries), so both writes are guarded by a read. A second run finds the Job by
 * its estimate join column and skips creation; the Lead write is skipped when
 * the stage is already Won. The automation never deletes anything and never
 * reacts to its own writes (it only listens to estimate.updated).
 *
 * Failure policy: unlike the post-install hook (which fails safe because a
 * failed install is worse than an unlabeled object), this handler logs context
 * and rethrows. A failed create must surface in the function logs and be
 * retried by the queue; the read-before-write guards make the retry safe.
 *
 * Permissions: the app's default function role (src/roles/default-role.ts) holds
 * read on all objects plus read+update on Job and Opportunity — Twenty gates
 * record creation on `canUpdateObjectRecords`, so that override is what lets the
 * function create the Job.
 */

const ESTIMATE_STATUS_SELECTION = {
  id: true,
  name: true,
  status: true,
  leadId: true,
  customerId: true,
} as const;

const JOB_SELECTION = { id: true, status: true } as const;

const OPPORTUNITY_SELECTION = { id: true, leadStage: true } as const;

type Connection<T> = {
  edges?: Array<{ node?: T | null } | null> | null;
};

type EstimateRecord = EstimateEventRecord & { id: string };

type JobRecord = {
  id: string;
  status?: string | null;
};

/** Narrow the generated client's result type without leaking `any`. */
const asResult = <T>(value: unknown): T => value as T;

const firstNode = <T>(connection?: Connection<T> | null): T | null =>
  connection?.edges?.[0]?.node ?? null;

const findEstimateById = async (
  client: CoreApiClient,
  estimateId: string,
): Promise<EstimateRecord | null> => {
  const result = asResult<{ estimates?: Connection<EstimateRecord> }>(
    await client.query({
      estimates: {
        __args: { filter: { id: { eq: estimateId } }, first: 1 },
        edges: { node: ESTIMATE_STATUS_SELECTION },
      },
    }),
  );

  return firstNode(result.estimates);
};

/**
 * Any Job already pointing at this estimate makes the run a no-op for creation
 * (retry safety). The Job's own status is not interpreted: if dispatch cancelled
 * it, re-accepting the estimate does not silently resurrect it.
 */
const findExistingJobForEstimate = async (
  client: CoreApiClient,
  estimateId: string,
): Promise<JobRecord | null> => {
  const result = asResult<{ serviceJobs?: Connection<JobRecord> }>(
    await client.query({
      serviceJobs: {
        __args: { filter: { estimateId: { eq: estimateId } }, first: 1 },
        edges: { node: JOB_SELECTION },
      },
    }),
  );

  return firstNode(result.serviceJobs);
};

const createServiceJobFromEstimate = async (
  client: CoreApiClient,
  input: JobCreateInput,
): Promise<string> => {
  const result = asResult<{ createServiceJob?: { id?: string | null } | null }>(
    await client.mutation({
      createServiceJob: { __args: { data: input }, id: true },
    }),
  );

  const jobId = result.createServiceJob?.id;

  if (!jobId) {
    throw new Error('createServiceJob returned no record id');
  }

  return jobId;
};

const findLeadStage = async (
  client: CoreApiClient,
  leadId: string,
): Promise<LeadStageRecord | null> => {
  const result = asResult<{ opportunities?: Connection<LeadStageRecord> }>(
    await client.query({
      opportunities: {
        __args: { filter: { id: { eq: leadId } }, first: 1 },
        edges: { node: OPPORTUNITY_SELECTION },
      },
    }),
  );

  return firstNode(result.opportunities);
};

const markLeadWon = async (
  client: CoreApiClient,
  leadId: string,
): Promise<void> => {
  await client.mutation({
    updateOpportunity: {
      __args: { id: leadId, data: buildLeadWonUpdate() },
      id: true,
    },
  });
};

export type EstimateAcceptedAutomationResult =
  | { skipped: true; reason: string }
  | {
      skipped: false;
      estimateId: string;
      jobId: string;
      jobCreated: boolean;
      leadId: string | null;
      leadStageUpdated: boolean;
    };

export const handler = async (
  event: DatabaseEventPayload<ObjectRecordUpdateEvent<EstimateEventRecord>>,
): Promise<EstimateAcceptedAutomationResult> => {
  const decision = decideEstimateAcceptedAutomation(event);

  if (!decision.shouldRun) {
    return { skipped: true, reason: decision.reason };
  }

  try {
    const client = new CoreApiClient();
    const estimate = await findEstimateById(client, decision.estimateId);

    if (!estimate) {
      return {
        skipped: true,
        reason: `estimate ${decision.estimateId} not found`,
      };
    }

    // The event is only a hint: between the transition and this run the estimate
    // may have been reverted (e.g. Declined), in which case nothing is created.
    if (estimate.status !== ESTIMATE_STATUS_ACCEPTED) {
      return {
        skipped: true,
        reason: `estimate status is ${estimate.status ?? 'unknown'}`,
      };
    }

    const existingJob = await findExistingJobForEstimate(client, estimate.id);
    const jobId =
      existingJob?.id ??
      (await createServiceJobFromEstimate(client, buildJobCreateInput(estimate)));

    let leadStageUpdated = false;

    const lead = estimate.leadId
      ? await findLeadStage(client, estimate.leadId)
      : null;

    if (lead?.id && shouldMarkLeadWon(lead)) {
      await markLeadWon(client, lead.id);
      leadStageUpdated = true;
    }

    console.log(
      `[JobFlow] estimate ${estimate.id} accepted → job ${jobId} (${
        existingJob ? 'reused' : 'created'
      }), lead ${estimate.leadId ?? 'none'}${
        leadStageUpdated ? ' moved to WON' : ' stage unchanged'
      }`,
    );

    return {
      skipped: false,
      estimateId: estimate.id,
      jobId,
      jobCreated: existingJob === null,
      leadId: estimate.leadId ?? null,
      leadStageUpdated,
    };
  } catch (error) {
    console.error(
      `[JobFlow] estimate→job automation failed for estimate ${decision.estimateId}:`,
      error,
    );

    throw error;
  }
};

export default defineLogicFunction({
  universalIdentifier:
    ESTIMATE_ACCEPTED_TO_JOB_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER,
  name: 'estimate-accepted-to-job',
  description:
    'When an estimate becomes Accepted, creates the Job linked to that estimate and its customer and moves the lead to Won. Retry-safe: reuses an existing job and does not rewrite an already-Won lead.',
  timeoutSeconds: 30,
  handler,
  databaseEventTriggerSettings: {
    eventName: ESTIMATE_EVENT_NAME,
    updatedFields: [ESTIMATE_STATUS_FIELD_NAME],
  },
});
