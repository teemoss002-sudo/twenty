import { defineField, FieldType } from 'twenty-sdk/define';

import { LEAD_OWNER_NOTES_FIELD_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';
import { OPPORTUNITY_OBJECT_UNIVERSAL_IDENTIFIER } from 'src/objects/opportunity.object';

export default defineField({
  universalIdentifier: LEAD_OWNER_NOTES_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier: OPPORTUNITY_OBJECT_UNIVERSAL_IDENTIFIER,
  name: 'leadOwnerNotes',
  label: 'Owner Notes',
  type: FieldType.TEXT,
  description: 'Internal notes from the lead owner.',
  icon: 'IconNotes',
});
