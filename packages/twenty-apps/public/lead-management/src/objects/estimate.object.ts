import {
  defineObject,
  FieldType,
} from 'twenty-sdk/define';

import {
  ESTIMATE_LINE_ITEMS_FIELD_UNIVERSAL_IDENTIFIER,
  ESTIMATE_NAME_FIELD_UNIVERSAL_IDENTIFIER,
  ESTIMATE_OBJECT_UNIVERSAL_IDENTIFIER,
  ESTIMATE_SENT_AT_FIELD_UNIVERSAL_IDENTIFIER,
  ESTIMATE_STATUS_FIELD_UNIVERSAL_IDENTIFIER,
  ESTIMATE_TOTAL_AMOUNT_FIELD_UNIVERSAL_IDENTIFIER,
  ESTIMATE_VALID_UNTIL_FIELD_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

// Re-exported for relation field files that target this object
// (real-estate app pattern: fields import the object UID from the object file).
export { ESTIMATE_OBJECT_UNIVERSAL_IDENTIFIER };

enum EstimateStatus {
  DRAFT = 'DRAFT',
  SENT = 'SENT',
  ACCEPTED = 'ACCEPTED',
  DECLINED = 'DECLINED',
}

// JobFlow Estimate: a quote sent to a customer from a lead. App-owned custom
// object created through the standard Apps SDK manifest (no core changes, no
// manual migrations). Relation fields (lead → Opportunity, customer → Person)
// are declared in src/fields/estimate/*.field.ts, with their ONE_TO_MANY
// reverse fields on the standard objects in src/fields/opportunity/ and
// src/fields/person/ — following the real-estate app convention of keeping
// relations out of defineObject's inline field list.
export default defineObject({
  universalIdentifier: ESTIMATE_OBJECT_UNIVERSAL_IDENTIFIER,
  nameSingular: 'estimate',
  namePlural: 'estimates',
  labelSingular: 'Estimate',
  labelPlural: 'Estimates',
  description: 'A quote sent to a customer for proposed work.',
  icon: 'IconFileDollar',
  labelIdentifierFieldMetadataUniversalIdentifier:
    ESTIMATE_NAME_FIELD_UNIVERSAL_IDENTIFIER,
  fields: [
    {
      universalIdentifier: ESTIMATE_NAME_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.TEXT,
      name: 'name',
      label: 'Name',
      description: 'Estimate label, e.g. the work summary',
      icon: 'IconAbc',
      defaultValue: "''",
    },
    {
      universalIdentifier: ESTIMATE_STATUS_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.SELECT,
      name: 'status',
      label: 'Status',
      icon: 'IconProgressCheck',
      isNullable: false,
      defaultValue: `'${EstimateStatus.DRAFT}'`,
      options: [
        {
          id: 'd0a0d0a0-0000-4000-8000-000000000901',
          value: EstimateStatus.DRAFT,
          label: 'Draft',
          position: 0,
          color: 'gray',
        },
        {
          id: 'd0a0d0a0-0000-4000-8000-000000000902',
          value: EstimateStatus.SENT,
          label: 'Sent',
          position: 1,
          color: 'blue',
        },
        {
          id: 'd0a0d0a0-0000-4000-8000-000000000903',
          value: EstimateStatus.ACCEPTED,
          label: 'Accepted',
          position: 2,
          color: 'green',
        },
        {
          id: 'd0a0d0a0-0000-4000-8000-000000000904',
          value: EstimateStatus.DECLINED,
          label: 'Declined',
          position: 3,
          color: 'red',
        },
      ],
    },
    {
      universalIdentifier: ESTIMATE_TOTAL_AMOUNT_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.CURRENCY,
      name: 'totalAmount',
      label: 'Total Amount',
      description: 'Total quoted amount for the proposed work.',
      icon: 'IconCurrencyDollar',
      isNullable: true,
    },
    {
      universalIdentifier: ESTIMATE_LINE_ITEMS_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.RAW_JSON,
      name: 'lineItems',
      label: 'Line Items',
      description:
        'Structured list of quoted line items (description, quantity, unit price).',
      icon: 'IconJson',
      isNullable: true,
    },
    {
      universalIdentifier: ESTIMATE_VALID_UNTIL_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.DATE,
      name: 'validUntil',
      label: 'Valid Until',
      description: 'Last date the customer can accept this estimate.',
      icon: 'IconCalendarDue',
      isNullable: true,
    },
    {
      universalIdentifier: ESTIMATE_SENT_AT_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.DATE_TIME,
      name: 'sentAt',
      label: 'Sent At',
      description: 'When the estimate was sent to the customer.',
      icon: 'IconSend',
      isNullable: true,
    },
  ],
});
