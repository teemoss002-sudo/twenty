import { defineView, ViewCalendarLayout, ViewType } from 'twenty-sdk/define';

import {
  JOB_ASSIGNED_TECH_FIELD_UNIVERSAL_IDENTIFIER,
  JOB_CALENDAR_VIEW_FIELD_ASSIGNED_TECH_UNIVERSAL_IDENTIFIER,
  JOB_CALENDAR_VIEW_FIELD_CONFLICT_UNIVERSAL_IDENTIFIER,
  JOB_CALENDAR_VIEW_FIELD_CUSTOMER_UNIVERSAL_IDENTIFIER,
  JOB_CALENDAR_VIEW_FIELD_NAME_UNIVERSAL_IDENTIFIER,
  JOB_CALENDAR_VIEW_FIELD_STATUS_UNIVERSAL_IDENTIFIER,
  JOB_CALENDAR_VIEW_UNIVERSAL_IDENTIFIER,
  JOB_CUSTOMER_FIELD_UNIVERSAL_IDENTIFIER,
  JOB_NAME_FIELD_UNIVERSAL_IDENTIFIER,
  JOB_SCHEDULED_END_FIELD_UNIVERSAL_IDENTIFIER,
  JOB_SCHEDULED_START_FIELD_UNIVERSAL_IDENTIFIER,
  JOB_SCHEDULE_CONFLICT_FIELD_UNIVERSAL_IDENTIFIER,
  JOB_STATUS_FIELD_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';
import { JOB_OBJECT_UNIVERSAL_IDENTIFIER } from 'src/objects/job.object';

// Week calendar of jobs placed by scheduledStart → scheduledEnd, so the office
// sees each tech's week at a glance; the conflict flag rides on each card.
export default defineView({
  universalIdentifier: JOB_CALENDAR_VIEW_UNIVERSAL_IDENTIFIER,
  name: 'Job Calendar',
  objectUniversalIdentifier: JOB_OBJECT_UNIVERSAL_IDENTIFIER,
  type: ViewType.CALENDAR,
  icon: 'IconCalendar',
  position: 2,
  calendarLayout: ViewCalendarLayout.WEEK,
  calendarFieldMetadataUniversalIdentifier:
    JOB_SCHEDULED_START_FIELD_UNIVERSAL_IDENTIFIER,
  calendarEndFieldMetadataUniversalIdentifier:
    JOB_SCHEDULED_END_FIELD_UNIVERSAL_IDENTIFIER,
  fields: [
    {
      universalIdentifier: JOB_CALENDAR_VIEW_FIELD_NAME_UNIVERSAL_IDENTIFIER,
      fieldMetadataUniversalIdentifier: JOB_NAME_FIELD_UNIVERSAL_IDENTIFIER,
      position: 0,
      isVisible: true,
    },
    {
      universalIdentifier:
        JOB_CALENDAR_VIEW_FIELD_ASSIGNED_TECH_UNIVERSAL_IDENTIFIER,
      fieldMetadataUniversalIdentifier:
        JOB_ASSIGNED_TECH_FIELD_UNIVERSAL_IDENTIFIER,
      position: 1,
      isVisible: true,
    },
    {
      universalIdentifier: JOB_CALENDAR_VIEW_FIELD_STATUS_UNIVERSAL_IDENTIFIER,
      fieldMetadataUniversalIdentifier: JOB_STATUS_FIELD_UNIVERSAL_IDENTIFIER,
      position: 2,
      isVisible: true,
    },
    {
      universalIdentifier: JOB_CALENDAR_VIEW_FIELD_CUSTOMER_UNIVERSAL_IDENTIFIER,
      fieldMetadataUniversalIdentifier:
        JOB_CUSTOMER_FIELD_UNIVERSAL_IDENTIFIER,
      position: 3,
      isVisible: true,
    },
    {
      universalIdentifier: JOB_CALENDAR_VIEW_FIELD_CONFLICT_UNIVERSAL_IDENTIFIER,
      fieldMetadataUniversalIdentifier:
        JOB_SCHEDULE_CONFLICT_FIELD_UNIVERSAL_IDENTIFIER,
      position: 4,
      isVisible: true,
    },
  ],
});
