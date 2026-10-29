import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderToString } from 'react-dom/server';
import { MockAdapter } from '../api/mock/MockAdapter';
import { ApiClientError } from '../api/client';
import { mockUsers } from '../api/mock/fixtures';
import { LiveClient, setCsrfToken } from '../api/LiveClient';
import { ProfileEditorModal } from '../components/profile/ProfileEditorModal';
import { SettingsProfilePage } from '../pages/SettingsProfilePage';
import { RouterProvider } from '../router/Router';
import { ThemeProvider } from '../theme/ThemeContext';
import { AuthProvider, type AuthUser } from '../auth/AuthContext';

const testAuthUser: AuthUser = {
  id: mockUsers.usr_0.id,
  username: mockUsers.usr_0.username,
  display_name: mockUsers.usr_0.display_name,
  avatar_url: mockUsers.usr_0.avatar_url,
  role: 'user',
};

describe('Phase 2B.2 — Profile Editor & Identity Management', () => {
  let adapter: MockAdapter;

  beforeEach(() => {
    adapter = new MockAdapter({ simulatedLatencyMs: 0 });
  });

  describe('MockAdapter updateProfile', () => {
    it('successfully updates user profile with valid fields', async () => {
      const updated = await adapter.updateProfile({
        display_name: 'Alex Rivera Updated',
        bio: 'Updated bio for testing',
        avatar_url: '/avatars/code-terminal.svg',
        banner_url: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=1200',
        website: 'https://example.com/alex',
      });

      expect(updated.display_name).toBe('Alex Rivera Updated');
      expect(updated.bio).toBe('Updated bio for testing');
      expect(updated.avatar_url).toBe('/avatars/code-terminal.svg');
      expect(updated.banner_url).toBe('https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=1200');
      expect(updated.website).toBe('https://example.com/alex');

      // Preserves immutable identity
      expect(updated.id).toBe('usr_0');
      expect(updated.username).toBe('alex_dev');
      expect(updated.followers_count).toBeDefined();
    });

    it('rejects update with empty display name', async () => {
      await expect(
        adapter.updateProfile({
          display_name: '   ',
        })
      ).rejects.toThrow(ApiClientError);
    });

    it('rejects update with empty avatar_url', async () => {
      await expect(
        adapter.updateProfile({
          avatar_url: '   ',
        })
      ).rejects.toThrow(ApiClientError);
    });

    it('preserves omitted fields during partial updates', async () => {
      const original = await adapter.getUserProfile('alex_dev');
      const updated = await adapter.updateProfile({
        bio: 'Only changing bio',
      });

      expect(updated.bio).toBe('Only changing bio');
      expect(updated.display_name).toBe(original.display_name);
      expect(updated.avatar_url).toBe(original.avatar_url);
    });
  });

  describe('LiveClient updateProfile API contract', () => {
    it('sends PATCH request to /api/v1/users/me with JSON payload', async () => {
      const originalFetch = globalThis.fetch;
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          ...mockUsers.usr_0,
          display_name: 'Patched Name',
        }),
      });
      globalThis.fetch = fetchMock as typeof fetch;
      setCsrfToken('mock-csrf-token-123');

      try {
        const client = new LiveClient();
        const res = await client.updateProfile({
          display_name: 'Patched Name',
          bio: 'Patched bio',
        });

        expect(fetchMock).toHaveBeenCalledTimes(1);
        const [url, options] = fetchMock.mock.calls[0];
        expect(url).toBe('/api/v1/users/me');
        expect(options.method).toBe('PATCH');
        expect(JSON.parse(options.body)).toEqual({
          display_name: 'Patched Name',
          bio: 'Patched bio',
        });
        expect(res.display_name).toBe('Patched Name');
      } finally {
        setCsrfToken(undefined);
        globalThis.fetch = originalFetch;
      }
    });
  });

  describe('ProfileEditorModal UI Component', () => {
    it('renders the modal with current profile data, preset avatars, category tabs, and character counters', () => {
      const profile = mockUsers.usr_0;
      const html = renderToString(
        <ThemeProvider>
          <AuthProvider initialUser={testAuthUser}>
            <ProfileEditorModal
              isOpen={true}
              profile={profile}
              onClose={() => {}}
            />
          </AuthProvider>
        </ThemeProvider>
      );

      expect(html).toContain('Edit Profile');
      expect(html).toContain('Display Name');
      expect(html).toContain('Alex Rivera');
      expect(html).toContain('Profile Avatar');
      expect(html).toContain('Vector Presets');
      expect(html).toContain('Custom URL');
      // Category pills
      expect(html).toContain('All Avatars');
      expect(html).toContain('Abstract &amp; Geometric');
      expect(html).toContain('Anime &amp; Stylized');
      expect(html).toContain('Animals');
      expect(html).toContain('Cosmic &amp; Fantasy');
      expect(html).toContain('Dev &amp; Creative');
      expect(html).toContain('Minimal &amp; Monochrome');
      expect(html).toContain('Nature &amp; Landscapes');
      // Presets
      expect(html).toContain('/avatars/code-terminal.svg');
      expect(html).toContain('/avatars/abstract-prism.svg');
      expect(html).toContain('/avatars/anime-cyberpunk.svg');
      expect(html).toContain('/avatars/mascot-wolf.svg');
      // Profile banner
      expect(html).toContain('Profile Banner');
      expect(html).toContain('Custom Banner URL');
      // Bio & Website
      expect(html).toContain('Bio');
      expect(html).toContain('Website or Portfolio URL');
      expect(html).toContain('/ 250');
      expect(html).toContain('/ 50');
      // Sticky footer buttons
      expect(html).toContain('Cancel');
      expect(html).toContain('Save Profile');
    });

    it('does not render modal content when isOpen is false', () => {
      const profile = mockUsers.usr_0;
      const html = renderToString(
        <ThemeProvider>
          <AuthProvider initialUser={testAuthUser}>
            <ProfileEditorModal
              isOpen={false}
              profile={profile}
              onClose={() => {}}
            />
          </AuthProvider>
        </ThemeProvider>
      );

      expect(html).toBe('');
    });
  });

  describe('SettingsProfilePage Component', () => {
    it('renders settings navigation tabs and profile editor inputs', () => {
      const html = renderToString(
        <ThemeProvider>
          <AuthProvider initialUser={testAuthUser}>
            <RouterProvider initialPath="/settings/profile">
              <SettingsProfilePage />
            </RouterProvider>
          </AuthProvider>
        </ThemeProvider>
      );

      expect(html).toContain('Account Settings');
      expect(html).toContain('Profile &amp; Identity');
      expect(html).toContain('Appearance &amp; Themes');
      expect(html).toContain('Display Name');
      expect(html).toContain('Biography');
      expect(html).toContain('Website or Portfolio');
      expect(html).toContain('Avatar Selection');
      expect(html).toContain('Save Changes');
    });
  });
});
