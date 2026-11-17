import {
  defineView,
  ViewFilterOperand,
  ViewSortDirection,
  ViewType,
} from 'twenty-sdk/define';

import {
  INVOICE_AMOUNT_FIELD_UNIVERSAL_IDENTIFIER,
  INVOICE_CUSTOMER_FIELD_UNIVERSAL_IDENTIFIER,
  INVOICE_DUE_DATE_FIELD_UNIVERSAL_IDENTIFIER,
  INVOICE_NAME_FIELD_UNIVERSAL_IDENTIFIER,
  INVOICE_STATUS_FIELD_UNIVERSAL_IDENTIFIER,
  UNPAID_INVOICES_VIEW_FIELD_AMOUNT_UNIVERSAL_IDENTIFIER,
  UNPAID_INVOICES_VIEW_FIELD_CUSTOMER_UNIVERSAL_IDENTIFIER,
  UNPAID_INVOICES_VIEW_FIELD_DUE_DATE_UNIVERSAL_IDENTIFIER,
  UNPAID_INVOICES_VIEW_FIELD_NAME_UNIVERSAL_IDENTIFIER,
  UNPAID_INVOICES_VIEW_FIELD_STATUS_UNIVERSAL_IDENTIFIER,
  UNPAID_INVOICES_VIEW_FILTER_STATUS_UNIVERSAL_IDENTIFIER,
  UNPAID_INVOICES_VIEW_SORT_DUE_DATE_UNIVERSAL_IDENTIFIER,
  UNPAID_INVOICES_VIEW_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';
import { INVOICE_OBJECT_UNIVERSAL_IDENTIFIER } from 'src/objects/invoice.object';

// Money still to collect: Draft (not sent yet) and Sent (awaiting payment),
// soonest due first so overdue invoices rise to the top.
export const UNPAID_INVOICE_STATUSES = ['DRAFT', 'SENT'];

export default defineView({
  universalIdentifier: UNPAID_INVOICES_VIEW_UNIVERSAL_IDENTIFIER,
  name: 'Unpaid Invoices',
  objectUniversalIdentifier: INVOICE_OBJECT_UNIVERSAL_IDENTIFIER,
  type: ViewType.TABLE,
  icon: 'IconCashOff',
  position: 1,
  filters: [
    {
      universalIdentifier:
        UNPAID_INVOICES_VIEW_FILTER_STATUS_UNIVERSAL_IDENTIFIER,
      fieldMetadataUniversalIdentifier:
        INVOICE_STATUS_FIELD_UNIVERSAL_IDENTIFIER,
      operand: ViewFilterOperand.IS,
      value: UNPAID_INVOICE_STATUSES,
    },
  ],
  sorts: [
    {
      universalIdentifier:
        UNPAID_INVOICES_VIEW_SORT_DUE_DATE_UNIVERSAL_IDENTIFIER,
      fieldMetadataUniversalIdentifier:
        INVOICE_DUE_DATE_FIELD_UNIVERSAL_IDENTIFIER,
      direction: ViewSortDirection.ASC,
    },
  ],
  fields: [
    {
      universalIdentifier: UNPAID_INVOICES_VIEW_FIELD_NAME_UNIVERSAL_IDENTIFIER,
      fieldMetadataUniversalIdentifier: INVOICE_NAME_FIELD_UNIVERSAL_IDENTIFIER,
      position: 0,
      isVisible: true,
      size: 220,
    },
    {
      universalIdentifier:
        UNPAID_INVOICES_VIEW_FIELD_STATUS_UNIVERSAL_IDENTIFIER,
      fieldMetadataUniversalIdentifier:
        INVOICE_STATUS_FIELD_UNIVERSAL_IDENTIFIER,
      position: 1,
      isVisible: true,
      size: 120,
    },
    {
      universalIdentifier:
        UNPAID_INVOICES_VIEW_FIELD_AMOUNT_UNIVERSAL_IDENTIFIER,
      fieldMetadataUniversalIdentifier:
        INVOICE_AMOUNT_FIELD_UNIVERSAL_IDENTIFIER,
      position: 2,
      isVisible: true,
      size: 150,
    },
    {
      universalIdentifier:
        UNPAID_INVOICES_VIEW_FIELD_DUE_DATE_UNIVERSAL_IDENTIFIER,
      fieldMetadataUniversalIdentifier:
        INVOICE_DUE_DATE_FIELD_UNIVERSAL_IDENTIFIER,
      position: 3,
      isVisible: true,
      size: 140,
    },
    {
      universalIdentifier:
        UNPAID_INVOICES_VIEW_FIELD_CUSTOMER_UNIVERSAL_IDENTIFIER,
      fieldMetadataUniversalIdentifier:
        INVOICE_CUSTOMER_FIELD_UNIVERSAL_IDENTIFIER,
      position: 4,
      isVisible: true,
      size: 200,
    },
  ],
});
