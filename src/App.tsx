import { lazy, Suspense, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { RootLayout } from '@/components/layout/RootLayout';
import AnimatedBackground from '@/components/layout/AnimatedBackground';
import { useAppStore } from '@/store/appStore';
import { useAuthStore } from '@/store/authStore';

const DashboardPage = lazy(() => import('@/pages/DashboardPage'));
const PatchesPage = lazy(() => import('@/pages/PatchesPage'));
const PatchDetailPage = lazy(() => import('@/pages/PatchDetailPage'));
const PatchFormPage = lazy(() => import('@/pages/PatchFormPage'));
const TimelinePage = lazy(() => import('@/pages/TimelinePage'));
const HotfixPage = lazy(() => import('@/pages/HotfixPage'));
const AuditPage = lazy(() => import('@/pages/AuditPage'));
const DocumentsPage = lazy(() => import('@/pages/DocumentsPage'));
const ClassificationsPage = lazy(() => import('@/pages/ClassificationsPage'));
const GitHubPage = lazy(() => import('@/pages/GitHubPage'));
const SettingsPage = lazy(() => import('@/pages/SettingsPage'));
const UsersPage = lazy(() => import('@/pages/UsersPage'));
const LoginPage = lazy(() => import('@/pages/LoginPage'));
const ProjectsPage = lazy(() => import('@/pages/ProjectsPage'));
const ProjectDetailPage = lazy(() => import('@/pages/ProjectDetailPage'));
const HistoryPage = lazy(() => import('@/pages/HistoryPage'));
const PermissionsPage = lazy(() => import('@/pages/PermissionsPage'));

function PageLoader() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-red border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, checkAuth } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    checkAuth().then(() => {
      if (!useAuthStore.getState().isAuthenticated) {
        navigate('/login', { replace: true });
      }
    });
  }, [checkAuth, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-red border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) return null;
  return <>{children}</>;
}

export default function App() {
  useEffect(() => {
    useAppStore.getState().init();
  }, []);

  return (
    <>
      <AnimatedBackground />
      <Routes>
        <Route path="/login" element={
        <Suspense fallback={<PageLoader />}>
          <LoginPage />
        </Suspense>
      } />
      <Route element={
        <AuthGuard>
          <RootLayout />
        </AuthGuard>
      }>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route
          path="/dashboard"
          element={
            <Suspense fallback={<PageLoader />}>
              <DashboardPage />
            </Suspense>
          }
        />
        <Route
          path="/patches"
          element={
            <Suspense fallback={<PageLoader />}>
              <PatchesPage />
            </Suspense>
          }
        />
        <Route
          path="/patches/new"
          element={
            <Suspense fallback={<PageLoader />}>
              <PatchFormPage />
            </Suspense>
          }
        />
        <Route
          path="/patches/:id"
          element={
            <Suspense fallback={<PageLoader />}>
              <PatchDetailPage />
            </Suspense>
          }
        />
        <Route
          path="/timeline"
          element={
            <Suspense fallback={<PageLoader />}>
              <TimelinePage />
            </Suspense>
          }
        />
        <Route
          path="/hotfixes"
          element={
            <Suspense fallback={<PageLoader />}>
              <HotfixPage />
            </Suspense>
          }
        />
        <Route
          path="/history/audit"
          element={
            <Suspense fallback={<PageLoader />}>
              <AuditPage />
            </Suspense>
          }
        />
        <Route
          path="/documents"
          element={
            <Suspense fallback={<PageLoader />}>
              <DocumentsPage />
            </Suspense>
          }
        />
        <Route
          path="/classifications"
          element={
            <Suspense fallback={<PageLoader />}>
              <ClassificationsPage />
            </Suspense>
          }
        />
        <Route
          path="/github"
          element={
            <Suspense fallback={<PageLoader />}>
              <GitHubPage />
            </Suspense>
          }
        />
        <Route
          path="/settings"
          element={
            <Suspense fallback={<PageLoader />}>
              <SettingsPage />
            </Suspense>
          }
        />
        <Route
          path="/users"
          element={
            <Suspense fallback={<PageLoader />}>
              <UsersPage />
            </Suspense>
          }
        />
        <Route
          path="/projects"
          element={
            <Suspense fallback={<PageLoader />}>
              <ProjectsPage />
            </Suspense>
          }
        />
        <Route
          path="/projects/:id"
          element={
            <Suspense fallback={<PageLoader />}>
              <ProjectDetailPage />
            </Suspense>
          }
        />
        <Route
          path="/calendar"
          element={<Navigate to="/projects" replace />}
        />
        <Route
          path="/history"
          element={
            <Suspense fallback={<PageLoader />}>
              <HistoryPage />
            </Suspense>
          }
        />
        <Route
          path="/archive"
          element={
            <Suspense fallback={<PageLoader />}>
              <HistoryPage />
            </Suspense>
          }
        />
        <Route
          path="/permissions"
          element={
            <Suspense fallback={<PageLoader />}>
              <PermissionsPage />
            </Suspense>
          }
        />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Route>
    </Routes>
    </>
  );
}
