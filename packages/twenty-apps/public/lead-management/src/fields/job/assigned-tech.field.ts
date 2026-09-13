import {
  defineField,
  FieldType,
  OnDeleteAction,
  RelationType,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';

import {
  JOB_ASSIGNED_TECH_FIELD_UNIVERSAL_IDENTIFIER,
  JOBS_ON_WORKSPACE_MEMBER_FIELD_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';
import { JOB_OBJECT_UNIVERSAL_IDENTIFIER } from 'src/objects/job.object';

// MANY_TO_ONE on the Job object → the standard WorkspaceMember (the technician).
// The reverse ONE_TO_MANY field (`jobs`) is declared in
// src/fields/workspace-member/jobs.field.ts.
export default defineField({
  universalIdentifier: JOB_ASSIGNED_TECH_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier: JOB_OBJECT_UNIVERSAL_IDENTIFIER,
  type: FieldType.RELATION,
  name: 'assignedTech',
  label: 'Assigned Tech',
  icon: 'IconUserCog',
  isNullable: true,
  relationTargetObjectMetadataUniversalIdentifier:
    STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.workspaceMember.universalIdentifier,
  relationTargetFieldMetadataUniversalIdentifier:
    JOBS_ON_WORKSPACE_MEMBER_FIELD_UNIVERSAL_IDENTIFIER,
  universalSettings: {
    relationType: RelationType.MANY_TO_ONE,
    onDelete: OnDeleteAction.SET_NULL,
    joinColumnName: 'assignedTechId',
  },
});
