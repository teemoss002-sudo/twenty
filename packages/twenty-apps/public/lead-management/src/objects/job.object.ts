import { defineObject, FieldType } from 'twenty-sdk/define';

import {
  JOB_NAME_FIELD_UNIVERSAL_IDENTIFIER,
  JOB_OBJECT_UNIVERSAL_IDENTIFIER,
  JOB_SCHEDULED_END_FIELD_UNIVERSAL_IDENTIFIER,
  JOB_SCHEDULED_START_FIELD_UNIVERSAL_IDENTIFIER,
  JOB_SERVICE_TYPE_FIELD_UNIVERSAL_IDENTIFIER,
  JOB_STATUS_FIELD_UNIVERSAL_IDENTIFIER,
  JOB_TECH_NOTES_FIELD_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

// Re-exported for relation field files that target this object
// (real-estate app pattern: fields import the object UID from the object file).
export { JOB_OBJECT_UNIVERSAL_IDENTIFIER };

enum JobStatus {
  SCHEDULED = 'SCHEDULED',
  EN_ROUTE = 'EN_ROUTE',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

enum ServiceType {
  GENERAL = 'GENERAL',
  REPAIR = 'REPAIR',
  INSTALLATION = 'INSTALLATION',
  MAINTENANCE = 'MAINTENANCE',
  INSPECTION = 'INSPECTION',
  CLEANING = 'CLEANING',
  OTHER = 'OTHER',
}

// JobFlow Job: scheduled work performed for a customer. App-owned custom object
// created through the standard Apps SDK manifest (no core changes, no manual
// migrations). Relation fields (estimate, customer, assignedTech) are declared
// in src/fields/job/*.field.ts — following the real-estate app convention of
// keeping relations out of defineObject's inline field list.
export default defineObject({
  universalIdentifier: JOB_OBJECT_UNIVERSAL_IDENTIFIER,
  nameSingular: 'job',
  namePlural: 'jobs',
  labelSingular: 'Job',
  labelPlural: 'Jobs',
  description: 'A piece of scheduled work performed for a customer.',
  icon: 'IconTool',
  labelIdentifierFieldMetadataUniversalIdentifier:
    JOB_NAME_FIELD_UNIVERSAL_IDENTIFIER,
  fields: [
    {
      universalIdentifier: JOB_NAME_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.TEXT,
      name: 'name',
      label: 'Name',
      description: 'Job label, e.g. the work summary',
      icon: 'IconAbc',
      defaultValue: "''",
    },
    {
      universalIdentifier: JOB_STATUS_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.SELECT,
      name: 'status',
      label: 'Status',
      icon: 'IconProgressCheck',
      isNullable: false,
      defaultValue: `'${JobStatus.SCHEDULED}'`,
      options: [
        {
          id: 'd0a0d0a0-0000-4000-8000-000000000911',
          value: JobStatus.SCHEDULED,
          label: 'Scheduled',
          position: 0,
          color: 'blue',
        },
        {
          id: 'd0a0d0a0-0000-4000-8000-000000000912',
          value: JobStatus.EN_ROUTE,
          label: 'En Route',
          position: 1,
          color: 'turquoise',
        },
        {
          id: 'd0a0d0a0-0000-4000-8000-000000000913',
          value: JobStatus.IN_PROGRESS,
          label: 'In Progress',
          position: 2,
          color: 'orange',
        },
        {
          id: 'd0a0d0a0-0000-4000-8000-000000000914',
          value: JobStatus.COMPLETED,
          label: 'Completed',
          position: 3,
          color: 'green',
        },
        {
          id: 'd0a0d0a0-0000-4000-8000-000000000915',
          value: JobStatus.CANCELLED,
          label: 'Cancelled',
          position: 4,
          color: 'gray',
        },
      ],
    },
    {
      universalIdentifier: JOB_SERVICE_TYPE_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.SELECT,
      name: 'serviceType',
      label: 'Service Type',
      description: 'Kind of work performed. Generic across service trades.',
      icon: 'IconBuildings',
      isNullable: true,
      options: [
        {
          id: 'd0a0d0a0-0000-4000-8000-000000000916',
          value: ServiceType.GENERAL,
          label: 'General',
          position: 0,
          color: 'blue',
        },
        {
          id: 'd0a0d0a0-0000-4000-8000-000000000917',
          value: ServiceType.REPAIR,
          label: 'Repair',
          position: 1,
          color: 'orange',
        },
        {
          id: 'd0a0d0a0-0000-4000-8000-000000000918',
          value: ServiceType.INSTALLATION,
          label: 'Installation',
          position: 2,
          color: 'green',
        },
        {
          id: 'd0a0d0a0-0000-4000-8000-000000000919',
          value: ServiceType.MAINTENANCE,
          label: 'Maintenance',
          position: 3,
          color: 'turquoise',
        },
        {
          id: 'd0a0d0a0-0000-4000-8000-000000000920',
          value: ServiceType.INSPECTION,
          label: 'Inspection',
          position: 4,
          color: 'purple',
        },
        {
          id: 'd0a0d0a0-0000-4000-8000-000000000921',
          value: ServiceType.CLEANING,
          label: 'Cleaning',
          position: 5,
          color: 'sky',
        },
        {
          id: 'd0a0d0a0-0000-4000-8000-000000000922',
          value: ServiceType.OTHER,
          label: 'Other',
          position: 6,
          color: 'gray',
        },
      ],
    },
    {
      universalIdentifier: JOB_SCHEDULED_START_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.DATE_TIME,
      name: 'scheduledStart',
      label: 'Scheduled Start',
      icon: 'IconCalendarClock',
      isNullable: true,
    },
    {
      universalIdentifier: JOB_SCHEDULED_END_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.DATE_TIME,
      name: 'scheduledEnd',
      label: 'Scheduled End',
      icon: 'IconCalendarEvent',
      isNullable: true,
    },
    {
      universalIdentifier: JOB_TECH_NOTES_FIELD_UNIVERSAL_IDENTIFIER,
      type: FieldType.RICH_TEXT,
      name: 'techNotes',
      label: 'Tech Notes',
      description: 'Technician notes from the field.',
      icon: 'IconNotes',
      isNullable: true,
    },
  ],
});
