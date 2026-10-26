import { defineView, ViewType } from 'twenty-sdk/define';

import {
  JOB_ASSIGNED_TECH_FIELD_UNIVERSAL_IDENTIFIER,
  JOB_BOARD_VIEW_FIELD_ASSIGNED_TECH_UNIVERSAL_IDENTIFIER,
  JOB_BOARD_VIEW_FIELD_CUSTOMER_UNIVERSAL_IDENTIFIER,
  JOB_BOARD_VIEW_FIELD_NAME_UNIVERSAL_IDENTIFIER,
  JOB_BOARD_VIEW_FIELD_SCHEDULED_START_UNIVERSAL_IDENTIFIER,
  JOB_BOARD_VIEW_FIELD_STATUS_UNIVERSAL_IDENTIFIER,
  JOB_BOARD_GROUP_CANCELLED_UNIVERSAL_IDENTIFIER,
  JOB_BOARD_GROUP_COMPLETED_UNIVERSAL_IDENTIFIER,
  JOB_BOARD_GROUP_EN_ROUTE_UNIVERSAL_IDENTIFIER,
  JOB_BOARD_GROUP_IN_PROGRESS_UNIVERSAL_IDENTIFIER,
  JOB_BOARD_GROUP_SCHEDULED_UNIVERSAL_IDENTIFIER,
  JOB_BOARD_VIEW_UNIVERSAL_IDENTIFIER,
  JOB_CUSTOMER_FIELD_UNIVERSAL_IDENTIFIER,
  JOB_NAME_FIELD_UNIVERSAL_IDENTIFIER,
  JOB_SCHEDULED_START_FIELD_UNIVERSAL_IDENTIFIER,
  JOB_STATUS_FIELD_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';
import { JOB_OBJECT_UNIVERSAL_IDENTIFIER } from 'src/objects/job.object';

// Kanban grouped by job status: Scheduled → En Route → In Progress → Completed
// / Cancelled. Mirrors the Lead Pipeline kanban pattern.
export default defineView({
  universalIdentifier: JOB_BOARD_VIEW_UNIVERSAL_IDENTIFIER,
  name: 'Job Board',
  objectUniversalIdentifier: JOB_OBJECT_UNIVERSAL_IDENTIFIER,
  type: ViewType.KANBAN,
  icon: 'IconLayoutKanban',
  position: 1,
  mainGroupByFieldMetadataUniversalIdentifier:
    JOB_STATUS_FIELD_UNIVERSAL_IDENTIFIER,
  shouldHideEmptyGroups: true,
  fields: [
    {
      universalIdentifier: JOB_BOARD_VIEW_FIELD_NAME_UNIVERSAL_IDENTIFIER,
      fieldMetadataUniversalIdentifier: JOB_NAME_FIELD_UNIVERSAL_IDENTIFIER,
      position: 0,
      isVisible: true,
      size: 200,
    },
    {
      universalIdentifier: JOB_BOARD_VIEW_FIELD_STATUS_UNIVERSAL_IDENTIFIER,
      fieldMetadataUniversalIdentifier: JOB_STATUS_FIELD_UNIVERSAL_IDENTIFIER,
      position: 1,
      isVisible: true,
      size: 140,
    },
    {
      universalIdentifier:
        JOB_BOARD_VIEW_FIELD_SCHEDULED_START_UNIVERSAL_IDENTIFIER,
      fieldMetadataUniversalIdentifier:
        JOB_SCHEDULED_START_FIELD_UNIVERSAL_IDENTIFIER,
      position: 2,
      isVisible: true,
      size: 180,
    },
    {
      universalIdentifier:
        JOB_BOARD_VIEW_FIELD_ASSIGNED_TECH_UNIVERSAL_IDENTIFIER,
      fieldMetadataUniversalIdentifier:
        JOB_ASSIGNED_TECH_FIELD_UNIVERSAL_IDENTIFIER,
      position: 3,
      isVisible: true,
      size: 180,
    },
    {
      universalIdentifier: JOB_BOARD_VIEW_FIELD_CUSTOMER_UNIVERSAL_IDENTIFIER,
      fieldMetadataUniversalIdentifier:
        JOB_CUSTOMER_FIELD_UNIVERSAL_IDENTIFIER,
      position: 4,
      isVisible: true,
      size: 200,
    },
  ],
  // One group per Job status option — without these the board renders no
  // columns at all (groups are not derived from the field's options).
  groups: [
    {
      universalIdentifier: JOB_BOARD_GROUP_SCHEDULED_UNIVERSAL_IDENTIFIER,
      fieldValue: 'SCHEDULED',
      position: 0,
      isVisible: true,
    },
    {
      universalIdentifier: JOB_BOARD_GROUP_EN_ROUTE_UNIVERSAL_IDENTIFIER,
      fieldValue: 'EN_ROUTE',
      position: 1,
      isVisible: true,
    },
    {
      universalIdentifier: JOB_BOARD_GROUP_IN_PROGRESS_UNIVERSAL_IDENTIFIER,
      fieldValue: 'IN_PROGRESS',
      position: 2,
      isVisible: true,
    },
    {
      universalIdentifier: JOB_BOARD_GROUP_COMPLETED_UNIVERSAL_IDENTIFIER,
      fieldValue: 'COMPLETED',
      position: 3,
      isVisible: true,
    },
    {
      universalIdentifier: JOB_BOARD_GROUP_CANCELLED_UNIVERSAL_IDENTIFIER,
      fieldValue: 'CANCELLED',
      position: 4,
      isVisible: true,
    },
  ],
});
