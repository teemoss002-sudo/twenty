import {
  defineNavigationMenuItem,
  NavigationMenuItemType,
} from 'twenty-sdk/define';

import {
  JOB_OBJECT_UNIVERSAL_IDENTIFIER,
  JOBS_NAVIGATION_MENU_ITEM_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

// Sidebar entry "Jobs" — opens the object's default view.
export default defineNavigationMenuItem({
  universalIdentifier: JOBS_NAVIGATION_MENU_ITEM_UNIVERSAL_IDENTIFIER,
  name: 'Jobs',
  icon: 'IconTool',
  color: 'orange',
  position: 6,
  type: NavigationMenuItemType.OBJECT,
  targetObjectUniversalIdentifier: JOB_OBJECT_UNIVERSAL_IDENTIFIER,
});
