import {
  defineRole,
  RowLevelPermissionPredicateOperand,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';

import { SALES_REP_OWNERSHIP_PREDICATE_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';
import { SALES_REP_ROLE_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';
import { OPPORTUNITY_OBJECT_UNIVERSAL_IDENTIFIER } from 'src/objects/opportunity.object';
import { OWNER_FIELD_UNIVERSAL_IDENTIFIER } from 'src/objects/opportunity.object';

// Optional role assignable to workspace members. The row-level predicate scopes
// leads to "owner is the current workspace member" (the doc-verified pattern
// from roles.mdx) — this is what makes the "My Leads" view truly per-user for
// reps, since manifest view-filter values are literal.
export default defineRole({
  universalIdentifier: SALES_REP_ROLE_UNIVERSAL_IDENTIFIER,
  label: 'Sales Rep',
  description:
    'JobFlow field role: works the leads they own, plus the customers, tasks and notes attached to them.',
  canReadAllObjectRecords: false,
  canUpdateAllObjectRecords: false,
  canSoftDeleteAllObjectRecords: false,
  canDestroyAllObjectRecords: false,
  canUpdateAllSettings: false,
  canBeAssignedToAgents: false,
  canBeAssignedToUsers: true,
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
      objectUniversalIdentifier:
        STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.person.universalIdentifier,
      canReadObjectRecords: true,
      canUpdateObjectRecords: true,
      canSoftDeleteObjectRecords: false,
      canDestroyObjectRecords: false,
    },
    {
      objectUniversalIdentifier:
        STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.task.universalIdentifier,
      canReadObjectRecords: true,
      canUpdateObjectRecords: true,
      canSoftDeleteObjectRecords: false,
      canDestroyObjectRecords: false,
    },
    {
      objectUniversalIdentifier:
        STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.note.universalIdentifier,
      canReadObjectRecords: true,
      canUpdateObjectRecords: true,
      canSoftDeleteObjectRecords: false,
      canDestroyObjectRecords: false,
    },
  ],
  fieldPermissions: [],
  rowLevelPermissionPredicates: [
    {
      universalIdentifier: SALES_REP_OWNERSHIP_PREDICATE_UNIVERSAL_IDENTIFIER,
      objectUniversalIdentifier: OPPORTUNITY_OBJECT_UNIVERSAL_IDENTIFIER,
      fieldUniversalIdentifier: OWNER_FIELD_UNIVERSAL_IDENTIFIER,
      operand: RowLevelPermissionPredicateOperand.IS,
      workspaceMemberFieldUniversalIdentifier:
        STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.workspaceMember.fields.id
          .universalIdentifier,
    },
  ],
  permissionFlagUniversalIdentifiers: [],
});
