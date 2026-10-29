import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Send,
  MessageSquare,
  Search,
  ArrowLeft,
  Check,
  CheckCheck,
  AlertCircle,
  PlusCircle,
  X,
  ExternalLink,
  Trash2,
} from 'lucide-react';
import { Link, useRouter } from '../router/Router';
import { useAuth } from '../auth/AuthContext';
import { api } from '../api';
import { Avatar, Button } from '../components/ui';
import type { ConversationSummary, DirectMessage } from '@socialgraph/shared';

function formatRelativeTime(isoString: string): string {
  try {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHrs = Math.floor(diffMin / 60);
    const diffDays = Math.floor(diffHrs / 24);

    if (diffSec < 60) return 'Just now';
    if (diffMin < 60) return `${diffMin}m`;
    if (diffHrs < 24) return `${diffHrs}h`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d`;
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  } catch {
    return '';
  }
}

export function MessagesPage() {
  const { user } = useAuth();
  const { currentPath, navigate, params } = useRouter();

  // Route matches /messages or /messages/:conversationId
  const conversationIdFromUrl = params.conversationId || currentPath.split('/messages/')[1] || null;

  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [convsError, setConvsError] = useState<string | null>(null);

  const [activeConvId, setActiveConvId] = useState<string | null>(conversationIdFromUrl);
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [msgsError, setMsgsError] = useState<string | null>(null);

  const [composerText, setComposerText] = useState('');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);

  const [searchFilter, setSearchFilter] = useState('');

  // New message modal state
  const [newModalOpen, setNewModalOpen] = useState(false);
  const [newUsernameInput, setNewUsernameInput] = useState('');
  const [newStarting, setNewStarting] = useState(false);
  const [newError, setNewError] = useState<string | null>(null);

  // Conversation deletion modal state
  const [convToDelete, setConvToDelete] = useState<ConversationSummary | null>(null);
  const [deletingConv, setDeletingConv] = useState(false);
  const [deleteConvError, setDeleteConvError] = useState<string | null>(null);

  // Message deletion modal state
  const [messageToDelete, setMessageToDelete] = useState<DirectMessage | null>(null);
  const [deletingMsg, setDeletingMsg] = useState(false);
  const [deleteMsgError, setDeleteMsgError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Sync route param with active conversation ID
  useEffect(() => {
    if (conversationIdFromUrl) {
      setActiveConvId(conversationIdFromUrl);
    }
  }, [conversationIdFromUrl]);

  // Load conversations list with unmount protection
  useEffect(() => {
    let mounted = true;
    const run = async () => {
      try {
        setLoadingConvs(true);
        setConvsError(null);
        const res = await api.getConversations(null, 50);
        if (!mounted) return;
        setConversations(res.data);

        if (!activeConvId && res.data.length > 0 && window.innerWidth >= 768) {
          setActiveConvId(res.data[0].id);
          navigate(`/messages/${res.data[0].id}`, { replace: true });
        }
      } catch (err: any) {
        if (!mounted) return;
        setConvsError(err?.detail || err?.message || 'Failed to load conversations.');
      } finally {
        if (mounted) setLoadingConvs(false);
      }
    };
    void run();
    return () => {
      mounted = false;
    };
  }, []);

  const loadConversations = async () => {
    try {
      setLoadingConvs(true);
      setConvsError(null);
      const res = await api.getConversations(null, 50);
      setConversations(res.data);
    } catch (err: any) {
      setConvsError(err?.detail || err?.message || 'Failed to load conversations.');
    } finally {
      setLoadingConvs(false);
    }
  };

  // Find active conversation object
  const activeConversation = useMemo(() => {
    return conversations.find((c) => c.id === activeConvId) || null;
  }, [conversations, activeConvId]);

  // Load message history when active conversation changes
  useEffect(() => {
    if (!activeConvId) {
      setMessages([]);
      return;
    }

    let active = true;
    setLoadingMsgs(true);
    setMsgsError(null);
    setSendError(null);

    api
      .getMessages(activeConvId, null, 100)
      .then((res) => {
        if (!active) return;
        setMessages(res.data);

        // Mark conversation as read if it has unread messages
        const target = conversations.find((c) => c.id === activeConvId);
        if (target && target.unread_count > 0) {
          void api.markConversationAsRead(activeConvId);
          setConversations((prev) =>
            prev.map((c) => (c.id === activeConvId ? { ...c, unread_count: 0 } : c))
          );
        }
      })
      .catch((err: any) => {
        if (!active) return;
        setMsgsError(err?.detail || err?.message || 'Could not load conversation messages.');
      })
      .finally(() => {
        if (active) setLoadingMsgs(false);
      });

    return () => {
      active = false;
    };
  }, [activeConvId]);

  // Auto-scroll to bottom of messages container
  useEffect(() => {
    if (messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, loadingMsgs]);

  // Handle Real-time SSE events for incoming direct messages and read receipts
  useEffect(() => {
    if (!user) return;
    const handleStorageEvent = (e: any) => {
      const type = e?.detail?.type;
      if (type === 'message.created') {
        const payload = e.detail;
        const incoming = payload.message;
        const isFromOther = incoming.sender_id !== user.id;

        if (activeConvId && payload.conversation_id === activeConvId) {
          setMessages((prev) => {
            if (prev.some((m) => m.id === incoming.id)) return prev;
            return [...prev, incoming];
          });
          if (isFromOther) {
            void api.markConversationAsRead(activeConvId);
          }
        }

        setConversations((prev) => {
          const index = prev.findIndex((c) => c.id === payload.conversation_id);
          if (index !== -1) {
            const updated = {
              ...prev[index],
              last_message: incoming,
              updated_at: incoming.created_at,
              unread_count:
                payload.conversation_id === activeConvId || !isFromOther
                  ? 0
                  : (prev[index].unread_count || 0) + 1,
            };
            const copy = [...prev];
            copy.splice(index, 1);
            return [updated, ...copy];
          }
          void loadConversations();
          return prev;
        });
      } else if (type === 'message.read') {
        const payload = e.detail;
        if (activeConvId && payload.conversation_id === activeConvId) {
          setMessages((prev) =>
            prev.map((m) => (m.sender_id === user.id ? { ...m, is_read: true } : m))
          );
        }
        setConversations((prev) =>
          prev.map((c) => {
            if (c.id === payload.conversation_id && c.last_message?.sender_id === user.id) {
              return {
                ...c,
                last_message: { ...c.last_message, is_read: true },
              };
            }
            return c;
          })
        );
      } else if (type === 'message.deleted') {
        const payload = e.detail;
        if (activeConvId && payload.conversation_id === activeConvId) {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === payload.message_id
                ? { ...m, is_deleted: true, content: 'This message was deleted' }
                : m
            )
          );
        }
        setConversations((prev) =>
          prev.map((c) => {
            if (c.id === payload.conversation_id && c.last_message && c.last_message.id === payload.message_id) {
              return {
                ...c,
                last_message: {
                  ...c.last_message,
                  is_deleted: true,
                  content: 'This message was deleted',
                },
              };
            }
            return c;
          })
        );
      } else if (type === 'conversation.deleted') {
        const payload = e.detail;
        setConversations((prev) => prev.filter((c) => c.id !== payload.conversation_id));
        if (activeConvId === payload.conversation_id) {
          setActiveConvId(null);
          navigate('/messages');
        }
      }
    };

    window.addEventListener('socialgraph:realtime' as any, handleStorageEvent);
    return () => {
      window.removeEventListener('socialgraph:realtime' as any, handleStorageEvent);
    };
  }, [activeConvId, user]);

  // Filter conversations by search query
  const filteredConversations = useMemo(() => {
    if (!searchFilter.trim()) return conversations;
    const q = searchFilter.toLowerCase().trim();
    return conversations.filter((c) => {
      const other = c.other_participant;
      if (!other) return false;
      return (
        other.display_name.toLowerCase().includes(q) ||
        other.username.toLowerCase().includes(q) ||
        (c.last_message?.content || '').toLowerCase().includes(q)
      );
    });
  }, [conversations, searchFilter]);

  // Send a message
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!activeConvId) return;

    const trimmed = composerText.trim();
    if (!trimmed || sending) return;

    setSending(true);
    setSendError(null);

    try {
      const sentMsg = await api.sendMessage(activeConvId, trimmed);
      setMessages((prev) => [...prev, sentMsg]);
      setComposerText('');

      // Update last message in conversation list
      setConversations((prev) => {
        const index = prev.findIndex((c) => c.id === activeConvId);
        if (index === -1) return prev;
        const updated = {
          ...prev[index],
          last_message: sentMsg,
          updated_at: sentMsg.created_at,
        };
        const rest = [...prev];
        rest.splice(index, 1);
        return [updated, ...rest];
      });

      // Refocus textarea
      textareaRef.current?.focus();
    } catch (err: any) {
      setSendError(err?.detail || err?.message || 'Failed to send message. Please try again.');
    } finally {
      setSending(false);
    }
  };

  // Keyboard shortcut: Enter to send, Shift+Enter for newline
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void handleSendMessage();
    }
  };

  // Select conversation
  const handleSelectConversation = (conv: ConversationSummary) => {
    setActiveConvId(conv.id);
    navigate(`/messages/${conv.id}`);
  };

  // Start new conversation by username
  const handleStartNewConversation = async (e: React.FormEvent) => {
    e.preventDefault();
    const handle = newUsernameInput.trim().replace(/^@/, '');
    if (!handle) {
      setNewError('Please enter a creator username.');
      return;
    }

    setNewStarting(true);
    setNewError(null);

    try {
      const targetUser = await api.getUserProfile(handle);
      if (user && targetUser.id === user.id) {
        setNewError('You cannot message yourself.');
        setNewStarting(false);
        return;
      }

      const conv = await api.getOrCreateConversation(targetUser.id);
      setNewModalOpen(false);
      setNewUsernameInput('');
      await loadConversations();
      setActiveConvId(conv.id);
      navigate(`/messages/${conv.id}`);
    } catch (err: any) {
      setNewError(err?.detail || err?.message || `User @${handle} was not found.`);
    } finally {
      setNewStarting(false);
    }
  };

  // Delete conversation confirmation
  const handleConfirmDeleteConversation = async () => {
    if (!convToDelete) return;
    setDeletingConv(true);
    setDeleteConvError(null);
    try {
      await api.deleteConversation(convToDelete.id);
      setConversations((prev) => prev.filter((c) => c.id !== convToDelete.id));
      if (activeConvId === convToDelete.id) {
        setActiveConvId(null);
        navigate('/messages');
      }
      setConvToDelete(null);
    } catch (err: any) {
      setDeleteConvError(err?.detail || err?.message || 'Failed to delete conversation.');
    } finally {
      setDeletingConv(false);
    }
  };

  // Delete message confirmation
  const handleConfirmDeleteMessage = async () => {
    if (!messageToDelete || !activeConvId) return;
    setDeletingMsg(true);
    setDeleteMsgError(null);
    try {
      await api.deleteMessage(activeConvId, messageToDelete.id);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === messageToDelete.id
            ? { ...m, is_deleted: true, content: 'This message was deleted' }
            : m
        )
      );
      setConversations((prev) =>
        prev.map((c) => {
          if (c.id === activeConvId && c.last_message && c.last_message.id === messageToDelete.id) {
            return {
              ...c,
              last_message: {
                ...c.last_message,
                is_deleted: true,
                content: 'This message was deleted',
              },
            };
          }
          return c;
        })
      );
      setMessageToDelete(null);
    } catch (err: any) {
      setDeleteMsgError(err?.detail || err?.message || 'Failed to delete message.');
    } finally {
      setDeletingMsg(false);
    }
  };

  return (
    <div
      data-testid="messages-page"
      className="w-full h-full flex flex-1 overflow-hidden bg-canvas transition-colors"
    >
      <div className="flex-1 flex overflow-hidden w-full h-full">
        {/* Left Pane: Conversation List */}
        <aside
          className={`w-full md:w-80 lg:w-[350px] xl:w-[380px] flex flex-col border-r border-border bg-canvas md:bg-surface-card/30 transition-all shrink-0 h-full overflow-hidden ${
            activeConvId ? 'hidden md:flex' : 'flex'
          }`}
          aria-label="Direct Conversations"
        >
          {/* Header */}
          <div className="h-16 px-4 border-b border-border flex items-center justify-between shrink-0 bg-canvas">
            <div>
              <h1 className="text-base font-bold text-text-primary tracking-tight flex items-center gap-2">
                <span>Direct Messages</span>
              </h1>
              <p className="text-xs text-text-muted mt-0.5">Direct conversations with creators</p>
            </div>
            <button
              type="button"
              data-testid="new-message-button"
              onClick={() => setNewModalOpen(true)}
              title="Start a new message"
              aria-label="Start a new conversation"
              className="p-2 rounded-xl text-text-primary hover:bg-black/[0.04] dark:hover:bg-white/[0.08] transition-colors cursor-pointer"
            >
              <PlusCircle size={20} />
            </button>
          </div>

          {/* Search / Filter Input */}
          <div className="p-3 border-b border-border/70 shrink-0 bg-canvas">
            <div className="relative flex items-center">
              <Search size={14} className="absolute left-3 text-text-muted pointer-events-none" />
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="w-full h-9 pl-9 pr-3 text-xs bg-surface-subtle border border-border/80 rounded-xl text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              />
              {searchFilter && (
                <button
                  type="button"
                  onClick={() => setSearchFilter('')}
                  aria-label="Clear conversation search"
                  className="absolute right-2.5 text-text-muted hover:text-text-primary p-0.5 cursor-pointer"
                >
                  <X size={13} />
                </button>
              )}
            </div>
          </div>

          {/* Conversation Items List */}
          <div className="flex-1 overflow-y-auto divide-y divide-border/30">
            {loadingConvs ? (
              <div className="p-8 text-center space-y-3">
                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-xs text-text-muted">Loading conversations...</p>
              </div>
            ) : convsError ? (
              <div className="p-6 text-center space-y-2 text-rose-500 text-xs">
                <AlertCircle size={18} className="mx-auto" />
                <p>{convsError}</p>
                <Button variant="secondary" size="sm" onClick={() => void loadConversations()}>
                  Retry
                </Button>
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="p-8 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-surface-subtle flex items-center justify-center mx-auto text-text-muted">
                  <MessageSquare size={22} />
                </div>
                <div>
                  <p className="text-xs font-semibold text-text-primary">
                    {searchFilter ? 'No matches found' : 'No conversations yet'}
                  </p>
                  <p className="text-[11px] text-text-muted mt-0.5">
                    {searchFilter
                      ? 'Try a different search term or handle.'
                      : 'Reach out to a fellow engineer to start a discussion.'}
                  </p>
                </div>
                {!searchFilter && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => setNewModalOpen(true)}
                    className="font-semibold text-xs"
                  >
                    Start a Chat
                  </Button>
                )}
              </div>
            ) : (
              filteredConversations.map((conv) => {
                const other = conv.other_participant;
                const isSelected = conv.id === activeConvId;
                const hasUnread = conv.unread_count > 0;

                return (
                  <button
                    key={conv.id}
                    type="button"
                    onClick={() => handleSelectConversation(conv)}
                    className={`w-full text-left p-3.5 transition-colors flex items-start gap-3 cursor-pointer group ${
                      isSelected
                        ? 'bg-black/[0.05] dark:bg-white/[0.08]'
                        : 'hover:bg-black/[0.03] dark:hover:bg-white/[0.04]'
                    }`}
                  >
                    <div className="relative shrink-0">
                      <Avatar
                        src={other?.avatar_url || '/avatars/alex-dev.svg'}
                        alt={other?.display_name || 'Creator'}
                        size="md"
                        className="w-11 h-11 ring-1 ring-border"
                      />
                      {other?.is_verified && (
                        <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-primary text-white text-[9px] flex items-center justify-center font-bold">
                          ✓
                        </span>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-xs font-bold text-text-primary truncate group-hover:text-primary transition-colors">
                          {other?.display_name || 'User'}
                        </span>
                        <span className="text-[10px] text-text-muted shrink-0">
                          {conv.last_message
                            ? formatRelativeTime(conv.last_message.created_at)
                            : formatRelativeTime(conv.updated_at)}
                        </span>
                      </div>

                      <p className="text-[11px] text-text-muted truncate mt-0.5">
                        @{other?.username || 'user'}
                      </p>

                      <div className="flex items-center justify-between gap-2 mt-1">
                        <p
                          className={`text-xs truncate ${
                            hasUnread
                              ? 'font-bold text-text-primary'
                              : 'text-text-muted font-normal'
                          }`}
                        >
                          {conv.last_message
                            ? conv.last_message.is_deleted || conv.last_message.content === 'This message was deleted'
                              ? 'This message was deleted'
                              : `${conv.last_message.sender_id === user?.id ? 'You: ' : ''}${
                                  conv.last_message.content
                                }`
                            : 'No messages yet'}
                        </p>

                        {hasUnread && (
                          <span
                            data-testid={`unread-badge-${conv.id}`}
                            className="shrink-0 px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-primary text-white leading-none shadow-xs"
                          >
                            {conv.unread_count}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </aside>

        {/* Right Pane: Conversation Stage */}
        <main
          className={`flex-1 flex flex-col bg-canvas overflow-hidden min-w-0 h-full ${
            !activeConvId ? 'hidden md:flex' : 'flex'
          }`}
          aria-label="Active Conversation Thread"
        >
          {activeConvId && activeConversation ? (
            <>
              {/* Active Conversation Header */}
              <div className="h-16 px-4 sm:px-6 border-b border-border flex items-center justify-between shrink-0 bg-canvas">
                <div className="flex items-center gap-3 min-w-0">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveConvId(null);
                      navigate('/messages');
                    }}
                    aria-label="Back to conversations list"
                    className="md:hidden p-1.5 -ml-1 text-text-muted hover:text-text-primary hover:bg-surface-subtle rounded-xl cursor-pointer shrink-0"
                  >
                    <ArrowLeft size={18} />
                  </button>

                  <div className="relative shrink-0">
                    <Avatar
                      src={activeConversation.other_participant?.avatar_url || '/avatars/alex-dev.svg'}
                      alt={activeConversation.other_participant?.display_name || 'Creator'}
                      size="md"
                      className="w-10 h-10 ring-1 ring-border"
                    />
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h2 className="text-sm font-bold text-text-primary truncate">
                        {activeConversation.other_participant?.display_name || 'Creator'}
                      </h2>
                      {activeConversation.other_participant?.is_verified && (
                        <span className="w-3.5 h-3.5 rounded-full bg-primary text-white text-[9px] flex items-center justify-center font-bold shrink-0">
                          ✓
                        </span>
                      )}
                    </div>
                    <Link
                      to={`/u/${activeConversation.other_participant?.username}`}
                      className="text-xs text-text-muted hover:text-primary transition-colors inline-flex items-center gap-1 font-mono truncate"
                    >
                      @{activeConversation.other_participant?.username}
                      <ExternalLink size={10} className="shrink-0" />
                    </Link>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Link
                    to={`/u/${activeConversation.other_participant?.username}`}
                    className="text-xs font-semibold px-3 py-1.5 rounded-xl border border-border text-text-secondary hover:text-text-primary hover:bg-surface-subtle transition-colors cursor-pointer"
                  >
                    View Profile
                  </Link>
                  <button
                    type="button"
                    data-testid="delete-conversation-btn"
                    onClick={() => setConvToDelete(activeConversation)}
                    title="Delete conversation"
                    aria-label="Delete conversation"
                    className="p-1.5 rounded-xl border border-border text-text-muted hover:text-rose-500 hover:border-rose-500/30 hover:bg-rose-500/10 transition-colors cursor-pointer"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>

              {/* Message History Feed */}
              <div
                data-testid="message-history"
                className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3 bg-canvas"
              >
                {loadingMsgs ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="w-7 h-7 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : msgsError ? (
                  <div className="p-6 text-center space-y-2 text-rose-500 text-xs">
                    <AlertCircle size={18} className="mx-auto" />
                    <p>{msgsError}</p>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        if (activeConvId) {
                          setLoadingMsgs(true);
                          api
                            .getMessages(activeConvId)
                            .then((res) => setMessages(res.data))
                            .finally(() => setLoadingMsgs(false));
                        }
                      }}
                    >
                      Retry
                    </Button>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center p-6 space-y-3">
                    <Avatar
                      src={activeConversation.other_participant?.avatar_url || '/avatars/alex-dev.svg'}
                      alt={activeConversation.other_participant?.display_name || 'Creator'}
                      size="xl"
                      className="w-16 h-16 ring-2 ring-primary/30"
                    />
                    <div>
                      <h3 className="text-sm font-bold text-text-primary">
                        Direct conversation with {activeConversation.other_participant?.display_name}
                      </h3>
                      <p className="text-xs text-text-muted max-w-sm mt-1">
                        Say hello, discuss architecture patterns, or share feedback on engineering posts.
                      </p>
                    </div>
                  </div>
                ) : (
                  messages.map((msg, idx) => {
                    const isMe = msg.sender_id === user?.id;
                    const prevMsg = idx > 0 ? messages[idx - 1] : null;
                    const isSequential = prevMsg && prevMsg.sender_id === msg.sender_id;
                    const isDeleted = msg.is_deleted || msg.content === 'This message was deleted';

                    return (
                      <div
                        key={msg.id}
                        data-testid={`message-item-${msg.id}`}
                        className={`group/msg flex flex-col ${isMe ? 'items-end' : 'items-start'} ${
                          isSequential ? 'mt-1' : 'mt-3.5'
                        }`}
                      >
                        <div
                          className={`flex items-end gap-2 max-w-[85%] sm:max-w-[75%] ${
                            isMe ? 'flex-row-reverse' : 'flex-row'
                          }`}
                        >
                          {!isMe && !isSequential && (
                            <Avatar
                              src={activeConversation.other_participant?.avatar_url || '/avatars/alex-dev.svg'}
                              alt={activeConversation.other_participant?.display_name || 'User'}
                              size="sm"
                              className="w-7 h-7 mb-0.5 shrink-0"
                            />
                          )}
                          {!isMe && isSequential && <div className="w-7 shrink-0" />}

                          {isDeleted ? (
                            <div
                              className="px-4 py-2.5 text-xs sm:text-sm italic rounded-2xl shadow-xs flex items-center gap-1.5 bg-surface-subtle text-text-muted border border-border/50"
                            >
                              <Trash2 size={13} className="shrink-0 opacity-60" />
                              <span>This message was deleted</span>
                            </div>
                          ) : (
                            <div
                              className={`px-4 py-2.5 text-xs sm:text-sm leading-relaxed whitespace-pre-wrap break-words shadow-xs ${
                                isMe
                                  ? 'bg-primary text-white rounded-2xl rounded-br-xs'
                                  : 'bg-black/[0.04] dark:bg-white/[0.08] text-text-primary border border-border/40 rounded-2xl rounded-bl-xs'
                              }`}
                            >
                              {msg.content}
                            </div>
                          )}

                          {/* Delete action button for message author (only if not deleted) */}
                          {isMe && !isDeleted && (
                            <button
                              type="button"
                              data-testid={`delete-message-btn-${msg.id}`}
                              onClick={() => setMessageToDelete(msg)}
                              title="Delete message"
                              aria-label="Delete message"
                              className="opacity-100 sm:opacity-0 sm:group-hover/msg:opacity-100 focus:opacity-100 transition-opacity p-1.5 text-text-muted hover:text-rose-500 rounded-lg hover:bg-surface-subtle shrink-0 cursor-pointer"
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>

                        {/* Timestamp & Read indicator */}
                        <div
                          className={`flex items-center gap-1 mt-0.5 px-1 text-[10px] text-text-muted ${
                            isMe ? 'mr-1' : 'ml-9'
                          }`}
                        >
                          <span>{formatRelativeTime(msg.created_at)}</span>
                          {isMe && !isDeleted && (
                            <span title={msg.is_read ? 'Read' : 'Delivered'}>
                              {msg.is_read ? (
                                <CheckCheck size={12} className="text-primary" />
                              ) : (
                                <Check size={12} />
                              )}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Composer Area */}
              <div className="p-3 sm:p-4 border-t border-border bg-canvas shrink-0">
                {sendError && (
                  <div
                    role="alert"
                    className="mb-2 p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 text-xs text-rose-600 dark:text-rose-300 flex items-center justify-between"
                  >
                    <span>{sendError}</span>
                    <button
                      type="button"
                      onClick={() => setSendError(null)}
                      className="text-rose-500 hover:text-rose-700 cursor-pointer"
                    >
                      <X size={13} />
                    </button>
                  </div>
                )}

                <form onSubmit={handleSendMessage} className="flex items-end gap-2">
                  <div className="relative flex-1">
                    <textarea
                      ref={textareaRef}
                      rows={1}
                      data-testid="message-input"
                      placeholder={`Message ${activeConversation.other_participant?.display_name || 'creator'}... (Enter to send)`}
                      value={composerText}
                      onChange={(e) => setComposerText(e.target.value)}
                      onKeyDown={handleKeyDown}
                      maxLength={2000}
                      disabled={sending}
                      className="w-full text-xs sm:text-sm bg-surface-subtle border border-border rounded-xl px-3.5 py-2.5 text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all resize-none max-h-32"
                    />
                  </div>

                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    data-testid="send-message-button"
                    disabled={!composerText.trim() || sending}
                    className="h-10 px-4 rounded-xl font-bold shrink-0 shadow-xs"
                    aria-label="Send message"
                  >
                    {sending ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Send size={15} />
                    )}
                  </Button>
                </form>
              </div>
            </>
          ) : (
            /* Empty State: No conversation selected */
            <div className="flex flex-col items-center justify-center h-full text-center p-8 space-y-4">
              <div className="w-16 h-16 rounded-3xl bg-black/[0.04] dark:bg-white/[0.06] text-text-primary flex items-center justify-center border border-border/50 shadow-xs">
                <MessageSquare size={30} className="text-text-muted" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-text-primary">
                  Select a Conversation
                </h2>
                <p className="text-xs text-text-muted max-w-sm mt-1">
                  Choose an existing conversation from the list or start a new direct message thread with a fellow creator.
                </p>
              </div>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setNewModalOpen(true)}
                className="font-semibold text-xs"
              >
                New Conversation
              </Button>
            </div>
          )}
        </main>
      </div>

      {/* New Conversation Modal */}
      {newModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="new-message-modal-title"
          data-testid="new-message-modal"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in"
        >
          <div className="relative w-full max-w-md bg-surface-card rounded-2xl sm:rounded-3xl border border-border shadow-2xl overflow-hidden p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h2 id="new-message-modal-title" className="text-base font-bold text-text-primary">
                New Direct Message
              </h2>
              <button
                type="button"
                onClick={() => setNewModalOpen(false)}
                className="p-1 rounded-lg text-text-muted hover:text-text-primary cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {newError && (
              <div
                role="alert"
                className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 text-xs text-rose-600 dark:text-rose-300 flex items-start gap-2"
              >
                <AlertCircle size={15} className="shrink-0 mt-0.5" />
                <span>{newError}</span>
              </div>
            )}

            <form onSubmit={handleStartNewConversation} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-text-primary uppercase tracking-wider mb-1.5">
                  Recipient Username
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-3 text-text-muted text-xs font-mono">@</span>
                  <input
                    type="text"
                    data-testid="new-recipient-username-input"
                    placeholder="lucas_t, elena_arch, etc."
                    value={newUsernameInput}
                    onChange={(e) => setNewUsernameInput(e.target.value)}
                    required
                    className="w-full h-10 pl-7 pr-3 text-sm bg-surface-subtle border border-border rounded-xl text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setNewModalOpen(false)}
                  disabled={newStarting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  data-testid="start-conversation-submit"
                  disabled={!newUsernameInput.trim() || newStarting}
                  className="font-semibold px-4"
                >
                  {newStarting ? 'Opening...' : 'Chat'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Delete Conversation Confirmation Modal */}
      {convToDelete && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-conv-modal-title"
          data-testid="delete-conversation-modal"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in"
        >
          <div className="relative w-full max-w-sm bg-surface-card rounded-2xl sm:rounded-3xl border border-border shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 id="delete-conv-modal-title" className="text-base font-bold text-text-primary flex items-center gap-2">
                <Trash2 size={18} className="text-rose-500" />
                Delete Conversation
              </h3>
              <button
                type="button"
                onClick={() => setConvToDelete(null)}
                className="p-1 rounded-lg text-text-muted hover:text-text-primary cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <p className="text-xs text-text-secondary leading-relaxed">
              Remove this conversation with{' '}
              <span className="font-bold text-text-primary">
                @{convToDelete.other_participant?.username}
              </span>{' '}
              from your inbox? Your chat history will be removed from your inbox view. The other participant will keep their copy.
            </p>

            {deleteConvError && (
              <div
                role="alert"
                className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 text-xs text-rose-600 dark:text-rose-300"
              >
                {deleteConvError}
              </div>
            )}

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setConvToDelete(null)}
                disabled={deletingConv}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="primary"
                size="sm"
                data-testid="confirm-delete-conversation-btn"
                onClick={handleConfirmDeleteConversation}
                disabled={deletingConv}
                className="bg-rose-600 hover:bg-rose-700 text-white font-semibold px-4"
              >
                {deletingConv ? 'Removing...' : 'Delete'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Message Confirmation Modal */}
      {messageToDelete && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-msg-modal-title"
          data-testid="delete-message-modal"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in"
        >
          <div className="relative w-full max-w-sm bg-surface-card rounded-2xl sm:rounded-3xl border border-border shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 id="delete-msg-modal-title" className="text-base font-bold text-text-primary flex items-center gap-2">
                <Trash2 size={18} className="text-rose-500" />
                Delete Message
              </h3>
              <button
                type="button"
                onClick={() => setMessageToDelete(null)}
                className="p-1 rounded-lg text-text-muted hover:text-text-primary cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <p className="text-xs text-text-secondary leading-relaxed">
              Delete this message for everyone in this chat? This cannot be undone.
            </p>

            {deleteMsgError && (
              <div
                role="alert"
                className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 text-xs text-rose-600 dark:text-rose-300"
              >
                {deleteMsgError}
              </div>
            )}

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setMessageToDelete(null)}
                disabled={deletingMsg}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="primary"
                size="sm"
                data-testid="confirm-delete-message-btn"
                onClick={handleConfirmDeleteMessage}
                disabled={deletingMsg}
                className="bg-rose-600 hover:bg-rose-700 text-white font-semibold px-4"
              >
                {deletingMsg ? 'Deleting...' : 'Delete'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MessagesPage;
