import { defineLogicFunction } from 'twenty-sdk/define';

// NOTE: runtime literals live in ./job-completed.ts — SDK constants are stubbed
// inside built function bundles, so this handler must not import runtime
// values from twenty-sdk.

import { JOB_COMPLETED_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';

import { resolveApiAccess } from './api-access';
import {
  buildCreateInvoiceVariables,
  buildFindEstimateBillingVariables,
  buildFindInvoicesForJobVariables,
  CREATE_INVOICE_MUTATION,
  type EstimateBillingSnapshot,
  FIND_ESTIMATE_BILLING_QUERY,
  FIND_INVOICES_FOR_JOB_QUERY,
  JOB_STATUS_FIELD_NAME,
  JOB_UPDATED_EVENT_NAME,
  type JobUpdatedEvent,
  planInvoiceHandoff,
} from './job-completed';
import { requestWorkspaceApi } from './workspace-api';

/**
 * Job → Invoice handoff (see ./job-completed.ts for the rationale).
 *
 * Retry-safe: the existing-invoice check runs first and creation is the last
 * step, so a re-queued run after any failure never bills a job twice.
 */
export const handler = async (event: JobUpdatedEvent): Promise<string> => {
  const plan = planInvoiceHandoff(event);

  if (plan.kind === 'skip') {
    return `[JobFlow] invoice skipped: ${plan.reason}`;
  }

  const access = resolveApiAccess(process.env);

  const existing = await requestWorkspaceApi(
    access,
    FIND_INVOICES_FOR_JOB_QUERY,
    buildFindInvoicesForJobVariables(plan.serviceJobId),
  );

  const existingInvoiceId = (
    existing.invoices as
      | { edges?: Array<{ node?: { id?: string } }> }
      | undefined
  )?.edges?.[0]?.node?.id;

  if (existingInvoiceId) {
    const summary = `[JobFlow] job ${plan.serviceJobId} completed: invoice ${existingInvoiceId} already exists, none created`;

    console.log(summary);

    return summary;
  }

  let estimate: EstimateBillingSnapshot | null = null;

  if (plan.estimateId) {
    const found = await requestWorkspaceApi(
      access,
      FIND_ESTIMATE_BILLING_QUERY,
      buildFindEstimateBillingVariables(plan.estimateId),
    );

    estimate = (found.estimate as EstimateBillingSnapshot | null) ?? null;
  }

  const created = await requestWorkspaceApi(
    access,
    CREATE_INVOICE_MUTATION,
    buildCreateInvoiceVariables(plan, estimate),
  );
  const createdInvoiceId = (created.createInvoice as { id?: string } | undefined)
    ?.id;

  const source = estimate
    ? `prefilled from estimate ${plan.estimateId}`
    : 'no estimate to prefill from';
  const summary = `[JobFlow] job ${plan.serviceJobId} completed: draft invoice ${createdInvoiceId ?? '(unknown id)'} created (${source})`;

  console.log(summary);

  return summary;
};

export default defineLogicFunction({
  universalIdentifier: JOB_COMPLETED_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER,
  name: 'job-completed-invoice',
  description:
    'When a Job moves to Completed: creates a Draft Invoice linked to the job and customer, with amount and line items copied from the job’s estimate (skipped if the job already has an invoice).',
  timeoutSeconds: 30,
  databaseEventTriggerSettings: {
    eventName: JOB_UPDATED_EVENT_NAME,
    updatedFields: [JOB_STATUS_FIELD_NAME],
  },
  handler,
});
