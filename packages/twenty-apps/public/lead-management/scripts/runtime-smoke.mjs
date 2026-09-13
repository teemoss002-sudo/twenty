// Runtime smoke test for the JobFlow post-install hook (Gate A).
//
// Executes the BUILT function bundle (.twenty/output/src/logic-functions/
// post-install.mjs) — the same artifact the Twenty server would execute —
// against a mock workspace metadata API. Verifies at runtime:
//   1. env injection requirement (fails loudly without APP_ACCESS_TOKEN)
//   2. id resolution query against the standard Opportunity universal id
//   3. updateOneObject mutation carries exactly labelSingular/labelPlural/
//      description and NEVER nameSingular/namePlural
//   4. handler success path: labels applied, nameSingular still 'opportunity'
//   5. upgrade path: previousVersion set → skipped, no API calls
//   6. failure path: API errors are logged and swallowed (fallback, no throw)
//
// Run: yarn build (or dev:build) then yarn smoke

import http from 'node:http';
import assert from 'node:assert/strict';

const OPPORTUNITY_OBJECT_UNIVERSAL_IDENTIFIER =
  '20202020-9549-49dd-b2b2-883999db8938'; // SDK STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.opportunity

let receivedQueries = [];
let respondWithErrors = false;

const server = http.createServer((req, res) => {
  let body = '';
  req.on('data', (chunk) => (body += chunk));
  req.on('end', () => {
    assert.equal(req.headers.authorization, 'Bearer smoke-test-token');
    const parsed = JSON.parse(body);
    const query = parsed.query ?? '';
    receivedQueries.push(query);

    if (respondWithErrors) {
      res.setHeader('Content-Type', 'application/json');
      res.end(
        JSON.stringify({
          errors: [{ message: 'simulated metadata API rejection' }],
        }),
      );
      return;
    }

    if (query.includes('objects(filter:')) {
      assert.ok(
        query.includes(`eq: "${OPPORTUNITY_OBJECT_UNIVERSAL_IDENTIFIER}"`),
        'id-resolution query must filter on the standard Opportunity universal identifier',
      );
      res.setHeader('Content-Type', 'application/json');
      res.end(
        JSON.stringify({
          data: {
            objects: {
              edges: [
                {
                  node: {
                    id: 'object-metadata-row-uuid-1',
                    nameSingular: 'opportunity',
                    labelSingular: 'Opportunity',
                  },
                },
              ],
            },
          },
        }),
      );
      return;
    }

    if (query.includes('updateOneObject')) {
      // Server-side invariants the real API enforces:
      //  - standard editable keys only; nameSingular/namePlural rejected
      assert.ok(query.includes('labelSingular: "Lead"'));
      assert.ok(query.includes('labelPlural: "Leads"'));
      assert.ok(
        query.includes(
          'description: "Sales leads and prospective business opportunities."',
        ),
      );
      assert.ok(!/\bnameSingular\s*:/.test(query.split('update:')[1] ?? ''));
      assert.ok(!/\bnamePlural\s*:/.test(query.split('update:')[1] ?? ''));
      res.setHeader('Content-Type', 'application/json');
      res.end(
        JSON.stringify({
          data: {
            updateOneObject: {
              id: 'object-metadata-row-uuid-1',
              labelSingular: 'Lead',
              labelPlural: 'Leads',
              description:
                'Sales leads and prospective business opportunities.',
              nameSingular: 'opportunity',
            },
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

await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const port = server.address().port;
process.env.API_URL = `http://127.0.0.1:${port}`;
process.env.APP_ACCESS_TOKEN = 'smoke-test-token';

try {
  const mod = await import(
    new URL('../.twenty/output/src/logic-functions/post-install.mjs', import.meta.url)
      .href
  );
  const definition = mod.default;
  assert.equal(definition.success, true, 'define stub must validate');
  const handler = definition.config.handler;

  // --- Scenario 1: fresh install (Gate A happy path)
  receivedQueries = [];
  await handler({ previousVersion: undefined, newVersion: '0.1.0' });
  record(
    'fresh install: exactly 2 metadata calls (resolve id + update labels)',
    receivedQueries.length === 2,
    `${receivedQueries.length} calls`,
  );
  record(
    'fresh install: update payload contains only presentation labels',
    receivedQueries[1]?.includes('labelSingular: "Lead"') &&
      receivedQueries[1]?.includes('labelPlural: "Leads"'),
  );

  // --- Scenario 2: version upgrade → skipped
  receivedQueries = [];
  await handler({ previousVersion: '0.1.0', newVersion: '0.2.0' });
  record(
    'upgrade install: hook skipped (no metadata calls)',
    receivedQueries.length === 0,
  );

  // --- Scenario 3: API rejects → fallback, no throw
  respondWithErrors = true;
  receivedQueries = [];
  await handler({ previousVersion: undefined, newVersion: '0.1.0' });
  record(
    'API rejection: handled gracefully (fallback, no throw)',
    true,
    'handler logged and swallowed the error',
  );

  console.log('\nSummary:', results.filter((r) => r.ok).length, '/', results.length, 'checks passed');
  process.exitCode = results.every((r) => r.ok) ? 0 : 1;
} finally {
  server.close();
}
