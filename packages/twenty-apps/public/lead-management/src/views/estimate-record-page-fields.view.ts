import { defineView, ViewType } from 'twenty-sdk/define';

import {
  ESTIMATE_CUSTOMER_FIELD_UNIVERSAL_IDENTIFIER,
  ESTIMATE_LEAD_FIELD_UNIVERSAL_IDENTIFIER,
  ESTIMATE_NAME_FIELD_UNIVERSAL_IDENTIFIER,
  ESTIMATE_RECORD_FIELD_CUSTOMER_UNIVERSAL_IDENTIFIER,
  ESTIMATE_RECORD_FIELD_LEAD_UNIVERSAL_IDENTIFIER,
  ESTIMATE_RECORD_FIELD_NAME_UNIVERSAL_IDENTIFIER,
  ESTIMATE_RECORD_FIELD_SENT_AT_UNIVERSAL_IDENTIFIER,
  ESTIMATE_RECORD_FIELD_STATUS_UNIVERSAL_IDENTIFIER,
  ESTIMATE_RECORD_FIELD_TOTAL_AMOUNT_UNIVERSAL_IDENTIFIER,
  ESTIMATE_RECORD_FIELD_VALID_UNTIL_UNIVERSAL_IDENTIFIER,
  ESTIMATE_RECORD_PAGE_FIELDS_VIEW_UNIVERSAL_IDENTIFIER,
  ESTIMATE_SENT_AT_FIELD_UNIVERSAL_IDENTIFIER,
  ESTIMATE_STATUS_FIELD_UNIVERSAL_IDENTIFIER,
  ESTIMATE_TOTAL_AMOUNT_FIELD_UNIVERSAL_IDENTIFIER,
  ESTIMATE_VALID_UNTIL_FIELD_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';
import { ESTIMATE_OBJECT_UNIVERSAL_IDENTIFIER } from 'src/objects/estimate.object';

// FIELDS_WIDGET view backing the Estimate record page "Home" tab
// (real-estate pattern: the layout's Fields widget renders this view).
export const ESTIMATE_RECORD_PAGE_FIELDS_VIEW_ID =
  ESTIMATE_RECORD_PAGE_FIELDS_VIEW_UNIVERSAL_IDENTIFIER;

export default defineView({
  universalIdentifier: ESTIMATE_RECORD_PAGE_FIELDS_VIEW_UNIVERSAL_IDENTIFIER,
  name: 'Estimate Record Page Fields',
  objectUniversalIdentifier: ESTIMATE_OBJECT_UNIVERSAL_IDENTIFIER,
  type: ViewType.FIELDS_WIDGET,
  fields: [
    {
      universalIdentifier: ESTIMATE_RECORD_FIELD_NAME_UNIVERSAL_IDENTIFIER,
      fieldMetadataUniversalIdentifier:
        ESTIMATE_NAME_FIELD_UNIVERSAL_IDENTIFIER,
      position: 0,
      isVisible: true,
    },
    {
      universalIdentifier: ESTIMATE_RECORD_FIELD_STATUS_UNIVERSAL_IDENTIFIER,
      fieldMetadataUniversalIdentifier:
        ESTIMATE_STATUS_FIELD_UNIVERSAL_IDENTIFIER,
      position: 1,
      isVisible: true,
    },
    {
      universalIdentifier:
        ESTIMATE_RECORD_FIELD_TOTAL_AMOUNT_UNIVERSAL_IDENTIFIER,
      fieldMetadataUniversalIdentifier:
        ESTIMATE_TOTAL_AMOUNT_FIELD_UNIVERSAL_IDENTIFIER,
      position: 2,
      isVisible: true,
    },
    {
      universalIdentifier:
        ESTIMATE_RECORD_FIELD_VALID_UNTIL_UNIVERSAL_IDENTIFIER,
      fieldMetadataUniversalIdentifier:
        ESTIMATE_VALID_UNTIL_FIELD_UNIVERSAL_IDENTIFIER,
      position: 3,
      isVisible: true,
    },
    {
      universalIdentifier: ESTIMATE_RECORD_FIELD_SENT_AT_UNIVERSAL_IDENTIFIER,
      fieldMetadataUniversalIdentifier:
        ESTIMATE_SENT_AT_FIELD_UNIVERSAL_IDENTIFIER,
      position: 4,
      isVisible: true,
    },
    {
      universalIdentifier: ESTIMATE_RECORD_FIELD_LEAD_UNIVERSAL_IDENTIFIER,
      fieldMetadataUniversalIdentifier:
        ESTIMATE_LEAD_FIELD_UNIVERSAL_IDENTIFIER,
      position: 5,
      isVisible: true,
    },
    {
      universalIdentifier: ESTIMATE_RECORD_FIELD_CUSTOMER_UNIVERSAL_IDENTIFIER,
      fieldMetadataUniversalIdentifier:
        ESTIMATE_CUSTOMER_FIELD_UNIVERSAL_IDENTIFIER,
      position: 6,
      isVisible: true,
    },
  ],
});
