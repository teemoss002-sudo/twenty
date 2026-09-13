import { defineField, FieldType } from 'twenty-sdk/define';

import { NEXT_FOLLOW_UP_FIELD_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';
import { OPPORTUNITY_OBJECT_UNIVERSAL_IDENTIFIER } from 'src/objects/opportunity.object';

export default defineField({
  universalIdentifier: NEXT_FOLLOW_UP_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier: OPPORTUNITY_OBJECT_UNIVERSAL_IDENTIFIER,
  name: 'nextFollowUp',
  label: 'Next Follow-up',
  type: FieldType.DATE_TIME,
  description: 'When to follow up with this lead next.',
  icon: 'IconCalendarClock',
});
