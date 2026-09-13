// Columns for the Hot Leads table view on the standard Opportunity.

import {
  ESTIMATED_VALUE_FIELD_UNIVERSAL_IDENTIFIER,
  HOT_LEADS_VIEW_FIELD_ESTIMATED_VALUE_UNIVERSAL_IDENTIFIER,
  HOT_LEADS_VIEW_FIELD_NAME_UNIVERSAL_IDENTIFIER,
  HOT_LEADS_VIEW_FIELD_NEXT_FOLLOW_UP_UNIVERSAL_IDENTIFIER,
  HOT_LEADS_VIEW_FIELD_SCORE_UNIVERSAL_IDENTIFIER,
  HOT_LEADS_VIEW_FIELD_STAGE_UNIVERSAL_IDENTIFIER,
  LEAD_SCORE_FIELD_UNIVERSAL_IDENTIFIER,
  LEAD_STAGE_FIELD_UNIVERSAL_IDENTIFIER,
  NEXT_FOLLOW_UP_FIELD_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';
import { NAME_FIELD_UNIVERSAL_IDENTIFIER } from 'src/objects/opportunity.object';

export const HOT_LEADS_VIEW_FIELDS = [
  {
    universalIdentifier: HOT_LEADS_VIEW_FIELD_NAME_UNIVERSAL_IDENTIFIER,
    fieldMetadataUniversalIdentifier: NAME_FIELD_UNIVERSAL_IDENTIFIER,
    position: 0,
    isVisible: true,
    size: 200,
  },
  {
    universalIdentifier: HOT_LEADS_VIEW_FIELD_STAGE_UNIVERSAL_IDENTIFIER,
    fieldMetadataUniversalIdentifier: LEAD_STAGE_FIELD_UNIVERSAL_IDENTIFIER,
    position: 1,
    isVisible: true,
    size: 150,
  },
  {
    universalIdentifier: HOT_LEADS_VIEW_FIELD_SCORE_UNIVERSAL_IDENTIFIER,
    fieldMetadataUniversalIdentifier: LEAD_SCORE_FIELD_UNIVERSAL_IDENTIFIER,
    position: 2,
    isVisible: true,
    size: 120,
  },
  {
    universalIdentifier:
      HOT_LEADS_VIEW_FIELD_ESTIMATED_VALUE_UNIVERSAL_IDENTIFIER,
    fieldMetadataUniversalIdentifier:
      ESTIMATED_VALUE_FIELD_UNIVERSAL_IDENTIFIER,
    position: 3,
    isVisible: true,
    size: 160,
  },
  {
    universalIdentifier:
      HOT_LEADS_VIEW_FIELD_NEXT_FOLLOW_UP_UNIVERSAL_IDENTIFIER,
    fieldMetadataUniversalIdentifier: NEXT_FOLLOW_UP_FIELD_UNIVERSAL_IDENTIFIER,
    position: 4,
    isVisible: true,
    size: 180,
  },
];
