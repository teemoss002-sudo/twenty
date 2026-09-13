import { defineField, FieldType } from 'twenty-sdk/define';

import { ESTIMATED_VALUE_FIELD_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';
import { OPPORTUNITY_OBJECT_UNIVERSAL_IDENTIFIER } from 'src/objects/opportunity.object';

export default defineField({
  universalIdentifier: ESTIMATED_VALUE_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier: OPPORTUNITY_OBJECT_UNIVERSAL_IDENTIFIER,
  name: 'estimatedValue',
  label: 'Estimated Value',
  type: FieldType.CURRENCY,
  description: 'Estimated value of the job for this lead.',
  icon: 'IconCurrencyDollar',
});
