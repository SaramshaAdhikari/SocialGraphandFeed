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
import { CommunitiesPage } from './pages/CommunitiesPage';
import { SettingsAppearancePage } from './pages/SettingsAppearancePage';
import { SettingsProfilePage } from './pages/SettingsProfilePage';
import { MessagesPage } from './pages/MessagesPage';
import { NotificationsPage } from './pages/NotificationsPage';
import { DiagnosticsView } from './components/common/DiagnosticsView';
import { PlaceholderPage } from './components/common/PlaceholderPage';
import { ThemeProvider } from './theme';
import { AuthPage } from './pages/AuthPage';
import { AuthGate } from './pages/AuthGate';
import { AuthProvider } from './auth/AuthContext';
import { PostModalProvider } from './context/PostModalContext';
import { GraphPage } from './pages/GraphPage';

export function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <RouterProvider>
          <AuthProvider>
            <PostModalProvider>
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
              <Route path="/login" element={<AuthPage mode="login" />} />
              <Route path="/register" element={<AuthPage mode="register" />} />
              <Route path="/" element={<HomePage />} />

              {/* Screen 2: Discover */}
              <Route path="/explore" element={<DiscoverPage />} />
              <Route path="/graph" element={<AuthGate><GraphPage /></AuthGate>} />

              {/* Screen 3: Post Detail & Threaded Comments */}
              <Route path="/post/:postId" element={<PostDetailPage />} />

              {/* Screen 4: User Profile */}
              <Route path="/u/:username" element={<UserProfilePage />} />

              {/* Screen 5: Community Hub */}
              <Route path="/c/:communityId" element={<CommunityPage />} />

              {/* Screen 6: Universal Search */}
              <Route path="/search" element={<SearchPage />} />

              {/* Screen 7: Create Post Composer */}
              <Route path="/create" element={<AuthGate><CreatePostPage /></AuthGate>} />

              {/* Direct Messaging */}
              <Route path="/messages" element={<AuthGate><MessagesPage /></AuthGate>} />
              <Route path="/messages/:conversationId" element={<AuthGate><MessagesPage /></AuthGate>} />
              <Route path="/notifications" element={<AuthGate><NotificationsPage /></AuthGate>} />

              {/* Supporting Surface: Saved Collections */}
              <Route path="/saved" element={<AuthGate><SavedCollectionsPage /></AuthGate>} />

              {/* Supporting Surface: Community Directory */}
              <Route path="/communities" element={<CommunitiesPage />} />

            {/* Settings & Appearance Personalization */}
            <Route path="/settings" element={<AuthGate><SettingsProfilePage /></AuthGate>} />
            <Route path="/settings/profile" element={<AuthGate><SettingsProfilePage /></AuthGate>} />
            <Route path="/settings/appearance" element={<SettingsAppearancePage />} />

            {/* Repurposed Milestone 1 Diagnostics */}
            <Route path="/diagnostics" element={<DiagnosticsView />} />
          </Routes>
              </AppLayout>
            </PostModalProvider>
          </AuthProvider>
      </RouterProvider>
    </ThemeProvider>
  </ErrorBoundary>
  );
}

export default App;
