import { useState, useEffect, useCallback, useMemo } from 'react';
import { useApi } from '../api';
import type { Community, PostCard, CreatePostInput } from '@socialgraph/shared';

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
  submitSuccess: boolean;
  createdPost: PostCard | null;
  isDirty: boolean;
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
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [createdPost, setCreatedPost] = useState<PostCard | null>(null);

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
  const handleLocalFileSelect = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) {
      setErrors((prev) => ({ ...prev, imageUrl: 'Please select a valid image file (PNG, JPG, WebP, SVG).' }));
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setImageUrl(objectUrl);
    setIsLocalFile(true);
    setImageError(false);
    setImageLoaded(false);

    // Calculate natural aspect ratio
    const img = new Image();
    img.onload = () => {
      if (img.naturalHeight > 0) {
        const ratio = parseFloat((img.naturalWidth / img.naturalHeight).toFixed(3));
        setImageAspectRatio(ratio);
        setImageLoaded(true);
      }
    };
    img.onerror = () => {
      setImageError(true);
    };
    img.src = objectUrl;

    setErrors((prev) => {
      const next = { ...prev };
      delete next.imageUrl;
      return next;
    });
  }, []);

  const clearImage = useCallback(() => {
    setImageUrl('');
    setIsLocalFile(false);
    setImageError(false);
    setImageLoaded(false);
    setImageAspectRatio(1.0);
  }, []);

  // Tag management
  const addTag = useCallback((rawTag: string) => {
    const cleaned = rawTag.trim().replace(/^#/, '').toLowerCase();
    if (cleaned && !tags.includes(cleaned) && tags.length < 5) {
      setTags((prev) => [...prev, cleaned]);
    }
  }, [tags]);

  const removeTag = useCallback((tagToRemove: string) => {
    setTags((prev) => prev.filter((t) => t !== tagToRemove));
  }, []);

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
      destinationUrl.trim()
    );
  }, [title, content, communityId, tags, imageUrl, destinationUrl]);

  // Form validation
  const validateForm = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};

    if (!title.trim()) {
      newErrors.title = 'Title is required.';
    } else if (postType === 'discussion' && title.trim().length < 3) {
      newErrors.title = 'Discussion title must be at least 3 characters.';
    } else if (title.trim().length > 300) {
      newErrors.title = 'Title must be 300 characters or fewer.';
    }

    if (postType === 'discussion') {
      if (!content.trim()) {
        newErrors.content = 'Discussion body is required.';
      } else if (content.trim().length < 5) {
        newErrors.content = 'Discussion body should provide more context (at least 5 characters).';
      }
    }

    if (postType === 'visual') {
      if (!imageUrl.trim()) {
        newErrors.imageUrl = 'An image URL or local file preview is required.';
      } else if (imageError) {
        newErrors.imageUrl = 'The provided image could not be loaded. Please check the URL.';
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
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [postType, title, content, imageUrl, imageError, destinationUrl]);

  // Submission handler
  const submitPost = useCallback(async (): Promise<PostCard | null> => {
    if (submitting) return null;

    if (!validateForm()) {
      return null;
    }

    setSubmitting(true);
    setSubmitError(null);

    try {
      let input: CreatePostInput;

      if (postType === 'discussion') {
        input = {
          post_type: 'discussion',
          title: title.trim(),
          content: content.trim(),
          community_id: communityId || undefined,
          tags: tags.length > 0 ? tags : undefined,
          flair: tags.length > 0 ? tags[0] : undefined,
        };
      } else {
        input = {
          post_type: 'visual',
          title: title.trim(),
          caption: content.trim() || undefined,
          content: content.trim() || undefined,
          community_id: communityId || undefined,
          destination_url: destinationUrl.trim() || undefined,
          tags: tags.length > 0 ? tags : undefined,
          media: [
            {
              id: `m_${Date.now()}`,
              url: imageUrl.trim(),
              aspect_ratio: imageAspectRatio || 1.0,
              alt_text: imageAlt.trim() || title.trim(),
            },
          ],
        };
      }

      const post = await api.createPost(input);
      setCreatedPost(post);
      setSubmitSuccess(true);
      return post;
    } catch (err: any) {
      const msg = err.message || err.detail || 'Failed to publish post. Please check required fields and try again.';
      setSubmitError(msg);
      return null;
    } finally {
      setSubmitting(false);
    }
  }, [submitting, validateForm, postType, title, content, communityId, tags, imageUrl, imageAspectRatio, imageAlt, destinationUrl, api]);

  const resetForm = useCallback(() => {
    setTitle('');
    setContent('');
    setCommunityId('');
    setTags([]);
    setImageUrl('');
    setImageAspectRatio(1.0);
    setImageAlt('');
    setDestinationUrl('');
    setIsLocalFile(false);
    setImageError(false);
    setImageLoaded(false);
    setErrors({});
    setSubmitting(false);
    setSubmitError(null);
    setSubmitSuccess(false);
    setCreatedPost(null);
  }, []);

  return {
    postType,
    setPostType,
    title,
    setTitle,
    content,
    setContent,
    communityId,
    setCommunityId,
    tags,
    addTag,
    removeTag,
    imageUrl,
    setImageUrl,
    imageAspectRatio,
    setImageAspectRatio,
    imageAlt,
    setImageAlt,
    destinationUrl,
    setDestinationUrl,
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
    submitSuccess,
    createdPost,
    isDirty,
    submitPost,
    resetForm,
  };
}
