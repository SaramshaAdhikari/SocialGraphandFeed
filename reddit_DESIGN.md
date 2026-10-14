---
description: |
  A discussion-first social interface organized around communities, post
  metadata, voting, comment threads, and discovery. This guide expands
  the supplied Reddit frontend notes into a practical implementation
  reference. It separates public brand/product facts from approximate
  web UI measurements; it is not Reddit's internal design-system
  specification.
name: Reddit Web Design Analysis
version: alpha
---

# Reddit Web Design Analysis

## Scope and confidence

This guide expands the supplied `reddit_design_guide.md`. It is intended
to help implement a **Reddit-inspired community discussion interface**,
not to claim that every dimension or token exactly matches Reddit's
current production web app.

Reddit's interface changes over time and may vary by viewport, account,
experiment, and community. In addition, communities can customize
aspects of their appearance. Treat pixel values below as prototype
estimates unless they are explicitly attributed to a public source.

Confidence labels:

-   **Publicly documented:** supported by Reddit's published brand
    guidance or Help Center.
-   **Observed pattern:** recurring visible product behavior, but not a
    guaranteed implementation spec.
-   **Approximation:** a practical CSS starting point; verify against
    the chosen target viewport.

## Design intent

Reddit is **conversation-first and community-organized**. A post is not
just a content card: it belongs to a community, has an author and
timestamp, supports voting, and leads into a comment thread. The design
must make dense information scannable without making controls hard to
use.

Core principles:

-   Make community identity and post context visible near the top of
    each post.
-   Keep titles, text, media, and comments easy to scan.
-   Treat voting as a primary interaction, with a clearly visible
    selected state.
-   Make comment hierarchy and reply relationships legible.
-   Use restrained surfaces and borders to separate content without
    excessive shadow.
-   Support several feed density modes where appropriate.
-   Keep community customization distinct from global application
    chrome.

Reddit's published brand guidelines describe **Reddit Sans** as its
brand typeface and emphasize readability. They are brand guidelines, not
a complete public token specification for every web UI component.
Source:
https://redditinc.com/hubfs/Reddit%20Inc/PDF/reddit_brand_guidelines_version_2022_2022-04-01-160548_akmi.pdf

## 1. Design tokens

### 1.1 Light theme

The supplied guide lists these familiar Reddit-inspired values. Use them
as **approximate interface tokens**, not a verified current
design-system export.

  ------------------------------------------------------------------------------
  Token              Value                   Intended use      Confidence
  ------------------ ----------------------- ----------------- -----------------
  `brand`            `#FF4500`               Brand accent and  Public brand
                                             selected voting   association /
                                             emphasis          approximate UI
                                                               use

  `canvas`           `#DAE0E6`               Outer app         Approximation;
                                             background in a   layout variants
                                             card-on-canvas    may use white
                                             layout            

  `surface`          `#FFFFFF`               Main content      Observed pattern
                                             panels and cards  

  `text-primary`     `#1A1A1B`               Titles and        Approximation
                                             primary text      

  `text-secondary`   `#787C7E`               Metadata,         Approximation
                                             timestamps,       
                                             secondary actions 

  `border`           `#EDEFF1`               Subtle separators Approximation

  `border-strong`    `#CCCCCC`               Stronger          Approximation
                                             boundaries or     
                                             selected panel    
                                             edges             

  `vote-rail`        `#F8F9FA`               Optional voting   Approximation
                                             column background 
                                             in a compact-card 
                                             variant           

  `hover-surface`    `rgba(0, 0, 0, 0.05)`   Subtle hover      Approximation
                                             feedback on       
                                             controls          
  ------------------------------------------------------------------------------

Some current Reddit surfaces use a white page canvas rather than a
blue-gray outer background. Use semantic tokens (`canvas`, `surface`,
`surface-muted`) so the layout can be tuned without rewriting
components.

### 1.2 Dark theme

The supplied guide suggests the following starting palette. Validate
contrast and component boundaries in the actual implementation.

  Token                   Value
  ----------------------- -----------
  `canvas-dark`           `#030303`
  `surface-dark`          `#1A1A1B`
  `text-primary-dark`     `#D7DADC`
  `text-secondary-dark`   `#818384`
  `border-dark`           `#343536`
  `brand`                 `#FF4500`

Do not derive every dark surface by simply inverting the light theme.
Keep separate semantic tokens for cards, nested comments, hover,
selected votes, disabled controls, and dividers.

### 1.3 Typography

Reddit's public brand guidelines identify **Reddit Sans** as the
official brand typeface. Availability of the production font in a
prototype is not guaranteed. Use a practical fallback stack:

``` css
font-family:
  "Reddit Sans", "IBM Plex Sans", "Noto Sans",
  system-ui, -apple-system, "Segoe UI", sans-serif;
```

The supplied guide proposes a compact interface scale:

  -------------------------------------------------------------------------
  Role                    Approx. size               Weight Use
  --------------- -------------------- -------------------- ---------------
  Post title                    `18px`             500--600 Main post
                                                            headline

  Body / post                   `14px`                  400 Text post and
  text                                                      comment content

  Community /                `12–14px`                  600 Post metadata
  author                                                    

  Timestamp /                   `12px`                  400 Relative time
  metadata                                                  and secondary
                                                            information

  Action label               `12–14px`                  600 Comments,
                                                            share, save,
                                                            menu

  Page /                     `24–32px`             600--700 Top-level page
  community                                                 hierarchy
  heading                                                   
  -------------------------------------------------------------------------

These sizes are implementation guidance, not official Reddit product
tokens. Keep line-height comfortable (about `1.4–1.55` for body text)
and prioritize readability in long comment threads.

### 1.4 Shape and spacing

  Element                   Suggested value Notes
  ----------------------- ----------------- -----------------------------------
  Standard card radius              `4–8px` Supplied guide's estimate
  Search field               pill / `999px` Rounded search pattern
  Small control radius                `4px` Compact menus and inline controls
  Standard spacing                    `8px` Tight component rhythm
  Main spacing                       `16px` Between feed elements
  Column gap                      `16–24px` Desktop layout estimate
  Post vote rail               about `40px` Supplied guide's estimate
  Community icon            about `20–32px` Depends on placement
  Top navigation height           `48–56px` Supplied guide's estimate

Use a restrained radius vocabulary. A discussion platform benefits from
clear alignment and readable nesting more than decorative card
treatments.

## 2. Layout architecture

### 2.1 Desktop shell

The supplied guide describes a three-region layout:

``` text
┌──────────────────────────────────────────────────────────────┐
│ Global navigation: logo, feed/community navigation, search   │
├───────────────┬───────────────────────────────┬──────────────┤
│ Left sidebar │ Main feed / discussion thread  │ Right rail   │
│ Communities   │ Post cards and comment tree    │ Context      │
└───────────────┴───────────────────────────────┴──────────────┘
```

The exact number of columns depends on the screen and current Reddit
experience. A robust implementation should allow the right rail to
disappear first, then compact the left navigation.

Suggested desktop starting measurements:

  Region                     Approx. width Confidence
  ------------------------ --------------- ---------------
  Centered app content        `1248px` max Approximation
  Left navigation                  `240px` Approximation
  Main feed                  up to `640px` Approximation
  Right information rail           `312px` Approximation
  Column gap                     `16–24px` Approximation

These widths are a design starting point, not fixed requirements. Use
CSS grid with min/max constraints rather than a brittle fixed-width
page.

### 2.2 Responsive behavior

-   **Wide desktop:** global top bar, expanded community/navigation
    rail, main feed, optional right rail.
-   **Medium desktop/tablet:** reduce or collapse the left rail; hide
    the right rail when content gets cramped.
-   **Mobile:** single-column feed; use compact navigation and make
    voting/comment actions easy to reach. Comment threads should
    preserve reply hierarchy without creating a narrow unreadable text
    column.

Test at 1440px, 1280px, 1024px, 768px, 390px, and 360px. Do not assume a
desktop three-column design will scale down naturally without layout
changes.

### 2.3 Feed density

Support at least two useful content densities if the product requires
it:

-   **Comfortable/card view:** larger spacing, visible media, more post
    context.
-   **Compact view:** less vertical padding and a tighter title/metadata
    arrangement.

Reddit's Help Center has documented experiments around compact mode and
feed behavior, reinforcing that feed density is not a universal fixed
setting. Source:
https://support.reddithelp.com/hc/en-us/articles/42961314311700-Changelog-November-4-2025

## 3. Core components

### 3.1 Global navigation

Typical elements:

-   Reddit-inspired brand mark and wordmark (for a derivative project,
    create original branding instead of reusing protected marks).
-   Home or feed selector.
-   Search input.
-   Create-post action.
-   Inbox/notification entry points.
-   User profile menu.

Suggested behavior:

-   Keep the navigation anchored at the top on long feeds.
-   Search should have default, focused, typing, result, and empty
    states.
-   Menus should open predictably and close with Escape or outside
    click.
-   Notification indicators should not be communicated by color alone.
-   At narrower widths, prioritize search and primary navigation; move
    secondary actions into a menu if necessary.

The supplied guide suggests a `48–56px` top bar and a pill-shaped search
input. These are approximations.

### 3.2 Post card (`FeedPost`)

A feed post typically contains:

``` text
FeedPost
├── VoteControl (upvote / score / downvote)
├── PostHeader
│   ├── Community icon + community name
│   ├── Author
│   ├── Timestamp
│   └── Optional join/follow action
├── PostContent
│   ├── Title
│   ├── Optional text body
│   ├── Optional image / video / link preview / poll
│   └── Optional flair
└── PostActions
    ├── Comments
    ├── Share
    ├── Save
    └── More actions (hide/report/etc. where supported)
```

Some feed variants place the voting controls in a left rail; others use
a compact horizontal voting/action row. Keep the component configurable
instead of assuming one layout is universal.

#### Vote control

-   Separate upvote and downvote buttons from the score label.
-   Show neutral, upvoted, and downvoted states distinctly.
-   Keep the score aligned and avoid layout shifts as it changes.
-   Make each button independently keyboard accessible.
-   Provide accessible names such as "Upvote post" and "Downvote post".
-   Support pending/error states if votes are saved asynchronously.

Voting is a core Reddit interaction. Reddit's Help Center explains that
upvotes and downvotes express whether content contributes positively to
the community; it also notes that vote counts may sometimes be hidden
temporarily. Source:
https://support.reddithelp.com/hc/en-us/articles/7419626610708-What-are-upvotes-and-downvotes

#### Header metadata

-   Community icon: circular or rounded, approximately `20–32px`.
-   Community name: visually emphasized and clickable.
-   Author and timestamp: smaller, lower-emphasis metadata.
-   Optional join action: visible but secondary to reading the post.
-   More-actions menu: keep it discoverable and consistent across cards.

Avoid forcing every metadata item into a single line at mobile widths.
Wrap or truncate intentionally.

#### Content body

Support different post types without changing the card's overall
information hierarchy:

-   Text-only post.
-   Image or gallery.
-   Video.
-   External link preview.
-   Poll or structured post where implemented.

Reserve media dimensions to prevent layout shift. Provide loading,
unavailable, and failed-media states. For link previews, distinguish the
source domain from the post title and avoid pretending that an external
preview is the original content.

#### Action row

Common actions include comments, share, save, and a more-actions menu.
Some actions may be hidden under a menu or vary by post type.

-   Use compact labels and icons.
-   Keep the comment count near the comments action.
-   Use subtle hover surfaces rather than large shadows.
-   Give controls visible focus and pressed states.
-   Do not show actions that are unsupported by the current post type or
    viewer permissions.

### 3.3 Comment thread

The comment thread is the most important difference between a generic
social feed and a discussion product.

-   Display author, timestamp, vote controls, comment body, and reply
    action.
-   Represent nesting with indentation and/or vertical thread guides.
-   Keep indentation bounded so deeply nested replies remain readable on
    mobile.
-   Allow a thread to collapse and expand.
-   Distinguish a collapsed comment's author and context from its hidden
    body.
-   Make reply composition available at the appropriate level.
-   Preserve the user's place when expanding a thread or returning from
    a post.

A useful data/display structure:

``` text
Comment
├── CommentHeader (author, timestamp, menu)
├── CommentBody
├── CommentActions (vote, reply, share, more)
└── Replies
    └── Comment ...
```

Do not rely on color alone to communicate thread depth. Use indentation,
connectors, spacing, and clear reply hierarchy together.

### 3.4 Community page

A community page should make the group's identity and rules discoverable
before asking users to contribute.

Typical regions:

-   Community icon and banner (where configured).
-   Community name and short description.
-   Join/Joined action.
-   Member/online information if available.
-   Create-post action.
-   Sort controls for the feed.
-   Community posts.
-   Optional sidebar with description, rules, moderators, and related
    information.

Reddit's Help Center documents community appearance controls such as
icon, banner, key color, base color, pinned-post color, and sidebar
widgets. This means community-specific color treatment is a real product
concept; it should not be treated as a universal global palette. Source:
https://support.reddithelp.com/hc/en-us/articles/15484082557332-Community-Appearance-overview

### 3.5 Create-post flow

A creation flow may include:

1.  Select a community.
2.  Choose a post type (text, image/video, link, poll, if supported).
3.  Enter title and content.
4.  Add optional flair or metadata.
5.  Validate required fields.
6.  Preview and submit.
7.  Show success, pending, or failure feedback.

Use explicit labels and validation. Preserve the draft if submission
fails. On mobile, keep the primary submit action reachable without
covering essential input.

### 3.6 Search and discovery

-   Provide a global query input.
-   Make community and post results visually distinguishable.
-   Include filters/sort controls where implemented.
-   Show loading, no-results, retry, and empty-query states.
-   Preserve query and scroll context when opening a result and
    returning.
-   Do not imply that all feeds use the same ranking logic.

### 3.7 Right rail / context widgets

Optional widgets can include community information, rules, related
communities, trending topics, or account prompts. Keep the rail
subordinate to the main post content and remove it when the viewport
cannot support it.

## 4. Interaction states and motion

Define these states consistently across votes, buttons, tabs, cards,
menus, and inputs:

-   Default
-   Hover
-   Focus-visible
-   Pressed
-   Selected (joined community, upvoted, downvoted, active sort)
-   Disabled
-   Loading/pending
-   Success
-   Error
-   Empty/no-results
-   Collapsed/expanded (comments and sidebars)

The supplied guide proposes subtle hover backgrounds and border changes.
Avoid aggressive movement: content-heavy pages need stable geometry
while users scan and scroll. Respect `prefers-reduced-motion`.

### Scroll and performance

Infinite or paginated feeds need stable keys, reserved media dimensions,
and careful state retention. If implementing virtualized lists, preserve
focus and reading position when rows are recycled. Avoid loading an
unlimited number of comments into the DOM at once.

Reddit has publicly documented feed behavior changes, including
restoring the last visited post position in a mobile feed and
experiments around trending stories. These examples illustrate that
scroll and feed behavior can evolve; they do not prescribe an exact
algorithm for this prototype. Source:
https://support.reddithelp.com/hc/en-us/articles/38922264026260-Changelog-July-1-2025

## 5. Accessibility

-   Use semantic buttons for votes, replies, join, save, and menu
    actions.
-   Give icon-only controls descriptive accessible names.
-   Expose selected vote state programmatically.
-   Maintain keyboard access to comment threads and menus.
-   Provide visible focus indicators and logical focus order.
-   Do not use orange alone to signal selection or error.
-   Preserve readable line length and contrast in long comments.
-   Keep deeply nested comments usable at small widths.
-   Ensure dialogs trap focus appropriately and return focus on close.
-   Provide alt text for meaningful media and captions/transcripts where
    appropriate for video.

## 6. Implementation guidance

Suggested component structure:

``` text
AppShell
├── TopNavigation
├── LeftCommunityNavigation
├── FeedPage
│   ├── FeedSort
│   └── FeedPost
│       ├── VoteControl
│       ├── PostHeader
│       ├── PostContent
│       └── PostActions
├── PostDetailPage
│   ├── FeedPost
│   ├── CommentComposer
│   └── CommentThread
├── CommunityPage
├── SearchPage
├── CreatePostDialog
└── RightContextRail
```

Keep rendering separate from persistence and network operations. A post
component should accept a typed post object and callbacks (`onVote`,
`onReply`, `onSave`, `onShare`) rather than making database calls
directly. Use optimistic updates only when rollback/error feedback is
implemented.

For a derivative project, use Reddit as a **behavioral and layout
reference**, but create an original name, logo, iconography, and color
system. Reddit's public trademark policy says its marks and brand assets
cannot be used in ways that suggest affiliation or endorsement without
authorization. Source:
https://redditinc.com/policies/trademark-use-policy

## 7. Do / don't

**Do** - Make community and author context immediately visible. - Keep
voting easy to understand and operate. - Give comment nesting a clear
visual structure. - Support text, image, link, and other post variants
intentionally. - Provide compact and comfortable density options if
useful. - Use community-specific appearance as an optional layer. - Test
empty, error, loading, collapsed, and selected states. - Keep feed
scrolling stable while content loads.

**Don't** - Present approximate dimensions as official Reddit tokens. -
Assume all posts share one media layout. - Use color as the only
vote-state indicator. - Allow deep nesting to squeeze comment text to an
unreadable width. - add heavy shadows to every card or animate card
positions unnecessarily. - Copy Reddit's logo, Snoo, or protected
branding into an original project. - Build the UI so every control
depends on a live backend before it can be previewed.

## 8. Research references

-   Reddit, *Brand Guidelines* (PDF; typography and brand guidance):
    https://redditinc.com/hubfs/Reddit%20Inc/PDF/reddit_brand_guidelines_version_2022_2022-04-01-160548_akmi.pdf
-   Reddit Help, *Community Appearance --- overview* (updated Apr 2025):
    https://support.reddithelp.com/hc/en-us/articles/15484082557332-Community-Appearance-overview
-   Reddit Help, *What are upvotes and downvotes?* (updated Oct 2026):
    https://support.reddithelp.com/hc/en-us/articles/7419626610708-What-are-upvotes-and-downvotes
-   Reddit Help, *Changelog --- July 1, 2025* (feed behavior and
    keyboard shortcuts):
    https://support.reddithelp.com/hc/en-us/articles/38922264026260-Changelog-July-1-2025
-   Reddit Help, *Changelog --- November 4, 2025* (feed density
    experiments):
    https://support.reddithelp.com/hc/en-us/articles/42961314311700-Changelog-November-4-2025
-   Reddit Inc., *Trademark Use Policy*:
    https://redditinc.com/policies/trademark-use-policy

The references support the documented product behaviors and brand
guidance. They do **not** verify every pixel value in the implementation
tables.
