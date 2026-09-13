import {
  defineField,
  FieldType,
  OnDeleteAction,
  RelationType,
} from 'twenty-sdk/define';

import {
  JOB_ESTIMATE_FIELD_UNIVERSAL_IDENTIFIER,
  JOBS_ON_ESTIMATE_FIELD_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';
import { ESTIMATE_OBJECT_UNIVERSAL_IDENTIFIER } from 'src/objects/estimate.object';
import { JOB_OBJECT_UNIVERSAL_IDENTIFIER } from 'src/objects/job.object';

// MANY_TO_ONE on the Job object → the app-owned Estimate object.
// The reverse ONE_TO_MANY field (`jobs`) is declared in
// src/fields/estimate/jobs.field.ts.
export default defineField({
  universalIdentifier: JOB_ESTIMATE_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier: JOB_OBJECT_UNIVERSAL_IDENTIFIER,
  type: FieldType.RELATION,
  name: 'estimate',
  label: 'Estimate',
  icon: 'IconFileDollar',
  isNullable: true,
  relationTargetObjectMetadataUniversalIdentifier:
    ESTIMATE_OBJECT_UNIVERSAL_IDENTIFIER,
  relationTargetFieldMetadataUniversalIdentifier:
    JOBS_ON_ESTIMATE_FIELD_UNIVERSAL_IDENTIFIER,
  universalSettings: {
    relationType: RelationType.MANY_TO_ONE,
    onDelete: OnDeleteAction.SET_NULL,
    joinColumnName: 'estimateId',
  },
});
