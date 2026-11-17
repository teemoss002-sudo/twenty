import {
  defineField,
  FieldType,
  OnDeleteAction,
  RelationType,
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS,
} from 'twenty-sdk/define';

import {
  INVOICE_CUSTOMER_FIELD_UNIVERSAL_IDENTIFIER,
  INVOICES_ON_PERSON_FIELD_UNIVERSAL_IDENTIFIER,
} from 'src/constants/universal-identifiers';
import { INVOICE_OBJECT_UNIVERSAL_IDENTIFIER } from 'src/objects/invoice.object';

// MANY_TO_ONE on the Invoice object → the standard Person (the Customer).
// The reverse ONE_TO_MANY field (`invoices`) is declared in
// src/fields/person/invoices.field.ts.
export default defineField({
  universalIdentifier: INVOICE_CUSTOMER_FIELD_UNIVERSAL_IDENTIFIER,
  objectUniversalIdentifier: INVOICE_OBJECT_UNIVERSAL_IDENTIFIER,
  type: FieldType.RELATION,
  name: 'customer',
  label: 'Customer',
  icon: 'IconUser',
  isNullable: true,
  relationTargetObjectMetadataUniversalIdentifier:
    STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.person.universalIdentifier,
  relationTargetFieldMetadataUniversalIdentifier:
    INVOICES_ON_PERSON_FIELD_UNIVERSAL_IDENTIFIER,
  universalSettings: {
    relationType: RelationType.MANY_TO_ONE,
    onDelete: OnDeleteAction.SET_NULL,
    joinColumnName: 'customerId',
  },
});
