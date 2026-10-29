import { describe, it, expect, beforeEach } from 'vitest';
import { renderToString } from 'react-dom/server';
import { MockAdapter } from '../api/mock/MockAdapter';
import { ApiClientError } from '../api/client';
import { mockUsers } from '../api/mock/fixtures';
import { MessagesPage } from '../pages/MessagesPage';
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

describe('Phase G — Advanced Messaging Management & Deletion', () => {
  let adapter: MockAdapter;

  beforeEach(() => {
    adapter = new MockAdapter({ simulatedLatencyMs: 0 });
  });

  describe('Message Deletion with Tombstone Semantics', () => {
    it('allows author to delete their own message, creating a tombstone', async () => {
      const convs = await adapter.getConversations();
      const convId = convs.data[0].id;

      // Send a new message as testAuthUser
      const sent = await adapter.sendMessage(convId, 'Test message to be deleted');
      expect(sent.is_deleted).toBeFalsy();

      // Delete the message
      const res = await adapter.deleteMessage(convId, sent.id);
      expect(res.is_deleted).toBe(true);
      expect(res.content).toBe('This message was deleted');

      // Verify message is now tombstoned
      const msgRes = await adapter.getMessages(convId);
      const target = msgRes.data.find((m) => m.id === sent.id);
      expect(target).toBeDefined();
      expect(target?.is_deleted).toBe(true);
      expect(target?.content).toBe('This message was deleted');
      expect(target?.deleted_at).toBeDefined();
    });

    it('rejects deletion attempt by non-author with 403 Forbidden', async () => {
      const convs = await adapter.getConversations();
      const convId = convs.data[0].id;

      // Find an incoming message from the other participant
      const msgRes = await adapter.getMessages(convId);
      const otherMsg = msgRes.data.find((m) => m.sender_id !== testAuthUser.id);
      expect(otherMsg).toBeDefined();

      if (otherMsg) {
        await expect(adapter.deleteMessage(convId, otherMsg.id)).rejects.toThrow(ApiClientError);
      }
    });

    it('updates conversation last_message to tombstone if deleted message was the latest', async () => {
      const convs = await adapter.getConversations();
      const convId = convs.data[0].id;

      const sent = await adapter.sendMessage(convId, 'Latest outgoing message');
      await adapter.deleteMessage(convId, sent.id);

      const updatedConvs = await adapter.getConversations();
      const targetConv = updatedConvs.data.find((c) => c.id === convId);
      expect(targetConv?.last_message?.id).toBe(sent.id);
      expect(targetConv?.last_message?.is_deleted).toBe(true);
      expect(targetConv?.last_message?.content).toBe('This message was deleted');
    });
  });

  describe('Conversation Deletion Semantics', () => {
    it('removes conversation from user inbox when deleted', async () => {
      const convs = await adapter.getConversations();
      const initialCount = convs.data.length;
      expect(initialCount).toBeGreaterThan(0);

      const targetId = convs.data[0].id;
      const res = await adapter.deleteConversation(targetId);
      expect(res.success).toBe(true);

      const updatedConvs = await adapter.getConversations();
      expect(updatedConvs.data.some((c) => c.id === targetId)).toBe(false);
      expect(updatedConvs.data.length).toBe(initialCount - 1);
    });

    it('restores conversation to inbox when a new message is sent to that participant', async () => {
      const convs = await adapter.getConversations();
      const target = convs.data[0];
      const otherId = target.other_participant!.id;

      // Delete the conversation
      await adapter.deleteConversation(target.id);
      let list = await adapter.getConversations();
      expect(list.data.some((c) => c.id === target.id)).toBe(false);

      // Re-open conversation
      const restored = await adapter.getOrCreateConversation(otherId);
      expect(restored.id).toBe(target.id);

      list = await adapter.getConversations();
      expect(list.data.some((c) => c.id === target.id)).toBe(true);
    });

    it('rejects deleting non-existent conversation with 404 Not Found', async () => {
      await expect(adapter.deleteConversation('non_existent_conv')).rejects.toThrow(ApiClientError);
    });
  });

  describe('MessagesPage UI Component Integration', () => {
    it('renders the messaging interface with conversation controls and structure', () => {
      const html = renderToString(
        <ThemeProvider>
          <AuthProvider initialUser={testAuthUser}>
            <RouterProvider initialPath="/messages">
              <MessagesPage />
            </RouterProvider>
          </AuthProvider>
        </ThemeProvider>
      );

      expect(html).toContain('Direct Messages');
      expect(html).toContain('Search conversations...');
      expect(html).toContain('Select a Conversation');
    });
  });
});
