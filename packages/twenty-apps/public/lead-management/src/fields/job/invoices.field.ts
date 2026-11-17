import {
  defineField,
  FieldType,
  RelationType,
} from 'twenty-sdk/define';

import {
  INVOICE_JOB_FIELD_UNIVERSAL_IDENTIFIER,
  INVOICE_OBJECT_UNIVERSAL_IDENTIFIER,
  INVOICES_ON_JOB_FIELD_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';
import { JOB_OBJECT_UNIVERSAL_IDENTIFIER } from 'src/objects/job.object';

// ONE_TO_MANY reverse field on the Job object: every Invoice whose `job`
// points here. Targets the MANY_TO_ONE field on Invoice.
export default defineField({
  universalIdentifier: INVOICES_ON_JOB_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier: JOB_OBJECT_UNIVERSAL_IDENTIFIER,
  type: FieldType.RELATION,
  name: 'invoices',
  label: 'Invoices',
  icon: 'IconFileInvoice',
  relationTargetObjectMetadataUniversalIdentifier:
    INVOICE_OBJECT_UNIVERSAL_IDENTIFIER,
  relationTargetFieldMetadataUniversalIdentifier:
    INVOICE_JOB_FIELD_UNIVERSAL_IDENTIFIER,
  universalSettings: {
    relationType: RelationType.ONE_TO_MANY,
  },
});
