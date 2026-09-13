import {
  defineField,
  FieldType,
  RelationType,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';

import {
  ESTIMATES_ON_OPPORTUNITY_FIELD_UNIVERSAL_IDENTIFIER,
  ESTIMATE_LEAD_FIELD_UNIVERSAL_IDENTIFIER,
  ESTIMATE_OBJECT_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';
import { OPPORTUNITY_OBJECT_UNIVERSAL_IDENTIFIER } from 'src/objects/opportunity.object';

// ONE_TO_MANY reverse field on the standard Opportunity object: every Estimate
// whose `lead` points here. Targets the MANY_TO_ONE field on Estimate.
export default defineField({
  universalIdentifier: ESTIMATES_ON_OPPORTUNITY_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier: OPPORTUNITY_OBJECT_UNIVERSAL_IDENTIFIER,
  type: FieldType.RELATION,
  name: 'estimates',
  label: 'Estimates',
  icon: 'IconFileDollar',
  relationTargetObjectMetadataUniversalIdentifier:
    ESTIMATE_OBJECT_UNIVERSAL_IDENTIFIER,
  relationTargetFieldMetadataUniversalIdentifier:
    ESTIMATE_LEAD_FIELD_UNIVERSAL_IDENTIFIER,
  universalSettings: {
    relationType: RelationType.ONE_TO_MANY,
  },
});
