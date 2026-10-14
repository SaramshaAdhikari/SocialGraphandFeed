---
description: |
  A photo-and-video-first social interface built around a narrow,
  readable feed, profile identity, lightweight engagement controls, and
  distinct discovery and short-video surfaces. This document combines
  the two supplied Instagram notes into one guide. It distinguishes
  observable product patterns from approximate implementation tokens; it
  is not an official Instagram design-system export.
name: Instagram Web Design Analysis
version: alpha
---

# Instagram Web Design Analysis

## Scope and confidence

This guide consolidates the two supplied Instagram files into **one
canonical reference**. The short note contributes the content-ratio,
story-ring, and restrained-image-chrome observations; the longer guide
contributes the web layout, post anatomy, and interaction details.

Instagram changes frequently and may run different layouts or
experiments by region, account, device, and rollout cohort. Treat exact
widths, spacing values, and some colors below as **implementation
estimates** unless linked to a published source. Do not present inferred
CSS values as official Meta design tokens.

Confidence labels used here:

-   **Publicly documented:** supported by Meta/Instagram announcements
    or help material.
-   **Observed pattern:** a recurring visible interface convention, but
    not a guaranteed specification.
-   **Approximation:** a practical starting value for a faithful
    prototype; verify against the target browser and viewport.

## Design intent

Instagram is a **media-first social product**. The image or video is the
dominant visual object; surrounding chrome helps users identify the
creator, understand the context, and take a small set of familiar
actions without competing with the media.

Key principles:

-   Prioritize photos and video while preserving creator identity and
    social context.
-   Use compact, mostly neutral interface chrome and restrained borders.
-   Keep common actions---like, comment, share, save---close to the
    media.
-   Give avatars and story rings a consistent circular treatment.
-   Separate following-based content from discovery and short-form video
    surfaces.
-   Keep text hierarchy compact: username and post content first,
    metadata second.
-   Do not assume the product is static: navigation, feed composition,
    and discovery features can vary by rollout.

## 1. Design tokens

### 1.1 Color palette

The values below are **prototype tokens based on the supplied notes and
commonly observed web UI**, not a claim that Instagram publishes these
as a complete official palette.

  -----------------------------------------------------------------------------
  Token                 Value             Intended use        Confidence
  --------------------- ----------------- ------------------- -----------------
  `canvas`              `#FFFFFF`         Main light-mode     Observed pattern
                                          page surface        

  `surface-soft`        `#FAFAFA`         Subtle secondary    Approximation
                                          surface or          
                                          placeholder area    

  `text-primary`        `#262626`         Main text and       Observed pattern
                                          usernames           

  `text-secondary`      `#737373`         Timestamps,         Approximation
                                          metadata, muted     
                                          labels              

  `border`              `#DBDBDB`         Hairline dividers   Observed pattern
                                          and input           
                                          boundaries          

  `link-blue`           `#0095F6`         Action links in the Approximation;
                                          supplied detailed   values can vary
                                          guide               

  `media-placeholder`   `#EFEEF0`         Loading or          Approximation
                                          unavailable-media   
                                          placeholder         

  `story-ring-warm`     `#FCAF45`         Start of the        Illustrative only
                                          multicolor          
                                          story-ring range    

  `story-ring-pink`     `#D6249F`         Pink/purple part of Illustrative only
                                          the story-ring      
                                          range               

  `story-ring-blue`     `#285AEB`         Blue part of a      Illustrative only
                                          commonly reproduced 
                                          ring gradient       
  -----------------------------------------------------------------------------

A practical story-ring gradient for a prototype:

``` css
--story-ring:
  radial-gradient(circle at 30% 107%,
    #fdf497 0%, #fdf497 5%,
    #fd5949 45%, #d6249f 60%, #285AEB 90%);
```

This is a commonly reproduced approximation, **not a guaranteed current
production token**. The shorter supplied file's orange-to-magenta
gradient and the longer file's more complete gradient differ; prefer
visual verification over treating either as authoritative.

### 1.2 Dark mode

A dark theme can be implemented for completeness, but exact Instagram
dark-mode tokens were not established by the supplied files. Use
semantic tokens and validate the result visually rather than mixing
guessed values into a supposedly official palette.

Suggested starting values (all approximate):

  Token                   Value
  ----------------------- -----------
  `canvas-dark`           `#000000`
  `surface-dark`          `#121212`
  `text-primary-dark`     `#F5F5F5`
  `text-secondary-dark`   `#A8A8A8`
  `border-dark`           `#262626`
  `link-blue-dark`        `#0095F6`

### 1.3 Typography

**Observed pattern:** Instagram's web UI uses a compact sans-serif
interface style. The supplied guide suggests a system-font stack; use it
as a safe prototype fallback rather than claiming it is the exact
proprietary production stack.

``` css
font-family:
  -apple-system, BlinkMacSystemFont, "Segoe UI",
  Roboto, Helvetica, Arial, sans-serif;
```

  -------------------------------------------------------------------------
  Role                    Approx. size               Weight Use
  --------------- -------------------- -------------------- ---------------
  Username /                      14px                  600 Post header,
  emphasized                                                caption author
  inline name                                               

  Body / caption                  14px                  400 Main post copy
  / comment                                                 

  Secondary                       12px                  400 Timestamp,
  metadata                                                  location,
                                                            auxiliary
                                                            labels

  Button / action                 14px                  600 Compact action
  label                                                     labels

  Modal or page               18--24px                  600 Use sparingly;
  heading                                                   hierarchy
                                                            differs by
                                                            surface
  -------------------------------------------------------------------------

Use a line-height around `1.35–1.5` for body copy. Avoid large
marketing-style typography inside the feed. The media itself should
provide most of the visual impact.

### 1.4 Shape and spacing

  ------------------------------------------------------------------------
  Token / element                    Suggested value Notes
  --------------------- ---------------------------- ---------------------
  Avatar                                `50%` radius Circular at all sizes

  Story avatar              `64–66px` outer diameter Approximate from
                                                     supplied short guide;
                                                     adapt to viewport

  Post-header avatar                          `32px` Supplied detailed
                                                     guide

  Feed card corners                          `0–8px` The supplied files
                                                     disagree;
                                                     edge-to-edge media
                                                     can be square while
                                                     surrounding web
                                                     surfaces may be
                                                     rounded

  Button radius                                `8px` Approximate; pill
                                                     controls also occur
                                                     on some surfaces

  Standard icon                               `24px` Like/comment/share
                                                     controls

  Compact spacing                            `4–8px` Icon and metadata
                                                     spacing

  Standard spacing                         `12–16px` Text blocks and
                                                     action rows

  Section spacing                          `24–32px` Separate larger page
                                                     regions
  ------------------------------------------------------------------------

Do not force a single corner radius onto every surface. A media canvas
can remain edge-to-edge while a dialog, popover, or input has its own
geometry.

## 2. Layout architecture

### 2.1 Desktop web

**Observed pattern:** a persistent navigation region sits beside a
central content area. Some desktop layouts also show a secondary
suggestions region; the exact arrangement depends on viewport and
product version.

The supplied guide proposes these useful implementation estimates:

  Region                               Suggested width Confidence
  ---------------------------------- ----------------- ---------------
  Expanded navigation                          `244px` Approximation
  Compact navigation                            `72px` Approximation
  Main feed column                         max `470px` Approximation
  Feed + suggestions container             max `935px` Approximation
  Suggestions region                     about `319px` Approximation
  Gap between feed and suggestions        about `64px` Approximation

Use these as starting constraints, not immutable measurements. At
narrower widths, remove the suggestions region before compressing the
feed until it becomes uncomfortable to read.

### 2.2 Responsive behavior

The supplied file proposes three ranges. Treat them as prototype
breakpoints rather than official platform breakpoints:

-   **Wide desktop (around 1264px and above):** expanded side
    navigation; central feed; optional suggestions rail.
-   **Medium desktop/tablet (around 768--1263px):** compact icon
    navigation; central feed; hide the suggestions rail when it no
    longer fits.
-   **Small screens (around 767px and below):** single-column media
    feed; compact top chrome and/or bottom navigation depending on the
    target experience.

Do not hard-code the whole product around these cutoffs. Test at 1440px,
1280px, 1024px, 768px, 390px, and 360px.

### 2.3 Feed width and media sizing

The media is usually the largest uninterrupted surface in a post.
Support at least:

-   Square: `aspect-ratio: 1 / 1`
-   Portrait: `aspect-ratio: 4 / 5`
-   Landscape: `aspect-ratio: 16 / 9`

These are useful display presets, not a claim that Instagram accepts
only these source ratios. Prefer preserving the post's intended crop
with `object-fit: cover` where appropriate, and avoid layout shift by
reserving the media box's dimensions before the image loads.

## 3. Core components

### 3.1 Navigation

Typical elements may include:

-   Brand mark or wordmark.
-   Primary destinations such as Home, Search/Explore, Reels, Messages,
    Notifications, Create, and Profile.
-   Search or discovery entry point.
-   Active, hover, focus, and unread/notification states.

The exact ordering and visibility of destinations changes. Meta
announced in 2025 that it was testing a Reels-first experience in India
for a limited group, with DMs moved to a more prominent navigation
position and a Following tab offering All, Friends, and Latest options.
Do not treat any one tab order as universal. Source:
https://about.fb.com/news/2025/09/in-india-instagram-debuts-a-reels-first-experience-for-its-mobile-app/

### 3.2 Stories tray

**Observed pattern:** a horizontally scrollable row of circular avatars
with a prominent ring around available stories.

-   Keep the avatar circular and the ring outside the image.
-   Separate the ring from the photo with a narrow inner gap so the
    photo remains legible.
-   Use a consistent avatar diameter and equal spacing.
-   Distinguish viewed and unviewed stories without relying on color
    alone.
-   On narrow screens, allow horizontal scrolling; do not squeeze every
    story into the viewport.
-   Include a creator label under each avatar where the target layout
    uses one.

The supplied short guide suggests approximately `66px` story avatars and
a `2px` ring/padding treatment. These are approximations.

### 3.3 Post card anatomy

A useful feed post model is:

``` text
Post
├── Header
│   ├── Avatar
│   ├── Username / optional location
│   └── More-actions menu
├── Media
├── Action row
│   ├── Like
│   ├── Comment
│   ├── Share
│   └── Save (aligned to the far edge)
├── Engagement summary
├── Caption
├── Preview comments / view-comments link
└── Timestamp or contextual metadata
```

The exact sequence can differ by client and post type. A comment
composer may appear on some desktop experiences, but should not be
assumed to be permanently embedded inside every card.

#### Header

-   Suggested height: approximately `56px` including padding.
-   Avatar: approximately `32px`.
-   Username: `14px`, semibold.
-   Optional secondary line: location, collaboration context, or audio
    information.
-   More-actions button: accessible icon button with a clear focus
    state.

#### Media canvas

-   Reserve width and aspect ratio before loading.
-   Use a neutral placeholder while loading.
-   Preserve image quality and avoid stretching.
-   Provide a clear fallback for failed media.
-   For carousels, show a subtle position indicator and support
    previous/next navigation without obscuring important content.
-   For video, distinguish muted/unmuted, playing/paused, and loading
    states.

#### Action row

-   Standard icon target: approximately `24px`.
-   Maintain a comfortable clickable area around the glyph; do not make
    the hit target equal to the glyph size.
-   Keep like, comment, and share grouped at the leading edge.
-   Align save/bookmark separately at the trailing edge where that
    pattern is used.
-   Make selected states visually clear (for example, filled versus
    outlined icon), and expose state to assistive technology.

#### Caption and comments

-   Render the username with semibold emphasis, followed by caption
    text.
-   Keep caption and comments at readable line-height.
-   Long captions can collapse behind a "more" affordance.
-   Separate metadata such as timestamp from the main conversational
    content.
-   Preserve line breaks and links/mentions where supported.

### 3.4 Profile page

A profile view should establish identity quickly:

-   Avatar, username, display name, and biography.
-   Post/follower/following counts where applicable.
-   Follow or edit-profile action depending on viewer permissions.
-   Profile tabs for content types that are available to that account.
-   A responsive post grid or media collection.
-   Clear empty, private, and loading states.

Do not assume every account has the same tabs or public visibility.
Private-account and signed-out states should not look like broken pages.

### 3.5 Explore and search

Discovery should feel more visual and less like the narrow chronological
feed.

-   Use a search input with a clear focused state and accessible label.
-   Present image/video thumbnails in a responsive grid.
-   Allow content details to open without losing the search context.
-   Include query, no-results, loading, and retry states.
-   Avoid treating a Pinterest-style masonry grid as Instagram's
    universal feed layout; it is a separate discovery pattern and should
    be used only if the chosen screen calls for it.

### 3.6 Reels / short-video surface

Reels are a distinct media-consumption surface, not simply a feed post
with a taller image.

-   Prioritize vertical media and persistent playback controls.
-   Keep creator identity, caption/audio metadata, and engagement
    actions discoverable without covering the subject unnecessarily.
-   Make play/pause and mute state understandable.
-   Reserve space for overlays and device safe areas.
-   On web, adapt controls to pointer and keyboard interaction; do not
    copy mobile gestures as the only interaction method.

Meta's 2025 announcement documents ongoing experiments and changes
around Reels, DMs, and the Following tab, so treat the exact navigation
and feed behavior as rollout-dependent. Source:
https://about.fb.com/news/2025/09/in-india-instagram-debuts-a-reels-first-experience-for-its-mobile-app/

## 4. Interaction states

Every interactive component should have explicit states:

-   **Default:** neutral and unobtrusive.
-   **Hover:** small color or surface change; do not add heavy shadows
    to media.
-   **Focus-visible:** high-contrast keyboard focus indicator.
-   **Pressed:** short visual response to activation.
-   **Selected:** liked, saved, active tab, or currently selected
    carousel item.
-   **Disabled:** clearly inactive with sufficient contrast.
-   **Loading:** reserved layout space plus spinner/skeleton where
    useful.
-   **Error:** concise explanation and a retry path when retry makes
    sense.
-   **Empty:** purposeful guidance rather than a blank region.

The supplied guide suggests a `0.2s ease-in-out` color transition. That
is a reasonable prototype default, not a verified production timing
token. Respect `prefers-reduced-motion`.

## 5. Accessibility and responsive requirements

-   Use semantic buttons and links; icon-only controls need accessible
    names.
-   Provide visible keyboard focus and a logical tab order.
-   Do not convey like, unread, or selected state by color alone.
-   Supply meaningful alt text for content images where appropriate;
    decorative images should not create noise for screen readers.
-   Ensure touch targets are comfortably larger than the visible icon.
-   Keep text contrast adequate in both themes.
-   Support keyboard operation for carousels, menus, dialogs, and video
    controls.
-   Return focus to the launching control after a dialog closes.
-   Respect reduced-motion preferences and avoid autoplay surprises.
-   On mobile widths, prevent horizontal page overflow and keep primary
    navigation reachable.

## 6. Implementation guidance

Suggested component boundaries:

``` text
AppShell
├── PrimaryNavigation
├── FeedPage
│   ├── StoriesTray
│   └── PostList
│       └── PostCard
│           ├── PostHeader
│           ├── MediaViewer
│           ├── PostActions
│           ├── Caption
│           └── CommentPreview
├── ExplorePage
├── ReelsPage
├── ProfilePage
└── Dialog / Menu / Toast primitives
```

Keep post data and interaction state separate from presentation. For
example, `PostCard` should receive a typed post model and callbacks such
as `onLike`, `onComment`, `onShare`, and `onSave`, rather than reaching
directly into the database. This makes the UI easy to test against
mocked responses while the backend is being built.

## 7. Do / don't

**Do** - Let the media dominate the post. - Keep the feed typography
compact and consistent. - Use neutral chrome and restrained dividers. -
Keep common actions close to the media. - Reserve layout space for
images and video before loading. - Treat navigation variants as
configurable. - Test responsive and interaction states, not just the
happy path.

**Don't** - Claim approximate CSS values are official Meta tokens. -
Assume every user sees the same navigation or recommendation surfaces. -
Apply masonry layout to every feed. - Add heavy drop shadows or
decorative borders to every image. - Make icon glyphs the entire
clickable target. - omit loading, empty, private, and media-error
states.

## 8. Research references

-   Meta, *In India, Instagram debuts a Reels-first experience for its
    mobile app* (28 Sep 2025):
    https://about.fb.com/news/2025/09/in-india-instagram-debuts-a-reels-first-experience-for-its-mobile-app/
-   Meta, *New Instagram Features to Help You Connect* (6 Aug 2025):
    https://about.fb.com/news/2025/08/new-instagram-features-help-you-connect/
-   Meta, *Reshape Your Instagram With a Recommendations Reset* (19 Nov
    2024; updated Jul 2025):
    https://about.fb.com/news/2024/11/introducing-recommendations-reset-instagram/

These sources support product behavior and feature evolution. They do
**not** publish the exact web CSS values in this document.
