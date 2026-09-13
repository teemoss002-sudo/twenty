import { STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS } from 'twenty-sdk/define';

/**
 * JobFlow uses the STANDARD Opportunity object as its Lead record.
 *
 * There is intentionally NO `defineObject()` call in this file:
 *   - nameSingular stays 'opportunity', namePlural stays 'opportunities'.
 *   - "Lead" is presentation only: labels are updated post-install (Gate A),
 *     and views / navigation / page-layout tabs are branded "Lead".
 *
 * Person → Opportunity: the standard `pointOfContact` relation (Person) and the
 * standard `company` relation already link Customers to Leads, so no relation
 * fields are added in the MVP. Tasks, notes, timeline activities, attachments
 * and calendar events on the record come for free with the standard object.
 */

export const OPPORTUNITY_OBJECT_UNIVERSAL_IDENTIFIER =
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.opportunity.universalIdentifier;

// Doc-verified standard-field identifiers on the Opportunity object
// (see packages/twenty-docs: roles.mdx and system-fields.mdx).
export const NAME_FIELD_UNIVERSAL_IDENTIFIER =
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.opportunity.fields.name
    .universalIdentifier;
export const OWNER_FIELD_UNIVERSAL_IDENTIFIER =
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.opportunity.fields.owner
    .universalIdentifier;
export const POINT_OF_CONTACT_FIELD_UNIVERSAL_IDENTIFIER =
  STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.opportunity.fields.pointOfContact
    .universalIdentifier;
