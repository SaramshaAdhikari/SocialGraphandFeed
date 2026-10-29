import { describe, it, expect, beforeEach } from 'vitest';
import { renderToString } from 'react-dom/server';
import { NotificationBell } from '../components/notifications/NotificationBell';
import { NotificationsPage } from '../pages/NotificationsPage';
import { RouterProvider } from '../router/Router';
import { ThemeProvider } from '../theme/ThemeContext';
import { AuthProvider, type AuthUser } from '../auth/AuthContext';
import { MockAdapter } from '../api/mock/MockAdapter';

const testAuthUser: AuthUser = {
  id: 'usr_dev_elena',
  username: 'elena_eng',
  display_name: 'Elena Rostova',
  avatar_url: '/avatars/anime-cyberpunk.svg',
  role: 'user',
};

function renderWithProviders(ui: React.ReactElement, initialPath = '/') {
  return renderToString(
    <AuthProvider initialUser={testAuthUser}>
      <ThemeProvider>
        <RouterProvider initialPath={initialPath}>{ui}</RouterProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}

describe('Phase E1: Notifications & Activity Center', () => {
  let mockApi: MockAdapter;

  beforeEach(() => {
    mockApi = new MockAdapter({ simulatedLatencyMs: 0 });
  });

  it('renders NotificationBell with accessible bell button and aria label', () => {
    const html = renderWithProviders(<NotificationBell />);
    expect(html).toContain('data-testid="notification-bell-button"');
    expect(html).toContain('Notifications');
  });

  it('renders dedicated NotificationsPage with Activity header and filter controls', () => {
    const html = renderWithProviders(<NotificationsPage />, '/notifications');
    expect(html).toContain('data-testid="notifications-page"');
    expect(html).toContain('Activity &amp; Notifications');
    expect(html).toContain('All Activity');
    expect(html).toContain('Unread');
  });

  it('MockAdapter returns seeded notifications and manages unread counts', async () => {
    const initialCount = await mockApi.getUnreadNotificationCount();
    expect(initialCount).toBe(2);

    const notifications = await mockApi.getNotifications();
    expect(notifications.success).toBe(true);
    expect(notifications.data.length).toBe(2);

    // Mark single notification as read
    const markRes = await mockApi.markNotificationAsRead('notif_1');
    expect(markRes.success).toBe(true);
    expect(markRes.notification.read).toBe(true);

    const countAfterOne = await mockApi.getUnreadNotificationCount();
    expect(countAfterOne).toBe(1);

    // Mark all as read
    const markAllRes = await mockApi.markAllNotificationsAsRead();
    expect(markAllRes.success).toBe(true);
    expect(markAllRes.updated_count).toBe(1);

    const finalCount = await mockApi.getUnreadNotificationCount();
    expect(finalCount).toBe(0);
  });
});
