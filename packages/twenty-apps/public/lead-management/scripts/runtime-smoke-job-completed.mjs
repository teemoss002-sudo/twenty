// Runtime smoke test for the job-completed invoice handoff.
//
// Executes the BUILT function bundle (.twenty/output/src/logic-functions/
// on-job-completed.mjs) — the artifact the Twenty server would execute, called
// as the manifest's handlerName says (default.config.handler) — against a mock
// workspace GraphQL API. Verifies at runtime:
//   1. env injection: TWENTY_API_URL + the application token, sent as Bearer
//   2. completed transition: invoice lookup, estimate read, draft invoice with
//      the estimate's amount and line items
//   3. retry / re-complete: an existing invoice means no second createInvoice
//   4. non-transition (already Completed): no API calls at all
//   5. API errors propagate (the server re-queues the run)
//
// Run: yarn twenty dev:build, then yarn smoke

import http from 'node:http';
import assert from 'node:assert/strict';

const ESTIMATE = {
  id: 'estimate-1',
  totalAmount: { amountMicros: 1250000000, currencyCode: 'USD' },
  lineItems: [{ description: 'Rewire kitchen', quantity: 1, unitPrice: 1250 }],
};

let receivedCalls = [];
let existingInvoiceId = null;
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

    if (call.query.includes('invoices(filter:')) {
      res.end(
        JSON.stringify({
          data: {
            invoices: {
              edges: existingInvoiceId ? [{ node: { id: existingInvoiceId } }] : [],
            },
          },
        }),
      );
      return;
    }

    if (call.query.includes('estimate(filter:')) {
      res.end(JSON.stringify({ data: { estimate: ESTIMATE } }));
      return;
    }

    if (call.query.includes('createInvoice(')) {
      res.end(
        JSON.stringify({
          data: {
            createInvoice: { id: 'invoice-created-1', name: call.variables.data.name },
          },
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

const completedEvent = (beforeStatus = 'IN_PROGRESS') => ({
  name: 'serviceJob.updated',
  workspaceId: 'workspace-1',
  recordId: 'job-1',
  properties: {
    updatedFields: ['status'],
    before: { id: 'job-1', status: beforeStatus },
    after: {
      id: 'job-1',
      name: 'Job for Kitchen rewire',
      status: 'COMPLETED',
      estimateId: 'estimate-1',
      customerId: 'person-1',
    },
  },
});

await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const port = server.address().port;

try {
  const mod = await import(
    new URL(
      '../.twenty/output/src/logic-functions/on-job-completed.mjs',
      import.meta.url,
    ).href
  );
  const handler = mod.default?.config?.handler;

  record('bundle exposes default.config.handler', typeof handler === 'function');

  // 1. no env → loud failure
  for (const name of [
    'TWENTY_API_URL',
    'TWENTY_APP_APPLICATION_ACCESS_TOKEN',
    'TWENTY_APP_ACCESS_TOKEN',
    'API_URL',
    'APP_ACCESS_TOKEN',
  ]) {
    delete process.env[name];
  }
  try {
    await handler(completedEvent());
    record('fails loudly without injected env', false, 'no error thrown');
  } catch (error) {
    record('fails loudly without injected env', /not injected/.test(error.message));
  }

  process.env.TWENTY_API_URL = `http://127.0.0.1:${port}/`;
  process.env.TWENTY_APP_ACCESS_TOKEN = 'smoke-person-token';
  process.env.TWENTY_APP_APPLICATION_ACCESS_TOKEN = 'smoke-app-token';

  // 2. completed transition
  receivedCalls = [];
  const summary = await handler(completedEvent());
  const operations = receivedCalls.map(
    (call) => call.query.match(/(invoices|estimate|createInvoice)\(/)?.[1],
  );
  assert.deepEqual(operations, ['invoices', 'estimate', 'createInvoice']);
  assert.deepEqual(receivedCalls[0].variables, { serviceJobId: 'job-1' });
  assert.deepEqual(receivedCalls[1].variables, { estimateId: 'estimate-1' });
  assert.deepEqual(receivedCalls[2].variables, {
    data: {
      name: 'Invoice for Kitchen rewire',
      status: 'DRAFT',
      serviceJobId: 'job-1',
      customerId: 'person-1',
      amount: { amountMicros: 1250000000, currencyCode: 'USD' },
      lineItems: ESTIMATE.lineItems,
    },
  });
  record(
    'completed: draft invoice prefilled from the estimate, app token used',
    summary.includes('draft invoice invoice-created-1 created'),
    summary,
  );

  // 3. existing invoice → no duplicate
  receivedCalls = [];
  existingInvoiceId = 'invoice-existing-1';
  const retrySummary = await handler(completedEvent());
  record(
    'retry: existing invoice is kept, no second createInvoice',
    receivedCalls.length === 1 && retrySummary.includes('already exists'),
    retrySummary,
  );
  existingInvoiceId = null;

  // 4. re-save of an already-completed job
  receivedCalls = [];
  const skipSummary = await handler(completedEvent('COMPLETED'));
  record(
    'non-transition: no API calls',
    receivedCalls.length === 0 && skipSummary.includes('skipped'),
    skipSummary,
  );

  // 5. API errors propagate
  respondWithErrors = true;
  try {
    await handler(completedEvent());
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
  `\n${results.length - failed.length}/${results.length} job-completed smoke checks passed`,
);
process.exit(failed.length ? 1 : 0);
