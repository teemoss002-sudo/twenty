import { defineView, ViewFilterOperand, ViewType } from 'twenty-sdk/define';

import {
  HOT_LEADS_VIEW_FILTER_TEMPERATURE_IS_HOT_UNIVERSAL_IDENTIFIER,
  HOT_LEADS_VIEW_UNIVERSAL_IDENTIFIER,
  LEAD_TEMPERATURE_FIELD_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';
import { OPPORTUNITY_OBJECT_UNIVERSAL_IDENTIFIER } from 'src/objects/opportunity.object';
import { HOT_LEADS_VIEW_FIELDS } from 'src/view-fields/hot-leads.view-fields';

export default defineView({
  universalIdentifier: HOT_LEADS_VIEW_UNIVERSAL_IDENTIFIER,
  name: 'Hot Leads',
  objectUniversalIdentifier: OPPORTUNITY_OBJECT_UNIVERSAL_IDENTIFIER,
  type: ViewType.TABLE,
  icon: 'IconFlame',
  position: 3,
  filters: [
    {
      universalIdentifier:
        HOT_LEADS_VIEW_FILTER_TEMPERATURE_IS_HOT_UNIVERSAL_IDENTIFIER,
      fieldMetadataUniversalIdentifier:
        LEAD_TEMPERATURE_FIELD_UNIVERSAL_IDENTIFIER,
      operand: ViewFilterOperand.IS,
      value: ['HOT'],
    },
  ],
  fields: HOT_LEADS_VIEW_FIELDS,
});
