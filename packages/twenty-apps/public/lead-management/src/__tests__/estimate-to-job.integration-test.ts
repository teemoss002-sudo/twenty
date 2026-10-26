import { describe, expect, it } from 'vitest';

// Live end-to-end test of the accepted-estimate -> Job automation.
// Runs against a real Twenty server (see global-setup.ts, which syncs the
// app first): creates a Lead (standard Opportunity) + Estimate through the
// public GraphQL API, flips the Estimate to ACCEPTED, and polls until the
// app's database-event logic function has created the Job and moved the
// Lead to WON. A second test replays DECLINED -> ACCEPTED and asserts the
// automation reuses the Job instead of creating a duplicate.
//
// Raw GraphQL is used on purpose: the typed twenty-client-sdk client is a
// stub until a dev sync generates it, while this test must exercise the
// real server surface (worker, event delivery, logic function runtime).

const API_URL = process.env.TWENTY_API_URL ?? 'http://localhost:2020';
const API_KEY = process.env.TWENTY_API_KEY ?? '';

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

type JobNode = { id: string; name: string; status: string; estimateId: string };

async function findJobsForEstimate(estimateId: string): Promise<JobNode[]> {
  const data = await graphql<{
    serviceJobs: { edges: Array<{ node: JobNode }> };
  }>(
    `query JobsForEstimate($estimateId: String!) {
      serviceJobs(filter: { estimateId: { eq: $estimateId } }) {
        edges { node { id name status estimateId } }
      }
    }`,
    { estimateId },
  );

  return data.serviceJobs.edges.map((edge) => edge.node);
}

async function findLeadStage(opportunityId: string): Promise<string | undefined> {
  const data = await graphql<{
    opportunities: { edges: Array<{ node: { id: string; leadStage: string } }> };
  }>(
    `query LeadStage($id: String!) {
      opportunities(filter: { id: { eq: $id } }) {
        edges { node { id leadStage } }
      }
    }`,
    { id: opportunityId },
  );

  return data.opportunities.edges[0]?.node.leadStage;
}

async function createLeadAndEstimate(suffix: string) {
  const lead = await graphql<{ createOpportunity: { id: string } }>(
    `mutation CreateLead($data: OpportunityCreateInput!) {
      createOpportunity(data: $data) { id }
    }`,
    { data: { name: `Integration Lead ${suffix}` } },
  );

  const estimate = await graphql<{ createEstimate: { id: string } }>(
    `mutation CreateEstimate($data: EstimateCreateInput!) {
      createEstimate(data: $data) { id }
    }`,
    {
      data: {
        name: `Integration Estimate ${suffix}`,
        status: 'SENT',
        leadId: lead.createOpportunity.id,
      },
    },
  );

  return {
    opportunityId: lead.createOpportunity.id,
    estimateId: estimate.createEstimate.id,
    estimateName: `Integration Estimate ${suffix}`,
  };
}

async function setEstimateStatus(estimateId: string, status: string) {
  await graphql(
    `mutation SetEstimateStatus($id: String!, $data: EstimateUpdateInput!) {
      updateEstimate(id: $id, data: $data) { id status }
    }`,
    { id: estimateId, data: { status } },
  );
}

describe('accepted estimate -> job automation (live server)', () => {
  it('creates a SCHEDULED job and moves the lead to WON', async () => {
    const { opportunityId, estimateId, estimateName } =
      await createLeadAndEstimate(`accept-${Date.now()}`);

    await setEstimateStatus(estimateId, 'ACCEPTED');

    const job = await waitFor('job created for accepted estimate', async () => {
      const jobs = await findJobsForEstimate(estimateId);

      return jobs[0];
    });

    expect(job.name).toBe(estimateName);
    expect(job.status).toBe('SCHEDULED');
    expect(job.estimateId).toBe(estimateId);

    const leadStage = await waitFor('lead moved to WON', async () => {
      const stage = await findLeadStage(opportunityId);

      return stage === 'WON' ? stage : undefined;
    });

    expect(leadStage).toBe('WON');
  });

  it('reuses the existing job on a DECLINED -> ACCEPTED replay', async () => {
    const { estimateId } = await createLeadAndEstimate(
      `replay-${Date.now()}`,
    );

    await setEstimateStatus(estimateId, 'ACCEPTED');

    const firstJob = await waitFor(
      'job created for accepted estimate',
      async () => (await findJobsForEstimate(estimateId))[0],
    );

    await setEstimateStatus(estimateId, 'DECLINED');
    await setEstimateStatus(estimateId, 'ACCEPTED');

    // Give the automation a full delivery window, then assert no duplicate.
    await new Promise((resolve) => setTimeout(resolve, 15_000));

    const jobs = await findJobsForEstimate(estimateId);

    expect(jobs).toHaveLength(1);
    expect(jobs[0].id).toBe(firstJob.id);
  });
});
