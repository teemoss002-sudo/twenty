import {
  defineNavigationMenuItem,
  NavigationMenuItemType,
} from 'twenty-sdk/define';

import {
  ESTIMATE_OBJECT_UNIVERSAL_IDENTIFIER,
  ESTIMATES_NAVIGATION_MENU_ITEM_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

// Sidebar entry "Estimates" — opens the object's default view. Position after
// the Leads item (4) and before Jobs (6).
export default defineNavigationMenuItem({
  universalIdentifier: ESTIMATES_NAVIGATION_MENU_ITEM_UNIVERSAL_IDENTIFIER,
  name: 'Estimates',
  icon: 'IconFileDollar',
  color: 'turquoise',
  position: 5,
  type: NavigationMenuItemType.OBJECT,
  targetObjectUniversalIdentifier: ESTIMATE_OBJECT_UNIVERSAL_IDENTIFIER,
});
