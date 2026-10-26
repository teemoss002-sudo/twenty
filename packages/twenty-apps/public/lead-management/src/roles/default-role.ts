import { defineApplicationRole } from 'twenty-sdk/define';

import { DEFAULT_ROLE_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';
import { JOB_OBJECT_UNIVERSAL_IDENTIFIER } from 'src/objects/job.object';
import { OPPORTUNITY_OBJECT_UNIVERSAL_IDENTIFIER } from 'src/objects/opportunity.object';

// Exactly one defineApplicationRole per app (manifest-build enforced). This
// role governs the app's own runtime token:
//   - read all records (Gate A resolves object metadata, the automation reads
//     estimates and leads);
//   - settings access so the post-install hook can attempt the Gate A metadata
//     mutation (relabel Opportunity → Lead);
//   - read+update on Job and Opportunity only. Twenty gates record creation on
//     `canUpdateObjectRecords` (engine/twenty-orm/repository/permissions.utils),
//     so the Job override is what lets the accepted-estimate automation create
//     the Job, and the Opportunity override lets it set leadStage = Won. Every
//     other object stays read-only for the app token.
export default defineApplicationRole({
  universalIdentifier: DEFAULT_ROLE_UNIVERSAL_IDENTIFIER,
  label: 'JobFlow Lead Management — function role',
  description:
    'Runtime role for JobFlow Lead Management logic functions: read all records, create jobs / move leads to Won for the accepted-estimate automation, settings access for post-install workspace configuration.',
  canReadAllObjectRecords: true,
  canUpdateAllObjectRecords: false,
  canSoftDeleteAllObjectRecords: false,
  canDestroyAllObjectRecords: false,
  canUpdateAllSettings: true,
  canBeAssignedToAgents: false,
  canBeAssignedToUsers: false,
  canBeAssignedToApiKeys: false,
  objectPermissions: [
    {
      objectUniversalIdentifier: JOB_OBJECT_UNIVERSAL_IDENTIFIER,
      canReadObjectRecords: true,
      canUpdateObjectRecords: true,
      canSoftDeleteObjectRecords: false,
      canDestroyObjectRecords: false,
    },
    {
      objectUniversalIdentifier: OPPORTUNITY_OBJECT_UNIVERSAL_IDENTIFIER,
      canReadObjectRecords: true,
      canUpdateObjectRecords: true,
      canSoftDeleteObjectRecords: false,
      canDestroyObjectRecords: false,
    },
  ],
  fieldPermissions: [],
  permissionFlagUniversalIdentifiers: [],
});
