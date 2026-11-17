import { defineApplicationRole } from 'twenty-sdk/define';

import { DEFAULT_ROLE_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';
import {
  INVOICE_OBJECT_UNIVERSAL_IDENTIFIER,
  JOB_OBJECT_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';
import { OPPORTUNITY_OBJECT_UNIVERSAL_IDENTIFIER } from 'src/objects/opportunity.object';

// Exactly one defineApplicationRole per app (manifest-build enforced). This
// role governs the app's own runtime token: broad read, settings access so the
// post-install hook can attempt the Gate A metadata mutation (relabel
// Opportunity → Lead), and record writes on exactly the objects the handoffs
// touch: Lead stage → Won and new Job (estimate accepted), new Invoice (job
// completed). Record inserts are authorised by canUpdateObjectRecords on the
// server; nothing here can delete or destroy records.
export default defineApplicationRole({
  universalIdentifier: DEFAULT_ROLE_UNIVERSAL_IDENTIFIER,
  label: 'JobFlow Lead Management — function role',
  description:
    'Runtime role for JobFlow Lead Management logic functions: read all records, create/update Leads, Jobs and Invoices for the estimate-accepted and job-completed handoffs, settings access for post-install workspace configuration.',
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
      objectUniversalIdentifier: OPPORTUNITY_OBJECT_UNIVERSAL_IDENTIFIER,
      canReadObjectRecords: true,
      canUpdateObjectRecords: true,
      canSoftDeleteObjectRecords: false,
      canDestroyObjectRecords: false,
    },
    {
      objectUniversalIdentifier: JOB_OBJECT_UNIVERSAL_IDENTIFIER,
      canReadObjectRecords: true,
      canUpdateObjectRecords: true,
      canSoftDeleteObjectRecords: false,
      canDestroyObjectRecords: false,
    },
    {
      objectUniversalIdentifier: INVOICE_OBJECT_UNIVERSAL_IDENTIFIER,
      canReadObjectRecords: true,
      canUpdateObjectRecords: true,
      canSoftDeleteObjectRecords: false,
      canDestroyObjectRecords: false,
    },
  ],
  fieldPermissions: [],
  permissionFlagUniversalIdentifiers: [],
});
