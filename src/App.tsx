import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from './store/authStore';
import SettingsInitializer from './components/app/SettingsInitializer';

// Layout
import MainLayout from './components/layout/MainLayout';
import ProtectedRoute from './components/common/ProtectedRoute';
import RoleGuard from './components/auth/RoleGuard';

// Auth Pages
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';

// Dashboard
import DashboardPage from './pages/dashboard/DashboardPage';

// Inventory Pages
import InventoryPage from './pages/inventory/InventoryPage';
import ProductFormPage from './pages/inventory/ProductFormPage';

// Settings Pages
import StoresPage from './pages/settings/StoresPage';
import SettingsPage from './pages/settings/SettingsPage';

// POS Pages
import POSPage from './pages/pos/POSPage';

// QR Code Pages
import QRCodePage from './pages/qrcode/QRCodePage';

// Reports Pages
import ReportsPage from './pages/reports/ReportsPage';

// Team Pages
import TeamPage from './pages/team/TeamPage';

// Create QueryClient instance
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function App() {
  const { isAuthenticated } = useAuthStore();

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <SettingsInitializer />
        <Routes>
          {/* Public routes */}
          <Route
            path="/login"
            element={
              isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />
            }
          />
          <Route
            path="/register"
            element={
              isAuthenticated ? <Navigate to="/dashboard" replace /> : <RegisterPage />
            }
          />

          {/* Protected routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <DashboardPage />
                </MainLayout>
              </ProtectedRoute>
            }
          />

          {/* Inventory routes */}
          <Route
            path="/inventory"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <InventoryPage />
                </MainLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/inventory/products/new"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <ProductFormPage />
                </MainLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/inventory/products/:id/edit"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <ProductFormPage />
                </MainLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/inventory/products/:id"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <ProductFormPage />
                </MainLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/pos"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <POSPage />
                </MainLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/product-codes"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <QRCodePage />
                </MainLayout>
              </ProtectedRoute>
            }
          />

          {/* Reports - OWNER and MANAGER only */}
          <Route
            path="/reports"
            element={
              <ProtectedRoute>
                <RoleGuard requiredPath="/reports">
                  <MainLayout>
                    <ReportsPage />
                  </MainLayout>
                </RoleGuard>
              </ProtectedRoute>
            }
          />

          {/* Team routes - OWNER and MANAGER only */}
          <Route
            path="/team"
            element={
              <ProtectedRoute>
                <RoleGuard requiredPath="/team">
                  <MainLayout>
                    <TeamPage />
                  </MainLayout>
                </RoleGuard>
              </ProtectedRoute>
            }
          />

          {/* Settings routes */}
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <SettingsPage />
                </MainLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/settings/stores"
            element={
              <ProtectedRoute>
                <RoleGuard requiredPath="/settings/stores">
                  <MainLayout>
                    <StoresPage />
                  </MainLayout>
                </RoleGuard>
              </ProtectedRoute>
            }
          />

          {/* Root redirect */}
          <Route
            path="/"
            element={
              <Navigate to={isAuthenticated ? '/dashboard' : '/login'} replace />
            }
          />

          {/* 404 */}
          <Route
            path="*"
            element={
              <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
                <div className="card max-w-md text-center">
                  <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
                    404
                  </h1>
                  <p className="text-gray-600 dark:text-gray-400 mb-6">
                    Page not found
                  </p>
                  <a href="/" className="btn btn-primary">
                    Go Home
                  </a>
                </div>
              </div>
            }
          />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
