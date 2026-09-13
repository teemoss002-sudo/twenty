import { defineField, FieldType } from 'twenty-sdk/define';

import { LEAD_TEMPERATURE_FIELD_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';
import { OPPORTUNITY_OBJECT_UNIVERSAL_IDENTIFIER } from 'src/objects/opportunity.object';

export default defineField({
  universalIdentifier: LEAD_TEMPERATURE_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier: OPPORTUNITY_OBJECT_UNIVERSAL_IDENTIFIER,
  name: 'leadTemperature',
  label: 'Temperature',
  type: FieldType.SELECT,
  description: 'How engaged this lead is right now.',
  icon: 'IconFlame',
  options: [
    { value: 'HOT', label: 'Hot', position: 0, color: 'red' },
    { value: 'WARM', label: 'Warm', position: 1, color: 'orange' },
    { value: 'COLD', label: 'Cold', position: 2, color: 'blue' },
  ],
});
