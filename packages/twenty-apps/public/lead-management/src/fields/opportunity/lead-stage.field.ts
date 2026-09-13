import { defineField, FieldType } from 'twenty-sdk/define';

import { LEAD_STAGE_FIELD_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';
import { OPPORTUNITY_OBJECT_UNIVERSAL_IDENTIFIER } from 'src/objects/opportunity.object';

/**
 * JobFlow lead pipeline stage.
 *
 * This app-owned select is the MVP way to "configure lead stages" on the
 * standard Opportunity: the manifest cannot rewrite the options of Twenty's
 * core `stage` field, and mutating core stage options at runtime was rejected
 * in the plan (data-loss risk for existing records). The core `stage` field
 * remains untouched; JobFlow views, kanban and layouts surface this field
 * instead.
 */
export default defineField({
  universalIdentifier: LEAD_STAGE_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier: OPPORTUNITY_OBJECT_UNIVERSAL_IDENTIFIER,
  name: 'leadStage',
  label: 'Stage',
  type: FieldType.SELECT,
  description:
    'JobFlow lead pipeline stage: New → Qualified → Estimate Sent → Follow-up → Won / Lost.',
  icon: 'IconFlag',
  defaultValue: "'NEW'",
  options: [
    { value: 'NEW', label: 'New', position: 0, color: 'blue' },
    { value: 'QUALIFIED', label: 'Qualified', position: 1, color: 'turquoise' },
    {
      value: 'ESTIMATE_SENT',
      label: 'Estimate Sent',
      position: 2,
      color: 'purple',
    },
    { value: 'FOLLOW_UP', label: 'Follow-up', position: 3, color: 'orange' },
    { value: 'WON', label: 'Won', position: 4, color: 'green' },
    { value: 'LOST', label: 'Lost', position: 5, color: 'red' },
  ],
});
