// Live end-to-end test of JobFlow against a REAL Twenty workspace.
//
// Prerequisites: the app is synced to the workspace (`yarn twenty apply`) and
// `.env.live` (gitignored via `.env*`) in this folder holds:
//   TWENTY_LIVE_URL=https://your-workspace.twenty.com
//   TWENTY_LIVE_API_KEY=<API key from Settings → APIs & Webhooks>
//
// It creates clearly-labelled test records ("JobFlow live test …"), drives
// each automation through the real server and worker, polls for the result,
// and deletes everything it created at the end (they land in the trash).
// Pass --keep to leave the records in place for inspection in the UI.
//
// Use a test workspace: the app relabels Opportunity → Lead and adds the
// Estimate / Job / Invoice objects to whatever workspace it is synced to.
//
// Run: yarn live-test [--keep]

import { readFileSync, existsSync } from 'node:fs';

const KEEP = process.argv.includes('--keep');
const POLL_INTERVAL_MS = 3000;
const POLL_TIMEOUT_MS = 120000;
const QUIET_PERIOD_MS = 20000;

// --- configuration -----------------------------------------------------------

const envFile = new URL('../.env.live', import.meta.url);

if (existsSync(envFile)) {
  for (const line of readFileSync(envFile, 'utf8').split('\n')) {
    const match = line.match(/^\s*([A-Z_]+)\s*=\s*(.*?)\s*$/);

    if (match && !process.env[match[1]]) {
      process.env[match[1]] = match[2].replace(/^['"]|['"]$/g, '');
    }
  }
}

const BASE_URL = (process.env.TWENTY_LIVE_URL ?? '').replace(/\/+$/, '');
const API_KEY = process.env.TWENTY_LIVE_API_KEY ?? '';

if (!BASE_URL || !API_KEY) {
  console.error(
    'Missing TWENTY_LIVE_URL / TWENTY_LIVE_API_KEY. Put them in .env.live next to package.json.',
  );
  process.exit(2);
}

// --- helpers -----------------------------------------------------------------

const request = async (path, query, variables = {}) => {
  const response = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query, variables }),
  });
  const text = await response.text();
  let body;

  try {
    body = JSON.parse(text);
  } catch {
    throw new Error(`${path} responded ${response.status}: ${text.slice(0, 200)}`);
  }

  if (body.errors?.length) {
    throw new Error(body.errors.map((error) => error.message).join('; '));
  }

  return body.data;
};

const gql = (query, variables) => request('/graphql', query, variables);
const metadata = (query, variables) => request('/metadata', query, variables);

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const poll = async (description, check) => {
  const started = Date.now();
  let last;

  while (Date.now() - started < POLL_TIMEOUT_MS) {
    last = await check();

    if (last.done) {
      return { ...last, seconds: Math.round((Date.now() - started) / 1000) };
    }

    await sleep(POLL_INTERVAL_MS);
  }

  return { ...last, done: false, timedOut: description };
};

const results = [];
const record = (name, ok, detail = '') => {
  results.push({ name, ok });
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`);
};

const created = [];
const remember = (objectName, id) => {
  created.push({ objectName, id });

  return id;
};

const pascal = (name) => name[0].toUpperCase() + name.slice(1);

const create = async (objectName, data) => {
  const resolver = `create${pascal(objectName)}`;
  const result = await gql(
    `mutation ($data: ${pascal(objectName)}CreateInput!) { ${resolver}(data: $data) { id } }`,
    { data },
  );

  return remember(objectName, result[resolver].id);
};

const update = (objectName, id, data) =>
  gql(
    `mutation ($id: UUID!, $data: ${pascal(objectName)}UpdateInput!) { update${pascal(objectName)}(id: $id, data: $data) { id } }`,
    { id, data },
  );

const RUN = `JobFlow live test ${new Date().toISOString().slice(0, 16).replace('T', ' ')}`;

// Far-future slot so the schedule check cannot collide with real bookings.
const SLOT = (hour) => `2099-01-05T${String(hour).padStart(2, '0')}:00:00.000Z`;

// --- run ---------------------------------------------------------------------

console.log(`Workspace: ${BASE_URL}`);
console.log(`Run label: "${RUN}"${KEEP ? ' (records kept)' : ' (records deleted afterwards)'}\n`);

try {
  // 0. App is installed, and the post-install relabel applied.
  const appObjects = await metadata(`query {
    objects(paging: { first: 200 }) { edges { node { nameSingular labelSingular } } }
  }`);
  const objects = appObjects.objects.edges.map((edge) => edge.node);
  const byName = Object.fromEntries(objects.map((object) => [object.nameSingular, object]));

  record(
    'app synced: Estimate, Job and Invoice objects exist',
    Boolean(byName.estimate && byName.job && byName.invoice),
    ['estimate', 'job', 'invoice'].filter((name) => !byName[name]).join(', ') || '',
  );
  record(
    'rename: Opportunity is labelled "Lead"',
    byName.opportunity?.labelSingular === 'Lead',
    `labelSingular = ${byName.opportunity?.labelSingular} (run \`yarn twenty dev:function:exec --postInstall\` if this fails after a dev sync)`,
  );

  // 1. Estimate accepted → Lead Won + Job.
  const personId = await create('person', {
    name: { firstName: 'Live', lastName: `Test ${RUN.slice(-5)}` },
  });
  const leadId = await create('opportunity', {
    name: `${RUN} lead`,
    pointOfContactId: personId,
    leadStage: 'NEW',
  });
  const estimateName = `${RUN} estimate`;
  const estimateId = await create('estimate', {
    name: estimateName,
    status: 'SENT',
    leadId,
    customerId: personId,
    totalAmount: { amountMicros: 1250000000, currencyCode: 'USD' },
    lineItems: [{ description: 'Live test line item', quantity: 1, unitPrice: 1250 }],
  });

  await update('estimate', estimateId, { status: 'ACCEPTED' });

  const findJobs = async () =>
    (
      await gql(
        `query ($id: UUID!) { jobs(filter: { estimateId: { eq: $id } }) { edges { node { id name status customerId } } } }`,
        { id: estimateId },
      )
    ).jobs.edges.map((edge) => edge.node);

  const handoff = await poll('estimate handoff', async () => {
    const lead = (
      await gql(`query ($id: UUID!) { opportunity(filter: { id: { eq: $id } }) { leadStage } }`, {
        id: leadId,
      })
    ).opportunity;
    const jobs = await findJobs();

    return { done: lead?.leadStage === 'WON' && jobs.length === 1, lead, jobs };
  });

  for (const job of handoff.jobs ?? []) {
    remember('job', job.id);
  }

  record(
    'handoff: accepting the estimate marks the lead Won',
    handoff.lead?.leadStage === 'WON',
    `leadStage = ${handoff.lead?.leadStage}${handoff.seconds !== undefined ? ` after ${handoff.seconds}s` : ''}`,
  );

  const handoffJob = handoff.jobs?.[0];

  record(
    'handoff: exactly one Scheduled job, linked to the customer',
    handoff.jobs?.length === 1 &&
      handoffJob.status === 'SCHEDULED' &&
      handoffJob.customerId === personId &&
      handoffJob.name === `Job for ${estimateName}`,
    `${handoff.jobs?.length ?? 0} job(s)${handoffJob ? `: "${handoffJob.name}" ${handoffJob.status}` : ''}`,
  );

  // 2. Re-accepting must not create a second job.
  await update('estimate', estimateId, { status: 'SENT' });
  await update('estimate', estimateId, { status: 'ACCEPTED' });
  await sleep(QUIET_PERIOD_MS);

  const jobsAfterReaccept = await findJobs();

  for (const job of jobsAfterReaccept) {
    if (!created.some((entry) => entry.id === job.id)) {
      remember('job', job.id);
    }
  }

  record(
    're-accept: still exactly one job for the estimate',
    jobsAfterReaccept.length === 1,
    `${jobsAfterReaccept.length} job(s) after ${QUIET_PERIOD_MS / 1000}s`,
  );

  // 3. Job completed → Draft invoice prefilled from the estimate.
  if (handoffJob) {
    await update('job', handoffJob.id, { status: 'COMPLETED' });

    const billing = await poll('invoice handoff', async () => {
      const invoices = (
        await gql(
          `query ($id: UUID!) { invoices(filter: { jobId: { eq: $id } }) { edges { node { id name status amount { amountMicros currencyCode } lineItems } } } }`,
          { id: handoffJob.id },
        )
      ).invoices.edges.map((edge) => edge.node);

      return { done: invoices.length > 0, invoices };
    });

    for (const invoice of billing.invoices ?? []) {
      remember('invoice', invoice.id);
    }

    const invoice = billing.invoices?.[0];

    record(
      'invoice: completing the job creates one Draft invoice',
      billing.invoices?.length === 1 && invoice.status === 'DRAFT',
      invoice
        ? `"${invoice.name}" ${invoice.status} after ${billing.seconds}s`
        : 'no invoice',
    );
    record(
      'invoice: amount and line items copied from the estimate',
      Number(invoice?.amount?.amountMicros) === 1250000000 &&
        invoice?.amount?.currencyCode === 'USD' &&
        Array.isArray(invoice?.lineItems) &&
        invoice.lineItems.length === 1,
      invoice ? `${Number(invoice.amount?.amountMicros) / 1e6} ${invoice.amount?.currencyCode}` : '',
    );
  } else {
    record('invoice: completing the job creates one Draft invoice', false, 'skipped: no job from the handoff');
  }

  // 4. Schedule check: overlap flagged, then cleared.
  const tech = (
    await gql(`query { workspaceMembers(first: 1) { edges { node { id } } } }`)
  ).workspaceMembers.edges[0]?.node;

  if (!tech) {
    record('schedule: double-booking flagged', false, 'no workspace member to assign');
  } else {
    const jobA = await create('job', {
      name: `${RUN} job A`,
      status: 'SCHEDULED',
      assignedTechId: tech.id,
      scheduledStart: SLOT(9),
      scheduledEnd: SLOT(11),
    });
    const jobB = await create('job', {
      name: `${RUN} job B`,
      status: 'SCHEDULED',
      assignedTechId: tech.id,
      scheduledStart: SLOT(10),
      scheduledEnd: SLOT(12),
    });

    const readFlags = async () =>
      Object.fromEntries(
        (
          await gql(
            `query ($ids: [UUID!]) { jobs(filter: { id: { in: $ids } }) { edges { node { id scheduleConflict conflictDetails } } } }`,
            { ids: [jobA, jobB] },
          )
        ).jobs.edges.map((edge) => [edge.node.id, edge.node]),
      );

    const flagged = await poll('schedule flag', async () => {
      const flags = await readFlags();

      return { done: flags[jobA]?.scheduleConflict && flags[jobB]?.scheduleConflict, flags };
    });

    record(
      'schedule: overlapping jobs for one tech are both flagged',
      Boolean(flagged.done) &&
        flagged.flags[jobA].conflictDetails.includes('job B') &&
        flagged.flags[jobB].conflictDetails.includes('job A'),
      flagged.flags
        ? `"${flagged.flags[jobA]?.conflictDetails}" / "${flagged.flags[jobB]?.conflictDetails}"${flagged.seconds !== undefined ? ` after ${flagged.seconds}s` : ''}`
        : '',
    );

    await update('job', jobB, { scheduledStart: SLOT(11) });

    const cleared = await poll('schedule clear', async () => {
      const flags = await readFlags();

      return { done: !flags[jobA]?.scheduleConflict && !flags[jobB]?.scheduleConflict, flags };
    });

    record(
      'schedule: moving one job back-to-back clears both flags',
      Boolean(cleared.done),
      cleared.seconds !== undefined ? `after ${cleared.seconds}s` : 'flags still set',
    );
  }
} catch (error) {
  record('live run', false, error.message);
} finally {
  if (KEEP) {
    console.log(`\nKept ${created.length} test record(s) labelled "${RUN}".`);
  } else {
    let deleted = 0;

    for (const { objectName, id } of [...created].reverse()) {
      try {
        await gql(`mutation ($id: UUID!) { delete${pascal(objectName)}(id: $id) { id } }`, { id });
        deleted++;
      } catch (error) {
        console.log(`  could not delete ${objectName} ${id}: ${error.message}`);
      }
    }

    console.log(`\nDeleted ${deleted}/${created.length} test record(s) (moved to trash).`);
  }
}

const failed = results.filter((result) => !result.ok);
console.log(`\n${results.length - failed.length}/${results.length} live checks passed`);
process.exit(failed.length ? 1 : 0);
