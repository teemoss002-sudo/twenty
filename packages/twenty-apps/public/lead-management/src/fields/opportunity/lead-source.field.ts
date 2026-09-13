import { defineField, FieldType } from 'twenty-sdk/define';

import { LEAD_SOURCE_FIELD_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';
import { OPPORTUNITY_OBJECT_UNIVERSAL_IDENTIFIER } from 'src/objects/opportunity.object';

export default defineField({
  universalIdentifier: LEAD_SOURCE_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier: OPPORTUNITY_OBJECT_UNIVERSAL_IDENTIFIER,
  name: 'leadSource',
  label: 'Lead Source',
  type: FieldType.SELECT,
  description: 'Where this lead came from.',
  icon: 'IconMegaphone',
  options: [
    { value: 'REFERRAL', label: 'Referral', position: 0, color: 'green' },
    { value: 'WEBSITE', label: 'Website', position: 1, color: 'turquoise' },
    { value: 'GOOGLE_LSA', label: 'Google / LSA', position: 2, color: 'blue' },
    {
      value: 'SOCIAL_MEDIA',
      label: 'Social Media',
      position: 3,
      color: 'purple',
    },
    { value: 'WALK_IN', label: 'Walk-in', position: 4, color: 'orange' },
    { value: 'COLD_CALL', label: 'Cold Call', position: 5, color: 'yellow' },
    { value: 'OTHER', label: 'Other', position: 6, color: 'gray' },
  ],
});
