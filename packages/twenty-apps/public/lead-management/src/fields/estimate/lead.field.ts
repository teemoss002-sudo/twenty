import {
  defineField,
  FieldType,
  OnDeleteAction,
  RelationType,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';

import {
  ESTIMATE_LEAD_FIELD_UNIVERSAL_IDENTIFIER,
  ESTIMATES_ON_OPPORTUNITY_FIELD_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';
import { ESTIMATE_OBJECT_UNIVERSAL_IDENTIFIER } from 'src/objects/estimate.object';

// MANY_TO_ONE on the Estimate object → the standard Opportunity (the Lead).
// The reverse ONE_TO_MANY field (`estimates`) is declared in
// src/fields/opportunity/estimates.field.ts.
export default defineField({
  universalIdentifier: ESTIMATE_LEAD_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier: ESTIMATE_OBJECT_UNIVERSAL_IDENTIFIER,
  type: FieldType.RELATION,
  name: 'lead',
  label: 'Lead',
  icon: 'IconTargetArrow',
  isNullable: true,
  relationTargetObjectMetadataUniversalIdentifier:
    STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.opportunity.universalIdentifier,
  relationTargetFieldMetadataUniversalIdentifier:
    ESTIMATES_ON_OPPORTUNITY_FIELD_UNIVERSAL_IDENTIFIER,
  universalSettings: {
    relationType: RelationType.MANY_TO_ONE,
    onDelete: OnDeleteAction.SET_NULL,
    joinColumnName: 'leadId',
  },
});
