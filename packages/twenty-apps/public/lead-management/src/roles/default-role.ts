import { defineApplicationRole } from 'twenty-sdk/define';

import { DEFAULT_ROLE_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';

// Exactly one defineApplicationRole per app (manifest-build enforced). This
// role governs the app's own runtime token: broad read, no record writes, and
// settings access so the post-install hook can attempt the Gate A metadata
// mutation (relabel Opportunity → Lead).
export default defineApplicationRole({
  universalIdentifier: DEFAULT_ROLE_UNIVERSAL_IDENTIFIER,
  label: 'JobFlow Lead Management — function role',
  description:
    'Runtime role for JobFlow Lead Management logic functions: read all records, no record writes, settings access for post-install workspace configuration.',
  canReadAllObjectRecords: true,
  canUpdateAllObjectRecords: false,
  canSoftDeleteAllObjectRecords: false,
  canDestroyAllObjectRecords: false,
  canUpdateAllSettings: true,
  canBeAssignedToAgents: false,
  canBeAssignedToUsers: false,
  canBeAssignedToApiKeys: false,
  objectPermissions: [],
  fieldPermissions: [],
  permissionFlagUniversalIdentifiers: [],
});
