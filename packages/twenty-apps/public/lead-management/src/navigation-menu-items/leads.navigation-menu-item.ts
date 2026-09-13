import {
  defineNavigationMenuItem,
  NavigationMenuItemType,
} from 'twenty-sdk/define';

import {
  LEADS_NAVIGATION_MENU_ITEM_UNIVERSAL_IDENTIFIER,
  LEAD_PIPELINE_VIEW_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

// Sidebar entry "Leads" — opens the Lead Pipeline kanban. Additional views
// (All Leads, My Leads, Hot Leads) are one click away through the view switcher.
export default defineNavigationMenuItem({
  universalIdentifier: LEADS_NAVIGATION_MENU_ITEM_UNIVERSAL_IDENTIFIER,
  name: 'Leads',
  icon: 'IconTargetArrow',
  color: 'blue',
  position: 4,
  type: NavigationMenuItemType.VIEW,
  viewUniversalIdentifier: LEAD_PIPELINE_VIEW_UNIVERSAL_IDENTIFIER,
});
