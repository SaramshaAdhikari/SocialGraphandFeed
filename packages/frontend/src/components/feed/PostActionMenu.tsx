import React, { useState, useRef, useEffect } from 'react';
import { MoreHorizontal, Edit2, Trash2, X } from 'lucide-react';
import type { PostCard } from '@socialgraph/shared';
import { useAuth } from '../../auth/AuthContext';
import { api } from '../../api';
import { Button } from '../ui/Button';

export interface PostActionMenuProps {
  post: PostCard;
  onPostUpdated?: (updated: PostCard) => void;
  onPostDeleted?: (postId: string) => void;
  className?: string;
}

export function PostActionMenu({
  post,
  onPostUpdated,
  onPostDeleted,
  className = '',
}: PostActionMenuProps) {
  const { user } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  const [editTitle, setEditTitle] = useState(
    'title' in post && post.title ? post.title : ''
  );
  const [editContent, setEditContent] = useState(
    post.post_type === 'discussion'
      ? post.content || ''
      : 'caption' in post && post.caption
      ? post.caption
      : ''
  );

  const [isSaving, setIsSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu on click outside
  useEffect(() => {
    if (!menuOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuOpen]);

  // Ownership authorization check
  const isOwner = user && (user.id === post.author.id || user.role === 'admin');
  if (!isOwner) return null;

  const hasExistingMedia =
    post.post_type === 'visual'
      ? !!post.media
      : Array.isArray(post.media) && post.media.length > 0;

  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    setDeleteError(null);
    try {
      await api.deletePost(post.id);
      setDeleteModalOpen(false);
      window.dispatchEvent(
        new CustomEvent('socialgraph:post_deleted', { detail: { postId: post.id } })
      );
      if (onPostDeleted) {
        onPostDeleted(post.id);
      }
    } catch (err: any) {
      setDeleteError(err?.detail || err?.message || 'Failed to delete post.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (post.post_type === 'discussion' && editTitle.trim().length < 3) {
      setEditError('Discussion title must be at least 3 characters.');
      return;
    }

    setIsSaving(true);
    setEditError(null);

    try {
      const payload: any = {
        title: editTitle.trim(),
      };
      if (post.post_type === 'discussion') {
        payload.content = editContent;
      } else {
        payload.caption = editContent;
      }

      const updated = await api.editPost(post.id, payload);
      setEditModalOpen(false);
      window.dispatchEvent(
        new CustomEvent('socialgraph:post_updated', { detail: { post: updated } })
      );
      if (onPostUpdated) {
        onPostUpdated(updated);
      }
    } catch (err: any) {
      setEditError(err?.detail || err?.message || 'Failed to save changes.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className={`relative ${className}`} ref={menuRef}>
      <button
        type="button"
        data-testid={`post-options-menu-${post.id}`}
        onClick={(e) => {
          e.stopPropagation();
          setMenuOpen(!menuOpen);
        }}
        aria-label="Post actions"
        aria-haspopup="true"
        aria-expanded={menuOpen}
        className="p-1 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-subtle transition-colors cursor-pointer"
      >
        <MoreHorizontal size={16} />
      </button>

      {/* Dropdown Menu */}
      {menuOpen && (
        <div
          role="menu"
          data-testid="post-dropdown-menu"
          className="absolute right-0 top-full mt-1 w-36 bg-surface-card border border-border rounded-xl shadow-lg z-20 py-1 overflow-hidden animate-in fade-in zoom-in-95 duration-100"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            role="menuitem"
            data-testid="edit-post-button"
            onClick={(e) => {
              e.stopPropagation();
              setMenuOpen(false);
              setEditModalOpen(true);
            }}
            className="w-full text-left px-3.5 py-2 text-xs font-medium text-text-primary hover:bg-surface-subtle flex items-center gap-2 cursor-pointer"
          >
            <Edit2 size={13} className="text-text-muted" />
            <span>Edit post</span>
          </button>
          <button
            type="button"
            role="menuitem"
            data-testid="delete-post-button"
            onClick={(e) => {
              e.stopPropagation();
              setMenuOpen(false);
              setDeleteModalOpen(true);
            }}
            className="w-full text-left px-3.5 py-2 text-xs font-medium text-rose-500 hover:bg-rose-500/10 flex items-center gap-2 cursor-pointer"
          >
            <Trash2 size={13} />
            <span>Delete post</span>
          </button>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby={`delete-post-title-${post.id}`}
          data-testid="delete-post-modal"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="relative w-full max-w-sm bg-surface-card rounded-2xl border border-border shadow-2xl p-5 space-y-4">
            <div className="space-y-1.5">
              <h3 id={`delete-post-title-${post.id}`} className="text-sm font-bold text-text-primary">
                Delete post?
              </h3>
              <p className="text-xs text-text-muted leading-relaxed">
                Are you sure you want to permanently delete this post? This action cannot be undone and all comments and interactions will be removed.
              </p>
            </div>

            {deleteError && (
              <p className="text-xs text-rose-500 font-medium">{deleteError}</p>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setDeleteModalOpen(false)}
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="danger"
                size="sm"
                data-testid="confirm-delete-button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="bg-rose-600 hover:bg-rose-700 text-white font-semibold"
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Post Modal */}
      {editModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby={`edit-post-title-${post.id}`}
          data-testid="edit-post-modal"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="relative w-full max-w-lg bg-surface-card rounded-2xl sm:rounded-3xl border border-border shadow-2xl overflow-hidden p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 id={`edit-post-title-${post.id}`} className="text-base font-bold text-text-primary">
                Edit Post
              </h3>
              <button
                type="button"
                onClick={() => setEditModalOpen(false)}
                className="p-1 rounded-lg text-text-muted hover:text-text-primary cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {editError && (
              <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 text-xs text-rose-600 dark:text-rose-300">
                {editError}
              </div>
            )}

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1">
                  Title
                </label>
                <input
                  type="text"
                  data-testid="edit-post-title"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full h-9 px-3 text-xs bg-surface-subtle border border-border rounded-xl text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
                  maxLength={post.post_type === 'visual' ? 150 : 300}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1">
                  {post.post_type === 'visual' ? 'Caption' : 'Content (Markdown)'}
                </label>
                <textarea
                  rows={5}
                  data-testid="edit-post-content"
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="w-full p-3 text-xs bg-surface-subtle border border-border rounded-xl text-text-primary focus:outline-none focus:ring-2 focus:ring-primary resize-y max-h-60"
                />
              </div>

              {hasExistingMedia && (
                <div className="text-[11px] text-text-muted flex items-center gap-1.5 bg-surface-subtle/50 p-2.5 rounded-xl border border-border/40">
                  <span className="text-primary font-bold">✓</span>
                  Existing media attachment will be preserved.
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setEditModalOpen(false)}
                  disabled={isSaving}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  data-testid="save-edit-button"
                  disabled={isSaving}
                  className="font-semibold"
                >
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default PostActionMenu;
