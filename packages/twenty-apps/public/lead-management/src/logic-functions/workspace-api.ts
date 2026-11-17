import { type ApiAccess } from './api-access';

// Workspace (record) GraphQL client shared by JobFlow logic functions. Errors
// are thrown so the server records the failure and re-queues the run.
export const requestWorkspaceApi = async (
  access: ApiAccess,
  query: string,
  variables: Record<string, unknown>,
): Promise<Record<string, unknown>> => {
  const response = await fetch(`${access.apiUrl}/graphql`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${access.accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query, variables }),
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

  if (!response.ok) {
    throw new Error(`workspace API responded ${response.status}`);
  }

  return body.data ?? {};
};
