// Columns for the Lead Pipeline kanban view on the standard Opportunity.
// Every entry references a field via fieldMetadataUniversalIdentifier and
// carries its own stable universalIdentifier (see src/constants/).

import {
  ESTIMATED_VALUE_FIELD_UNIVERSAL_IDENTIFIER,
  LEAD_PIPELINE_VIEW_FIELD_ESTIMATED_VALUE_UNIVERSAL_IDENTIFIER,
  LEAD_PIPELINE_VIEW_FIELD_NAME_UNIVERSAL_IDENTIFIER,
  LEAD_PIPELINE_VIEW_FIELD_NEXT_FOLLOW_UP_UNIVERSAL_IDENTIFIER,
  LEAD_PIPELINE_VIEW_FIELD_OWNER_UNIVERSAL_IDENTIFIER,
  LEAD_PIPELINE_VIEW_FIELD_STAGE_UNIVERSAL_IDENTIFIER,
  LEAD_PIPELINE_VIEW_FIELD_TEMPERATURE_UNIVERSAL_IDENTIFIER,
  LEAD_STAGE_FIELD_UNIVERSAL_IDENTIFIER,
  LEAD_TEMPERATURE_FIELD_UNIVERSAL_IDENTIFIER,
  NEXT_FOLLOW_UP_FIELD_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';
import {
  NAME_FIELD_UNIVERSAL_IDENTIFIER,
  OWNER_FIELD_UNIVERSAL_IDENTIFIER,
} from 'src/objects/opportunity.object';

export const LEAD_PIPELINE_VIEW_FIELDS = [
  {
    universalIdentifier: LEAD_PIPELINE_VIEW_FIELD_NAME_UNIVERSAL_IDENTIFIER,
    fieldMetadataUniversalIdentifier: NAME_FIELD_UNIVERSAL_IDENTIFIER,
    position: 0,
    isVisible: true,
    size: 200,
  },
  {
    universalIdentifier: LEAD_PIPELINE_VIEW_FIELD_STAGE_UNIVERSAL_IDENTIFIER,
    fieldMetadataUniversalIdentifier: LEAD_STAGE_FIELD_UNIVERSAL_IDENTIFIER,
    position: 1,
    isVisible: true,
    size: 160,
  },
  {
    universalIdentifier:
      LEAD_PIPELINE_VIEW_FIELD_TEMPERATURE_UNIVERSAL_IDENTIFIER,
    fieldMetadataUniversalIdentifier: LEAD_TEMPERATURE_FIELD_UNIVERSAL_IDENTIFIER,
    position: 2,
    isVisible: true,
    size: 140,
  },
  {
    universalIdentifier:
      LEAD_PIPELINE_VIEW_FIELD_ESTIMATED_VALUE_UNIVERSAL_IDENTIFIER,
    fieldMetadataUniversalIdentifier:
      ESTIMATED_VALUE_FIELD_UNIVERSAL_IDENTIFIER,
    position: 3,
    isVisible: true,
    size: 160,
  },
  {
    universalIdentifier:
      LEAD_PIPELINE_VIEW_FIELD_NEXT_FOLLOW_UP_UNIVERSAL_IDENTIFIER,
    fieldMetadataUniversalIdentifier: NEXT_FOLLOW_UP_FIELD_UNIVERSAL_IDENTIFIER,
    position: 4,
    isVisible: true,
    size: 180,
  },
  {
    universalIdentifier: LEAD_PIPELINE_VIEW_FIELD_OWNER_UNIVERSAL_IDENTIFIER,
    fieldMetadataUniversalIdentifier: OWNER_FIELD_UNIVERSAL_IDENTIFIER,
    position: 5,
    isVisible: true,
    size: 160,
  },
];
