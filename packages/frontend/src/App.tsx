import { RouterProvider, Routes, Route } from './router/Router';
import { AppLayout } from './components/layout/AppLayout';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { HomeFeedFoundation } from './components/common/HomeFeedFoundation';
import { DiagnosticsView } from './components/common/DiagnosticsView';
import { PlaceholderPage } from './components/common/PlaceholderPage';

export function App() {
  return (
    <ErrorBoundary>
      <RouterProvider>
        <AppLayout>
          <Routes
            fallback={
              <PlaceholderPage
                title="Page Not Found (404)"
                personality="Utility & Management"
                milestone="Error Boundary"
                reference="RFC 7807 Standard"
                description="The requested route does not match any registered application paths."
              />
            }
          >
            {/* Screen 1: Home Feed */}
            <Route path="/" element={<HomeFeedFoundation />} />

            {/* Screen 2: Discover */}
            <Route
              path="/explore"
              element={
                <PlaceholderPage
                  title="Discover (Visual Masonry)"
                  personality="Visual Discovery (90% Imagery, High Density)"
                  milestone="Checkpoint 2.4 — Screen 2"
                  reference="pinterest_DESIGN.md"
                  description="Multi-column greedy shortest-column masonry gallery preserving natural aspect ratios without layout shift."
                />
              }
            />

            {/* Screen 3: Post Detail & Threaded Comments */}
            <Route
              path="/post/:postId"
              element={
                <PlaceholderPage
                  title="Post Detail & Discussion"
                  personality="Discussion & Community"
                  milestone="Checkpoint 2.5 — Screen 3"
                  reference="reddit_DESIGN.md & instagram_DESIGN.md"
                  description="Focused reading canvas with full media viewer and collapsible nested comment tree with branch guide lines."
                />
              }
            />

            {/* Screen 4: User Profile */}
            <Route
              path="/u/:username"
              element={
                <PlaceholderPage
                  title="User Profile & Content Tabs"
                  personality="Profiles & Creator Media (70% Media, Structured)"
                  milestone="Checkpoint 2.6 — Screen 4"
                  reference="instagram_DESIGN.md"
                  description="Identity hub with 120px avatar, follower counts, optimistic follow toggle, and content tabs."
                />
              }
            />

            {/* Screen 5: Community Hub */}
            <Route
              path="/c/:communityId"
              element={
                <PlaceholderPage
                  title="Community Hub"
                  personality="Discussion & Community"
                  milestone="Checkpoint 2.7 — Screen 5"
                  reference="reddit_DESIGN.md"
                  description="Dedicated topical space with community header banner, member count, scoped feed, and rules sidebar."
                />
              }
            />

            {/* Screen 6: Universal Search */}
            <Route
              path="/search"
              element={
                <PlaceholderPage
                  title="Universal Search"
                  personality="Utility & Management"
                  milestone="Checkpoint 2.8 — Screen 6"
                  reference="meta_DESIGN.md"
                  description="Multi-entity search with debounced querying and tabbed filters across posts, communities, and people."
                />
              }
            />

            {/* Supporting Surface: Saved Collections */}
            <Route
              path="/saved"
              element={
                <PlaceholderPage
                  title="Saved & Collections"
                  personality="Visual Discovery & Personal Library"
                  milestone="Supporting Surface (Milestone 4)"
                  reference="pinterest_DESIGN.md"
                  description="Personal curation library for saved visual pins and bookmarked discussions."
                />
              }
            />

            {/* Supporting Surface: Community Directory */}
            <Route
              path="/communities"
              element={
                <PlaceholderPage
                  title="Community Directory"
                  personality="Utility & Management"
                  milestone="Supporting Surface (Milestone 4)"
                  reference="reddit_DESIGN.md"
                  description="Curated catalog of topical communities across systems, algorithms, hardware, and design."
                />
              }
            />

            {/* Repurposed Milestone 1 Diagnostics */}
            <Route path="/diagnostics" element={<DiagnosticsView />} />
          </Routes>
        </AppLayout>
      </RouterProvider>
    </ErrorBoundary>
  );
}

export default App;
