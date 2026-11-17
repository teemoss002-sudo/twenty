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
        ↓ invoices (ONE_TO_MANY reverse field)
Invoice (custom object)   → job: MANY_TO_ONE → Job
                          → customer: MANY_TO_ONE → Person

Estimate status → Accepted  ──(estimate.updated / status)──▶  Lead stage → Won
                                                           ▶  Job created (Scheduled)
Job status → Completed      ──(job.updated / status)───────▶  Draft Invoice created
                                                              (amount + line items from the estimate)
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
| `src/roles/default-role.ts` | `defineApplicationRole` — function runtime role (read all; writes on Opportunity + Job only) |
| `src/roles/sales-rep.role.ts` | Assignable role; "owner is current member" predicate |
| `src/logic-functions/post-install.ts` | Gate A hook |
| `src/logic-functions/lead-labels.test.ts` | Unit tests: Gate A payload & invariants |
| `src/logic-functions/on-estimate-accepted.ts` | Estimate-accepted handoff: database-event logic function (`estimate.updated`, `status`) |
| `src/logic-functions/estimate-accepted.ts` | Handoff decision logic, GraphQL documents, payload builders (no SDK runtime imports) |
| `src/logic-functions/on-job-completed.ts` | Job-completed invoice handoff: database-event logic function (`job.updated`, `status`) |
| `src/logic-functions/job-completed.ts` | Invoice handoff decision logic, GraphQL documents, payload builders (no SDK runtime imports) |
| `src/logic-functions/job-completed.test.ts` | Unit tests: literals pinned to manifests, transition rules, estimate prefill, retry-safe handler flow |
| `src/logic-functions/workspace-api.ts` | Shared record-API (GraphQL) client for the handoffs |
| `src/logic-functions/api-access.ts` | Shared env resolution for all logic functions (`TWENTY_API_URL`, app token first) |
| `src/logic-functions/api-access.test.ts` | Unit tests: injected env names and token preference |
| `src/logic-functions/estimate-accepted.test.ts` | Unit tests: literals pinned to manifests, transition rules, payloads, retry-safe handler flow |
| `src/manifest-invariants.test.ts` | Unit tests: UID uniqueness, standard-object safety, relation pairing, view/nav/tab wiring, function-role write scope |
| `src/objects/estimate.object.ts` | **Estimate** custom object: status (Draft/Sent/Accepted/Declined), totalAmount, lineItems (RAW_JSON), validUntil, sentAt |
| `src/objects/job.object.ts` | **Job** custom object: status (5 stages), serviceType, scheduledStart/End, techNotes (RICH_TEXT) |
| `src/fields/estimate/*.field.ts` | Estimate.lead → Opportunity, Estimate.customer → Person, reverse `jobs` on Estimate |
| `src/fields/job/*.field.ts` | Job.estimate → Estimate, Job.customer → Person, Job.assignedTech → WorkspaceMember |
| `src/fields/opportunity/estimates.field.ts`, `src/fields/person/*.field.ts`, `src/fields/workspace-member/jobs.field.ts` | ONE_TO_MANY reverse fields on the standard objects |
| `src/views/all-estimates.view.ts`, `src/views/all-jobs.view.ts`, `src/views/job-board.view.ts` | Estimates table, Jobs table, Job Board kanban (by status) |
| `src/views/estimate-record-page-fields.view.ts`, `src/views/job-record-page-fields.view.ts` | FIELDS_WIDGET views backing the record pages |
| `src/navigation-menu-items/estimates.navigation-menu-item.ts`, `jobs.…` | Sidebar "Estimates" / "Jobs" items |
| `src/page-layouts/estimate.page-layout.ts`, `job.page-layout.ts` | Record-page layouts: Home (fields) + Timeline tabs |
| `src/objects/invoice.object.ts` | **Invoice** custom object: status (Draft/Sent/Paid/Void), amount, lineItems (RAW_JSON), issueDate, dueDate, paidDate |
| `src/fields/invoice/*.field.ts`, `src/fields/job/invoices.field.ts`, `src/fields/person/invoices.field.ts` | Invoice.job → Job, Invoice.customer → Person, and their ONE_TO_MANY reverse fields |
| `src/views/all-invoices.view.ts`, `src/views/unpaid-invoices.view.ts` | Invoices table; Unpaid (Draft + Sent) sorted by due date |
| `src/views/invoice-record-page-fields.view.ts`, `src/page-layouts/invoice.page-layout.ts` | Invoice record page: Home (fields) + Timeline tabs |
| `src/navigation-menu-items/invoices.navigation-menu-item.ts` | Sidebar "Invoices" (7, after Jobs) |

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
- Navigation: Leads (4) → Estimates (5) → Jobs (6) → Invoices (7).

## Invoice custom object (billing)

- **Invoice** — `status` SELECT (Draft → Sent → Paid, or Void; default Draft), `amount` CURRENCY, `lineItems` RAW_JSON (same shape as Estimate line items), `issueDate` / `dueDate` / `paidDate` DATE, `job` MANY_TO_ONE → Job (join `jobId`), `customer` MANY_TO_ONE → Person (join `customerId`), with reverse `invoices` on Job and Person.
- "Overdue" is deliberately **not** a stored status — it is a Sent invoice past its due date, so it can never drift out of sync. The **Unpaid Invoices** view (Draft + Sent, soonest due first) puts overdue ones at the top.
- Not in this version: online payment (Stripe etc.), invoice PDFs, emailing invoices, review requests after payment.

## Stages — why an app-owned `leadStage` field

The manifest **cannot rewrite the options of the core `stage` field** (`defineField` only adds fields), and mutating core select options at runtime was rejected in the plan (replacing options can orphan existing record values). So the JobFlow pipeline lives in `leadStage`; the core `stage` field is untouched and simply not surfaced in JobFlow views/layouts.

## Automation — estimate accepted → Lead Won + Job

`src/logic-functions/on-estimate-accepted.ts` runs on every Estimate update that touches `status` (`databaseEventTriggerSettings: { eventName: 'estimate.updated', updatedFields: ['status'] }`). When the status moves **into** Accepted (not when an already-accepted estimate is re-saved):

1. The linked Lead's `leadStage` is set to `WON` (skipped if the estimate has no lead).
2. Unless the estimate already has a Job, a Job is created: `name` "Job for <estimate name>", `status` Scheduled, linked to the estimate and its customer. Assigned tech and scheduled times are left for the office to fill in.

**Verified against twenty-server source:** trigger matching is `<objectNameSingular>.<operation>` and `updatedFields` filters update events by `properties.updatedFields`; resolvers are `updateOpportunity(id: UUID!, data: OpportunityUpdateInput!)`, `jobs(filter:)` and `createJob(data: JobCreateInput!)`, with relations written through their join columns (`estimateId`, `customerId`); record inserts require `canUpdateObjectRecords`.

**Permissions:** the handler calls the workspace API with `TWENTY_APP_APPLICATION_ACCESS_TOKEN` (the app's own function role), so it works whoever accepted the estimate — a Sales Rep has no Job access of their own. The function role grants update (which covers create) on Opportunity and Job only, and never delete/destroy.

**Retries:** the server re-queues a failed run up to 3 times. The lead update runs first and is idempotent; the job is created last and only if none exists for the estimate, so a retry after a partial failure completes the work without duplicates. API errors are thrown, not swallowed, so failures show up in the function logs.

## Automation — job completed → Draft Invoice

`src/logic-functions/on-job-completed.ts` runs on every Job update that touches `status` (`job.updated`, `updatedFields: ['status']`). When the status moves **into** Completed (Cancelled never bills; re-saving a completed job does nothing):

1. If the job already has an invoice, nothing is created (retries and re-completes are safe).
2. Otherwise, when the job has an estimate, its `totalAmount` and `lineItems` are read.
3. A **Draft** Invoice is created: `name` "Invoice for <work>" (a leading "Job for " is dropped, so handoff-created jobs don't produce "Invoice for Job for …"), linked to the job and customer, amount and line items copied from the estimate. Issue and due dates are left for the office to set when sending.

Same mechanics as the estimate handoff (server-verified trigger matching, app token, function role now also writes Invoice, creation as the last step for retry safety). Additionally verified: findOne takes `filter` (`estimate(filter: { id: { eq } })`) and CURRENCY is the composite `{ amountMicros, currencyCode }`, copied through unchanged.

## Gates

- **Gate A — relabel Opportunity → Lead (post-install, `shouldRunSynchronously: true`):** **verified against twenty-server source** (`object-metadata` module):
  1. Resolves the workspace objectMetadata id via `objects(filter: { universalIdentifier: { eq: <opp uid> } })` — `UpdateOneObjectInput.id` is the workspace id, not the universal identifier.
  2. Calls `updateOneObject(input: { id, update })` with exactly `labelSingular: 'Lead'`, `labelPlural: 'Leads'`, `description: 'Sales leads and prospective business opportunities.'`.
  3. All three keys are in `FLAT_OBJECT_METADATA_EDITABLE_PROPERTIES.standard` — the server converts them into a cosmetic `overrides` blob (the same path Settings → Data model rename uses, and it survives standard-app syncs).
  4. **`nameSingular` / `namePlural` are not in the standard editable list** — the server throws `INVALID_OBJECT_INPUT` if an app tries to rename a standard object. The hook never sends them and post-checks `nameSingular === 'opportunity'` after the mutation.

  The hook authenticates through `src/logic-functions/api-access.ts`, which reads the names the server actually injects (`TWENTY_API_URL`, `TWENTY_APP_APPLICATION_ACCESS_TOKEN` / `TWENTY_APP_ACCESS_TOKEN`). Until 2026-11-17 it read unprefixed `API_URL` / `APP_ACCESS_TOKEN`, which current servers do not set, so every install fell back silently; `yarn smoke` now injects the server's real names to catch this.

  Any failure is logged and swallowed (fallback: workspace keeps "Opportunity"; relabel manually in Settings → Data model). The app's `defaultRoleUniversalIdentifier` points at the function role (`canUpdateAllSettings: true`) so the app token passes `SettingsPermissionGuard(DATA_MODEL)`.
- **Gate B — core stage options:** intentionally not attempted in the MVP (replacing core select options can orphan existing record values).

## Verification status

**Local (2026-11-17, billing added):** `yarn typecheck`, `yarn test` (65/65), `yarn twenty dev:build` (manifest: estimate/job/invoice objects, invoice relations, views, record page, nav item, both handoff functions with their triggers, function-role writes on Opportunity + Job + Invoice), and `yarn smoke` (4/4 post-install, 6/6 estimate handoff, 6/6 invoice handoff on the built bundles, against mock APIs) all pass. Not yet run against a live Twenty server.

**Earlier (2026-11-17, estimate-accepted handoff; post-install env fix):** same commands, 44/44 tests.

**Local (sandbox, 2026-09-12):** `yarn typecheck`, `yarn test` (20/20 — Gate A payload invariants + manifest-layer invariants), `yarn twenty dev:build`, and `yarn smoke` (4/4 on the built post-install bundle) all pass. Manifest build enforces the single-`defineApplicationRole` invariant, so the default function role is pinned at build time.

**Live workspace verification: BLOCKED/DEFERRED (environment limitation).** `yarn twenty dev:function:exec --postInstall` requires a Twenty server at `localhost:2020`; the current sandbox has no server, no Docker, no Postgres/Redis. Run it once a server or remote workspace is available (it is also exercised automatically on first `app:publish` + install). Until then, Gate A behavior is covered end-to-end by `yarn smoke` against a mock metadata API; the real-run risk (workspace rejecting the relabel) fails safe by design — the workspace keeps "Opportunity".

## Install / dev

```bash
cd packages/twenty-apps/public/lead-management
yarn install
yarn typecheck               # tsc --noEmit
yarn test                    # unit tests (vitest)
yarn twenty dev:build        # build the manifest + function bundles locally
yarn smoke                   # runtime smoke tests of the BUILT post-install hook and both handoffs

yarn twenty dev                 # sync manifest to a local workspace (hooks don't run in dev)
yarn twenty dev:function:exec --postInstall   # run Gate A manually during development
yarn twenty app:publish        # publish; installs run Gate A automatically
```

Post-install runs on fresh installs only (`previousVersion === undefined`).

## Known risks / safe failure modes

- **SDK constants are stubbed inside built function bundles** (`stub-twenty-sdk-define.plugin.ts`): any non-`define*` import from `twenty-sdk/define` — including `STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS` — renders as an empty string at runtime. Runtime code (handlers) must use literal UIDs; `lead-labels.test.ts` pins the literal to the real SDK value to catch upstream drift. Manifest code (objects/fields/views) is unaffected.
- Gate A is source-verified against this repo's server code; the residual risks are server-version drift (the editable-properties list or filter API changing upstream) and the app token being denied the metadata mutation. Both fail safe: the hook logs and the workspace keeps "Opportunity".
- Standard-field references (`opportunity.fields.name`, `.owner`, `.pointOfContact`) are doc-verified and used in **manifest** code only; any drift fails at manifest build, not runtime.
- Job-completed invoice handoff: same near-simultaneous caveat as below (Completed → other → Completed within one queue cycle could create two drafts); void the extra one.
- Estimate-accepted handoff: two near-simultaneous status changes into Accepted for the same estimate could both pass the existing-job check before either job exists, creating two jobs. Unlikely in normal use (it needs Accepted → other → Accepted within one queue cycle); delete the extra job if it happens.
- View filters are literal values, so "My Leads" is scoped by the Sales Rep role predicate rather than a current-user filter (admins see all).
