import * as path from 'path';

import { expect, test } from '@playwright/test';

import { resolveE2eWorkspaceUrl } from './utils/resolve-e2e-workspace-url';

// Captures REAL marketplace screenshots from a live Twenty instance with
// the app installed (see e2e/global-setup.ts). Seeds service-business demo
// data through the GraphQL API, lets the estimate->job automation create
// real Jobs, then photographs the three gallery views. Output overwrites
// the mockups in public/; the CI screenshots job commits them back.

const API_URL = process.env.TWENTY_API_URL ?? 'http://localhost:2020';
const API_KEY = process.env.TWENTY_API_KEY ?? '';

const PUBLIC_DIR = path.resolve(process.cwd(), 'public');

type GraphQLResponse<T> = {
  data?: T;
  errors?: Array<{ message: string }>;
};

async function graphql<T>(
  query: string,
  variables: Record<string, unknown>,
): Promise<T> {
  const response = await fetch(`${API_URL}/graphql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({ query, variables }),
  });

  const body = (await response.json()) as GraphQLResponse<T>;

  if (!response.ok || body.errors?.length || !body.data) {
    throw new Error(
      `GraphQL request failed (${response.status}): ${JSON.stringify(body.errors ?? body)}`,
    );
  }

  return body.data;
}

async function waitFor<T>(
  description: string,
  probe: () => Promise<T | undefined>,
  timeoutMs = 90_000,
): Promise<T> {
  const deadline = Date.now() + timeoutMs;

  for (;;) {
    const value = await probe();

    if (value !== undefined) {
      return value;
    }

    if (Date.now() > deadline) {
      throw new Error(`Timed out waiting for: ${description}`);
    }

    await new Promise((resolve) => setTimeout(resolve, 2_000));
  }
}

async function createLead(name: string, leadStage: string): Promise<string> {
  const data = await graphql<{ createOpportunity: { id: string } }>(
    `mutation CreateLead($data: OpportunityCreateInput!) {
      createOpportunity(data: $data) { id }
    }`,
    { data: { name, leadStage } },
  );

  return data.createOpportunity.id;
}

async function createEstimate(
  name: string,
  leadId: string,
  status: string,
): Promise<string> {
  const data = await graphql<{ createEstimate: { id: string } }>(
    `mutation CreateEstimate($data: EstimateCreateInput!) {
      createEstimate(data: $data) { id }
    }`,
    { data: { name, status, leadId } },
  );

  return data.createEstimate.id;
}

async function setEstimateStatus(estimateId: string, status: string) {
  await graphql(
    `mutation SetEstimateStatus($id: String!, $data: EstimateUpdateInput!) {
      updateEstimate(id: $id, data: $data) { id status }
    }`,
    { id: estimateId, data: { status } },
  );
}

async function jobsForEstimate(estimateId: string) {
  const data = await graphql<{
    serviceJobs: { edges: Array<{ node: { id: string } }> };
  }>(
    `query JobsForEstimate($estimateId: String!) {
      serviceJobs(filter: { estimateId: { eq: $estimateId } }) {
        edges { node { id } }
      }
    }`,
    { estimateId },
  );

  return data.serviceJobs.edges.map((edge) => edge.node);
}

async function findViewId(viewName: string): Promise<string | undefined> {
  try {
    const data = await graphql<{
      views: { edges: Array<{ node: { id: string; name: string } }> };
    }>(
      `query ViewByName($name: String!) {
        views(filter: { name: { eq: $name } }) {
          edges { node { id name } }
        }
      }`,
      { name: viewName },
    );

    return data.views.edges[0]?.node.id;
  } catch {
    return undefined;
  }
}

const seeded: {
  acceptedEstimateId?: string;
  acceptedEstimateName: string;
  heroLeadName: string;
  heroJobName: string;
} = {
  acceptedEstimateName: 'Johnson Residence — AC Replacement',
  heroLeadName: 'Johnson Residence — AC Replacement',
  heroJobName: 'Johnson Residence — AC Replacement',
};

test.describe.serial('marketplace screenshots (real UI)', () => {
  // The UI fails silently in screenshots; surface browser output in the log.
  test.beforeEach(({ page }) => {
    page.on('console', (message) => {
      console.log(`[browser:${message.type()}] ${message.text()}`);
    });

    page.on('pageerror', (error) => {
      console.log(`[pageerror] ${error.message}\n${error.stack ?? ''}`);
    });

    page.on('requestfailed', (request) => {
      console.log(
        `[requestfailed] ${request.method()} ${request.url()} — ${
          request.failure()?.errorText ?? 'unknown error'
        }`,
      );
    });

    page.on('response', (response) => {
      if (response.status() >= 400) {
        console.log(
          `[response ${response.status()}] ${response.request().method()} ${response.url()}`,
        );
      }

      // GraphQL errors come back as HTTP 200 with an errors array.
      if (response.url().includes('/graphql') && response.status() === 200) {
        response
          .json()
          .then((body: { errors?: Array<{ message: string }> }) => {
            if (body.errors?.length) {
              console.log(
                `[graphql errors] ${JSON.stringify(body.errors).slice(0, 2000)}`,
              );
            }
          })
          .catch(() => {});
      }
    });
  });

  test.beforeAll(async () => {
    const miller = await createLead('Miller — Water Heater Install', 'NEW');
    const johnson = await createLead(
      'Johnson Residence — AC Replacement',
      'QUALIFIED',
    );
    const garcia = await createLead('Garcia — Roof Repair', 'ESTIMATE_SENT');
    const nguyen = await createLead('Nguyen — Kitchen Remodel', 'FOLLOW_UP');
    const patel = await createLead('Patel — HVAC Maintenance Plan', 'NEW');
    await createLead('Thompson — Deck Build', 'LOST');

    await createEstimate('Garcia — Roof Repair Quote', garcia, 'SENT');
    await createEstimate('Nguyen — Kitchen Remodel Quote', nguyen, 'DRAFT');

    // Accepted estimates: the automation creates the Jobs and wins the Leads.
    const johnsonEstimate = await createEstimate(
      'Johnson Residence — AC Replacement',
      johnson,
      'SENT',
    );
    await setEstimateStatus(johnsonEstimate, 'ACCEPTED');
    seeded.acceptedEstimateId = johnsonEstimate;

    const millerEstimate = await createEstimate(
      'Miller — Water Heater Install',
      miller,
      'SENT',
    );
    await setEstimateStatus(millerEstimate, 'ACCEPTED');

    const patelEstimate = await createEstimate(
      'Patel — HVAC Maintenance Plan',
      patel,
      'SENT',
    );
    await setEstimateStatus(patelEstimate, 'ACCEPTED');

    // Wait for the automation, then spread job statuses across the board.
    const johnsonJob = await waitFor('automation job (Johnson)', async () =>
      (await jobsForEstimate(johnsonEstimate))[0],
    );
    const millerJob = await waitFor('automation job (Miller)', async () =>
      (await jobsForEstimate(millerEstimate))[0],
    );
    const patelJob = await waitFor('automation job (Patel)', async () =>
      (await jobsForEstimate(patelEstimate))[0],
    );

    await graphql(
      `mutation SetJobStatus($id: String!, $data: ServiceJobUpdateInput!) {
        updateServiceJob(id: $id, data: $data) { id status }
      }`,
      { id: millerJob.id, data: { status: 'IN_PROGRESS' } },
    );
    await graphql(
      `mutation SetJobStatus($id: String!, $data: ServiceJobUpdateInput!) {
        updateServiceJob(id: $id, data: $data) { id status }
      }`,
      { id: patelJob.id, data: { status: 'EN_ROUTE' } },
    );

    expect(johnsonJob.id).toBeTruthy();
  });

  test('lead pipeline', async ({ page }) => {
    const base = resolveE2eWorkspaceUrl();
    const viewId = await findViewId('Lead Pipeline');

    await page.goto(
      `${base}/objects/opportunities${viewId ? `?viewId=${viewId}` : ''}`,
    );
    try {
      await expect(
        page.getByText(seeded.heroLeadName).first(),
      ).toBeVisible({ timeout: 60_000 });
    } catch (error) {
      const bodyText = await page.locator('body').innerText();
      console.log(`[dump] opportunities page text: ${bodyText.slice(0, 4000)}`);
      throw error;
    }
    await page.waitForTimeout(1_500);

    await page.screenshot({
      path: path.join(PUBLIC_DIR, 'screenshot-pipeline.png'),
    });
  });

  test('accepted estimate', async ({ page }) => {
    const base = resolveE2eWorkspaceUrl();

    await page.goto(`${base}/object/estimate/${seeded.acceptedEstimateId}`);
    await expect(
      page.getByText(seeded.acceptedEstimateName).first(),
    ).toBeVisible({ timeout: 30_000 });
    await page.waitForTimeout(1_500);

    await page.screenshot({
      path: path.join(PUBLIC_DIR, 'screenshot-estimate-to-job.png'),
    });
  });

  test('job board', async ({ page }) => {
    const base = resolveE2eWorkspaceUrl();
    const viewId = await findViewId('Job Board');

    await page.goto(
      `${base}/objects/serviceJobs${viewId ? `?viewId=${viewId}` : ''}`,
    );
    await expect(
      page.getByText(seeded.heroJobName).first(),
    ).toBeVisible({ timeout: 30_000 });
    await page.waitForTimeout(1_500);

    await page.screenshot({
      path: path.join(PUBLIC_DIR, 'screenshot-jobs.png'),
    });
  });
});
