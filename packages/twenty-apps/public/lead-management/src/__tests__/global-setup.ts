import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

import { appDevOnce, appUninstall } from 'twenty-sdk/cli';

// Integration-test bootstrap (SDK testing pattern): verifies the target
// Twenty server is reachable, writes the CLI test config the SDK reads
// under NODE_ENV=test, then syncs this app into the workspace so its
// objects, fields, roles and logic functions exist before tests run.
// The dev sync also generates the real twenty-client-sdk client, which is
// what lets the app's own logic functions call the API server-side.
//
// Requires TWENTY_API_URL + TWENTY_API_KEY (see vitest.integration.config.ts).
// Locally: `yarn twenty docker:start` provides both. In CI the
// spawn-twenty-app-dev-test action provides both.

const APP_PATH = process.cwd();
const CONFIG_DIR = path.join(os.homedir(), '.twenty');

function validateEnv(): { apiUrl: string; apiKey: string } {
  const apiUrl = process.env.TWENTY_API_URL;
  const apiKey = process.env.TWENTY_API_KEY;

  if (!apiUrl || !apiKey) {
    throw new Error(
      'TWENTY_API_URL and TWENTY_API_KEY must be set.\n' +
        'Start a local server: yarn twenty docker:start\n' +
        'Or run via CI (spawn-twenty-app-dev-test action).',
    );
  }

  return { apiUrl, apiKey };
}

async function checkServer(apiUrl: string) {
  let response: Response;

  try {
    response = await fetch(`${apiUrl}/healthz`);
  } catch {
    throw new Error(
      `Twenty server is not reachable at ${apiUrl}. ` +
        'Make sure the server is running before executing integration tests.',
    );
  }

  if (!response.ok) {
    throw new Error(`Server at ${apiUrl} returned ${response.status}`);
  }
}

function writeConfig(apiUrl: string, apiKey: string) {
  const payload = JSON.stringify(
    {
      remotes: {
        local: { apiUrl, apiKey, accessToken: apiKey },
      },
      defaultRemote: 'local',
    },
    null,
    2,
  );

  fs.mkdirSync(CONFIG_DIR, { recursive: true });
  fs.writeFileSync(path.join(CONFIG_DIR, 'config.test.json'), payload);
}

export async function setup() {
  const { apiUrl, apiKey } = validateEnv();

  await checkServer(apiUrl);

  writeConfig(apiUrl, apiKey);

  await appUninstall({ appPath: APP_PATH }).catch(() => {});

  const result = await appDevOnce({
    appPath: APP_PATH,
    onProgress: (message: string) => console.log(`[dev] ${message}`),
  });

  if (!result.success) {
    throw new Error(
      `Dev sync failed: ${result.error?.message ?? 'Unknown error'}`,
    );
  }
}

export async function teardown() {
  // Tolerant: if setup failed before the sync (e.g. no server), there is
  // nothing to uninstall, and a teardown error would mask the real one.
  // The next setup() also uninstalls first, so nothing leaks.
  const uninstallResult = await appUninstall({ appPath: APP_PATH }).catch(
    () => null,
  );

  if (uninstallResult && !uninstallResult.success) {
    console.warn(
      `App uninstall during teardown failed: ${JSON.stringify(uninstallResult.error, null, 2)}`,
    );
  }
}
