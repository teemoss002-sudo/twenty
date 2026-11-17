import { describe, expect, it } from 'vitest';

// Subject under test: env resolution shared by every JobFlow logic function.
// Current servers inject only the TWENTY_-prefixed names; reading the old
// unprefixed ones silently broke the post-install relabel, so the preferred
// names and their order are pinned here.

import { resolveApiAccess } from './api-access';

describe('resolveApiAccess', () => {
  it('reads the TWENTY_-prefixed names the server injects', () => {
    expect(
      resolveApiAccess({
        TWENTY_API_URL: 'https://crm.example.com',
        TWENTY_APP_ACCESS_TOKEN: 'install-token',
      }),
    ).toEqual({ apiUrl: 'https://crm.example.com', accessToken: 'install-token' });
  });

  it('prefers the application token so the function role applies', () => {
    expect(
      resolveApiAccess({
        TWENTY_API_URL: 'https://crm.example.com/',
        TWENTY_APP_ACCESS_TOKEN: 'person-token',
        TWENTY_APP_APPLICATION_ACCESS_TOKEN: 'app-token',
      }),
    ).toEqual({ apiUrl: 'https://crm.example.com', accessToken: 'app-token' });
  });

  it('falls back to the person-scoped token, then the pre-TWENTY_ names', () => {
    expect(
      resolveApiAccess({
        TWENTY_API_URL: 'https://crm.example.com',
        TWENTY_APP_ACCESS_TOKEN: 'person-token',
      }).accessToken,
    ).toBe('person-token');
    expect(
      resolveApiAccess({ API_URL: 'https://old.example.com', APP_ACCESS_TOKEN: 'old' }),
    ).toEqual({ apiUrl: 'https://old.example.com', accessToken: 'old' });
  });

  it('fails loudly when nothing is injected', () => {
    expect(() => resolveApiAccess({})).toThrow(/not injected/);
  });
});
