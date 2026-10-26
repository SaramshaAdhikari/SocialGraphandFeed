import { useState, useEffect, useCallback, useMemo } from 'react';
import { useApi } from '../api';
import { ApiClientError } from '../api/client';
import type { Community, PostCard, CreatePostInput, MediaAttachment } from '@socialgraph/shared';

export type PostComposerType = 'discussion' | 'visual';

export interface UseCreatePostReturn {
  postType: PostComposerType;
  setPostType: (type: PostComposerType) => void;
  title: string;
  setTitle: (title: string) => void;
  content: string;
  setContent: (content: string) => void;
  communityId: string;
  setCommunityId: (id: string) => void;
  tags: string[];
  addTag: (tag: string) => void;
  removeTag: (tag: string) => void;
  imageUrl: string;
  setImageUrl: (url: string) => void;
  mediaList: MediaAttachment[];
  addMediaItem: (item: { url: string; aspect_ratio?: number; alt_text?: string }) => void;
  addMultipleMedia: (items: MediaAttachment[]) => void;
  removeMediaItem: (index: number) => void;
  reorderMediaItem: (fromIndex: number, toIndex: number) => void;
  setCoverMedia: (index: number) => void;
  imageAspectRatio: number;
  setImageAspectRatio: (ratio: number) => void;
  imageAlt: string;
  setImageAlt: (alt: string) => void;
  destinationUrl: string;
  setDestinationUrl: (url: string) => void;
  isLocalFile: boolean;
  handleLocalFileSelect: (file: File) => void;
  clearImage: () => void;
  imageError: boolean;
  setImageError: (err: boolean) => void;
  imageLoaded: boolean;
  setImageLoaded: (loaded: boolean) => void;
  communities: Community[];
  loadingCommunities: boolean;
  errors: Record<string, string>;
  setFieldError: (field: string, error: string | null) => void;
  submitting: boolean;
  submitError: string | null;
  rateLimitSeconds: number | null;
  submitSuccess: boolean;
  createdPost: PostCard | null;
  isDirty: boolean;
  isLiveMode: boolean;
  idempotencyKey: string;
  submitPost: () => Promise<PostCard | null>;
  resetForm: () => void;
}

export interface UseCreatePostOptions {
  initialType?: PostComposerType;
  apiInstance?: any;
}

export function useCreatePost(optionsOrType: UseCreatePostOptions | PostComposerType = 'discussion'): UseCreatePostReturn {
  const options: UseCreatePostOptions =
    typeof optionsOrType === 'string' ? { initialType: optionsOrType } : optionsOrType;

  const defaultApiInstance = useApi();
  const api = options.apiInstance || defaultApiInstance;

  const [postType, setPostType] = useState<PostComposerType>(options.initialType || 'discussion');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [communityId, setCommunityId] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [imageUrl, setImageUrl] = useState('');
  const [mediaList, setMediaList] = useState<MediaAttachment[]>([]);
  const [imageAspectRatio, setImageAspectRatio] = useState(1.0);
  const [imageAlt, setImageAlt] = useState('');
  const [destinationUrl, setDestinationUrl] = useState('');
  const [isLocalFile, setIsLocalFile] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const [communities, setCommunities] = useState<Community[]>([]);
  const [loadingCommunities, setLoadingCommunities] = useState(false);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [rateLimitSeconds, setRateLimitSeconds] = useState<number | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [createdPost, setCreatedPost] = useState<PostCard | null>(null);

  // Durable draft submission key for server-side idempotency
  const [idempotencyKey, setIdempotencyKey] = useState<string>(
    () => `post_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
  );

  const refreshIdempotencyKey = useCallback(() => {
    setIdempotencyKey(`post_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`);
  }, []);

  const handleSetTitle = useCallback((val: string) => {
    setTitle(val);
    refreshIdempotencyKey();
  }, [refreshIdempotencyKey]);

  const handleSetContent = useCallback((val: string) => {
    setContent(val);
    refreshIdempotencyKey();
  }, [refreshIdempotencyKey]);

  const handleSetCommunityId = useCallback((val: string) => {
    setCommunityId(val);
    refreshIdempotencyKey();
  }, [refreshIdempotencyKey]);

  const handleSetPostType = useCallback((val: PostComposerType) => {
    setPostType(val);
    refreshIdempotencyKey();
  }, [refreshIdempotencyKey]);

  const handleSetImageUrl = useCallback((val: string) => {
    setImageUrl(val);
    setMediaList((prev) => {
      if (prev.length <= 1) {
        if (!val.trim()) return [];
        return [{
          id: prev[0]?.id || `m_${Date.now()}`,
          url: val.trim(),
          aspect_ratio: imageAspectRatio || 1.0,
          alt_text: imageAlt || '',
        }];
      }
      const next = [...prev];
      next[0] = { ...next[0], url: val.trim() };
      return next;
    });
    refreshIdempotencyKey();
  }, [imageAspectRatio, imageAlt, refreshIdempotencyKey]);

  const addMediaItem = useCallback(
    (item: { url: string; aspect_ratio?: number; alt_text?: string }) => {
      if (!item.url.trim()) return;
      const newAttachment: MediaAttachment = {
        id: `m_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        url: item.url.trim(),
        aspect_ratio: item.aspect_ratio || 1.0,
        alt_text: item.alt_text || '',
      };
      setMediaList((prev) => {
        if (prev.length >= 10) return prev;
        const next = [...prev, newAttachment];
        if (next.length === 1) {
          setImageUrl(next[0].url);
          setImageAspectRatio(next[0].aspect_ratio);
          setImageAlt(next[0].alt_text || '');
        }
        return next;
      });
      refreshIdempotencyKey();
    },
    [refreshIdempotencyKey]
  );

  const addMultipleMedia = useCallback(
    (items: MediaAttachment[]) => {
      if (!items || items.length === 0) return;
      setMediaList((prev) => {
        const combined = [...prev, ...items].slice(0, 10);
        if (combined.length > 0) {
          setImageUrl(combined[0].url);
          setImageAspectRatio(combined[0].aspect_ratio);
          setImageAlt(combined[0].alt_text || '');
        }
        return combined;
      });
      refreshIdempotencyKey();
    },
    [refreshIdempotencyKey]
  );

  const removeMediaItem = useCallback(
    (index: number) => {
      setMediaList((prev) => {
        const next = prev.filter((_, i) => i !== index);
        if (next.length > 0) {
          setImageUrl(next[0].url);
          setImageAspectRatio(next[0].aspect_ratio);
          setImageAlt(next[0].alt_text || '');
        } else {
          setImageUrl('');
          setIsLocalFile(false);
          setImageLoaded(false);
          setImageError(false);
        }
        return next;
      });
      refreshIdempotencyKey();
    },
    [refreshIdempotencyKey]
  );

  const reorderMediaItem = useCallback(
    (fromIndex: number, toIndex: number) => {
      setMediaList((prev) => {
        if (fromIndex < 0 || fromIndex >= prev.length || toIndex < 0 || toIndex >= prev.length) {
          return prev;
        }
        const next = [...prev];
        const [moved] = next.splice(fromIndex, 1);
        next.splice(toIndex, 0, moved);
        setImageUrl(next[0].url);
        setImageAspectRatio(next[0].aspect_ratio);
        setImageAlt(next[0].alt_text || '');
        return next;
      });
      refreshIdempotencyKey();
    },
    [refreshIdempotencyKey]
  );

  const setCoverMedia = useCallback(
    (index: number) => {
      reorderMediaItem(index, 0);
    },
    [reorderMediaItem]
  );

  const handleSetDestinationUrl = useCallback((val: string) => {
    setDestinationUrl(val);
    refreshIdempotencyKey();
  }, [refreshIdempotencyKey]);

  const handleSetImageAspectRatio = useCallback((val: number) => {
    setImageAspectRatio(val);
    refreshIdempotencyKey();
  }, [refreshIdempotencyKey]);

  const handleSetImageAlt = useCallback((val: string) => {
    setImageAlt(val);
    refreshIdempotencyKey();
  }, [refreshIdempotencyKey]);

  // Countdown timer for rate limiting
  useEffect(() => {
    if (rateLimitSeconds === null || rateLimitSeconds <= 0) return;
    const timer = setInterval(() => {
      setRateLimitSeconds((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(timer);
          return null;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [rateLimitSeconds]);

  // Fetch available communities on mount
  useEffect(() => {
    let mounted = true;
    setLoadingCommunities(true);
    api
      .getCommunities()
      .then((data: Community[]) => {
        if (mounted) {
          setCommunities(data);
          setLoadingCommunities(false);
        }
      })
      .catch(() => {
        if (mounted) {
          setLoadingCommunities(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, [api]);

  // Handle local file preview
  const handleLocalFileSelect = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setErrors((prev) => ({ ...prev, imageUrl: 'Please select a valid image file (PNG, JPG, WebP, SVG).' }));
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setErrors((prev) => ({ ...prev, imageUrl: 'File size exceeds the 10MB limit.' }));
      return;
    }

    try {
      const uploaded = await api.uploadMedia([file]);
      if (uploaded && uploaded.length > 0) {
        addMultipleMedia(uploaded);
        setErrors((prev) => {
          const next = { ...prev };
          delete next.imageUrl;
          return next;
        });
      }
    } catch (err: any) {
      setErrors((prev) => ({ ...prev, imageUrl: err.message || 'Failed to upload image.' }));
    }
  }, [api, addMultipleMedia]);

  const clearImage = useCallback(() => {
    setImageUrl('');
    setMediaList([]);
    setIsLocalFile(false);
    setImageError(false);
    setImageLoaded(false);
    setImageAspectRatio(1.0);
    refreshIdempotencyKey();
  }, [refreshIdempotencyKey]);

  // Tag management: canonical normalization (lowercase, stripped leading #s, validated slug)
  const addTag = useCallback((rawTag: string) => {
    const cleaned = rawTag.trim().replace(/^#+/, '').toLowerCase();
    if (cleaned && /^[a-z0-9_-]+$/.test(cleaned) && !tags.includes(cleaned) && tags.length < 5) {
      setTags((prev) => [...prev, cleaned]);
      refreshIdempotencyKey();
      setErrors((prev) => {
        const next = { ...prev };
        delete next.tags;
        return next;
      });
    }
  }, [tags, refreshIdempotencyKey]);

  const removeTag = useCallback((tagToRemove: string) => {
    setTags((prev) => prev.filter((t) => t !== tagToRemove));
    refreshIdempotencyKey();
    setErrors((prev) => {
      const next = { ...prev };
      delete next.tags;
      return next;
    });
  }, [refreshIdempotencyKey]);

  const setFieldError = useCallback((field: string, error: string | null) => {
    setErrors((prev) => {
      const next = { ...prev };
      if (error) {
        next[field] = error;
      } else {
        delete next[field];
      }
      return next;
    });
  }, []);

  // Dirty check to guard against accidental navigation
  const isDirty = useMemo(() => {
    return Boolean(
      title.trim() ||
      content.trim() ||
      communityId ||
      tags.length > 0 ||
      imageUrl.trim() ||
      mediaList.length > 0 ||
      destinationUrl.trim()
    );
  }, [title, content, communityId, tags, imageUrl, mediaList.length, destinationUrl]);

  // Form validation for unified composer
  const validateForm = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};
    const hasMedia = mediaList.length > 0 || Boolean(imageUrl.trim());
    const hasText = Boolean(title.trim() || content.trim());

    if (!hasMedia && !hasText) {
      newErrors.content = 'Post must contain either text content or at least one image.';
    }

    if (title.trim().length > 300) {
      newErrors.title = 'Title must be 300 characters or fewer.';
    }

    if (content.trim().length > 40000) {
      newErrors.content = 'Content must be 40,000 characters or fewer.';
    }

    if (destinationUrl.trim()) {
      try {
        const urlObj = new URL(destinationUrl.trim());
        if (!['http:', 'https:'].includes(urlObj.protocol)) {
          newErrors.destinationUrl = 'Destination link must start with http:// or https://';
        }
      } catch {
        newErrors.destinationUrl = 'Please enter a valid destination URL (e.g. https://example.com)';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [mediaList.length, imageUrl, title, content, destinationUrl]);

  // Submission handler
  const submitPost = useCallback(async (): Promise<PostCard | null> => {
    if (submitting || (rateLimitSeconds !== null && rateLimitSeconds > 0)) return null;

    if (!validateForm()) {
      return null;
    }

    setSubmitting(true);
    setSubmitError(null);

    // Canonical tag normalization: clean, unique, and strictly formatted
    const cleanTags = tags
      .map((t) => t.trim().replace(/^#+/, '').toLowerCase())
      .filter((t) => t.length > 0 && /^[a-z0-9_-]+$/.test(t));
    const uniqueTags = Array.from(new Set(cleanTags));
    const finalTags = uniqueTags.length > 0 ? uniqueTags : undefined;
    const finalFlair = uniqueTags.length > 0 ? uniqueTags[0] : undefined;

    try {
      let input: CreatePostInput;

      const mediaItems: MediaAttachment[] = mediaList.length > 0
        ? mediaList
        : imageUrl.trim()
        ? [
            {
              id: `m_${Date.now()}`,
              url: imageUrl.trim(),
              aspect_ratio: imageAspectRatio || 1.0,
              alt_text: imageAlt.trim() || undefined,
            },
          ]
        : [];

      const hasMedia = mediaItems.length > 0;
      const inferredPostType: 'discussion' | 'visual' = hasMedia ? 'visual' : 'discussion';

      input = {
        post_type: inferredPostType,
        title: title.trim() || undefined,
        content: content.trim() || undefined,
        caption: content.trim() || undefined,
        community_id: communityId || undefined,
        destination_url: destinationUrl.trim() || undefined,
        tags: finalTags,
        flair: finalFlair,
        media: mediaItems.length > 0 ? mediaItems : undefined,
      };

      const post = await api.createPost(input, idempotencyKey);
      setCreatedPost(post);
      setSubmitSuccess(true);
      // Advance idempotency key for subsequent post
      setIdempotencyKey(`post_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`);
      return post;
    } catch (err: any) {
      if (err instanceof ApiClientError || err.problem) {
        const problem = err.problem || {};
        if (problem.status === 429 || problem.code === 'RATE_LIMITED') {
          const retrySec = problem.retry_after || 40;
          setRateLimitSeconds(retrySec);
          setSubmitError(`Rate limit exceeded for post. Please try again in ${retrySec} seconds.`);
        } else if (problem.status === 400 && Array.isArray(problem.invalid_params)) {
          for (const param of problem.invalid_params) {
            if (param.name) {
              setFieldError(param.name, param.reason);
            }
          }
          setSubmitError(problem.detail || 'Request payload failed schema validation.');
        } else {
          setSubmitError(problem.detail || err.message || 'Failed to publish post. Please check required fields and try again.');
        }
      } else {
        const msg = err.message || 'Failed to publish post. Please check required fields and try again.';
        setSubmitError(msg);
      }
      return null;
    } finally {
      setSubmitting(false);
    }
  }, [
    submitting,
    rateLimitSeconds,
    validateForm,
    postType,
    title,
    content,
    communityId,
    tags,
    imageUrl,
    mediaList,
    imageAspectRatio,
    imageAlt,
    destinationUrl,
    api,
    idempotencyKey,
    setFieldError,
  ]);

  const resetForm = useCallback(() => {
    setTitle('');
    setContent('');
    setCommunityId('');
    setTags([]);
    setImageUrl('');
    setMediaList([]);
    setImageAspectRatio(1.0);
    setImageAlt('');
    setDestinationUrl('');
    setIsLocalFile(false);
    setImageError(false);
    setImageLoaded(false);
    setErrors({});
    setSubmitting(false);
    setSubmitError(null);
    setRateLimitSeconds(null);
    setSubmitSuccess(false);
    setCreatedPost(null);
    setIdempotencyKey(`post_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`);
  }, []);

  return {
    postType,
    setPostType: handleSetPostType,
    title,
    setTitle: handleSetTitle,
    content,
    setContent: handleSetContent,
    communityId,
    setCommunityId: handleSetCommunityId,
    tags,
    addTag,
    removeTag,
    imageUrl,
    setImageUrl: handleSetImageUrl,
    mediaList,
    addMediaItem,
    addMultipleMedia,
    removeMediaItem,
    reorderMediaItem,
    setCoverMedia,
    imageAspectRatio,
    setImageAspectRatio: handleSetImageAspectRatio,
    imageAlt,
    setImageAlt: handleSetImageAlt,
    destinationUrl,
    setDestinationUrl: handleSetDestinationUrl,
    isLocalFile,
    handleLocalFileSelect,
    clearImage,
    imageError,
    setImageError,
    imageLoaded,
    setImageLoaded,
    communities,
    loadingCommunities,
    errors,
    setFieldError,
    submitting,
    submitError,
    rateLimitSeconds,
    submitSuccess,
    createdPost,
    isDirty,
    isLiveMode: api.dataSource === 'live',
    idempotencyKey,
    submitPost,
    resetForm,
  };
}
