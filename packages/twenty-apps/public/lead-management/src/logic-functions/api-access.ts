/**
 * Shared API access for JobFlow logic functions.
 *
 * Server-verified (twenty-shared/application constants, logic-function-executor
 * service): every run gets TWENTY_API_URL, TWENTY_APP_ACCESS_TOKEN (acts as the
 * person who triggered the run, falling back to the app when nobody did) and
 * TWENTY_APP_APPLICATION_ACCESS_TOKEN (always the app itself, with the function
 * role). The unprefixed API_URL / APP_ACCESS_TOKEN names are NOT injected by
 * current servers; they are kept only as a last fallback.
 *
 * The application token is preferred so every JobFlow function runs with the
 * app's own function role (src/roles/default-role.ts) whoever triggered it.
 */

export type ApiAccess = { apiUrl: string; accessToken: string };

export const resolveApiAccess = (
  env: Record<string, string | undefined>,
): ApiAccess => {
  const apiUrl = env.TWENTY_API_URL || env.API_URL;
  const accessToken =
    env.TWENTY_APP_APPLICATION_ACCESS_TOKEN ||
    env.TWENTY_APP_ACCESS_TOKEN ||
    env.APP_ACCESS_TOKEN;

  if (!apiUrl || !accessToken) {
    throw new Error(
      'TWENTY_API_URL / TWENTY_APP_APPLICATION_ACCESS_TOKEN are not injected',
    );
  }

  return { apiUrl: apiUrl.replace(/\/+$/, ''), accessToken };
};
