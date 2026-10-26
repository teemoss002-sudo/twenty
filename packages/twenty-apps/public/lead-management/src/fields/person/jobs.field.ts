import {
  defineField,
  FieldType,
  RelationType,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';

import {
  JOBS_ON_PERSON_FIELD_UNIVERSAL_IDENTIFIER,
  JOB_CUSTOMER_FIELD_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';
import { JOB_OBJECT_UNIVERSAL_IDENTIFIER } from 'src/objects/job.object';

// ONE_TO_MANY reverse field on the standard Person object: every Job whose
// `customer` points here. Targets the MANY_TO_ONE field on Job.
export default defineField({
  universalIdentifier: JOBS_ON_PERSON_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier:
    STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.person.universalIdentifier,
  type: FieldType.RELATION,
  name: 'serviceJobs',
  label: 'Jobs',
  icon: 'IconTool',
  relationTargetObjectMetadataUniversalIdentifier:
    JOB_OBJECT_UNIVERSAL_IDENTIFIER,
  relationTargetFieldMetadataUniversalIdentifier:
    JOB_CUSTOMER_FIELD_UNIVERSAL_IDENTIFIER,
  universalSettings: {
    relationType: RelationType.ONE_TO_MANY,
  },
});
