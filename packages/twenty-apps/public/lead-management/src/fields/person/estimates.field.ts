import {
  defineField,
  FieldType,
  RelationType,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';

import {
  ESTIMATES_ON_PERSON_FIELD_UNIVERSAL_IDENTIFIER,
  ESTIMATE_CUSTOMER_FIELD_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';
import { ESTIMATE_OBJECT_UNIVERSAL_IDENTIFIER } from 'src/objects/estimate.object';

// ONE_TO_MANY reverse field on the standard Person object: every Estimate
// whose `customer` points here. Targets the MANY_TO_ONE field on Estimate.
export default defineField({
  universalIdentifier: ESTIMATES_ON_PERSON_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier:
    STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.person.universalIdentifier,
  type: FieldType.RELATION,
  name: 'estimates',
  label: 'Estimates',
  icon: 'IconFileDollar',
  relationTargetObjectMetadataUniversalIdentifier:
    ESTIMATE_OBJECT_UNIVERSAL_IDENTIFIER,
  relationTargetFieldMetadataUniversalIdentifier:
    ESTIMATE_CUSTOMER_FIELD_UNIVERSAL_IDENTIFIER,
  universalSettings: {
    relationType: RelationType.ONE_TO_MANY,
  },
});
