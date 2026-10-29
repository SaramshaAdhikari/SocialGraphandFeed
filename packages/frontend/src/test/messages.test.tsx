import { describe, it, expect, beforeEach } from 'vitest';
import { renderToString } from 'react-dom/server';
import { MockAdapter } from '../api/mock/MockAdapter';
import { ApiClientError } from '../api/client';
import { mockUsers } from '../api/mock/fixtures';
import { MessagesPage } from '../pages/MessagesPage';
import { ProfileHeader } from '../components/profile/ProfileHeader';
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

describe('Phase 2B.3 — Direct Messaging', () => {
  let adapter: MockAdapter;

  beforeEach(() => {
    adapter = new MockAdapter({ simulatedLatencyMs: 0 });
  });

  describe('MockAdapter Direct Messaging Engine', () => {
    it('fetches existing conversations with summaries', async () => {
      const res = await adapter.getConversations();
      expect(Array.isArray(res.data)).toBe(true);
      expect(res.data.length).toBeGreaterThan(0);

      const first = res.data[0];
      expect(first.id).toBeDefined();
      expect(first.other_participant).toBeDefined();
      expect(first.other_participant?.id).not.toBe(testAuthUser.id);
      expect(first.last_message).toBeDefined();
    });

    it('fetches messages for a conversation in chronological order', async () => {
      const res = await adapter.getConversations();
      const convId = res.data[0].id;

      const msgRes = await adapter.getMessages(convId);
      expect(Array.isArray(msgRes.data)).toBe(true);
      expect(msgRes.data.length).toBeGreaterThan(0);

      for (let i = 1; i < msgRes.data.length; i++) {
        const prev = new Date(msgRes.data[i - 1].created_at).getTime();
        const curr = new Date(msgRes.data[i].created_at).getTime();
        expect(curr).toBeGreaterThanOrEqual(prev);
      }
    });

    it('sends a message and updates the conversation state', async () => {
      const res = await adapter.getConversations();
      const convId = res.data[0].id;

      const sent = await adapter.sendMessage(convId, 'Hello from automated test!');
      expect(sent.id).toBeDefined();
      expect(sent.conversation_id).toBe(convId);
      expect(sent.sender_id).toBe(testAuthUser.id);
      expect(sent.content).toBe('Hello from automated test!');

      // Verify conversation messages now include the sent message
      const msgRes = await adapter.getMessages(convId);
      const last = msgRes.data[msgRes.data.length - 1];
      expect(last.id).toBe(sent.id);
      expect(last.content).toBe('Hello from automated test!');
    });

    it('rejects sending empty or whitespace-only messages', async () => {
      const res = await adapter.getConversations();
      const convId = res.data[0].id;

      await expect(adapter.sendMessage(convId, '   ')).rejects.toThrow(ApiClientError);
    });

    it('marks conversation as read and reflects in unread count', async () => {
      const res = await adapter.getConversations();
      const convWithUnread = res.data.find((c) => c.unread_count > 0) || res.data[0];

      await adapter.markConversationAsRead(convWithUnread.id);
      const updatedRes = await adapter.getConversations();
      const found = updatedRes.data.find((c) => c.id === convWithUnread.id);
      expect(found?.unread_count).toBe(0);
    });

    it('creates or retrieves direct conversation idempotently', async () => {
      // Starting conversation with usr_3
      const c1 = await adapter.getOrCreateConversation('usr_3');
      expect(c1.id).toBeDefined();
      expect(c1.participant_ids).toContain('usr_3');
      expect(c1.participant_ids).toContain(testAuthUser.id);

      // Retrieving same conversation again should yield identical ID
      const c2 = await adapter.getOrCreateConversation('usr_3');
      expect(c2.id).toBe(c1.id);
    });

    it('rejects starting a conversation with oneself', async () => {
      await expect(adapter.getOrCreateConversation(testAuthUser.id)).rejects.toThrow(ApiClientError);
    });
  });

  describe('MessagesPage UI Component', () => {
    it('renders the messaging shell with conversations heading, search, and empty conversation pane', () => {
      const html = renderToString(
        <ThemeProvider>
          <AuthProvider initialUser={testAuthUser}>
            <RouterProvider initialPath="/messages">
              <MessagesPage />
            </RouterProvider>
          </AuthProvider>
        </ThemeProvider>
      );

      expect(html).toContain('Messages');
      expect(html).toContain('Search conversations...');
      expect(html).toContain('Select a Conversation');
      expect(html).toContain('New Conversation');
    });

    it('renders initial loading state for messages view prior to client hydration', () => {
      const html = renderToString(
        <ThemeProvider>
          <AuthProvider initialUser={testAuthUser}>
            <RouterProvider initialPath="/messages/conv_1">
              <MessagesPage />
            </RouterProvider>
          </AuthProvider>
        </ThemeProvider>
      );

      expect(html).toContain('Messages');
      expect(html).toContain('Loading conversations...');
    });
  });

  describe('ProfileHeader "Message" Action Integration', () => {
    it('shows the "Message" button when viewing another user profile', () => {
      const otherUser = mockUsers.usr_1;
      const html = renderToString(
        <ThemeProvider>
          <AuthProvider initialUser={testAuthUser}>
            <RouterProvider initialPath="/u/elena_design">
              <ProfileHeader
                profile={otherUser}
                isSelf={false}
                onToggleFollow={() => Promise.resolve()}
              />
            </RouterProvider>
          </AuthProvider>
        </ThemeProvider>
      );

      expect(html).toContain('Message');
      expect(html).not.toContain('Edit Profile');
    });

    it('does NOT show the "Message" button on own profile, showing "Edit Profile" instead', () => {
      const selfUser = mockUsers.usr_0;
      const html = renderToString(
        <ThemeProvider>
          <AuthProvider initialUser={testAuthUser}>
            <RouterProvider initialPath="/u/alex_dev">
              <ProfileHeader
                profile={selfUser}
                isSelf={true}
                onToggleFollow={() => Promise.resolve()}
              />
            </RouterProvider>
          </AuthProvider>
        </ThemeProvider>
      );

      expect(html).not.toContain('Message</button>');
      expect(html).toContain('Edit Profile');
    });
  });
});
