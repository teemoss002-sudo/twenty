import {
  defineView,
  ViewFilterOperand,
  ViewSortDirection,
  ViewType,
} from 'twenty-sdk/define';

import {
  JOB_ASSIGNED_TECH_FIELD_UNIVERSAL_IDENTIFIER,
  JOB_CONFLICT_DETAILS_FIELD_UNIVERSAL_IDENTIFIER,
  JOB_NAME_FIELD_UNIVERSAL_IDENTIFIER,
  JOB_SCHEDULED_END_FIELD_UNIVERSAL_IDENTIFIER,
  JOB_SCHEDULED_START_FIELD_UNIVERSAL_IDENTIFIER,
  JOB_SCHEDULE_CONFLICT_FIELD_UNIVERSAL_IDENTIFIER,
  JOB_STATUS_FIELD_UNIVERSAL_IDENTIFIER,
  SCHEDULE_CONFLICTS_VIEW_FIELD_ASSIGNED_TECH_UNIVERSAL_IDENTIFIER,
  SCHEDULE_CONFLICTS_VIEW_FIELD_DETAILS_UNIVERSAL_IDENTIFIER,
  SCHEDULE_CONFLICTS_VIEW_FIELD_END_UNIVERSAL_IDENTIFIER,
  SCHEDULE_CONFLICTS_VIEW_FIELD_NAME_UNIVERSAL_IDENTIFIER,
  SCHEDULE_CONFLICTS_VIEW_FIELD_START_UNIVERSAL_IDENTIFIER,
  SCHEDULE_CONFLICTS_VIEW_FIELD_STATUS_UNIVERSAL_IDENTIFIER,
  SCHEDULE_CONFLICTS_VIEW_FILTER_CONFLICT_UNIVERSAL_IDENTIFIER,
  SCHEDULE_CONFLICTS_VIEW_SORT_START_UNIVERSAL_IDENTIFIER,
  SCHEDULE_CONFLICTS_VIEW_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';
import { JOB_OBJECT_UNIVERSAL_IDENTIFIER } from 'src/objects/job.object';

// The office's to-fix list: every job the schedule check flagged, soonest
// first. Rows leave the list on their own once the clash is resolved.
//
// BOOLEAN filter values must be the strings 'true' / 'false': twenty-shared's
// turnRecordFilterIntoGqlOperationFilter parses them with
// z.enum(['true', 'false']).catch(false), so a real boolean `true` would
// silently become `eq: false` and list every job WITHOUT a conflict.
export default defineView({
  universalIdentifier: SCHEDULE_CONFLICTS_VIEW_UNIVERSAL_IDENTIFIER,
  name: 'Schedule Conflicts',
  objectUniversalIdentifier: JOB_OBJECT_UNIVERSAL_IDENTIFIER,
  type: ViewType.TABLE,
  icon: 'IconCalendarExclamation',
  position: 3,
  filters: [
    {
      universalIdentifier:
        SCHEDULE_CONFLICTS_VIEW_FILTER_CONFLICT_UNIVERSAL_IDENTIFIER,
      fieldMetadataUniversalIdentifier:
        JOB_SCHEDULE_CONFLICT_FIELD_UNIVERSAL_IDENTIFIER,
      operand: ViewFilterOperand.IS,
      value: 'true',
    },
  ],
  sorts: [
    {
      universalIdentifier: SCHEDULE_CONFLICTS_VIEW_SORT_START_UNIVERSAL_IDENTIFIER,
      fieldMetadataUniversalIdentifier:
        JOB_SCHEDULED_START_FIELD_UNIVERSAL_IDENTIFIER,
      direction: ViewSortDirection.ASC,
    },
  ],
  fields: [
    {
      universalIdentifier: SCHEDULE_CONFLICTS_VIEW_FIELD_NAME_UNIVERSAL_IDENTIFIER,
      fieldMetadataUniversalIdentifier: JOB_NAME_FIELD_UNIVERSAL_IDENTIFIER,
      position: 0,
      isVisible: true,
      size: 220,
    },
    {
      universalIdentifier:
        SCHEDULE_CONFLICTS_VIEW_FIELD_DETAILS_UNIVERSAL_IDENTIFIER,
      fieldMetadataUniversalIdentifier:
        JOB_CONFLICT_DETAILS_FIELD_UNIVERSAL_IDENTIFIER,
      position: 1,
      isVisible: true,
      size: 300,
    },
    {
      universalIdentifier: SCHEDULE_CONFLICTS_VIEW_FIELD_START_UNIVERSAL_IDENTIFIER,
      fieldMetadataUniversalIdentifier:
        JOB_SCHEDULED_START_FIELD_UNIVERSAL_IDENTIFIER,
      position: 2,
      isVisible: true,
      size: 170,
    },
    {
      universalIdentifier: SCHEDULE_CONFLICTS_VIEW_FIELD_END_UNIVERSAL_IDENTIFIER,
      fieldMetadataUniversalIdentifier:
        JOB_SCHEDULED_END_FIELD_UNIVERSAL_IDENTIFIER,
      position: 3,
      isVisible: true,
      size: 170,
    },
    {
      universalIdentifier:
        SCHEDULE_CONFLICTS_VIEW_FIELD_ASSIGNED_TECH_UNIVERSAL_IDENTIFIER,
      fieldMetadataUniversalIdentifier:
        JOB_ASSIGNED_TECH_FIELD_UNIVERSAL_IDENTIFIER,
      position: 4,
      isVisible: true,
      size: 180,
    },
    {
      universalIdentifier:
        SCHEDULE_CONFLICTS_VIEW_FIELD_STATUS_UNIVERSAL_IDENTIFIER,
      fieldMetadataUniversalIdentifier: JOB_STATUS_FIELD_UNIVERSAL_IDENTIFIER,
      position: 5,
      isVisible: true,
      size: 130,
    },
  ],
});
