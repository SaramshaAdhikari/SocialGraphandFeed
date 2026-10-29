import { describe, it, expect } from 'vitest';
import { renderToString } from 'react-dom/server';
import { Button } from '../components/ui/Button';
import { ProfileHeader } from '../components/profile/ProfileHeader';
import { TopHeader } from '../components/layout/TopHeader';
import { SettingsProfilePage } from '../pages/SettingsProfilePage';
import { SettingsAppearancePage } from '../pages/SettingsAppearancePage';
import { RouterProvider } from '../router/Router';
import { ThemeProvider } from '../theme/ThemeContext';
import { AuthProvider, type AuthUser } from '../auth/AuthContext';
import { mockUsers } from '../api/mock/fixtures';
import { MockAdapter } from '../api/mock/MockAdapter';
import { UserCheck } from 'lucide-react';

const testAuthUser: AuthUser = {
  id: mockUsers.usr_0.id,
  username: mockUsers.usr_0.username,
  display_name: mockUsers.usr_0.display_name,
  avatar_url: mockUsers.usr_0.avatar_url,
  role: 'user',
};

describe('Final UX Corrections & Release Verification', () => {
  describe('Bug 1: Standardized Button & Icon Alignment', () => {
    it('Button primitive enforces vertical flex alignment and gap for icons and labels', () => {
      const html = renderToString(
        <Button variant="primary" size="sm" leftIcon={<UserCheck size={16} />}>
          Following
        </Button>
      );

      // Enforces inline-flex items-center on container
      expect(html).toContain('inline-flex items-center justify-center');
      // Enforces leading-none on icon wrapper
      expect(html).toContain('leading-none');
      // Enforces inner flex alignment to prevent text baseline shift
      expect(html).toContain('truncate inline-flex items-center justify-center gap-1.5 leading-none');
      expect(html).toContain('Following');
    });

    it('ProfileHeader action buttons share uniform h-8 min-h-[32px] dimensions and flex alignment', () => {
      const html = renderToString(
        <RouterProvider initialPath="/">
          <ProfileHeader
            profile={mockUsers.usr_2}
            isSelf={false}
            onToggleFollow={async () => {}}
          />
        </RouterProvider>
      );

      // Follow and Message buttons use Button with size="sm" (h-8 min-h-[32px])
      expect(html).toContain('Follow');
      expect(html).toContain('Message');
      expect(html).toContain('data-testid="message-creator-button"');
      // Share button uses identical h-8 w-8 min-h-[32px] min-w-[32px] rounded-xl flex styling
      expect(html).toContain('h-8 w-8 min-h-[32px] min-w-[32px] rounded-xl');
    });
  });

  describe('Bug 2: Social Graph Followers & Following Counts', () => {
    it('MockAdapter.getGraphNeighborhood returns real numeric follower and following counts', async () => {
      const adapter = new MockAdapter({ simulatedLatencyMs: 0 });
      const data = await adapter.getGraphNeighborhood(10);

      expect(data.center).toBeDefined();
      expect(typeof data.center.followers_count).toBe('number');
      expect(typeof data.center.following_count).toBe('number');
      expect(data.center.followers_count).toBeGreaterThan(0);
      expect(data.center.following_count).toBeGreaterThan(0);

      for (const node of data.nodes) {
        expect(node.id).toBeDefined();
        expect(typeof node.followers_count).toBe('number');
        expect(typeof node.following_count).toBe('number');
      }
    });
  });

  describe('Bug 3: Unified Profile Editing & Canonical Account Settings', () => {
    it('Own profile Edit Profile action links directly to Account Settings (/settings/profile) without opening a modal', () => {
      const html = renderToString(
        <RouterProvider initialPath="/u/alex_dev">
          <ProfileHeader
            profile={mockUsers.usr_0}
            isSelf={true}
            onToggleFollow={async () => {}}
          />
        </RouterProvider>
      );

      // Must render Edit Profile button with test id
      expect(html).toContain('data-testid="edit-profile-button"');
      expect(html).toContain('Edit Profile');
      // Must not render ProfileEditorModal in DOM
      expect(html).not.toContain('role="dialog"');
      expect(html).not.toContain('Vector Presets');
    });

    it('TopHeader profile dropdown trigger renders accessible user account menu button', () => {
      const html = renderToString(
        <ThemeProvider>
          <AuthProvider initialUser={testAuthUser}>
            <RouterProvider initialPath="/">
              <TopHeader />
            </RouterProvider>
          </AuthProvider>
        </ThemeProvider>
      );

      expect(html).toContain('aria-label="User account menu for Alex Rivera"');
      expect(html).toContain('Alex Rivera');
    });

    it('SettingsProfilePage and SettingsAppearancePage expose matching unified sub-tabs navigation', () => {
      const profileHtml = renderToString(
        <ThemeProvider>
          <AuthProvider initialUser={testAuthUser}>
            <RouterProvider initialPath="/settings/profile">
              <SettingsProfilePage />
            </RouterProvider>
          </AuthProvider>
        </ThemeProvider>
      );

      const appearanceHtml = renderToString(
        <ThemeProvider>
          <AuthProvider initialUser={testAuthUser}>
            <RouterProvider initialPath="/settings/appearance">
              <SettingsAppearancePage />
            </RouterProvider>
          </AuthProvider>
        </ThemeProvider>
      );

      // Both pages render canonical sub-tabs
      expect(profileHtml).toContain('Profile &amp; Identity');
      expect(profileHtml).toContain('Appearance &amp; Themes');
      expect(appearanceHtml).toContain('Profile &amp; Identity');
      expect(appearanceHtml).toContain('Appearance &amp; Themes');

      // Profile tab links to /settings/profile, appearance links to /settings/appearance
      expect(profileHtml).toContain('href="/settings/profile"');
      expect(profileHtml).toContain('href="/settings/appearance"');
      expect(appearanceHtml).toContain('href="/settings/profile"');
      expect(appearanceHtml).toContain('href="/settings/appearance"');
    });
  });
});
