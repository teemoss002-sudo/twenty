import { defineView, ViewType } from 'twenty-sdk/define';

import {
  ALL_JOBS_VIEW_UNIVERSAL_IDENTIFIER,
  JOBS_VIEW_FIELD_ASSIGNED_TECH_UNIVERSAL_IDENTIFIER,
  JOBS_VIEW_FIELD_CUSTOMER_UNIVERSAL_IDENTIFIER,
  JOBS_VIEW_FIELD_ESTIMATE_UNIVERSAL_IDENTIFIER,
  JOBS_VIEW_FIELD_NAME_UNIVERSAL_IDENTIFIER,
  JOBS_VIEW_FIELD_SCHEDULED_START_UNIVERSAL_IDENTIFIER,
  JOBS_VIEW_FIELD_SERVICE_TYPE_UNIVERSAL_IDENTIFIER,
  JOBS_VIEW_FIELD_STATUS_UNIVERSAL_IDENTIFIER,
  JOB_ASSIGNED_TECH_FIELD_UNIVERSAL_IDENTIFIER,
  JOB_CUSTOMER_FIELD_UNIVERSAL_IDENTIFIER,
  JOB_ESTIMATE_FIELD_UNIVERSAL_IDENTIFIER,
  JOB_NAME_FIELD_UNIVERSAL_IDENTIFIER,
  JOB_SCHEDULED_START_FIELD_UNIVERSAL_IDENTIFIER,
  JOB_SERVICE_TYPE_FIELD_UNIVERSAL_IDENTIFIER,
  JOB_STATUS_FIELD_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';
import { JOB_OBJECT_UNIVERSAL_IDENTIFIER } from 'src/objects/job.object';

export default defineView({
  universalIdentifier: ALL_JOBS_VIEW_UNIVERSAL_IDENTIFIER,
  name: 'All Jobs',
  objectUniversalIdentifier: JOB_OBJECT_UNIVERSAL_IDENTIFIER,
  type: ViewType.TABLE,
  icon: 'IconTool',
  position: 0,
  fields: [
    {
      universalIdentifier: JOBS_VIEW_FIELD_NAME_UNIVERSAL_IDENTIFIER,
      fieldMetadataUniversalIdentifier: JOB_NAME_FIELD_UNIVERSAL_IDENTIFIER,
      position: 0,
      isVisible: true,
      size: 220,
    },
    {
      universalIdentifier: JOBS_VIEW_FIELD_STATUS_UNIVERSAL_IDENTIFIER,
      fieldMetadataUniversalIdentifier: JOB_STATUS_FIELD_UNIVERSAL_IDENTIFIER,
      position: 1,
      isVisible: true,
      size: 140,
    },
    {
      universalIdentifier: JOBS_VIEW_FIELD_SERVICE_TYPE_UNIVERSAL_IDENTIFIER,
      fieldMetadataUniversalIdentifier:
        JOB_SERVICE_TYPE_FIELD_UNIVERSAL_IDENTIFIER,
      position: 2,
      isVisible: true,
      size: 150,
    },
    {
      universalIdentifier: JOBS_VIEW_FIELD_SCHEDULED_START_UNIVERSAL_IDENTIFIER,
      fieldMetadataUniversalIdentifier:
        JOB_SCHEDULED_START_FIELD_UNIVERSAL_IDENTIFIER,
      position: 3,
      isVisible: true,
      size: 180,
    },
    {
      universalIdentifier: JOBS_VIEW_FIELD_ESTIMATE_UNIVERSAL_IDENTIFIER,
      fieldMetadataUniversalIdentifier:
        JOB_ESTIMATE_FIELD_UNIVERSAL_IDENTIFIER,
      position: 4,
      isVisible: true,
      size: 200,
    },
    {
      universalIdentifier: JOBS_VIEW_FIELD_ASSIGNED_TECH_UNIVERSAL_IDENTIFIER,
      fieldMetadataUniversalIdentifier:
        JOB_ASSIGNED_TECH_FIELD_UNIVERSAL_IDENTIFIER,
      position: 5,
      isVisible: true,
      size: 180,
    },
    {
      universalIdentifier: JOBS_VIEW_FIELD_CUSTOMER_UNIVERSAL_IDENTIFIER,
      fieldMetadataUniversalIdentifier:
        JOB_CUSTOMER_FIELD_UNIVERSAL_IDENTIFIER,
      position: 6,
      isVisible: true,
      size: 200,
    },
  ],
});
