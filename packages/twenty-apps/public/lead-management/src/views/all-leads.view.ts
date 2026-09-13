import { defineView, ViewType } from 'twenty-sdk/define';

import { ALL_LEADS_VIEW_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';
import { OPPORTUNITY_OBJECT_UNIVERSAL_IDENTIFIER } from 'src/objects/opportunity.object';
import { ALL_LEADS_VIEW_FIELDS } from 'src/view-fields/all-leads.view-fields';

export default defineView({
  universalIdentifier: ALL_LEADS_VIEW_UNIVERSAL_IDENTIFIER,
  name: 'All Leads',
  objectUniversalIdentifier: OPPORTUNITY_OBJECT_UNIVERSAL_IDENTIFIER,
  type: ViewType.TABLE,
  icon: 'IconList',
  position: 1,
  fields: ALL_LEADS_VIEW_FIELDS,
});
