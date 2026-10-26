# JobFlow Lead Management (Twenty App)

JobFlow's MVP lead pipeline for service businesses, shipped as a **Twenty app** (no core changes, no migrations authored, no forked architecture).

## Architecture

```
Standard Person (Customer)                     (unchanged)
        ↓ pointOfContact (existing standard relation)
Standard Opportunity  nameSingular = 'opportunity', namePlural = 'opportunities'
        │
        ├─ presentation relabelled to "Lead"      → post-install Gate A
        ├─ 7 JobFlow-owned fields via defineField → manifest
        ├─ JobFlow pipeline stages (leadStage)    → manifest (see "Stages" below)
        ├─ 4 views (kanban + tables)              → manifest
        ├─ sidebar "Leads" navigation item        → manifest
        ├─ "Lead Details" tab on the record page  → definePageLayoutTab
        └─ Sales Rep role w/ row-level ownership  → manifest

Estimate (custom object)  → lead: MANY_TO_ONE → Opportunity
custom object             → customer: MANY_TO_ONE → Person
        ↓ jobs (ONE_TO_MANY reverse field)
Job (custom object)       → estimate: MANY_TO_ONE → Estimate
                          → customer: MANY_TO_ONE → Person
                          → assignedTech: MANY_TO_ONE → WorkspaceMember

Estimate.status → ACCEPTED  ── database-event trigger ──▶  Job created (linked
                                                            to estimate + customer)
                                                         + Lead moved to Won
```

- **No `defineObject()` call exists.** The object keeps `nameSingular: 'opportunity'`; "Lead" is presentation only.
- Person → Opportunity, Tasks, Notes, Timeline, Attachments, Calendar all reuse the standard object's existing machinery.

## File map

| Path | What it declares |
| --- | --- |
| `src/app.ts` | `defineApplication` — app identity + `defaultRoleUniversalIdentifier` |
| `src/constants/universal-identifiers.ts` | All stable UIDs (generate once, never rotate) |
| `src/objects/opportunity.object.ts` | Standard-object/field constants (no `defineObject`) |
| `src/fields/opportunity/*.field.ts` | 7 `defineField` calls targeting the standard Opportunity |
| `src/views/*.view.ts` | Lead Pipeline (kanban), All Leads, My Leads, Hot Leads |
| `src/view-fields/*.view-fields.ts` | Column sets for the views above |
| `src/navigation-menu-items/leads.navigation-menu-item.ts` | Sidebar "Leads" → pipeline view |
| `src/page-layouts/lead.page-layout.ts` | Layout reference (`opportunityRecordPage`) + rationale |
| `src/page-layout-tabs/lead.page-layout-tab.ts` | "Lead Details" tab with all JobFlow fields |
| `src/roles/default-role.ts` | `defineApplicationRole` — function runtime role |
| `src/roles/sales-rep.role.ts` | Assignable role; "owner is current member" predicate |
| `src/logic-functions/post-install.ts` | Gate A hook |
| `src/logic-functions/estimate-accepted.ts` | **Automation**: database-event logic function — accepted Estimate → Job + Lead Won |
| `src/logic-functions/estimate-accepted-to-job.ts` | Pure trigger decision + Job/Lead payload builders (literal select values only) |
| `src/logic-functions/estimate-accepted.test.ts` | Unit tests: trigger wiring, handler flow, idempotency, failure policy (mocked client) |
| `src/logic-functions/estimate-accepted-to-job.test.ts` | Unit tests: transition guards, exact Job payload, Won guard |
| `src/logic-functions/lead-labels.test.ts` | Unit tests: Gate A payload & invariants |
| `src/manifest-invariants.test.ts` | Unit tests: UID uniqueness, standard-object safety, relation pairing, view/nav/tab wiring |
| `src/objects/estimate.object.ts` | **Estimate** custom object: status (Draft/Sent/Accepted/Declined), totalAmount, lineItems (RAW_JSON), validUntil, sentAt |
| `src/objects/job.object.ts` | **Job** custom object: status (5 stages), serviceType, scheduledStart/End, techNotes (RICH_TEXT) |
| `src/fields/estimate/*.field.ts` | Estimate.lead → Opportunity, Estimate.customer → Person, reverse `jobs` on Estimate |
| `src/fields/job/*.field.ts` | Job.estimate → Estimate, Job.customer → Person, Job.assignedTech → WorkspaceMember |
| `src/fields/opportunity/estimates.field.ts`, `src/fields/person/*.field.ts`, `src/fields/workspace-member/jobs.field.ts` | ONE_TO_MANY reverse fields on the standard objects |
| `src/views/all-estimates.view.ts`, `src/views/all-jobs.view.ts`, `src/views/job-board.view.ts` | Estimates table, Jobs table, Job Board kanban (by status) |
| `src/views/estimate-record-page-fields.view.ts`, `src/views/job-record-page-fields.view.ts` | FIELDS_WIDGET views backing the record pages |
| `src/navigation-menu-items/estimates.navigation-menu-item.ts`, `jobs.…` | Sidebar "Estimates" / "Jobs" items |
| `src/page-layouts/estimate.page-layout.ts`, `job.page-layout.ts` | Record-page layouts: Home (fields) + Timeline tabs |

## Fields added to Opportunity

| Field | name | Type | Notes |
| --- | --- | --- | --- |
| Stage | `leadStage` | SELECT | `NEW`, `QUALIFIED`, `ESTIMATE_SENT`, `FOLLOW_UP`, `WON`, `LOST`; defaults to `NEW` |
| Lead Source | `leadSource` | SELECT | Referral, Website, Google / LSA, Social Media, Walk-in, Cold Call, Other |
| Lead Score | `leadScore` | NUMBER | 0–100 |
| Temperature | `leadTemperature` | SELECT | Hot / Warm / Cold |
| Estimated Value | `estimatedValue` | CURRENCY | |
| Next Follow-up | `nextFollowUp` | DATE_TIME | |
| Owner Notes | `leadOwnerNotes` | TEXT | |

## Estimate & Job custom objects

Built exactly on the real-estate/partners app conventions:

- **Estimate** — `status` SELECT (Draft → Sent → Accepted/Declined, default Draft), `totalAmount` CURRENCY, `lineItems` RAW_JSON (structured line items without a full nested-object system), `validUntil` DATE, `sentAt` DATE_TIME, `lead` MANY_TO_ONE → Opportunity (join `leadId`), `customer` MANY_TO_ONE → Person (join `customerId`).
- **Job** — `status` SELECT (Scheduled → En Route → In Progress → Completed/Cancelled, default Scheduled), `serviceType` SELECT (generic trades), `scheduledStart`/`scheduledEnd` DATE_TIME, `techNotes` RICH_TEXT, `estimate` MANY_TO_ONE → Estimate, `customer` MANY_TO_ONE → Person, `assignedTech` MANY_TO_ONE → WorkspaceMember.
- Reverse ONE_TO_MANY fields (`estimates` on Opportunity/Person, `jobs` on Estimate/Person/WorkspaceMember) complete each pairing.
- Record pages: Home tab (FIELDS widget over a FIELDS_WIDGET view) + Timeline tab — tasks, notes, attachments surface through the timeline automatically.
- Navigation: Leads (4) → Estimates (5) → Jobs (6).

## Automation — accepted Estimate creates the Job

`src/logic-functions/estimate-accepted.ts` closes the Estimate → Job handoff. It is a manifest-declared logic function, not a workflow built by hand in the UI:

```ts
databaseEventTriggerSettings: {
  eventName: 'estimate.updated',
  updatedFields: ['status'],
}
```

**When it runs.** Only when `estimate.status` transitions **to** `ACCEPTED`:

1. the server-side filter (`updatedFields: ['status']`) drops updates that do not touch status;
2. the handler re-checks the event in `estimate-accepted-to-job.ts` — it must be `estimate.updated`, `after.status === 'ACCEPTED'`, and the previous status (from `before`, or the event diff on slim payloads) must **not** already be `ACCEPTED`;
3. the estimate is re-read from the workspace (the event is a hint, not the source of truth). If it no longer exists or is no longer accepted, nothing is written.

**What it writes.**

| Write | Value |
| --- | --- |
| `createServiceJob` | `name` = estimate name (fallback `Job from accepted estimate`), `status` = `SCHEDULED`, `estimateId` = the accepted estimate, `customerId` = the estimate's customer when set |
| `updateOpportunity` | `leadStage` = `WON`, **only** when the lead exists and is not already Won |

Nothing else is copied: `scheduledStart`/`scheduledEnd`, `serviceType`, `assignedTech` and `techNotes` stay manual, so the automation never invents a dispatch decision.

**Retry safety.** Database-event triggers are queued with retries, and the same accepted estimate can emit more than one event (a later edit that touches status, a manual replay). Both writes are read-before-write:

- a Job already linked to the estimate (any status) is reused — the automation never creates a second Job for one estimate;
- an already-Won lead is not rewritten.

A Job cancelled by dispatch is **not** resurrected when the estimate is re-accepted; that is a deliberate manual decision.

**Failure policy.** Unlike Gate A, this handler logs the estimate id and rethrows. A failed create should be visible in `yarn twenty dev:function:logs` and retried by the queue; rethrowing after partial success is safe because the next run finds the Job and only finishes the remaining write. Reverting an accepted estimate to Draft/Declined after the fact does **not** auto-cancel the Job — cancel it in the Jobs board if the work is not happening.

**Deliberately out of scope.**

- **An estimate created directly with status Accepted does not fire this trigger.** The trigger is on `estimate.updated` (the normal Draft → Sent → Accepted path); subscribing to `estimate.created` as well would burn a function run for every Draft estimate created. For imported data, create such Jobs manually or move the status through Draft → Accepted.
- No scheduling, technician assignment, invoice, or email is produced; the Job starts as `Scheduled` and unassigned.
- No cancellation/reschedule mirror when an accepted estimate is later reverted.

**Permissions.** The function runs under the app's default role. Twenty gates record **insertion** on `canUpdateObjectRecords` (`twenty-server` → `engine/twenty-orm/repository/permissions.utils.ts`), so `src/roles/default-role.ts` carries explicit read+update overrides for **Job** and **Opportunity** only; everything else stays read-only, and `canUpdateAllSettings` remains for Gate A. `manifest-invariants.test.ts` pins both the overrides and the trigger's `updatedFields`, because a missing permission or a renamed field turns the automation into a silent no-op.

**Running it manually.** After `yarn twenty dev` against a live server, either flip an estimate to Accepted in the UI (the worker picks up the event) or invoke the function directly:

```bash
yarn twenty dev:function:exec -n estimate-accepted-to-job -p '{
  "name": "estimate.updated",
  "recordId": "<estimate-id>",
  "properties": {
    "before": { "id": "<estimate-id>", "status": "SENT" },
    "after":  { "id": "<estimate-id>", "status": "ACCEPTED" },
    "updatedFields": ["status"]
  }
}'
```

## Stages — why an app-owned `leadStage` field

The manifest **cannot rewrite the options of the core `stage` field** (`defineField` only adds fields), and mutating core select options at runtime was rejected in the plan (replacing options can orphan existing record values). So the JobFlow pipeline lives in `leadStage`; the core `stage` field is untouched and simply not surfaced in JobFlow views/layouts.

## Gates

- **Gate A — relabel Opportunity → Lead (post-install, `shouldRunSynchronously: true`):** **verified against twenty-server source** (`object-metadata` module):
  1. Resolves the workspace objectMetadata id via `objects(filter: { universalIdentifier: { eq: <opp uid> } })` — `UpdateOneObjectInput.id` is the workspace id, not the universal identifier.
  2. Calls `updateOneObject(input: { id, update })` with exactly `labelSingular: 'Lead'`, `labelPlural: 'Leads'`, `description: 'Sales leads and prospective business opportunities.'`.
  3. All three keys are in `FLAT_OBJECT_METADATA_EDITABLE_PROPERTIES.standard` — the server converts them into a cosmetic `overrides` blob (the same path Settings → Data model rename uses, and it survives standard-app syncs).
  4. **`nameSingular` / `namePlural` are not in the standard editable list** — the server throws `INVALID_OBJECT_INPUT` if an app tries to rename a standard object. The hook never sends them and post-checks `nameSingular === 'opportunity'` after the mutation.

  Any failure is logged and swallowed (fallback: workspace keeps "Opportunity"; relabel manually in Settings → Data model). The app's `defaultRoleUniversalIdentifier` points at the function role (`canUpdateAllSettings: true`) so the app token passes `SettingsPermissionGuard(DATA_MODEL)`.
- **Gate B — core stage options:** intentionally not attempted in the MVP (replacing core select options can orphan existing record values).

## Verification status

**Local (sandbox, 2026-10-26):** `yarn typecheck`, `yarn test` (**61/61** across 4 files — Gate A payload invariants, estimate→job trigger guards/payloads, handler flow with a mocked `CoreApiClient`, manifest-layer invariants), `yarn twenty dev:build` (6 emitted files), and `yarn smoke` (**6/6** — the built post-install bundle plus the built manifest's automation trigger and bundle path) all pass. Manifest build enforces the single-`defineApplicationRole` invariant, so the default function role is pinned at build time.

**Live workspace verification: PASSING in CI (verified 2026-10-26, run 40354404265).** `.github/workflows/ci-lead-management-app.yaml` (repo root) spawns a real Twenty server (all-in-one `twenty-app-dev` image: server, worker, Postgres, Redis) via the repo's `spawn-twenty-app-dev-test` action, syncs this app with `appDevOnce`, and runs `yarn test:integration` (`src/__tests__/estimate-to-job.integration-test.ts`): create Lead + Estimate, flip Estimate to ACCEPTED, assert the Job is created (SCHEDULED, estimate's name) and the Lead reaches WON, plus a DECLINED to ACCEPTED replay asserting no duplicate Job. Locally the same suite runs after `yarn twenty docker:start` with `TWENTY_API_URL`/`TWENTY_API_KEY` set. Still not covered live: Gate A's post-install hook (dev syncs don't run install hooks; it is covered by `yarn smoke` against a mock metadata API - fails safe, workspace keeps "Opportunity").

## Selling / distribution

**License:** proprietary (`UNLICENSED` + `LICENSE`) — do not publish the source under MIT terms.

**Private sale (available today):** Twenty's marketplace has no paid checkout yet (credit billing is declared via the `billing:` block but not live), so charge the client outside Twenty (e.g. Stripe/invoice: setup fee + monthly per workspace) and deliver a private tarball:

```bash
yarn twenty remote:add --url https://client-twenty.example.com --as client
yarn twenty dev:build --tarball        # local artifact only, no server needed
yarn twenty app:publish --private --remote client   # deploy to their server
```

Then share it from **Settings → Applications → Registrations → Distribution → Copy share link** (private apps are not browsable in the marketplace). Each release must bump `version` in `package.json` — the server rejects same/lower versions with `VERSION_ALREADY_EXISTS`; installed workspaces with auto-upgrade enabled update in the background.

**Marketplace (free funnel, later):** `yarn twenty app:publish` publishes `.twenty/output` to npm (name `lead-management`, keyword `twenty-app` already set) and the catalog syncs hourly (`yarn twenty dev:catalog-sync` forces it). Listing assets are wired: `public/logo.png` + three `galleryImages` in `defineApplication` (pinned by `manifest-invariants.test.ts`, present in the built manifest and tarball). The gallery images are **real captures**: the workflow's `screenshots` job (manual dispatch from the Actions tab) boots a live Twenty instance, installs the app, seeds demo data, photographs the actual UI with Playwright (`e2e/screenshots.spec.ts`), and commits the PNGs back. The logo is a generated brand mark. Remaining before listing: complete live-server verification below. Installs are free until platform credit charging goes live, at which point a `billing.recurring` block in `src/app.ts` is what charges workspaces.

## Install / dev

```bash
cd packages/twenty-apps/public/lead-management
yarn install
yarn typecheck               # tsc --noEmit
yarn test                    # unit tests (vitest)
yarn twenty dev:build        # build the manifest + function bundles locally
yarn smoke                   # built post-install bundle + automation manifest wiring

yarn twenty dev                 # sync manifest to a local workspace (install hooks don't run in dev)
yarn twenty dev:function:exec --postInstall   # run Gate A manually during development
yarn twenty dev:function:exec -n estimate-accepted-to-job -p '{"name":"estimate.updated","recordId":"<id>","properties":{"before":{"id":"<id>","status":"SENT"},"after":{"id":"<id>","status":"ACCEPTED"},"updatedFields":["status"]}}'
yarn twenty dev:function:logs   # watch automation output (success line + rethrown failures)
yarn twenty app:publish        # publish; installs run Gate A automatically
```

Post-install runs on fresh installs only (`previousVersion === undefined`). The automation is a database-event trigger: it fires from the server worker whenever an estimate's status changes, including in dev once the app is synced.

## Known risks / safe failure modes

- **`job`/`jobs` are reserved metadata names on current Twenty servers** (`RESERVED_METADATA_NAME_KEYWORDS` — there is a core jobs concept), and app sync rejects them as hard validation errors. The Job object is therefore `serviceJob`/`serviceJobs` in the API (GraphQL: `serviceJobs`, `createServiceJob`) and \"Job\" only in labels; likewise the reverse relation fields on Estimate/Person/WorkspaceMember are named `serviceJobs`. UIDs are unchanged, so the rename is sync-safe for any workspace that somehow has the old names (none shipped). The live CI run caught this — the local manifest build does not check server reserved names. Pinned by `manifest-invariants.test.ts`.

- **SDK constants are stubbed inside built function bundles** (`stub-twenty-sdk-define.plugin.ts`): any non-`define*` import from `twenty-sdk/define` — including `STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS` — renders as an empty string at runtime. Runtime code (handlers) must use literal UIDs; `lead-labels.test.ts` pins the literal to the real SDK value to catch upstream drift. Manifest code (objects/fields/views) is unaffected.
- Gate A is source-verified against this repo's server code; the residual risks are server-version drift (the editable-properties list or filter API changing upstream) and the app token being denied the metadata mutation. Both fail safe: the hook logs and the workspace keeps "Opportunity".
- Standard-field references (`opportunity.fields.name`, `.owner`, `.pointOfContact`) are doc-verified and used in **manifest** code only; any drift fails at manifest build, not runtime.
- View filters are literal values, so "My Leads" is scoped by the Sales Rep role predicate rather than a current-user filter (admins see all).
- The automation writes select values as literals (`ACCEPTED`, `WON`, `SCHEDULED`) and reads `estimate.updated` / `status`. Those strings mirror the manifest definitions and are pinned by `estimate-accepted-to-job.test.ts` + `manifest-invariants.test.ts`; renaming an option or field in the manifest requires updating the literal in the same change, or the trigger becomes a silent no-op.
- The automation's object permissions ship in the same manifest as the role. On a workspace that already has the app installed, the app must be upgraded/re-synced before the new Job/Opportunity overrides exist; until then `createServiceJob` fails with `PERMISSION_DENIED` (logged, retried, and safe to replay because creation is read-guarded).
- Duplicate protection keys off the Job → estimate link. If the auto-created Job is deleted and the estimate emits another accepted event, a new Job is created; if a user manually creates a Job for that estimate first, the automation reuses it (any status) rather than adding a second one.
- Database-event delivery needs the server worker; `yarn twenty dev` alone only syncs metadata. The smoke test cannot cover the HTTP round-trip because `CoreApiClient` is generated only against a live workspace.
