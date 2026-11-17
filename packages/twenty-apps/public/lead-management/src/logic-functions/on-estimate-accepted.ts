import { defineLogicFunction } from 'twenty-sdk/define';

// NOTE: runtime literals (option values, GraphQL documents) live in
// ./estimate-accepted.ts — SDK constants are stubbed inside built function
// bundles, so this handler must not import runtime values from twenty-sdk.

import { ESTIMATE_ACCEPTED_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';

import { resolveApiAccess } from './api-access';
import {
  buildCreateJobVariables,
  buildFindJobsForEstimateVariables,
  buildMarkLeadWonVariables,
  CREATE_JOB_MUTATION,
  ESTIMATE_STATUS_FIELD_NAME,
  ESTIMATE_UPDATED_EVENT_NAME,
  type EstimateUpdatedEvent,
  FIND_JOBS_FOR_ESTIMATE_QUERY,
  MARK_LEAD_WON_MUTATION,
  planEstimateHandoff,
} from './estimate-accepted';
import { requestWorkspaceApi } from './workspace-api';

/**
 * Estimate → Lead → Job handoff (see ./estimate-accepted.ts for the
 * server-verified rationale).
 *
 * Order matters for retries: the lead update runs first and is idempotent;
 * the job is created last and only when the estimate has none yet. A retry
 * after a partial failure therefore finishes the work without duplicating it.
 */

export const handler = async (event: EstimateUpdatedEvent): Promise<string> => {
  const plan = planEstimateHandoff(event);

  if (plan.kind === 'skip') {
    return `[JobFlow] handoff skipped: ${plan.reason}`;
  }

  const access = resolveApiAccess(process.env);
  const outcomes: string[] = [];

  if (plan.leadId) {
    await requestWorkspaceApi(
      access,
      MARK_LEAD_WON_MUTATION,
      buildMarkLeadWonVariables(plan.leadId),
    );
    outcomes.push(`lead ${plan.leadId} marked Won`);
  } else {
    outcomes.push('no linked lead to mark Won');
  }

  const existing = await requestWorkspaceApi(
    access,
    FIND_JOBS_FOR_ESTIMATE_QUERY,
    buildFindJobsForEstimateVariables(plan.estimateId),
  );

  const existingJobId = (
    existing.jobs as { edges?: Array<{ node?: { id?: string } }> } | undefined
  )?.edges?.[0]?.node?.id;

  if (existingJobId) {
    outcomes.push(`job ${existingJobId} already exists, none created`);
  } else {
    const created = await requestWorkspaceApi(
      access,
      CREATE_JOB_MUTATION,
      buildCreateJobVariables(plan),
    );
    const createdJobId = (created.createJob as { id?: string } | undefined)
      ?.id;

    outcomes.push(`job ${createdJobId ?? '(unknown id)'} created`);
  }

  const summary = `[JobFlow] estimate ${plan.estimateId} accepted: ${outcomes.join('; ')}`;

  console.log(summary);

  return summary;
};

export default defineLogicFunction({
  universalIdentifier: ESTIMATE_ACCEPTED_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER,
  name: 'estimate-accepted-handoff',
  description:
    'When an Estimate moves to Accepted: marks its Lead as Won and creates a Scheduled Job linked to the estimate and customer (skipped if the estimate already has a job).',
  timeoutSeconds: 30,
  databaseEventTriggerSettings: {
    eventName: ESTIMATE_UPDATED_EVENT_NAME,
    updatedFields: [ESTIMATE_STATUS_FIELD_NAME],
  },
  handler,
});
