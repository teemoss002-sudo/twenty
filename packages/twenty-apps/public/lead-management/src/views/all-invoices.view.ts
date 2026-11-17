import { defineView, ViewType } from 'twenty-sdk/define';

import {
  ALL_INVOICES_VIEW_UNIVERSAL_IDENTIFIER,
  INVOICE_AMOUNT_FIELD_UNIVERSAL_IDENTIFIER,
  INVOICE_CUSTOMER_FIELD_UNIVERSAL_IDENTIFIER,
  INVOICE_DUE_DATE_FIELD_UNIVERSAL_IDENTIFIER,
  INVOICE_JOB_FIELD_UNIVERSAL_IDENTIFIER,
  INVOICE_NAME_FIELD_UNIVERSAL_IDENTIFIER,
  INVOICE_PAID_DATE_FIELD_UNIVERSAL_IDENTIFIER,
  INVOICE_STATUS_FIELD_UNIVERSAL_IDENTIFIER,
  INVOICES_VIEW_FIELD_AMOUNT_UNIVERSAL_IDENTIFIER,
  INVOICES_VIEW_FIELD_CUSTOMER_UNIVERSAL_IDENTIFIER,
  INVOICES_VIEW_FIELD_DUE_DATE_UNIVERSAL_IDENTIFIER,
  INVOICES_VIEW_FIELD_JOB_UNIVERSAL_IDENTIFIER,
  INVOICES_VIEW_FIELD_NAME_UNIVERSAL_IDENTIFIER,
  INVOICES_VIEW_FIELD_PAID_DATE_UNIVERSAL_IDENTIFIER,
  INVOICES_VIEW_FIELD_STATUS_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';
import { INVOICE_OBJECT_UNIVERSAL_IDENTIFIER } from 'src/objects/invoice.object';

export default defineView({
  universalIdentifier: ALL_INVOICES_VIEW_UNIVERSAL_IDENTIFIER,
  name: 'All Invoices',
  objectUniversalIdentifier: INVOICE_OBJECT_UNIVERSAL_IDENTIFIER,
  type: ViewType.TABLE,
  icon: 'IconFileInvoice',
  position: 0,
  fields: [
    {
      universalIdentifier: INVOICES_VIEW_FIELD_NAME_UNIVERSAL_IDENTIFIER,
      fieldMetadataUniversalIdentifier: INVOICE_NAME_FIELD_UNIVERSAL_IDENTIFIER,
      position: 0,
      isVisible: true,
      size: 220,
    },
    {
      universalIdentifier: INVOICES_VIEW_FIELD_STATUS_UNIVERSAL_IDENTIFIER,
      fieldMetadataUniversalIdentifier:
        INVOICE_STATUS_FIELD_UNIVERSAL_IDENTIFIER,
      position: 1,
      isVisible: true,
      size: 120,
    },
    {
      universalIdentifier: INVOICES_VIEW_FIELD_AMOUNT_UNIVERSAL_IDENTIFIER,
      fieldMetadataUniversalIdentifier:
        INVOICE_AMOUNT_FIELD_UNIVERSAL_IDENTIFIER,
      position: 2,
      isVisible: true,
      size: 150,
    },
    {
      universalIdentifier: INVOICES_VIEW_FIELD_DUE_DATE_UNIVERSAL_IDENTIFIER,
      fieldMetadataUniversalIdentifier:
        INVOICE_DUE_DATE_FIELD_UNIVERSAL_IDENTIFIER,
      position: 3,
      isVisible: true,
      size: 140,
    },
    {
      universalIdentifier: INVOICES_VIEW_FIELD_PAID_DATE_UNIVERSAL_IDENTIFIER,
      fieldMetadataUniversalIdentifier:
        INVOICE_PAID_DATE_FIELD_UNIVERSAL_IDENTIFIER,
      position: 4,
      isVisible: true,
      size: 140,
    },
    {
      universalIdentifier: INVOICES_VIEW_FIELD_JOB_UNIVERSAL_IDENTIFIER,
      fieldMetadataUniversalIdentifier: INVOICE_JOB_FIELD_UNIVERSAL_IDENTIFIER,
      position: 5,
      isVisible: true,
      size: 200,
    },
    {
      universalIdentifier: INVOICES_VIEW_FIELD_CUSTOMER_UNIVERSAL_IDENTIFIER,
      fieldMetadataUniversalIdentifier:
        INVOICE_CUSTOMER_FIELD_UNIVERSAL_IDENTIFIER,
      position: 6,
      isVisible: true,
      size: 200,
    },
  ],
});
