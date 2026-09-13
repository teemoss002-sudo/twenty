import { defineField, FieldType } from 'twenty-sdk/define';

import { LEAD_SCORE_FIELD_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';
import { OPPORTUNITY_OBJECT_UNIVERSAL_IDENTIFIER } from 'src/objects/opportunity.object';

export default defineField({
  universalIdentifier: LEAD_SCORE_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier: OPPORTUNITY_OBJECT_UNIVERSAL_IDENTIFIER,
  name: 'leadScore',
  label: 'Lead Score',
  type: FieldType.NUMBER,
  description: 'Qualification score from 0 to 100.',
  icon: 'IconChartBar',
});
