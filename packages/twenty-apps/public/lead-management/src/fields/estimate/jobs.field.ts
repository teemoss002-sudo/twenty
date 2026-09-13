import {
  defineField,
  FieldType,
  RelationType,
} from 'twenty-sdk/define';

import {
  JOBS_ON_ESTIMATE_FIELD_UNIVERSAL_IDENTIFIER,
  JOB_ESTIMATE_FIELD_UNIVERSAL_IDENTIFIER,
  JOB_OBJECT_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';
import { ESTIMATE_OBJECT_UNIVERSAL_IDENTIFIER } from 'src/objects/estimate.object';

// ONE_TO_MANY reverse field on the Estimate object: every Job whose `estimate`
// points here. Targets the MANY_TO_ONE field on Job.
export default defineField({
  universalIdentifier: JOBS_ON_ESTIMATE_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier: ESTIMATE_OBJECT_UNIVERSAL_IDENTIFIER,
  type: FieldType.RELATION,
  name: 'jobs',
  label: 'Jobs',
  icon: 'IconTool',
  relationTargetObjectMetadataUniversalIdentifier:
    JOB_OBJECT_UNIVERSAL_IDENTIFIER,
  relationTargetFieldMetadataUniversalIdentifier:
    JOB_ESTIMATE_FIELD_UNIVERSAL_IDENTIFIER,
  universalSettings: {
    relationType: RelationType.ONE_TO_MANY,
  },
});
