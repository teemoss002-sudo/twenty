import { defineView, ViewType } from 'twenty-sdk/define';

import {
  ALL_ESTIMATES_VIEW_UNIVERSAL_IDENTIFIER,
  ESTIMATES_VIEW_FIELD_CUSTOMER_UNIVERSAL_IDENTIFIER,
  ESTIMATES_VIEW_FIELD_LEAD_UNIVERSAL_IDENTIFIER,
  ESTIMATES_VIEW_FIELD_NAME_UNIVERSAL_IDENTIFIER,
  ESTIMATES_VIEW_FIELD_STATUS_UNIVERSAL_IDENTIFIER,
  ESTIMATES_VIEW_FIELD_TOTAL_AMOUNT_UNIVERSAL_IDENTIFIER,
  ESTIMATES_VIEW_FIELD_VALID_UNTIL_UNIVERSAL_IDENTIFIER,
  ESTIMATE_CUSTOMER_FIELD_UNIVERSAL_IDENTIFIER,
  ESTIMATE_LEAD_FIELD_UNIVERSAL_IDENTIFIER,
  ESTIMATE_NAME_FIELD_UNIVERSAL_IDENTIFIER,
  ESTIMATE_STATUS_FIELD_UNIVERSAL_IDENTIFIER,
  ESTIMATE_TOTAL_AMOUNT_FIELD_UNIVERSAL_IDENTIFIER,
  ESTIMATE_VALID_UNTIL_FIELD_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';
import { ESTIMATE_OBJECT_UNIVERSAL_IDENTIFIER } from 'src/objects/estimate.object';

export default defineView({
  universalIdentifier: ALL_ESTIMATES_VIEW_UNIVERSAL_IDENTIFIER,
  name: 'All Estimates',
  objectUniversalIdentifier: ESTIMATE_OBJECT_UNIVERSAL_IDENTIFIER,
  type: ViewType.TABLE,
  icon: 'IconFileDollar',
  position: 0,
  fields: [
    {
      universalIdentifier: ESTIMATES_VIEW_FIELD_NAME_UNIVERSAL_IDENTIFIER,
      fieldMetadataUniversalIdentifier:
        ESTIMATE_NAME_FIELD_UNIVERSAL_IDENTIFIER,
      position: 0,
      isVisible: true,
      size: 220,
    },
    {
      universalIdentifier: ESTIMATES_VIEW_FIELD_STATUS_UNIVERSAL_IDENTIFIER,
      fieldMetadataUniversalIdentifier:
        ESTIMATE_STATUS_FIELD_UNIVERSAL_IDENTIFIER,
      position: 1,
      isVisible: true,
      size: 140,
    },
    {
      universalIdentifier:
        ESTIMATES_VIEW_FIELD_TOTAL_AMOUNT_UNIVERSAL_IDENTIFIER,
      fieldMetadataUniversalIdentifier:
        ESTIMATE_TOTAL_AMOUNT_FIELD_UNIVERSAL_IDENTIFIER,
      position: 2,
      isVisible: true,
      size: 160,
    },
    {
      universalIdentifier: ESTIMATES_VIEW_FIELD_VALID_UNTIL_UNIVERSAL_IDENTIFIER,
      fieldMetadataUniversalIdentifier:
        ESTIMATE_VALID_UNTIL_FIELD_UNIVERSAL_IDENTIFIER,
      position: 3,
      isVisible: true,
      size: 150,
    },
    {
      universalIdentifier: ESTIMATES_VIEW_FIELD_LEAD_UNIVERSAL_IDENTIFIER,
      fieldMetadataUniversalIdentifier:
        ESTIMATE_LEAD_FIELD_UNIVERSAL_IDENTIFIER,
      position: 4,
      isVisible: true,
      size: 200,
    },
    {
      universalIdentifier: ESTIMATES_VIEW_FIELD_CUSTOMER_UNIVERSAL_IDENTIFIER,
      fieldMetadataUniversalIdentifier:
        ESTIMATE_CUSTOMER_FIELD_UNIVERSAL_IDENTIFIER,
      position: 5,
      isVisible: true,
      size: 200,
    },
  ],
});
