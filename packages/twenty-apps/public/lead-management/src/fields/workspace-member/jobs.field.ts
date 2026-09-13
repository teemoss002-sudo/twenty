import {
  defineField,
  FieldType,
  RelationType,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';

import {
  JOBS_ON_WORKSPACE_MEMBER_FIELD_UNIVERSAL_IDENTIFIER,
  JOB_ASSIGNED_TECH_FIELD_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';
import { JOB_OBJECT_UNIVERSAL_IDENTIFIER } from 'src/objects/job.object';

// ONE_TO_MANY reverse field on the standard WorkspaceMember object: every Job
// whose `assignedTech` points here (the technician's job list). Targets the
// MANY_TO_ONE field on Job.
export default defineField({
  universalIdentifier: JOBS_ON_WORKSPACE_MEMBER_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier:
    STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.workspaceMember.universalIdentifier,
  type: FieldType.RELATION,
  name: 'jobs',
  label: 'Jobs',
  icon: 'IconTool',
  relationTargetObjectMetadataUniversalIdentifier:
    JOB_OBJECT_UNIVERSAL_IDENTIFIER,
  relationTargetFieldMetadataUniversalIdentifier:
    JOB_ASSIGNED_TECH_FIELD_UNIVERSAL_IDENTIFIER,
  universalSettings: {
    relationType: RelationType.ONE_TO_MANY,
  },
});
