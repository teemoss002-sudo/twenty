import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Subject under test: the Job → Invoice handoff.
//   1. runtime literals (event name, field name, option values, join columns,
//      resolver names) match the manifest definitions they mirror
//   2. only a transition INTO Completed bills
//   3. the draft invoice copies amount and line items from the estimate when
//      there is one, and stays valid when there is not
//   4. the handler is retry-safe: an existing invoice means no second one

import estimateObject from 'src/objects/estimate.object';
import invoiceObject from 'src/objects/invoice.object';
import jobObject from 'src/objects/job.object';
import invoiceJobField from 'src/fields/invoice/job.field';
import invoiceCustomerField from 'src/fields/invoice/customer.field';
import jobEstimateField from 'src/fields/job/estimate.field';
import jobCustomerField from 'src/fields/job/customer.field';

import jobCompletedFunction, { handler } from './on-job-completed';
import {
  buildCreateInvoiceVariables,
  buildInvoiceName,
  CREATE_INVOICE_MUTATION,
  DEFAULT_INVOICE_NAME,
  FIND_ESTIMATE_BILLING_QUERY,
  FIND_INVOICES_FOR_JOB_QUERY,
  INVOICE_STATUS_DRAFT,
  JOB_STATUS_COMPLETED,
  JOB_STATUS_FIELD_NAME,
  planInvoiceHandoff,
  type EstimateBillingSnapshot,
  type JobUpdatedEvent,
} from './job-completed';

type FieldManifest = {
  name: string;
  type?: string;
  options?: Array<{ value: string }>;
};

const objectField = (
  object: { config: { fields: unknown[] } },
  name: string,
) =>
  (object.config.fields as FieldManifest[]).find(
    (field) => field.name === name,
  );

const optionValuesOf = (field: FieldManifest | undefined) =>
  (field?.options ?? []).map((option) => option.value);

const joinColumnOf = (field: { config: unknown }) =>
  (field.config as { universalSettings?: { joinColumnName?: string } })
    .universalSettings?.joinColumnName;

const ESTIMATE: EstimateBillingSnapshot = {
  totalAmount: { amountMicros: 1250000000, currencyCode: 'USD' },
  lineItems: [{ description: 'Rewire kitchen', quantity: 1, unitPrice: 1250 }],
};

const completedEvent = (
  overrides: Partial<{
    beforeStatus: string;
    name: string | null;
    estimateId: string | null;
    customerId: string | null;
  }> = {},
): JobUpdatedEvent => ({
  recordId: 'job-1',
  properties: {
    before: { status: overrides.beforeStatus ?? 'IN_PROGRESS' },
    after: {
      id: 'job-1',
      name: overrides.name === undefined ? 'Job for Kitchen rewire' : overrides.name,
      status: JOB_STATUS_COMPLETED,
      estimateId:
        overrides.estimateId === undefined ? 'estimate-1' : overrides.estimateId,
      customerId:
        overrides.customerId === undefined ? 'person-1' : overrides.customerId,
    },
  },
});

const invoicePlan = {
  kind: 'invoice' as const,
  jobId: 'job-1',
  estimateId: 'estimate-1',
  customerId: 'person-1',
  invoiceName: 'Invoice for Kitchen rewire',
};

describe('runtime literals match the manifest', () => {
  it('triggers on job updates that touch the status field', () => {
    const settings = jobCompletedFunction.config.databaseEventTriggerSettings;

    expect(settings?.eventName).toBe(`${jobObject.config.nameSingular}.updated`);
    expect(settings?.updatedFields).toEqual([JOB_STATUS_FIELD_NAME]);
    expect(objectField(jobObject, JOB_STATUS_FIELD_NAME)).toBeDefined();
  });

  it('uses option values that exist on the Job and Invoice status fields', () => {
    expect(optionValuesOf(objectField(jobObject, 'status'))).toContain(
      JOB_STATUS_COMPLETED,
    );
    expect(optionValuesOf(objectField(invoiceObject, 'status'))).toContain(
      INVOICE_STATUS_DRAFT,
    );
  });

  it('reads job relations and writes invoice relations through their join columns', () => {
    expect(joinColumnOf(jobEstimateField)).toBe('estimateId');
    expect(joinColumnOf(jobCustomerField)).toBe('customerId');

    const { data } = buildCreateInvoiceVariables(invoicePlan, ESTIMATE);

    expect(Object.keys(data)).toContain(joinColumnOf(invoiceJobField));
    expect(Object.keys(data)).toContain(joinColumnOf(invoiceCustomerField));
    expect(FIND_INVOICES_FOR_JOB_QUERY).toContain(
      `${joinColumnOf(invoiceJobField)}: { eq: $jobId }`,
    );
  });

  it('copies between fields that exist with matching types on Estimate and Invoice', () => {
    expect(objectField(estimateObject, 'totalAmount')?.type).toBe('CURRENCY');
    expect(objectField(invoiceObject, 'amount')?.type).toBe('CURRENCY');
    expect(objectField(estimateObject, 'lineItems')?.type).toBe('RAW_JSON');
    expect(objectField(invoiceObject, 'lineItems')?.type).toBe('RAW_JSON');
    expect(FIND_ESTIMATE_BILLING_QUERY).toContain(
      'totalAmount { amountMicros currencyCode } lineItems',
    );
  });

  it('targets the resolvers generated for the invoice and estimate objects', () => {
    expect(FIND_INVOICES_FOR_JOB_QUERY).toContain(
      `${invoiceObject.config.namePlural}(filter:`,
    );
    expect(FIND_ESTIMATE_BILLING_QUERY).toContain(
      `${estimateObject.config.nameSingular}(filter: { id: { eq: $estimateId } })`,
    );
    expect(CREATE_INVOICE_MUTATION).toContain('createInvoice(data: $data)');
    expect(CREATE_INVOICE_MUTATION).toContain('InvoiceCreateInput!');
  });
});

describe('planInvoiceHandoff', () => {
  it('bills when a job moves into Completed', () => {
    expect(planInvoiceHandoff(completedEvent())).toEqual(invoicePlan);
  });

  it('skips when the new status is not Completed (e.g. Cancelled)', () => {
    const event = completedEvent();

    event.properties!.after!.status = 'CANCELLED';

    expect(planInvoiceHandoff(event).kind).toBe('skip');
  });

  it('skips when the job was already Completed (re-save, not a transition)', () => {
    expect(
      planInvoiceHandoff(completedEvent({ beforeStatus: JOB_STATUS_COMPLETED }))
        .kind,
    ).toBe('skip');
  });

  it('falls back to the record id inside the event and skips without one', () => {
    const withoutRecordId = { ...completedEvent(), recordId: undefined };

    expect(planInvoiceHandoff(withoutRecordId)).toMatchObject({
      kind: 'invoice',
      jobId: 'job-1',
    });

    withoutRecordId.properties!.after!.id = null;

    expect(planInvoiceHandoff(withoutRecordId).kind).toBe('skip');
  });

  it('still bills a job with no estimate or customer', () => {
    expect(
      planInvoiceHandoff(completedEvent({ estimateId: null, customerId: null })),
    ).toMatchObject({ kind: 'invoice', estimateId: null, customerId: null });
  });

  it('names the invoice after the work, not "Invoice for Job for …"', () => {
    expect(buildInvoiceName('Job for Kitchen rewire')).toBe(
      'Invoice for Kitchen rewire',
    );
    expect(buildInvoiceName('Furnace service')).toBe('Invoice for Furnace service');
    expect(buildInvoiceName('  ')).toBe(DEFAULT_INVOICE_NAME);
    expect(buildInvoiceName(null)).toBe(DEFAULT_INVOICE_NAME);
  });
});

describe('draft invoice payload', () => {
  it('copies amount and line items from the estimate', () => {
    expect(buildCreateInvoiceVariables(invoicePlan, ESTIMATE)).toEqual({
      data: {
        name: 'Invoice for Kitchen rewire',
        status: INVOICE_STATUS_DRAFT,
        jobId: 'job-1',
        customerId: 'person-1',
        amount: { amountMicros: 1250000000, currencyCode: 'USD' },
        lineItems: ESTIMATE.lineItems,
      },
    });
  });

  it('leaves dates empty for the office to set when sending', () => {
    const { data } = buildCreateInvoiceVariables(invoicePlan, ESTIMATE);

    expect(data).not.toHaveProperty('issueDate');
    expect(data).not.toHaveProperty('dueDate');
    expect(data).not.toHaveProperty('paidDate');
  });

  it('omits amount, line items and customer when there is nothing to copy', () => {
    const { data } = buildCreateInvoiceVariables(
      { ...invoicePlan, estimateId: null, customerId: null },
      null,
    );

    expect(data).toEqual({
      name: 'Invoice for Kitchen rewire',
      status: INVOICE_STATUS_DRAFT,
      jobId: 'job-1',
    });
  });

  it('omits an incomplete amount instead of writing a broken currency value', () => {
    const { data } = buildCreateInvoiceVariables(invoicePlan, {
      totalAmount: { amountMicros: null, currencyCode: 'USD' },
      lineItems: null,
    });

    expect(data).not.toHaveProperty('amount');
    expect(data).not.toHaveProperty('lineItems');
  });
});

describe('handler (mock workspace API)', () => {
  type RecordedCall = { query: string; variables: Record<string, unknown> };

  let calls: RecordedCall[];
  let existingInvoiceId: string | null;

  beforeEach(() => {
    calls = [];
    existingInvoiceId = null;
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

        const data = call.query.includes('invoices(filter')
          ? {
              invoices: {
                edges: existingInvoiceId ? [{ node: { id: existingInvoiceId } }] : [],
              },
            }
          : call.query.includes('estimate(filter')
            ? { estimate: { id: 'estimate-1', ...ESTIMATE } }
            : { createInvoice: { id: 'invoice-new', name: 'Invoice' } };

        return new Response(JSON.stringify({ data }), { status: 200 });
      }),
    );
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  const operationsOf = (recorded: RecordedCall[]) =>
    recorded.map(
      (call) => call.query.match(/(invoices|estimate|createInvoice)\(/)?.[1],
    );

  it('checks for an invoice, reads the estimate, then creates the draft', async () => {
    const summary = await handler(completedEvent());

    expect(operationsOf(calls)).toEqual(['invoices', 'estimate', 'createInvoice']);
    expect(calls[2].variables).toEqual(
      buildCreateInvoiceVariables(invoicePlan, { id: 'estimate-1', ...ESTIMATE } as EstimateBillingSnapshot),
    );
    expect(summary).toContain('draft invoice invoice-new created');
  });

  it('does not bill a job twice (retry or re-complete)', async () => {
    existingInvoiceId = 'invoice-existing';

    const summary = await handler(completedEvent());

    expect(operationsOf(calls)).toEqual(['invoices']);
    expect(summary).toContain('invoice invoice-existing already exists');
  });

  it('skips the estimate lookup when the job has no estimate', async () => {
    const summary = await handler(completedEvent({ estimateId: null }));

    expect(operationsOf(calls)).toEqual(['invoices', 'createInvoice']);
    expect(calls[1].variables.data).not.toHaveProperty('amount');
    expect(summary).toContain('no estimate to prefill from');
  });

  it('makes no API calls when the update is not a move into Completed', async () => {
    const summary = await handler(
      completedEvent({ beforeStatus: JOB_STATUS_COMPLETED }),
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

    await expect(handler(completedEvent())).rejects.toThrow('Permission denied');
  });
});
