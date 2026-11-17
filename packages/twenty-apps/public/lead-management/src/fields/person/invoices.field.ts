import {
  defineField,
  FieldType,
  RelationType,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';

import {
  INVOICE_CUSTOMER_FIELD_UNIVERSAL_IDENTIFIER,
  INVOICES_ON_PERSON_FIELD_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';
import { INVOICE_OBJECT_UNIVERSAL_IDENTIFIER } from 'src/objects/invoice.object';

// ONE_TO_MANY reverse field on the standard Person object: every Invoice whose
// `customer` points here. Targets the MANY_TO_ONE field on Invoice.
export default defineField({
  universalIdentifier: INVOICES_ON_PERSON_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier:
    STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.person.universalIdentifier,
  type: FieldType.RELATION,
  name: 'invoices',
  label: 'Invoices',
  icon: 'IconFileInvoice',
  relationTargetObjectMetadataUniversalIdentifier:
    INVOICE_OBJECT_UNIVERSAL_IDENTIFIER,
  relationTargetFieldMetadataUniversalIdentifier:
    INVOICE_CUSTOMER_FIELD_UNIVERSAL_IDENTIFIER,
  universalSettings: {
    relationType: RelationType.ONE_TO_MANY,
  },
});
