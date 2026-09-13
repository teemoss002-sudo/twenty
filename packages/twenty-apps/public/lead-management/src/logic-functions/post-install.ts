import {
  definePostInstallLogicFunction,
  type InstallPayload,
} from 'twenty-sdk/define';

// NOTE: the hook's runtime literals live in ./lead-labels.ts — SDK constants
// (STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS) are stubbed inside built function
// bundles, so runtime code must not import them (see lead-labels.ts header).

import { POST_INSTALL_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER } from 'src/constants/universal-identifiers';

import {
  assertOpportunityIdentityPreserved,
  buildFindOpportunityObjectIdQuery,
  buildUpdateLeadLabelsMutation,
} from './lead-labels';

/**
 * Gate A: relabel the standard Opportunity object's user-facing presentation
 * to "Lead".
 *
 * Server-verified behavior (twenty-server source, object-metadata module):
 *  - The mutation is `updateOneObject(input: { id, update: UpdateObjectPayload })`,
 *    guarded by SettingsPermissionGuard(DATA_MODEL) — the app's function role
 *    (wired through the application's defaultRoleUniversalIdentifier) has
 *    canUpdateAllSettings for this.
 *  - `update.labelSingular`, `update.labelPlural`, `update.description` are in
 *    FLAT_OBJECT_METADATA_EDITABLE_PROPERTIES.standard: allowed for standard
 *    objects and persisted as a cosmetic `overrides` blob (survives upgrades).
 *  - `nameSingular` / `namePlural` are NOT in the standard editable list — the
 *    server rejects any attempt to rename a standard object. This hook never
 *    sends them: the API names stay `opportunity` / `opportunities` forever.
 *    Payload construction lives in ./lead-labels.ts and is unit-tested.
 *
 * `input.id` is the workspace objectMetadata id (not the universal identifier),
 * so the id is resolved first via the `objects` query filtered on
 * `universalIdentifier`.
 *
 * Any failure is logged and swallowed — the workspace keeps the "Opportunity"
 * label and every other part of the app (fields, views, nav, tab, roles) works
 * unchanged. The label can also be applied later from Settings → Data model.
 */

type ObjectMetadataNode = {
  id: string;
  nameSingular: string;
  labelSingular: string | null;
  labelPlural: string | null;
};

const requestMetadataApi = async (
  query: string,
): Promise<Record<string, unknown>> => {
  const apiUrl = process.env.API_URL;
  const appAccessToken = process.env.APP_ACCESS_TOKEN;

  if (!apiUrl || !appAccessToken) {
    throw new Error('APP_ACCESS_TOKEN / API_URL are not injected');
  }

  const response = await fetch(`${apiUrl.replace(/\/+$/, '')}/metadata`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${appAccessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query }),
  });

  const body = (await response.json()) as {
    data?: Record<string, unknown>;
    errors?: Array<{ message?: string }>;
  };

  if (body.errors?.length) {
    throw new Error(
      body.errors.map((entry) => entry.message ?? 'unknown error').join('; '),
    );
  }

  return body.data ?? {};
};

/** Resolve the workspace objectMetadata id for the standard Opportunity object. */
const findOpportunityObjectId = async (): Promise<string> => {
  const data = await requestMetadataApi(buildFindOpportunityObjectIdQuery());

  const edges = (data.objects as
    | { edges?: Array<{ node?: ObjectMetadataNode }> }
    | undefined)?.edges;

  const node = edges?.[0]?.node;

  if (!node) {
    throw new Error(
      `standard Opportunity object not found in workspace (see ./lead-labels.ts for the queried universalIdentifier)`,
    );
  }

  if (node.nameSingular !== 'opportunity') {
    throw new Error(
      `unexpected object matched: nameSingular=${node.nameSingular} (expected "opportunity")`,
    );
  }

  return node.id;
};

const applyLeadLabels = async (): Promise<string> => {
  const objectId = await findOpportunityObjectId();

  const data = await requestMetadataApi(
    buildUpdateLeadLabelsMutation(objectId),
  );

  const updated = data.updateOneObject as
    | (ObjectMetadataNode & { description: string | null })
    | undefined;

  if (!updated) {
    throw new Error('updateOneObject returned no object');
  }

  // Post-condition: presentation changed, API identity untouched.
  assertOpportunityIdentityPreserved(updated.nameSingular);

  return `labelSingular=${updated.labelSingular}, labelPlural=${updated.labelPlural}, nameSingular=${updated.nameSingular} (unchanged)`;
};

const handler = async ({ previousVersion }: InstallPayload): Promise<void> => {
  if (previousVersion) {
    console.log(
      '[JobFlow] post-install skipped on version upgrade (labels already configured)',
    );
    return;
  }

  try {
    console.log(`[JobFlow] Gate A result: ${await applyLeadLabels()}`);
  } catch (error) {
    console.log(
      `[JobFlow] Gate A fallback engaged — workspace keeps the "Opportunity" label. Reason: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }
};

export default definePostInstallLogicFunction({
  universalIdentifier: POST_INSTALL_LOGIC_FUNCTION_UNIVERSAL_IDENTIFIER,
  name: 'configure-lead-labels',
  description:
    'Relabels the standard Opportunity object to Lead for presentation only (nameSingular stays "opportunity"); falls back gracefully if the workspace rejects the mutation.',
  timeoutSeconds: 60,
  shouldRunOnVersionUpgrade: false,
  shouldRunSynchronously: true,
  handler,
});
