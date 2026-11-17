// Runtime smoke test for the estimate-accepted handoff.
//
// Executes the BUILT function bundle (.twenty/output/src/logic-functions/
// on-estimate-accepted.mjs) — the same artifact the Twenty server would
// execute, called the way the manifest's handlerName says
// (default.config.handler) — against a mock workspace GraphQL API. Verifies at
// runtime:
//   1. env injection: TWENTY_API_URL + the application token, sent as Bearer
//   2. accepted transition: lead marked Won, existing-job lookup, job created
//   3. retry / re-accept: an existing job means no second createServiceJob
//   4. non-transition (already Accepted): no API calls at all
//   5. API errors propagate (the server re-queues the run)
//
// Run: yarn twenty dev:build, then yarn smoke

import http from 'node:http';
import assert from 'node:assert/strict';

let receivedCalls = [];
let existingJobId = null;
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

    if (call.query.includes('updateOpportunity(')) {
      res.end(
        JSON.stringify({
          data: {
            updateOpportunity: {
              id: call.variables.id,
              leadStage: call.variables.data.leadStage,
            },
          },
        }),
      );
      return;
    }

    if (call.query.includes('serviceJobs(filter:')) {
      res.end(
        JSON.stringify({
          data: {
            serviceJobs: {
              edges: existingJobId ? [{ node: { id: existingJobId } }] : [],
            },
          },
        }),
      );
      return;
    }

    if (call.query.includes('createServiceJob(')) {
      res.end(
        JSON.stringify({
          data: { createServiceJob: { id: 'job-created-1', name: call.variables.data.name } },
        }),
      );
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

const acceptedEvent = (beforeStatus = 'SENT') => ({
  name: 'estimate.updated',
  workspaceId: 'workspace-1',
  recordId: 'estimate-1',
  properties: {
    updatedFields: ['status'],
    before: { id: 'estimate-1', status: beforeStatus },
    after: {
      id: 'estimate-1',
      name: 'Kitchen rewire',
      status: 'ACCEPTED',
      leadId: 'lead-1',
      customerId: 'person-1',
    },
  },
});

await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const port = server.address().port;

try {
  const mod = await import(
    new URL(
      '../.twenty/output/src/logic-functions/on-estimate-accepted.mjs',
      import.meta.url,
    ).href
  );
  const handler = mod.default?.config?.handler;

  record('bundle exposes default.config.handler', typeof handler === 'function');

  // 1. no env → loud failure
  delete process.env.TWENTY_API_URL;
  delete process.env.TWENTY_APP_APPLICATION_ACCESS_TOKEN;
  delete process.env.TWENTY_APP_ACCESS_TOKEN;
  delete process.env.API_URL;
  delete process.env.APP_ACCESS_TOKEN;
  try {
    await handler(acceptedEvent());
    record('fails loudly without injected env', false, 'no error thrown');
  } catch (error) {
    record('fails loudly without injected env', /not injected/.test(error.message));
  }

  process.env.TWENTY_API_URL = `http://127.0.0.1:${port}/`;
  process.env.TWENTY_APP_ACCESS_TOKEN = 'smoke-person-token';
  process.env.TWENTY_APP_APPLICATION_ACCESS_TOKEN = 'smoke-app-token';

  // 2. accepted transition
  receivedCalls = [];
  const summary = await handler(acceptedEvent());
  const operations = receivedCalls.map(
    (call) => call.query.match(/(updateOpportunity|serviceJobs|createServiceJob)\(/)?.[1],
  );
  assert.deepEqual(operations, ['updateOpportunity', 'serviceJobs', 'createServiceJob']);
  assert.deepEqual(receivedCalls[0].variables, {
    id: 'lead-1',
    data: { leadStage: 'WON' },
  });
  assert.deepEqual(receivedCalls[1].variables, { estimateId: 'estimate-1' });
  assert.deepEqual(receivedCalls[2].variables, {
    data: {
      name: 'Job for Kitchen rewire',
      status: 'SCHEDULED',
      estimateId: 'estimate-1',
      customerId: 'person-1',
    },
  });
  record(
    'accepted: lead → Won, job created with the app token',
    summary.includes('job job-created-1 created'),
    summary,
  );

  // 3. existing job → no duplicate
  receivedCalls = [];
  existingJobId = 'job-existing-1';
  const retrySummary = await handler(acceptedEvent());
  record(
    'retry: existing job is reused, no second createServiceJob',
    !receivedCalls.some((call) => call.query.includes('createServiceJob(')) &&
      retrySummary.includes('already exists'),
    retrySummary,
  );
  existingJobId = null;

  // 4. re-save of an already-accepted estimate
  receivedCalls = [];
  const skipSummary = await handler(acceptedEvent('ACCEPTED'));
  record(
    'non-transition: no API calls',
    receivedCalls.length === 0 && skipSummary.includes('skipped'),
    skipSummary,
  );

  // 5. API errors propagate
  respondWithErrors = true;
  try {
    await handler(acceptedEvent());
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
  `\n${results.length - failed.length}/${results.length} estimate-accepted smoke checks passed`,
);
process.exit(failed.length ? 1 : 0);
