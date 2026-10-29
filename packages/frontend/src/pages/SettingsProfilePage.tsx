import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Sparkles,
  AlertCircle,
  Check,
  Globe,
  Camera,
  Image as ImageIcon,
  Link as LinkIcon,
  Palette,
  User,
} from 'lucide-react';
import { Link, useRouter } from '../router/Router';
import { useAuth } from '../auth/AuthContext';
import { api } from '../api';
import { Avatar } from '../components/ui/Avatar';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import type { UserProfile } from '@socialgraph/shared';
import {
  PRESET_AVATARS,
  PRESET_BANNERS,
  AVATAR_CATEGORIES,
  type AvatarCategory,
} from '../components/profile/ProfileEditorModal';

export function SettingsProfilePage() {
  const { user, status, updateCurrentUser } = useAuth();
  const { navigate } = useRouter();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('/avatars/alex-dev.svg');
  const [bannerUrl, setBannerUrl] = useState('');
  const [website, setWebsite] = useState('');

  const [avatarMode, setAvatarMode] = useState<'presets' | 'custom'>('presets');
  const [activeCategory, setActiveCategory] = useState<AvatarCategory>('all');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    let active = true;
    async function loadProfile() {
      if (!user) {
        setLoading(false);
        return;
      }
      try {
        const data = await api.getUserProfile(user.username);
        if (active) {
          setProfile(data);
          setDisplayName(data.display_name || '');
          setBio(data.bio || '');
          setAvatarUrl(data.avatar_url || '/avatars/alex-dev.svg');
          setBannerUrl(data.banner_url || '');
          setWebsite(data.website || '');
        }
      } catch (err: any) {
        if (active) {
          setError('Failed to load profile details.');
        }
      } finally {
        if (active) setLoading(false);
      }
    }
    loadProfile();
    return () => {
      active = false;
    };
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = displayName.trim();
    if (!trimmedName) {
      setError('Display name is required and cannot be blank.');
      return;
    }
    if (trimmedName.length > 50) {
      setError('Display name cannot exceed 50 characters.');
      return;
    }
    if (bio.length > 250) {
      setError('Biography cannot exceed 250 characters.');
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuccess(false);

    try {
      const updated = await api.updateProfile({
        display_name: trimmedName,
        bio: bio.trim(),
        avatar_url: avatarUrl.trim(),
        banner_url: bannerUrl.trim() || '',
        website: website.trim() || '',
      });

      updateCurrentUser({
        display_name: updated.display_name,
        avatar_url: updated.avatar_url,
      });

      setProfile(updated);
      setSuccess(true);
    } catch (err: any) {
      setError(err?.detail || err?.message || 'Failed to update profile. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (status === 'unauthenticated' || (!loading && !user)) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="bg-surface-card rounded-3xl border border-border p-8 shadow-xs">
          <AlertCircle size={32} className="text-amber-500 mx-auto mb-3" />
          <h2 className="text-xl font-bold text-text-primary mb-2">Sign In Required</h2>
          <p className="text-xs text-text-muted mb-6">
            You must be signed in to access profile and account settings.
          </p>
          <Button variant="primary" size="sm" onClick={() => navigate('/login')}>
            Sign In to Continue
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16 px-4">
      {/* Header Breadcrumbs */}
      <div className="space-y-3 pb-6 border-b border-border">
        <div className="flex items-center gap-2 text-xs font-semibold text-text-muted uppercase tracking-wider">
          <Link to="/" className="hover:text-primary transition-colors flex items-center gap-1">
            <ArrowLeft size={14} /> Back to Home
          </Link>
          <span>/</span>
          <span>Settings</span>
          <span>/</span>
          <span className="text-primary font-bold">Profile &amp; Account</span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-text-primary">
              Account Settings
            </h1>
            <p className="mt-1 text-sm text-text-muted">
              Manage your public social identity, bio, avatar, and engineering profile attributes.
            </p>
          </div>
        </div>
      </div>

      {/* Settings Sub-Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-border">
        <Link
          to="/settings/profile"
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold border-b-2 border-primary text-primary transition-colors cursor-pointer"
        >
          <User size={15} className="shrink-0" />
          <span>Profile &amp; Identity</span>
        </Link>
        <Link
          to="/settings/appearance"
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold border-b-2 border-transparent text-text-muted hover:text-text-primary transition-colors cursor-pointer"
        >
          <Palette size={15} className="shrink-0" />
          <span>Appearance &amp; Themes</span>
        </Link>
      </div>

      {/* Profile Form Card */}
      <div className="bg-surface-card rounded-3xl border border-border p-6 sm:p-8 shadow-xs">
        {error && (
          <div
            role="alert"
            data-testid="settings-profile-error"
            className="flex items-start gap-2.5 p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 text-xs text-rose-700 dark:text-rose-300 mb-6"
          >
            <AlertCircle size={16} className="shrink-0 text-rose-500 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div
            role="status"
            data-testid="settings-profile-success"
            className="flex items-start gap-2.5 p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/40 text-xs text-emerald-700 dark:text-emerald-300 mb-6"
          >
            <Check size={16} className="shrink-0 text-emerald-500 mt-0.5" />
            <span>Your profile changes have been safely committed to the social graph!</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Banner Section */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-text-primary uppercase tracking-wider">
              Profile Banner
            </label>
            <div
              className="w-full h-32 sm:h-36 rounded-2xl overflow-hidden relative border border-border bg-gradient-to-r from-neutral-900/50 via-neutral-950/50 to-neutral-900/50 flex items-center justify-center"
              style={{
                backgroundImage: bannerUrl ? `url(${bannerUrl})` : undefined,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            >
              {!bannerUrl && (
                <span className="text-xs text-text-muted flex items-center gap-1.5 bg-black/40 px-3 py-1.5 rounded-xl backdrop-blur-xs">
                  <ImageIcon size={14} /> Default subtle gradient banner
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[11px] text-text-muted font-medium mr-1">Presets:</span>
              {PRESET_BANNERS.map((b) => (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => setBannerUrl(b.url)}
                  className={`text-[11px] px-2.5 py-1 rounded-lg border transition-colors cursor-pointer ${
                    bannerUrl === b.url
                      ? 'border-primary bg-primary/10 text-primary font-semibold'
                      : 'border-border text-text-secondary hover:bg-surface-subtle'
                  }`}
                >
                  {b.label}
                </button>
              ))}
              {bannerUrl && (
                <button
                  type="button"
                  onClick={() => setBannerUrl('')}
                  className="text-[11px] px-2 py-1 rounded-lg text-text-muted hover:text-rose-500 transition-colors cursor-pointer"
                >
                  Clear Banner
                </button>
              )}
            </div>

            <Input
              id="settings-banner-url"
              label="Banner Image URL"
              placeholder="https://images.unsplash.com/..."
              value={bannerUrl}
              onChange={(e) => setBannerUrl(e.target.value)}
              leftIcon={<LinkIcon size={14} />}
            />
          </div>

          {/* Avatar Section */}
          <div className="space-y-3 pt-3 border-t border-border/60">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-text-primary uppercase tracking-wider">
                Avatar Selection
              </label>
              <div className="flex items-center gap-1 text-xs">
                <button
                  type="button"
                  onClick={() => setAvatarMode('presets')}
                  className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                    avatarMode === 'presets'
                      ? 'bg-surface-subtle text-text-primary font-bold'
                      : 'text-text-muted hover:text-text-primary'
                  }`}
                >
                  Vector Presets
                </button>
                <button
                  type="button"
                  onClick={() => setAvatarMode('custom')}
                  className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                    avatarMode === 'custom'
                      ? 'bg-surface-subtle text-text-primary font-bold'
                      : 'text-text-muted hover:text-text-primary'
                  }`}
                >
                  Custom URL
                </button>
              </div>
            </div>

            <div className="flex items-center gap-4 p-3.5 rounded-2xl bg-surface-subtle/50 border border-border">
              <Avatar src={avatarUrl} alt={displayName || 'Avatar'} size="xl" className="ring-2 ring-primary/30" />
              <div className="space-y-1">
                <p className="text-xs font-bold text-text-primary">Current Avatar Preview</p>
                <p className="text-[11px] text-text-muted font-mono truncate max-w-sm">{avatarUrl}</p>
              </div>
            </div>

            {avatarMode === 'presets' ? (
              <div className="space-y-3">
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none" role="tablist" aria-label="Avatar Categories">
                  {AVATAR_CATEGORIES.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      role="tab"
                      aria-selected={activeCategory === cat.id}
                      onClick={() => setActiveCategory(cat.id)}
                      className={`text-xs px-2.5 py-1 rounded-full whitespace-nowrap transition-colors cursor-pointer shrink-0 ${
                        activeCategory === cat.id
                          ? 'bg-primary text-white font-semibold shadow-xs'
                          : 'bg-surface-subtle text-text-muted hover:text-text-primary hover:bg-border/50 border border-border/60'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
                <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2 pt-1" data-testid="settings-avatar-presets">
                  {(activeCategory === 'all'
                    ? PRESET_AVATARS
                    : PRESET_AVATARS.filter((av) => av.category === activeCategory)
                  ).map((av) => (
                    <button
                      key={av.id}
                      type="button"
                      onClick={() => setAvatarUrl(av.url)}
                      title={av.name}
                      aria-label={`Select ${av.name} avatar`}
                      className={`p-1.5 rounded-2xl border transition-all cursor-pointer flex flex-col items-center gap-1 ${
                        avatarUrl === av.url
                          ? 'border-primary ring-2 ring-primary/40 bg-primary/10 shadow-xs'
                          : 'border-border/60 hover:border-border hover:bg-surface-subtle bg-surface-card'
                      }`}
                    >
                      <img src={av.url} alt={av.name} className="w-10 h-10 rounded-xl object-contain" />
                      <span className="text-[9px] text-text-muted truncate max-w-full px-0.5">{av.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <Input
                id="settings-avatar-url"
                label="Custom Avatar URL"
                placeholder="https://example.com/avatar.png or /avatars/..."
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                leftIcon={<Camera size={14} />}
              />
            )}
          </div>

          {/* Form Fields: Display Name, Username, Bio, Website */}
          <div className="space-y-4 pt-3 border-t border-border/60">
            <Input
              id="settings-display-name"
              label="Display Name"
              placeholder="Your full name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              maxLength={50}
              required
              helperText={`${displayName.length} / 50 characters`}
            />

            <div>
              <label className="block text-xs font-semibold text-text-primary uppercase tracking-wider mb-1.5">
                Username (System Identity)
              </label>
              <div className="flex items-center px-3.5 py-2.5 rounded-xl bg-surface-subtle border border-border text-text-muted text-sm font-mono">
                @{user?.username || profile?.username}
              </div>
              <p className="text-[11px] text-text-muted mt-1">
                Your username anchors immutable relationships across followers, posts, and mentions.
              </p>
            </div>

            <div>
              <label
                htmlFor="settings-bio"
                className="block text-xs font-semibold text-text-primary uppercase tracking-wider mb-1.5"
              >
                Biography
              </label>
              <textarea
                id="settings-bio"
                rows={3}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                maxLength={250}
                placeholder="Describe your engineering focus, distributed systems experience, or side projects..."
                className="w-full text-sm bg-surface-card text-text-primary placeholder:text-text-muted border border-border rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all resize-none"
              />
              <p className="text-[11px] text-text-muted text-right mt-1">
                {bio.length} / 250 characters
              </p>
            </div>

            <Input
              id="settings-website"
              label="Website or Portfolio URL"
              type="url"
              placeholder="https://github.com/..."
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              leftIcon={<Globe size={14} />}
            />
          </div>

          {/* Action Row */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => navigate(`/u/${user?.username}`)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={submitting}
              leftIcon={submitting ? undefined : <Sparkles size={14} />}
              className="font-semibold px-6 shadow-xs"
            >
              {submitting ? 'Saving Profile...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
export default SettingsProfilePage;
