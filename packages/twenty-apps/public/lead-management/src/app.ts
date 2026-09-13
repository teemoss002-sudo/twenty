import { defineApplication } from 'twenty-sdk/define';

import {
  APP_DESCRIPTION,
  APP_DISPLAY_NAME,
  APPLICATION_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';

export default defineApplication({
  universalIdentifier: APPLICATION_UNIVERSAL_IDENTIFIER,
  displayName: APP_DISPLAY_NAME,
  description: APP_DESCRIPTION,
  author: 'JobFlow',
  // Must be one of the SDK-known categories (Communication, Productivity,
  // Product management, Sales, Marketing, Enrichment, Data, Search, Other).
  category: 'Sales',
  // No `defaultRoleUniversalIdentifier` here: SDK 2.39 deprecates the property
  // and auto-derives the default role from the single defineApplicationRole()
  // file (src/roles/default-role.ts). The manifest build errors if zero or
  // multiple defineApplicationRole() files exist, so this stays pinned to the
  // function role that carries canUpdateAllSettings for the Gate A hook.
});
