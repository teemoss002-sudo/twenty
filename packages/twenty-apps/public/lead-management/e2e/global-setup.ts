import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

import { appDevOnce } from 'twenty-sdk/cli';

// Playwright global setup for screenshot capture: syncs the app into the
// target workspace so the objects/views exist for the browser session.
// Unlike the integration-test setup there is no teardown uninstall — the
// CI instance is ephemeral and the browser needs the app installed.
//
// Requires TWENTY_API_URL + TWENTY_API_KEY (the spawn-twenty-app-dev-test
// action outputs in CI) and NODE_ENV=test so the SDK CLI reads the test
// config written below.

const APP_PATH = process.cwd();
const CONFIG_DIR = path.join(os.homedir(), '.twenty');

async function globalSetup() {
  const apiUrl = process.env.TWENTY_API_URL;
  const apiKey = process.env.TWENTY_API_KEY;

  if (!apiUrl || !apiKey) {
    throw new Error(
      'TWENTY_API_URL and TWENTY_API_KEY must be set (spawn a Twenty test instance first).',
    );
  }

  const health = await fetch(`${apiUrl}/healthz`).catch(() => null);

  if (!health?.ok) {
    throw new Error(`Twenty server is not reachable at ${apiUrl}.`);
  }

  fs.mkdirSync(CONFIG_DIR, { recursive: true });
  fs.writeFileSync(
    path.join(CONFIG_DIR, 'config.test.json'),
    JSON.stringify(
      {
        remotes: {
          local: { apiUrl, apiKey, accessToken: apiKey },
        },
        defaultRemote: 'local',
      },
      null,
      2,
    ),
  );

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

export default globalSetup;
