import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Sparkles,
  AlertCircle,
  Check,
  Globe,
  Camera,
  Link as LinkIcon,
  Image as ImageIcon,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import type { UserProfile } from '@socialgraph/shared';
import { api } from '../../api';
import { useAuth } from '../../auth/AuthContext';
import { Avatar } from '../ui/Avatar';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

export interface ProfileEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfile;
  onProfileUpdated?: (updated: UserProfile) => void;
}

export type AvatarCategory =
  | 'all'
  | 'abstract'
  | 'anime'
  | 'animals'
  | 'fantasy'
  | 'developer'
  | 'minimal'
  | 'nature';

export interface AvatarPreset {
  id: string;
  name: string;
  url: string;
  category: Exclude<AvatarCategory, 'all'>;
}

export const AVATAR_CATEGORIES: { id: AvatarCategory; label: string }[] = [
  { id: 'all', label: 'All Avatars' },
  { id: 'abstract', label: 'Abstract & Geometric' },
  { id: 'anime', label: 'Anime & Stylized' },
  { id: 'animals', label: 'Animals' },
  { id: 'fantasy', label: 'Cosmic & Fantasy' },
  { id: 'developer', label: 'Dev & Creative' },
  { id: 'minimal', label: 'Minimal & Monochrome' },
  { id: 'nature', label: 'Nature & Landscapes' },
];

export const PRESET_AVATARS: AvatarPreset[] = [
  // 1. Abstract & Geometric
  { id: 'abstract-bauhaus', name: 'Bauhaus Shapes', url: '/avatars/abstract-bauhaus.svg', category: 'abstract' },
  { id: 'abstract-cyber', name: 'Cyber Grid', url: '/avatars/abstract-cyber.svg', category: 'abstract' },
  { id: 'abstract-prism', name: 'Prism Spectrum', url: '/avatars/abstract-prism.svg', category: 'abstract' },
  { id: 'abstract-fractal', name: 'Fractal Orbit', url: '/avatars/abstract-fractal.svg', category: 'abstract' },

  // 2. Anime & Stylized
  { id: 'anime-cyberpunk', name: 'Cyberpunk Visor', url: '/avatars/anime-cyberpunk.svg', category: 'anime' },
  { id: 'anime-hacker', name: 'Night Hacker', url: '/avatars/anime-hacker.svg', category: 'anime' },
  { id: 'anime-sorcerer', name: 'Arcane Sorcerer', url: '/avatars/anime-sorcerer.svg', category: 'anime' },
  { id: 'alex-dev', name: 'Alex Rivera', url: '/avatars/alex-dev.svg', category: 'anime' },
  { id: 'lucas-t', name: 'Lucas Thorne', url: '/avatars/lucas-t.svg', category: 'anime' },
  { id: 'elena-arch', name: 'Elena Rostova', url: '/avatars/elena-arch.svg', category: 'anime' },
  { id: 'sara-code', name: 'Sara Chen', url: '/avatars/sara-code.svg', category: 'anime' },
  { id: 'alec-m', name: 'Alec Mercer', url: '/avatars/alec-m.svg', category: 'anime' },

  // 3. Animals
  { id: 'mascot-cat', name: 'Calico Cat', url: '/avatars/mascot-cat.svg', category: 'animals' },
  { id: 'mascot-fox', name: 'Kitsune Fox', url: '/avatars/mascot-fox.svg', category: 'animals' },
  { id: 'mascot-wolf', name: 'Timber Wolf', url: '/avatars/mascot-wolf.svg', category: 'animals' },
  { id: 'mascot-rabbit', name: 'Moon Rabbit', url: '/avatars/mascot-rabbit.svg', category: 'animals' },
  { id: 'mascot-shiba', name: 'Shiba Inu', url: '/avatars/mascot-shiba.svg', category: 'animals' },
  { id: 'mascot-frog', name: 'Zen Frog', url: '/avatars/mascot-frog.svg', category: 'animals' },
  { id: 'mascot-owl', name: 'Night Owl', url: '/avatars/mascot-owl.svg', category: 'animals' },
  { id: 'mascot-panda', name: 'Red Panda', url: '/avatars/mascot-panda.svg', category: 'animals' },
  { id: 'mascot-raccoon', name: 'Bandit Raccoon', url: '/avatars/mascot-raccoon.svg', category: 'animals' },

  // 4. Cosmic & Fantasy
  { id: 'cosmic-nebula', name: 'Stellar Nebula', url: '/avatars/cosmic-nebula.svg', category: 'fantasy' },
  { id: 'cosmic-eclipse', name: 'Solar Eclipse', url: '/avatars/cosmic-eclipse.svg', category: 'fantasy' },
  { id: 'pixel-ghost', name: 'Pixel Phantom', url: '/avatars/pixel-ghost.svg', category: 'fantasy' },
  { id: 'pixel-potion', name: 'Mana Elixir', url: '/avatars/pixel-potion.svg', category: 'fantasy' },

  // 5. Dev & Creative
  { id: 'code-terminal', name: 'UNIX Terminal', url: '/avatars/code-terminal.svg', category: 'developer' },
  { id: 'pixel-gameboy', name: 'Retro Gameboy', url: '/avatars/pixel-gameboy.svg', category: 'developer' },
  { id: 'gear-synth', name: 'Modular Synth', url: '/avatars/gear-synth.svg', category: 'developer' },
  { id: 'gear-camera', name: 'Rangefinder', url: '/avatars/gear-camera.svg', category: 'developer' },
  { id: 'gear-keyboard', name: 'Mechanical Key', url: '/avatars/gear-keyboard.svg', category: 'developer' },
  { id: 'food-coffee', name: 'Pour Over V60', url: '/avatars/food-coffee.svg', category: 'developer' },
  { id: 'food-ramen', name: 'Midnight Ramen', url: '/avatars/food-ramen.svg', category: 'developer' },
  { id: 'gear-headphones', name: 'Studio Monitor', url: '/avatars/gear-headphones.svg', category: 'developer' },
  { id: 'gear-vinyl', name: 'Turntable', url: '/avatars/gear-vinyl.svg', category: 'developer' },
  { id: 'art-palette', name: 'Color Palette', url: '/avatars/art-palette.svg', category: 'developer' },
  { id: 'art-manga-pen', name: 'Manga G-Pen', url: '/avatars/art-manga-pen.svg', category: 'developer' },
  { id: 'gear-car', name: 'Touge Civic', url: '/avatars/gear-car.svg', category: 'developer' },
  { id: 'pixel-moth', name: 'Pixel Moth', url: '/avatars/pixel-moth.svg', category: 'developer' },

  // 6. Minimal & Monochrome
  { id: 'minimal-crest', name: 'Geometric Crest', url: '/avatars/minimal-crest.svg', category: 'minimal' },
  { id: 'minimal-zen', name: 'Zen Circle', url: '/avatars/minimal-zen.svg', category: 'minimal' },

  // 7. Nature & Landscapes
  { id: 'nature-mountain', name: 'Alpine Peaks', url: '/avatars/nature-mountain.svg', category: 'nature' },
  { id: 'nature-bonsai', name: 'Bonsai Pine', url: '/avatars/nature-bonsai.svg', category: 'nature' },
  { id: 'nature-monstera', name: 'Monstera Leaf', url: '/avatars/nature-monstera.svg', category: 'nature' },
  { id: 'nature-wave', name: 'Kanagawa Wave', url: '/avatars/nature-wave.svg', category: 'nature' },
  { id: 'nature-aurora', name: 'Nordic Aurora', url: '/avatars/nature-aurora.svg', category: 'nature' },
];

export const PRESET_BANNERS = [
  { id: 'cyber', label: 'Matrix Terminal', url: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=1200' },
  { id: 'brutalist', label: 'Concrete Geometry', url: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200' },
  { id: 'synth', label: 'Hardware Modular', url: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=1200' },
  { id: 'neon', label: 'Urban Reflections', url: 'https://images.unsplash.com/photo-1514565131-fce0801e5785?w=1200' },
  { id: 'design', label: 'Design Tokens', url: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=1200' },
];

export function ProfileEditorModal({
  isOpen,
  onClose,
  profile,
  onProfileUpdated,
}: ProfileEditorModalProps) {
  const { updateCurrentUser } = useAuth();
  const [displayName, setDisplayName] = useState(profile.display_name || '');
  const [bio, setBio] = useState(profile.bio || '');
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url || '/avatars/alex-dev.svg');
  const [bannerUrl, setBannerUrl] = useState(profile.banner_url || '');
  const [website, setWebsite] = useState(profile.website || '');
  const [avatarMode, setAvatarMode] = useState<'presets' | 'custom'>('presets');
  const [activeCategory, setActiveCategory] = useState<AvatarCategory>('all');
  const [customAvatarError, setCustomAvatarError] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [confirmDiscard, setConfirmDiscard] = useState(false);

  const modalRef = useRef<HTMLDivElement>(null);

  // Sync state when profile changes
  useEffect(() => {
    setDisplayName(profile.display_name || '');
    setBio(profile.bio || '');
    setAvatarUrl(profile.avatar_url || '/avatars/alex-dev.svg');
    setBannerUrl(profile.banner_url || '');
    setWebsite(profile.website || '');
    setError(null);
    setSuccess(false);
    setConfirmDiscard(false);
    setCustomAvatarError(false);

    // If initial avatar is not in preset list, switch mode to custom
    const isPreset = PRESET_AVATARS.some((p) => p.url === profile.avatar_url);
    if (!isPreset && profile.avatar_url && !profile.avatar_url.startsWith('/avatars/')) {
      setAvatarMode('custom');
    } else {
      setAvatarMode('presets');
    }
  }, [profile, isOpen]);

  // Track whether form is dirty
  const isDirty = useMemo(() => {
    return (
      displayName.trim() !== (profile.display_name || '').trim() ||
      bio.trim() !== (profile.bio || '').trim() ||
      avatarUrl.trim() !== (profile.avatar_url || '').trim() ||
      bannerUrl.trim() !== (profile.banner_url || '').trim() ||
      website.trim() !== (profile.website || '').trim()
    );
  }, [displayName, bio, avatarUrl, bannerUrl, website, profile]);

  // Handle request to close with unsaved changes confirmation
  const handleRequestClose = () => {
    if (submitting) return;
    if (isDirty && !confirmDiscard) {
      setConfirmDiscard(true);
      return;
    }
    setConfirmDiscard(false);
    onClose();
  };

  // Keyboard accessibility: Escape to close
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        handleRequestClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isDirty, confirmDiscard]);

  // Filtered avatar presets by category
  const filteredAvatars = useMemo(() => {
    if (activeCategory === 'all') return PRESET_AVATARS;
    return PRESET_AVATARS.filter((av) => av.category === activeCategory);
  }, [activeCategory]);

  const selectedPreset = useMemo(() => {
    return PRESET_AVATARS.find((av) => av.url === avatarUrl);
  }, [avatarUrl]);

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Lock document body scroll when modal is open to prevent background scrolling
  useEffect(() => {
    if (!isOpen || typeof document === 'undefined') return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

  if (!isOpen) return null;

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

    try {
      const updatedProfile = await api.updateProfile({
        display_name: trimmedName,
        bio: bio.trim(),
        avatar_url: avatarUrl.trim(),
        banner_url: bannerUrl.trim() || '',
        website: website.trim() || '',
      });

      // Update current user session context immediately
      updateCurrentUser({
        display_name: updatedProfile.display_name,
        avatar_url: updatedProfile.avatar_url,
      });

      setSuccess(true);
      if (onProfileUpdated) {
        onProfileUpdated(updatedProfile);
      }
      setTimeout(() => {
        onClose();
      }, 400);
    } catch (err: any) {
      setError(err?.detail || err?.message || 'Failed to update profile. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const modalContent = (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="profile-editor-title"
      data-testid="profile-editor-modal"
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-5 md:p-6 bg-black/75 backdrop-blur-xs animate-fade-in overflow-hidden"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          handleRequestClose();
        }
      }}
    >
      <div
        ref={modalRef}
        className="relative w-full max-w-xl sm:max-w-2xl bg-surface-card rounded-2xl sm:rounded-3xl border border-border shadow-2xl flex flex-col max-h-[92vh] sm:max-h-[86vh] overflow-hidden my-auto"
      >
        {/* Fixed Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-3.5 sm:py-4 border-b border-border bg-surface-card shrink-0">
          <div>
            <h2 id="profile-editor-title" className="text-base sm:text-lg font-bold text-text-primary tracking-tight">
              Edit Profile
            </h2>
            <p className="text-xs text-text-muted">
              Customize how your identity and engineering bio appear across the network.
            </p>
          </div>
          <button
            type="button"
            onClick={handleRequestClose}
            aria-label="Close profile editor"
            className="p-2 -mr-1.5 rounded-xl text-text-muted hover:text-text-primary hover:bg-surface-subtle transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Unsaved Changes Confirmation Banner */}
        {confirmDiscard && (
          <div
            role="alert"
            className="flex items-center justify-between px-5 py-2.5 bg-amber-500/10 border-b border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs shrink-0"
          >
            <div className="flex items-center gap-2">
              <AlertTriangle size={15} className="shrink-0 text-amber-500" />
              <span>You have unsaved changes. Discard them?</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setConfirmDiscard(false)}
                className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-surface-subtle text-text-primary hover:bg-surface-card"
              >
                Keep Editing
              </button>
              <button
                type="button"
                onClick={() => {
                  setConfirmDiscard(false);
                  onClose();
                }}
                className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-rose-500 text-white hover:bg-rose-600"
              >
                Discard
              </button>
            </div>
          </div>
        )}

        {/* Form Body - Independently Scrollable */}
        <form
          id="profile-editor-form"
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto px-5 sm:px-6 py-4 sm:py-5 space-y-5"
        >
          {error && (
            <div
              role="alert"
              data-testid="profile-editor-error"
              className="flex items-start gap-2.5 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 text-xs text-rose-700 dark:text-rose-300"
            >
              <AlertCircle size={15} className="shrink-0 text-rose-500 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div
              role="status"
              data-testid="profile-editor-success"
              className="flex items-start gap-2.5 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/40 text-xs text-emerald-700 dark:text-emerald-300"
            >
              <Check size={15} className="shrink-0 text-emerald-500 mt-0.5" />
              <span>Profile updated successfully! Refreshing view...</span>
            </div>
          )}

          {/* Section 1: Compact Banner Selection */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-text-primary uppercase tracking-wider">
                Profile Banner
              </label>
              {bannerUrl && (
                <button
                  type="button"
                  onClick={() => setBannerUrl('')}
                  className="text-[11px] text-text-muted hover:text-rose-500 transition-colors cursor-pointer"
                >
                  Clear Banner
                </button>
              )}
            </div>

            <div
              className="w-full h-20 sm:h-24 rounded-xl overflow-hidden relative border border-border bg-gradient-to-r from-neutral-900/50 via-neutral-950/50 to-neutral-900/50 flex items-center justify-center shadow-xs"
              style={{
                backgroundImage: bannerUrl ? `url(${bannerUrl})` : undefined,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            >
              {!bannerUrl && (
                <span className="text-xs text-text-muted flex items-center gap-1.5 bg-black/40 px-3 py-1 rounded-lg backdrop-blur-xs">
                  <ImageIcon size={13} /> Default gradient banner
                </span>
              )}
            </div>

            {/* Quick Banner Presets Chips */}
            <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
              <span className="text-[11px] text-text-muted font-medium mr-0.5">Presets:</span>
              {PRESET_BANNERS.map((b) => (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => setBannerUrl(b.url)}
                  className={`text-[11px] px-2 py-0.5 rounded-lg border transition-colors cursor-pointer ${
                    bannerUrl === b.url
                      ? 'border-primary bg-primary/10 text-primary font-semibold'
                      : 'border-border text-text-secondary hover:bg-surface-subtle'
                  }`}
                >
                  {b.label}
                </button>
              ))}
            </div>

            <Input
              id="profile-banner-input"
              label="Custom Banner URL"
              placeholder="https://images.unsplash.com/..."
              value={bannerUrl}
              onChange={(e) => setBannerUrl(e.target.value)}
              leftIcon={<LinkIcon size={13} />}
              className="text-xs h-9"
            />
          </div>

          {/* Section 2: Expanded Avatar Selection */}
          <div className="space-y-3 pt-3 border-t border-border/70">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-text-primary uppercase tracking-wider">
                Profile Avatar
              </label>
              <div className="flex items-center gap-1 bg-surface-subtle p-0.5 rounded-lg border border-border/60 text-xs">
                <button
                  type="button"
                  onClick={() => setAvatarMode('presets')}
                  className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                    avatarMode === 'presets'
                      ? 'bg-surface-card text-text-primary font-bold shadow-xs'
                      : 'text-text-muted hover:text-text-primary'
                  }`}
                >
                  Vector Presets
                </button>
                <button
                  type="button"
                  onClick={() => setAvatarMode('custom')}
                  className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                    avatarMode === 'custom'
                      ? 'bg-surface-card text-text-primary font-bold shadow-xs'
                      : 'text-text-muted hover:text-text-primary'
                  }`}
                >
                  Custom URL
                </button>
              </div>
            </div>

            {/* Selected Avatar Preview Card */}
            <div className="flex items-center gap-3.5 p-3 rounded-2xl bg-surface-subtle/60 border border-border">
              <div className="relative shrink-0">
                <Avatar
                  src={avatarUrl}
                  alt={displayName || 'Avatar'}
                  size="xl"
                  className="w-16 h-16 sm:w-18 sm:h-18 ring-2 ring-primary/40 shadow-xs"
                />
                <span className="absolute -bottom-1 -right-1 inline-flex items-center justify-center w-5 h-5 rounded-full bg-primary text-white text-[10px] shadow-xs">
                  <CheckCircle2 size={12} />
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-text-primary">
                  {selectedPreset ? selectedPreset.name : 'Selected Avatar'}
                </p>
                <p className="text-[11px] text-text-muted font-mono truncate max-w-sm mt-0.5">
                  {avatarUrl}
                </p>
                <p className="text-[10px] text-text-muted capitalize mt-0.5">
                  Category: {selectedPreset ? selectedPreset.category : 'Custom'}
                </p>
              </div>
            </div>

            {avatarMode === 'presets' ? (
              <div className="space-y-2.5">
                {/* Category Pills Navigation */}
                <div
                  className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none"
                  role="tablist"
                  aria-label="Avatar Categories"
                >
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

                {/* Grid of Avatars - Flows naturally in form body without nested scrolling */}
                <div
                  className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-7 gap-2 p-1.5 rounded-xl border border-border/60 bg-surface-subtle/30"
                  data-testid="avatar-presets-grid"
                >
                  {filteredAvatars.map((av) => {
                    const isSelected = avatarUrl === av.url;
                    return (
                      <button
                        key={av.id}
                        type="button"
                        onClick={() => setAvatarUrl(av.url)}
                        title={av.name}
                        aria-label={`Select ${av.name} avatar`}
                        className={`p-1.5 rounded-xl border transition-all cursor-pointer flex flex-col items-center gap-1 group relative ${
                          isSelected
                            ? 'border-primary ring-2 ring-primary/40 bg-primary/10 shadow-xs'
                            : 'border-border/60 hover:border-border hover:bg-surface-subtle bg-surface-card'
                        }`}
                      >
                        <img
                          src={av.url}
                          alt={av.name}
                          className="w-11 h-11 rounded-lg object-contain transition-transform group-hover:scale-105"
                          loading="lazy"
                        />
                        <span className="text-[10px] text-text-muted truncate max-w-full px-0.5 text-center leading-tight">
                          {av.name}
                        </span>
                        {isSelected && (
                          <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-primary" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              /* Custom Avatar URL Mode */
              <div className="space-y-2 p-3 rounded-xl border border-border/60 bg-surface-subtle/30">
                <Input
                  id="profile-avatar-url"
                  label="Custom Avatar URL"
                  placeholder="https://example.com/avatar.svg or /avatars/..."
                  value={avatarUrl}
                  onChange={(e) => {
                    setAvatarUrl(e.target.value);
                    setCustomAvatarError(false);
                  }}
                  leftIcon={<Camera size={14} />}
                  helperText="Enter a secure image URL (HTTPS) or internal vector SVG asset."
                />
                {customAvatarError && (
                  <p className="text-xs text-rose-500 flex items-center gap-1">
                    <AlertCircle size={13} /> The image could not be loaded from this URL.
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Section 3: Identity & Bio Fields */}
          <div className="space-y-4 pt-3 border-t border-border/70">
            <div>
              <Input
                id="profile-display-name"
                label="Display Name"
                placeholder="Your full name or handle"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                maxLength={50}
                required
                helperText={`${displayName.length} / 50 characters`}
              />
            </div>

            {/* Read-only Username Anchor */}
            <div>
              <label className="block text-xs font-semibold text-text-primary uppercase tracking-wider mb-1">
                Username (Immutable Identity)
              </label>
              <div className="flex items-center px-3.5 py-2 rounded-xl bg-surface-subtle border border-border text-text-muted text-xs font-mono">
                @{profile.username}
              </div>
              <p className="text-[11px] text-text-muted mt-0.5">
                Anchors immutable social graph edges and mentions.
              </p>
            </div>

            {/* Bio textarea */}
            <div>
              <label
                htmlFor="profile-bio"
                className="block text-xs font-semibold text-text-primary uppercase tracking-wider mb-1"
              >
                Biography
              </label>
              <textarea
                id="profile-bio"
                rows={3}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                maxLength={250}
                placeholder="Tell the network about your engineering interests, stack, and side projects..."
                className="w-full text-xs sm:text-sm bg-surface-card text-text-primary placeholder:text-text-muted border border-border rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all resize-none"
              />
              <p className="text-[11px] text-text-muted text-right mt-0.5">
                {bio.length} / 250 characters
              </p>
            </div>

            {/* Website URL */}
            <div>
              <Input
                id="profile-website"
                label="Website or Portfolio URL (Optional)"
                type="url"
                placeholder="https://github.com/username or /sites/..."
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                leftIcon={<Globe size={14} />}
              />
            </div>
          </div>
        </form>

        {/* Fixed / Sticky Modal Action Footer */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-3 border-t border-border bg-surface-card shrink-0">
          <div className="text-xs text-text-muted hidden sm:block">
            {isDirty ? (
              <span className="text-primary font-medium">• Unsaved changes</span>
            ) : (
              <span>Profile unchanged</span>
            )}
          </div>
          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleRequestClose}
              disabled={submitting}
              className="flex-1 sm:flex-none"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              form="profile-editor-form"
              variant="primary"
              size="sm"
              disabled={submitting}
              leftIcon={submitting ? undefined : <Sparkles size={14} />}
              className="font-semibold px-5 flex-1 sm:flex-none"
            >
              {submitting ? 'Saving Changes...' : 'Save Profile'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );

  if (typeof document !== 'undefined' && mounted && document.body) {
    return createPortal(modalContent, document.body);
  }

  return modalContent;
}

export default ProfileEditorModal;
