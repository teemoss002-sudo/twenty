import { describe, expect, it } from 'vitest';

// Subject under test: the Gate A post-install hook's payload construction and
// hard invariants. The handler itself performs network I/O (global fetch), so
// tests target the pieces the app owns and that must never regress:
//   1. the update payload contains EXACTLY labelSingular/labelPlural/description
//   2. nameSingular / namePlural are never sent (the server rejects them for
//      standard objects — and JobFlow's product requirement is that the API
//      identity stays `opportunity` / `opportunities`)
//   3. the id-resolution query targets the standard Opportunity universal
//      identifier (the mutation needs the workspace id, not the universal id)
//   4. the identity post-check fires on any unexpected API identity
//   5. the runtime literal matches the real SDK constant — the SDK build
//      stubs SDK constants inside function bundles, so the handler must use
//      a frozen literal; this test catches upstream UID drift

import { STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS } from 'twenty-sdk/define';

import {
  OPPORTUNITY_NAME_SINGULAR,
  OPPORTUNITY_OBJECT_UNIVERSAL_IDENTIFIER_RUNTIME,
  assertOpportunityIdentityPreserved,
  buildFindOpportunityObjectIdQuery,
  buildUpdateLeadLabelsMutation,
  LEAD_LABELS,
} from './lead-labels';

describe('Gate A payload construction', () => {
  it('sends exactly labelSingular, labelPlural and description', () => {
    const mutation = buildUpdateLeadLabelsMutation('test-object-id');

    expect(mutation).toContain(
      `labelSingular: "${LEAD_LABELS.labelSingular}"`,
    );
    expect(mutation).toContain(`labelPlural: "${LEAD_LABELS.labelPlural}"`);
    expect(mutation).toContain(`description: "${LEAD_LABELS.description}"`);
  });

  it('never sends nameSingular or namePlural in the update payload', () => {
    const mutation = buildUpdateLeadLabelsMutation('test-object-id');
    const updateSection = mutation.split('update:')[1] ?? '';

    expect(updateSection).not.toMatch(/\bnameSingular\s*:/);
    expect(updateSection).not.toMatch(/\bnamePlural\s*:/);
  });

  it('uses the workspace objectMetadata id supplied by the caller', () => {
    const mutation = buildUpdateLeadLabelsMutation('abc-123');

    expect(mutation).toContain('id: "abc-123"');
  });

  it('resolves the id via the standard Opportunity universal identifier', () => {
    const query = buildFindOpportunityObjectIdQuery();

    // The runtime literal must equal the real SDK constant (drift guard).
    expect(OPPORTUNITY_OBJECT_UNIVERSAL_IDENTIFIER_RUNTIME).toBe(
      STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.opportunity.universalIdentifier,
    );
    expect(query).toContain(
      `eq: "${OPPORTUNITY_OBJECT_UNIVERSAL_IDENTIFIER_RUNTIME}"`,
    );
    expect(query).toContain('objects(filter:');
  });
});

describe('Gate A identity invariant', () => {
  it('keeps the API identity as opportunity', () => {
    expect(OPPORTUNITY_NAME_SINGULAR).toBe('opportunity');
  });

  it('passes the post-check when nameSingular is unchanged', () => {
    expect(() =>
      assertOpportunityIdentityPreserved('opportunity'),
    ).not.toThrow();
  });

  it('throws the post-check when the API identity changed', () => {
    expect(() => assertOpportunityIdentityPreserved('lead')).toThrow(
      /nameSingular is now lead/,
    );
  });
});
