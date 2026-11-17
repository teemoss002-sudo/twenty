import {
  defineNavigationMenuItem,
  NavigationMenuItemType,
} from 'twenty-sdk/define';

import {
  INVOICE_OBJECT_UNIVERSAL_IDENTIFIER,
  INVOICES_NAVIGATION_MENU_ITEM_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

// Sidebar entry "Invoices" — opens the object's default view. Position after
// Jobs (6), following the work: Leads → Estimates → Jobs → Invoices.
export default defineNavigationMenuItem({
  universalIdentifier: INVOICES_NAVIGATION_MENU_ITEM_UNIVERSAL_IDENTIFIER,
  name: 'Invoices',
  icon: 'IconFileInvoice',
  color: 'green',
  position: 7,
  type: NavigationMenuItemType.OBJECT,
  targetObjectUniversalIdentifier: INVOICE_OBJECT_UNIVERSAL_IDENTIFIER,
});
