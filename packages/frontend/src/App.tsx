import { RouterProvider, Routes, Route } from './router/Router';
import { AppLayout } from './components/layout/AppLayout';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { HomePage } from './pages/HomePage';
import { DiscoverPage } from './pages/DiscoverPage';
import { PostDetailPage } from './pages/PostDetailPage';
import { UserProfilePage } from './pages/UserProfilePage';
import { CommunityPage } from './pages/CommunityPage';
import { SearchPage } from './pages/SearchPage';
import { CreatePostPage } from './pages/CreatePostPage';
import { SavedCollectionsPage } from './pages/SavedCollectionsPage';
import { SettingsAppearancePage } from './pages/SettingsAppearancePage';
import { DiagnosticsView } from './components/common/DiagnosticsView';
import { PlaceholderPage } from './components/common/PlaceholderPage';
import { ThemeProvider } from './theme';

export function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
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
              <Route path="/" element={<HomePage />} />

              {/* Screen 2: Discover */}
              <Route path="/explore" element={<DiscoverPage />} />

              {/* Screen 3: Post Detail & Threaded Comments */}
              <Route path="/post/:postId" element={<PostDetailPage />} />

              {/* Screen 4: User Profile */}
              <Route path="/u/:username" element={<UserProfilePage />} />

              {/* Screen 5: Community Hub */}
              <Route path="/c/:communityId" element={<CommunityPage />} />

              {/* Screen 6: Universal Search */}
              <Route path="/search" element={<SearchPage />} />

              {/* Screen 7: Create Post Composer */}
              <Route path="/create" element={<CreatePostPage />} />

              {/* Supporting Surface: Saved Collections */}
              <Route path="/saved" element={<SavedCollectionsPage />} />

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

            {/* Settings & Appearance Personalization */}
            <Route path="/settings" element={<SettingsAppearancePage />} />
            <Route path="/settings/appearance" element={<SettingsAppearancePage />} />

            {/* Repurposed Milestone 1 Diagnostics */}
            <Route path="/diagnostics" element={<DiagnosticsView />} />
          </Routes>
        </AppLayout>
      </RouterProvider>
    </ThemeProvider>
  </ErrorBoundary>
);
}

export default App;
