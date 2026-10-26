# Create Post workflow

The Create Post page supports two real publishing paths:

- **Discussion Post**: Markdown-capable technical discussions with a title, body, community, and topic tags.
- **Visual Pin**: An image URL, title, caption, optional destination URL, alt text, community, and topic tags.

Both paths use the existing authenticated `POST /api/v1/posts` endpoint and its idempotency key. The frontend validates the form for usability, while the shared TypeBox schema and backend validate the payload authoritatively.

## Media behavior

The repository does not currently have a configured cloud media provider or upload endpoint. Live mode therefore accepts externally accessible `http`/`https` image URLs only. The image is loaded in the browser before it is shown as valid, and failed URLs remain blocked from publishing.

Local file selection is available only for mock/in-memory mode, where it is a temporary browser preview. It is not presented as a permanent upload in live mode. To support persistent local uploads, add a server-side storage integration (for example S3-compatible storage or Cloudinary) and return a validated public or signed URL from the backend; provider credentials must remain server-side.

## Drafts and previews

`Save Draft` stores the current non-sensitive composer fields in browser local storage under `socialgraph:create-post-draft`. A later visit restores that draft. This is intentionally a lightweight browser-local fallback, not a synchronized server draft system.

The right-hand live preview updates title, content, image, community, and tags while editing. On smaller screens it moves below the editor.

