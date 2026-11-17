import {
  defineObject,
  FieldType,
} from 'twenty-sdk/define';

import {
  INVOICE_AMOUNT_FIELD_UNIVERSAL_IDENTIFIER,
  INVOICE_DUE_DATE_FIELD_UNIVERSAL_IDENTIFIER,
  INVOICE_ISSUE_DATE_FIELD_UNIVERSAL_IDENTIFIER,
  INVOICE_LINE_ITEMS_FIELD_UNIVERSAL_IDENTIFIER,
  INVOICE_NAME_FIELD_UNIVERSAL_IDENTIFIER,
  INVOICE_OBJECT_UNIVERSAL_IDENTIFIER,
  INVOICE_PAID_DATE_FIELD_UNIVERSAL_IDENTIFIER,
  INVOICE_STATUS_DRAFT_OPTION_ID,
  INVOICE_STATUS_FIELD_UNIVERSAL_IDENTIFIER,
  INVOICE_STATUS_PAID_OPTION_ID,
  INVOICE_STATUS_SENT_OPTION_ID,
  INVOICE_STATUS_VOID_OPTION_ID,
} from 'src/constants/universal-identifiers';

// Re-exported for relation field files that target this object
// (real-estate app pattern: fields import the object UID from the object file).
export { INVOICE_OBJECT_UNIVERSAL_IDENTIFIER };

enum InvoiceStatus {
  DRAFT = 'DRAFT',
  SENT = 'SENT',
  PAID = 'PAID',
  VOID = 'VOID',
}

// JobFlow Invoice: the bill for a completed job. App-owned custom object, same
// conventions as Estimate/Job: relation fields (job → Job, customer → Person)
// live in src/fields/invoice/*.field.ts with their ONE_TO_MANY reverse fields
// in src/fields/job/ and src/fields/person/. "Overdue" is not a stored status:
// it is a Sent invoice whose due date has passed, so it can never go stale.
export default defineObject({
  universalIdentifier: INVOICE_OBJECT_UNIVERSAL_IDENTIFIER,
  nameSingular: 'invoice',
  namePlural: 'invoices',
  labelSingular: 'Invoice',
  labelPlural: 'Invoices',
  description: 'A bill sent to a customer for completed work.',
  icon: 'IconFileInvoice',
  labelIdentifierFieldMetadataUniversalIdentifier:
    INVOICE_NAME_FIELD_UNIVERSAL_IDENTIFIER,
  fields: [
    {
      universalIdentifier: INVOICE_NAME_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.TEXT,
      name: 'name',
      label: 'Name',
      description: 'Invoice label, e.g. the work billed',
      icon: 'IconAbc',
      defaultValue: "''",
    },
    {
      universalIdentifier: INVOICE_STATUS_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.SELECT,
      name: 'status',
      label: 'Status',
      icon: 'IconProgressCheck',
      isNullable: false,
      defaultValue: `'${InvoiceStatus.DRAFT}'`,
      options: [
        {
          id: INVOICE_STATUS_DRAFT_OPTION_ID,
          value: InvoiceStatus.DRAFT,
          label: 'Draft',
          position: 0,
          color: 'gray',
        },
        {
          id: INVOICE_STATUS_SENT_OPTION_ID,
          value: InvoiceStatus.SENT,
          label: 'Sent',
          position: 1,
          color: 'blue',
        },
        {
          id: INVOICE_STATUS_PAID_OPTION_ID,
          value: InvoiceStatus.PAID,
          label: 'Paid',
          position: 2,
          color: 'green',
        },
        {
          id: INVOICE_STATUS_VOID_OPTION_ID,
          value: InvoiceStatus.VOID,
          label: 'Void',
          position: 3,
          color: 'red',
        },
      ],
    },
    {
      universalIdentifier: INVOICE_AMOUNT_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.CURRENCY,
      name: 'amount',
      label: 'Amount',
      description: 'Total amount billed to the customer.',
      icon: 'IconCurrencyDollar',
      isNullable: true,
    },
    {
      universalIdentifier: INVOICE_LINE_ITEMS_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.RAW_JSON,
      name: 'lineItems',
      label: 'Line Items',
      description:
        'Structured list of billed line items (description, quantity, unit price).',
      icon: 'IconJson',
      isNullable: true,
    },
    {
      universalIdentifier: INVOICE_ISSUE_DATE_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.DATE,
      name: 'issueDate',
      label: 'Issue Date',
      description: 'Date the invoice was sent to the customer.',
      icon: 'IconCalendarEvent',
      isNullable: true,
    },
    {
      universalIdentifier: INVOICE_DUE_DATE_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.DATE,
      name: 'dueDate',
      label: 'Due Date',
      description: 'Date payment is due.',
      icon: 'IconCalendarDue',
      isNullable: true,
    },
    {
      universalIdentifier: INVOICE_PAID_DATE_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.DATE,
      name: 'paidDate',
      label: 'Paid Date',
      description: 'Date payment was received.',
      icon: 'IconCalendarCheck',
      isNullable: true,
    },
  ],
});
