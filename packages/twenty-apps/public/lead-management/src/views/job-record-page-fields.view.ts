import { defineView, ViewType } from 'twenty-sdk/define';

import {
  JOB_ASSIGNED_TECH_FIELD_UNIVERSAL_IDENTIFIER,
  JOB_CUSTOMER_FIELD_UNIVERSAL_IDENTIFIER,
  JOB_ESTIMATE_FIELD_UNIVERSAL_IDENTIFIER,
  JOB_NAME_FIELD_UNIVERSAL_IDENTIFIER,
  JOB_RECORD_FIELD_ASSIGNED_TECH_UNIVERSAL_IDENTIFIER,
  JOB_RECORD_FIELD_CUSTOMER_UNIVERSAL_IDENTIFIER,
  JOB_RECORD_FIELD_ESTIMATE_UNIVERSAL_IDENTIFIER,
  JOB_RECORD_FIELD_NAME_UNIVERSAL_IDENTIFIER,
  JOB_RECORD_FIELD_SCHEDULED_END_UNIVERSAL_IDENTIFIER,
  JOB_RECORD_FIELD_SCHEDULED_START_UNIVERSAL_IDENTIFIER,
  JOB_RECORD_FIELD_SERVICE_TYPE_UNIVERSAL_IDENTIFIER,
  JOB_RECORD_FIELD_STATUS_UNIVERSAL_IDENTIFIER,
  JOB_RECORD_PAGE_FIELDS_VIEW_UNIVERSAL_IDENTIFIER,
  JOB_SCHEDULED_END_FIELD_UNIVERSAL_IDENTIFIER,
  JOB_SCHEDULED_START_FIELD_UNIVERSAL_IDENTIFIER,
  JOB_SERVICE_TYPE_FIELD_UNIVERSAL_IDENTIFIER,
  JOB_STATUS_FIELD_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';
import { JOB_OBJECT_UNIVERSAL_IDENTIFIER } from 'src/objects/job.object';

// FIELDS_WIDGET view backing the Job record page "Home" tab
// (real-estate pattern: the layout's Fields widget renders this view).
export const JOB_RECORD_PAGE_FIELDS_VIEW_ID =
  JOB_RECORD_PAGE_FIELDS_VIEW_UNIVERSAL_IDENTIFIER;

export default defineView({
  universalIdentifier: JOB_RECORD_PAGE_FIELDS_VIEW_UNIVERSAL_IDENTIFIER,
  name: 'Job Record Page Fields',
  objectUniversalIdentifier: JOB_OBJECT_UNIVERSAL_IDENTIFIER,
  type: ViewType.FIELDS_WIDGET,
  fields: [
    {
      universalIdentifier: JOB_RECORD_FIELD_NAME_UNIVERSAL_IDENTIFIER,
      fieldMetadataUniversalIdentifier: JOB_NAME_FIELD_UNIVERSAL_IDENTIFIER,
      position: 0,
      isVisible: true,
    },
    {
      universalIdentifier: JOB_RECORD_FIELD_STATUS_UNIVERSAL_IDENTIFIER,
      fieldMetadataUniversalIdentifier: JOB_STATUS_FIELD_UNIVERSAL_IDENTIFIER,
      position: 1,
      isVisible: true,
    },
    {
      universalIdentifier: JOB_RECORD_FIELD_SERVICE_TYPE_UNIVERSAL_IDENTIFIER,
      fieldMetadataUniversalIdentifier:
        JOB_SERVICE_TYPE_FIELD_UNIVERSAL_IDENTIFIER,
      position: 2,
      isVisible: true,
    },
    {
      universalIdentifier:
        JOB_RECORD_FIELD_SCHEDULED_START_UNIVERSAL_IDENTIFIER,
      fieldMetadataUniversalIdentifier:
        JOB_SCHEDULED_START_FIELD_UNIVERSAL_IDENTIFIER,
      position: 3,
      isVisible: true,
    },
    {
      universalIdentifier: JOB_RECORD_FIELD_SCHEDULED_END_UNIVERSAL_IDENTIFIER,
      fieldMetadataUniversalIdentifier:
        JOB_SCHEDULED_END_FIELD_UNIVERSAL_IDENTIFIER,
      position: 4,
      isVisible: true,
    },
    {
      universalIdentifier: JOB_RECORD_FIELD_ESTIMATE_UNIVERSAL_IDENTIFIER,
      fieldMetadataUniversalIdentifier:
        JOB_ESTIMATE_FIELD_UNIVERSAL_IDENTIFIER,
      position: 5,
      isVisible: true,
    },
    {
      universalIdentifier: JOB_RECORD_FIELD_ASSIGNED_TECH_UNIVERSAL_IDENTIFIER,
      fieldMetadataUniversalIdentifier:
        JOB_ASSIGNED_TECH_FIELD_UNIVERSAL_IDENTIFIER,
      position: 6,
      isVisible: true,
    },
    {
      universalIdentifier: JOB_RECORD_FIELD_CUSTOMER_UNIVERSAL_IDENTIFIER,
      fieldMetadataUniversalIdentifier:
        JOB_CUSTOMER_FIELD_UNIVERSAL_IDENTIFIER,
      position: 7,
      isVisible: true,
    },
  ],
});
