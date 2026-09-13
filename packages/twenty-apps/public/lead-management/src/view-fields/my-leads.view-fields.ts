// Columns for the My Leads table view on the standard Opportunity.
//
// View filters cannot express "owner is the current user" as a manifest value
// (view-filter values are literal), so per-user scoping is delivered by the
// Sales Rep role's row-level predicate instead (see src/roles/sales-rep.role.ts).

import {
  LEAD_STAGE_FIELD_UNIVERSAL_IDENTIFIER,
  LEAD_TEMPERATURE_FIELD_UNIVERSAL_IDENTIFIER,
  MY_LEADS_VIEW_FIELD_NAME_UNIVERSAL_IDENTIFIER,
  MY_LEADS_VIEW_FIELD_NEXT_FOLLOW_UP_UNIVERSAL_IDENTIFIER,
  MY_LEADS_VIEW_FIELD_OWNER_UNIVERSAL_IDENTIFIER,
  MY_LEADS_VIEW_FIELD_STAGE_UNIVERSAL_IDENTIFIER,
  MY_LEADS_VIEW_FIELD_TEMPERATURE_UNIVERSAL_IDENTIFIER,
  NEXT_FOLLOW_UP_FIELD_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';
import {
  NAME_FIELD_UNIVERSAL_IDENTIFIER,
  OWNER_FIELD_UNIVERSAL_IDENTIFIER,
} from 'src/objects/opportunity.object';

export const MY_LEADS_VIEW_FIELDS = [
  {
    universalIdentifier: MY_LEADS_VIEW_FIELD_NAME_UNIVERSAL_IDENTIFIER,
    fieldMetadataUniversalIdentifier: NAME_FIELD_UNIVERSAL_IDENTIFIER,
    position: 0,
    isVisible: true,
    size: 200,
  },
  {
    universalIdentifier: MY_LEADS_VIEW_FIELD_STAGE_UNIVERSAL_IDENTIFIER,
    fieldMetadataUniversalIdentifier: LEAD_STAGE_FIELD_UNIVERSAL_IDENTIFIER,
    position: 1,
    isVisible: true,
    size: 150,
  },
  {
    universalIdentifier: MY_LEADS_VIEW_FIELD_TEMPERATURE_UNIVERSAL_IDENTIFIER,
    fieldMetadataUniversalIdentifier:
      LEAD_TEMPERATURE_FIELD_UNIVERSAL_IDENTIFIER,
    position: 2,
    isVisible: true,
    size: 130,
  },
  {
    universalIdentifier:
      MY_LEADS_VIEW_FIELD_NEXT_FOLLOW_UP_UNIVERSAL_IDENTIFIER,
    fieldMetadataUniversalIdentifier: NEXT_FOLLOW_UP_FIELD_UNIVERSAL_IDENTIFIER,
    position: 3,
    isVisible: true,
    size: 180,
  },
  {
    universalIdentifier: MY_LEADS_VIEW_FIELD_OWNER_UNIVERSAL_IDENTIFIER,
    fieldMetadataUniversalIdentifier: OWNER_FIELD_UNIVERSAL_IDENTIFIER,
    position: 4,
    isVisible: true,
    size: 160,
  },
];
