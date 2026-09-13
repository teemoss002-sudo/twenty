/**
 * Gate A constants and pure payload builders, split out of post-install.ts so
 * the hard invariants (exactly labelSingular/labelPlural/description; never
 * nameSingular/namePlural; API identity preserved) can be unit-tested.
 *
 * Server-verified (twenty-server object-metadata module):
 *  - `updateOneObject(input: { id, update })` with label/description keys is
 *    allowed for standard objects and persisted as a cosmetic `overrides` blob.
 *  - `nameSingular` / `namePlural` are NOT editable on standard objects — the
 *    server rejects them. They must never appear in the update payload.
 *
 * RUNTIME CONSTRAINT (caught by scripts/runtime-smoke.mjs): the SDK build
 * stubs every non-`define*` export of twenty-sdk/define in logic-function
 * bundles (see stub-twenty-sdk-define.plugin.ts), so constants imported from
 * the SDK render as EMPTY STRINGS at runtime. Handler code must therefore use
 * literal UIDs — lead-labels.test.ts pins this literal to the real SDK value
 * to catch upstream drift.
 */

// STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.opportunity.universalIdentifier
// (frozen literal for runtime; kept in sync by lead-labels.test.ts)
export const OPPORTUNITY_OBJECT_UNIVERSAL_IDENTIFIER_RUNTIME =
  '20202020-9549-49dd-b2b2-883999db8938';

export const LEAD_LABELS = {
  labelSingular: 'Lead',
  labelPlural: 'Leads',
  description: 'Sales leads and prospective business opportunities.',
} as const;

export const OPPORTUNITY_NAME_SINGULAR = 'opportunity';

/** Resolve the workspace objectMetadata id for the standard Opportunity object. */
export const buildFindOpportunityObjectIdQuery = (): string =>
  `query {
      objects(filter: { universalIdentifier: { eq: "${OPPORTUNITY_OBJECT_UNIVERSAL_IDENTIFIER_RUNTIME}" } }) {
        edges { node { id nameSingular labelSingular } }
      }
    }`;

/**
 * The Gate A mutation. The update payload contains EXACTLY the three
 * presentation keys — never nameSingular / namePlural.
 */
export const buildUpdateLeadLabelsMutation = (objectId: string): string =>
  `mutation {
      updateOneObject(
        input: {
          id: "${objectId}"
          update: {
            labelSingular: "${LEAD_LABELS.labelSingular}"
            labelPlural: "${LEAD_LABELS.labelPlural}"
            description: "${LEAD_LABELS.description}"
          }
        }
      ) { id labelSingular labelPlural description nameSingular }
    }`;

/** Post-check: the relabel must never touch the object's API identity. */
export const assertOpportunityIdentityPreserved = (
  nameSingular: string,
): void => {
  if (nameSingular !== OPPORTUNITY_NAME_SINGULAR) {
    throw new Error(`post-check failed: nameSingular is now ${nameSingular}`);
  }
};
