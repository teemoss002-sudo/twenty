/**
 * Job → Invoice handoff: constants, decision logic and API payload builders,
 * split out of on-job-completed.ts so every piece the app owns is unit-tested
 * (job-completed.test.ts) without network I/O.
 *
 * When a Job's status changes to Completed, a Draft Invoice is created for it
 * (linked to the job and customer, amount and line items copied from the job's
 * estimate when there is one) unless the job already has an invoice. The office
 * reviews the draft, sets issue/due dates and sends it.
 *
 * Same server-verified mechanics as estimate-accepted.ts (trigger matching,
 * `updatedFields` filtering, 3 retries, resolver/input naming, join-column
 * writes, inserts authorised by canUpdateObjectRecords), plus:
 *  - findOne takes `filter` (get-resolver-args.util.ts): `estimate(filter:)`.
 *  - CURRENCY is the composite { amountMicros, currencyCode }
 *    (twenty-shared currency.composite-type.ts); it is copied through as-is.
 *
 * RUNTIME CONSTRAINT: no runtime imports from twenty-sdk (SDK constants are
 * stubbed in built bundles); literals are pinned to the manifests by
 * job-completed.test.ts.
 */

export const JOB_UPDATED_EVENT_NAME = 'job.updated';
export const JOB_STATUS_FIELD_NAME = 'status';

// Select-option values (pinned to the manifests by job-completed.test.ts).
export const JOB_STATUS_COMPLETED = 'COMPLETED';
export const INVOICE_STATUS_DRAFT = 'DRAFT';

export const DEFAULT_INVOICE_NAME = 'Invoice for completed job';

export type JobSnapshot = {
  id?: string | null;
  name?: string | null;
  status?: string | null;
  estimateId?: string | null;
  customerId?: string | null;
};

export type JobUpdatedEvent = {
  recordId?: string | null;
  properties?: {
    before?: JobSnapshot | null;
    after?: JobSnapshot | null;
  } | null;
};

export type InvoiceHandoffPlan =
  | { kind: 'skip'; reason: string }
  | {
      kind: 'invoice';
      jobId: string;
      estimateId: string | null;
      customerId: string | null;
      invoiceName: string;
    };

export type CurrencyValue = {
  amountMicros?: number | string | null;
  currencyCode?: string | null;
};

export type EstimateBillingSnapshot = {
  totalAmount?: CurrencyValue | null;
  lineItems?: unknown;
};

// Jobs the handoff creates are named "Job for <estimate>"; bill as
// "Invoice for <estimate>" rather than "Invoice for Job for <estimate>".
const JOB_NAME_PREFIX = /^job for\s+/i;

export const buildInvoiceName = (jobName?: string | null): string => {
  const subject = jobName?.trim().replace(JOB_NAME_PREFIX, '').trim();

  return subject ? `Invoice for ${subject}` : DEFAULT_INVOICE_NAME;
};

/**
 * Decide what to do with one `job.updated` event. Only a transition INTO
 * Completed bills; re-saving a completed job does nothing.
 */
export const planInvoiceHandoff = (
  event: JobUpdatedEvent,
): InvoiceHandoffPlan => {
  const before = event.properties?.before ?? null;
  const after = event.properties?.after ?? null;

  if (after?.status !== JOB_STATUS_COMPLETED) {
    return { kind: 'skip', reason: 'job status is not Completed' };
  }

  if (before?.status === JOB_STATUS_COMPLETED) {
    return {
      kind: 'skip',
      reason: 'job was already Completed before this update',
    };
  }

  const jobId = event.recordId ?? after.id ?? null;

  if (!jobId) {
    return { kind: 'skip', reason: 'event carries no job id' };
  }

  return {
    kind: 'invoice',
    jobId,
    estimateId: after.estimateId ?? null,
    customerId: after.customerId ?? null,
    invoiceName: buildInvoiceName(after.name),
  };
};

// -----------------------------------------------------------------------------
// Workspace GraphQL documents (POST {TWENTY_API_URL}/graphql).
// -----------------------------------------------------------------------------

export const FIND_INVOICES_FOR_JOB_QUERY = `query JobFlowFindInvoicesForJob($jobId: UUID!) {
  invoices(filter: { jobId: { eq: $jobId } }, first: 1) { edges { node { id } } }
}`;

export const FIND_ESTIMATE_BILLING_QUERY = `query JobFlowFindEstimateBilling($estimateId: UUID!) {
  estimate(filter: { id: { eq: $estimateId } }) { id totalAmount { amountMicros currencyCode } lineItems }
}`;

export const CREATE_INVOICE_MUTATION = `mutation JobFlowCreateInvoiceFromJob($data: InvoiceCreateInput!) {
  createInvoice(data: $data) { id name }
}`;

export const buildFindInvoicesForJobVariables = (jobId: string) => ({ jobId });

export const buildFindEstimateBillingVariables = (estimateId: string) => ({
  estimateId,
});

const hasAmount = (
  value: CurrencyValue | null | undefined,
): value is CurrencyValue =>
  value?.amountMicros !== null &&
  value?.amountMicros !== undefined &&
  Boolean(value.currencyCode);

export const buildCreateInvoiceVariables = (
  plan: Extract<InvoiceHandoffPlan, { kind: 'invoice' }>,
  estimate: EstimateBillingSnapshot | null,
) => ({
  data: {
    name: plan.invoiceName,
    status: INVOICE_STATUS_DRAFT,
    jobId: plan.jobId,
    ...(plan.customerId ? { customerId: plan.customerId } : {}),
    ...(hasAmount(estimate?.totalAmount)
      ? {
          amount: {
            amountMicros: estimate.totalAmount.amountMicros,
            currencyCode: estimate.totalAmount.currencyCode,
          },
        }
      : {}),
    ...(estimate?.lineItems !== null && estimate?.lineItems !== undefined
      ? { lineItems: estimate.lineItems }
      : {}),
  },
});
