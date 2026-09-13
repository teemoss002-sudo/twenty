import { defineView, ViewSortDirection, ViewType } from 'twenty-sdk/define';

import {
  MY_LEADS_VIEW_SORT_NEXT_FOLLOW_UP_UNIVERSAL_IDENTIFIER,
  MY_LEADS_VIEW_UNIVERSAL_IDENTIFIER,
  NEXT_FOLLOW_UP_FIELD_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';
import { OPPORTUNITY_OBJECT_UNIVERSAL_IDENTIFIER } from 'src/objects/opportunity.object';
import { MY_LEADS_VIEW_FIELDS } from 'src/view-fields/my-leads.view-fields';

// Upcoming follow-ups first. Per-user scoping ("my") comes from the Sales Rep
// role's row-level ownership predicate, since manifest view-filter values are
// literal and cannot express "owner is the current user".
export default defineView({
  universalIdentifier: MY_LEADS_VIEW_UNIVERSAL_IDENTIFIER,
  name: 'My Leads',
  objectUniversalIdentifier: OPPORTUNITY_OBJECT_UNIVERSAL_IDENTIFIER,
  type: ViewType.TABLE,
  icon: 'IconUser',
  position: 2,
  sorts: [
    {
      universalIdentifier: MY_LEADS_VIEW_SORT_NEXT_FOLLOW_UP_UNIVERSAL_IDENTIFIER,
      fieldMetadataUniversalIdentifier: NEXT_FOLLOW_UP_FIELD_UNIVERSAL_IDENTIFIER,
      direction: ViewSortDirection.ASC,
    },
  ],
  fields: MY_LEADS_VIEW_FIELDS,
});
