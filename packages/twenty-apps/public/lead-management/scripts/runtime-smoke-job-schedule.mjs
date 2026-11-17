// Runtime smoke test for the tech double-booking check.
//
// Executes the BUILT function bundle (.twenty/output/src/logic-functions/
// on-job-schedule-changed.mjs) — the artifact the Twenty server would execute,
// called as the manifest's handlerName says (default.config.handler) — against
// a mock workspace GraphQL API holding a small, mutable job table. Verifies at
// runtime:
//   1. env injection: TWENTY_API_URL + the application token, sent as Bearer
//   2. double-booking: both overlapping jobs get flagged with each other's name
//   3. rerun with nothing changed: no writes (idempotent under retries)
//   4. fix (reschedule): both flags cleared
//   5. reassignment: the old tech's left-behind job is cleared too
//   6. API errors propagate (the server re-queues the run)
//
// Run: yarn twenty dev:build, then yarn smoke

import http from 'node:http';
import assert from 'node:assert/strict';

const ACTIVE = ['SCHEDULED', 'EN_ROUTE', 'IN_PROGRESS'];

// Mutable "database": job id → record.
let jobs = {};
let receivedCalls = [];
let respondWithErrors = false;

const server = http.createServer((req, res) => {
  let body = '';
  req.on('data', (chunk) => (body += chunk));
  req.on('end', () => {
    res.setHeader('Content-Type', 'application/json');

    try {
      assert.equal(req.url, '/graphql');
      assert.equal(req.headers.authorization, 'Bearer smoke-app-token');
    } catch (error) {
      res.statusCode = 400;
      res.end(JSON.stringify({ errors: [{ message: error.message }] }));
      return;
    }

    const call = JSON.parse(body);
    receivedCalls.push(call);

    if (respondWithErrors) {
      res.end(JSON.stringify({ errors: [{ message: 'simulated rejection' }] }));
      return;
    }

    if (call.query.includes('jobs(')) {
      assert.ok(call.query.includes('status: { in: [SCHEDULED, EN_ROUTE, IN_PROGRESS] }'));
      const nodes = Object.values(jobs).filter(
        (job) => job.assignedTechId === call.variables.techId && ACTIVE.includes(job.status),
      );
      res.end(
        JSON.stringify({
          data: {
            jobs: {
              edges: nodes.map(({ assignedTechId, ...node }) => ({ node })),
              pageInfo: { hasNextPage: false, endCursor: null },
            },
          },
        }),
      );
      return;
    }

    if (call.query.includes('updateJob(')) {
      Object.assign(jobs[call.variables.id], call.variables.data);
      res.end(JSON.stringify({ data: { updateJob: { id: call.variables.id } } }));
      return;
    }

    res.statusCode = 400;
    res.end(JSON.stringify({ errors: [{ message: 'unexpected query' }] }));
  });
});

const results = [];
const record = (name, ok, detail = '') => {
  results.push({ name, ok, detail });
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`);
};

const makeJob = (id, techId, start, end) => ({
  id,
  name: `Job for ${id}`,
  status: 'SCHEDULED',
  assignedTechId: techId,
  scheduledStart: start,
  scheduledEnd: end,
  scheduleConflict: false,
  conflictDetails: '',
});

const updatedEvent = (id, before = {}) => ({
  name: 'job.updated',
  workspaceId: 'workspace-1',
  recordId: id,
  properties: { updatedFields: ['scheduledStart'], before, after: { ...jobs[id] } },
});

const writes = () => receivedCalls.filter((call) => call.query.includes('updateJob('));

await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const port = server.address().port;

try {
  const mod = await import(
    new URL(
      '../.twenty/output/src/logic-functions/on-job-schedule-changed.mjs',
      import.meta.url,
    ).href
  );
  const handler = mod.default?.config?.handler;

  record('bundle exposes default.config.handler', typeof handler === 'function');

  process.env.TWENTY_API_URL = `http://127.0.0.1:${port}/`;
  process.env.TWENTY_APP_ACCESS_TOKEN = 'smoke-person-token';
  process.env.TWENTY_APP_APPLICATION_ACCESS_TOKEN = 'smoke-app-token';

  // 2. double-booking
  jobs = {
    roof: makeJob('roof', 'tech-1', '2026-11-18T09:00:00Z', '2026-11-18T11:00:00Z'),
    furnace: makeJob('furnace', 'tech-1', '2026-11-18T10:00:00Z', '2026-11-18T12:00:00Z'),
  };
  receivedCalls = [];
  await handler(updatedEvent('furnace'));
  record(
    'double-booking: both jobs flagged with each other’s name',
    jobs.roof.scheduleConflict === true &&
      jobs.roof.conflictDetails === 'Overlaps Job for furnace' &&
      jobs.furnace.scheduleConflict === true &&
      jobs.furnace.conflictDetails === 'Overlaps Job for roof',
    `${jobs.roof.conflictDetails} | ${jobs.furnace.conflictDetails}`,
  );

  // 3. rerun → no writes
  receivedCalls = [];
  await handler(updatedEvent('furnace'));
  record('rerun with nothing changed: no writes', writes().length === 0);

  // 4. fix the clash
  jobs.furnace.scheduledStart = '2026-11-18T11:00:00Z';
  receivedCalls = [];
  await handler(updatedEvent('furnace'));
  record(
    'reschedule back-to-back: both flags cleared',
    !jobs.roof.scheduleConflict &&
      !jobs.furnace.scheduleConflict &&
      jobs.roof.conflictDetails === '' &&
      writes().length === 2,
  );

  // 5. reassignment clears the old tech's job
  jobs.furnace.scheduledStart = '2026-11-18T10:00:00Z';
  await handler(updatedEvent('furnace'));
  assert.equal(jobs.roof.scheduleConflict, true);
  jobs.furnace.assignedTechId = 'tech-2';
  await handler(updatedEvent('furnace', { assignedTechId: 'tech-1' }));
  record(
    'reassign to another tech: left-behind job cleared, moved job clear',
    !jobs.roof.scheduleConflict && !jobs.furnace.scheduleConflict,
  );

  // 6. API errors propagate
  respondWithErrors = true;
  try {
    await handler(updatedEvent('furnace'));
    record('API errors propagate', false, 'no error thrown');
  } catch (error) {
    record('API errors propagate', error.message.includes('simulated rejection'));
  }
  respondWithErrors = false;
} catch (error) {
  record('smoke run', false, error.stack ?? String(error));
} finally {
  server.close();
}

const failed = results.filter((result) => !result.ok);
console.log(
  `\n${results.length - failed.length}/${results.length} job-schedule smoke checks passed`,
);
process.exit(failed.length ? 1 : 0);
