// Columns for the All Leads table view on the standard Opportunity.

import {
  ALL_LEADS_VIEW_FIELD_ESTIMATED_VALUE_UNIVERSAL_IDENTIFIER,
  ALL_LEADS_VIEW_FIELD_NAME_UNIVERSAL_IDENTIFIER,
  ALL_LEADS_VIEW_FIELD_NEXT_FOLLOW_UP_UNIVERSAL_IDENTIFIER,
  ALL_LEADS_VIEW_FIELD_OWNER_UNIVERSAL_IDENTIFIER,
  ALL_LEADS_VIEW_FIELD_SCORE_UNIVERSAL_IDENTIFIER,
  ALL_LEADS_VIEW_FIELD_SOURCE_UNIVERSAL_IDENTIFIER,
  ALL_LEADS_VIEW_FIELD_STAGE_UNIVERSAL_IDENTIFIER,
  ALL_LEADS_VIEW_FIELD_TEMPERATURE_UNIVERSAL_IDENTIFIER,
  ESTIMATED_VALUE_FIELD_UNIVERSAL_IDENTIFIER,
  LEAD_SCORE_FIELD_UNIVERSAL_IDENTIFIER,
  LEAD_SOURCE_FIELD_UNIVERSAL_IDENTIFIER,
  LEAD_STAGE_FIELD_UNIVERSAL_IDENTIFIER,
  LEAD_TEMPERATURE_FIELD_UNIVERSAL_IDENTIFIER,
  NEXT_FOLLOW_UP_FIELD_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';
import {
  NAME_FIELD_UNIVERSAL_IDENTIFIER,
  OWNER_FIELD_UNIVERSAL_IDENTIFIER,
} from 'src/objects/opportunity.object';

export const ALL_LEADS_VIEW_FIELDS = [
  {
    universalIdentifier: ALL_LEADS_VIEW_FIELD_NAME_UNIVERSAL_IDENTIFIER,
    fieldMetadataUniversalIdentifier: NAME_FIELD_UNIVERSAL_IDENTIFIER,
    position: 0,
    isVisible: true,
    size: 200,
  },
  {
    universalIdentifier: ALL_LEADS_VIEW_FIELD_STAGE_UNIVERSAL_IDENTIFIER,
    fieldMetadataUniversalIdentifier: LEAD_STAGE_FIELD_UNIVERSAL_IDENTIFIER,
    position: 1,
    isVisible: true,
    size: 150,
  },
  {
    universalIdentifier: ALL_LEADS_VIEW_FIELD_TEMPERATURE_UNIVERSAL_IDENTIFIER,
    fieldMetadataUniversalIdentifier:
      LEAD_TEMPERATURE_FIELD_UNIVERSAL_IDENTIFIER,
    position: 2,
    isVisible: true,
    size: 130,
  },
  {
    universalIdentifier: ALL_LEADS_VIEW_FIELD_SOURCE_UNIVERSAL_IDENTIFIER,
    fieldMetadataUniversalIdentifier: LEAD_SOURCE_FIELD_UNIVERSAL_IDENTIFIER,
    position: 3,
    isVisible: true,
    size: 150,
  },
  {
    universalIdentifier: ALL_LEADS_VIEW_FIELD_SCORE_UNIVERSAL_IDENTIFIER,
    fieldMetadataUniversalIdentifier: LEAD_SCORE_FIELD_UNIVERSAL_IDENTIFIER,
    position: 4,
    isVisible: true,
    size: 120,
  },
  {
    universalIdentifier:
      ALL_LEADS_VIEW_FIELD_ESTIMATED_VALUE_UNIVERSAL_IDENTIFIER,
    fieldMetadataUniversalIdentifier:
      ESTIMATED_VALUE_FIELD_UNIVERSAL_IDENTIFIER,
    position: 5,
    isVisible: true,
    size: 160,
  },
  {
    universalIdentifier:
      ALL_LEADS_VIEW_FIELD_NEXT_FOLLOW_UP_UNIVERSAL_IDENTIFIER,
    fieldMetadataUniversalIdentifier: NEXT_FOLLOW_UP_FIELD_UNIVERSAL_IDENTIFIER,
    position: 6,
    isVisible: true,
    size: 180,
  },
  {
    universalIdentifier: ALL_LEADS_VIEW_FIELD_OWNER_UNIVERSAL_IDENTIFIER,
    fieldMetadataUniversalIdentifier: OWNER_FIELD_UNIVERSAL_IDENTIFIER,
    position: 7,
    isVisible: true,
    size: 160,
  },
];
