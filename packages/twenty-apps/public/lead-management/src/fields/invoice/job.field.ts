import {
  defineField,
  FieldType,
  OnDeleteAction,
  RelationType,
} from 'twenty-sdk/define';

import {
  INVOICE_JOB_FIELD_UNIVERSAL_IDENTIFIER,
  INVOICES_ON_JOB_FIELD_UNIVERSAL_IDENTIFIER,
  JOB_OBJECT_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';
import { INVOICE_OBJECT_UNIVERSAL_IDENTIFIER } from 'src/objects/invoice.object';

// MANY_TO_ONE on the Invoice object → Job (app-owned). The reverse
// ONE_TO_MANY field (`invoices`) is declared in src/fields/job/invoices.field.ts.
export default defineField({
  universalIdentifier: INVOICE_JOB_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier: INVOICE_OBJECT_UNIVERSAL_IDENTIFIER,
  type: FieldType.RELATION,
  name: 'serviceJob',
  label: 'Job',
  icon: 'IconTool',
  isNullable: true,
  relationTargetObjectMetadataUniversalIdentifier:
    JOB_OBJECT_UNIVERSAL_IDENTIFIER,
  relationTargetFieldMetadataUniversalIdentifier:
    INVOICES_ON_JOB_FIELD_UNIVERSAL_IDENTIFIER,
  universalSettings: {
    relationType: RelationType.MANY_TO_ONE,
    onDelete: OnDeleteAction.SET_NULL,
    joinColumnName: 'serviceJobId',
  },
});
