import { useState, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './store';
import { ThemeProvider } from './hooks/useTheme';

// === Компоненты ===
import ProtectedRoute from './components/ProtectedRoute';  // Убрали ./
import CSVUploadModal from './components/CSVUploadModal';
import Loader from './components/Loader';

// === Фичи (lazy loading) ===
const Login = lazy(() => import('./auth/components/Login'));
const ForgotPassword = lazy(() => import('./auth/components/ForgotPassword'));
const Dashboard = lazy(() => import('./features/dashboard/components/Dashboard'));
const History = lazy(() => import('./features/history/components/History'));
const Admin = lazy(() => import('./features/admin/components/Admin'));
const NotFound = lazy(() => import('./components/NotFound'));// Создайте или удалите

function App() {
  const [isCSVModalOpen, setIsCSVModalOpen] = useState(false);

  return (
    <ThemeProvider>
      <Provider store={store}>
        <BrowserRouter>
          <Suspense fallback={<Loader />}>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />

              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Dashboard onOpenCSVModal={() => setIsCSVModalOpen(true)} />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/history"
                element={
                  <ProtectedRoute>
                    <History onOpenCSVModal={() => setIsCSVModalOpen(true)} />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin"
                element={
                  <ProtectedRoute adminOnly>
                    <Admin onOpenCSVModal={() => setIsCSVModalOpen(true)} />
                  </ProtectedRoute>
                }
              />

              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="*" element={<NotFound />} />
            </Routes>

            <CSVUploadModal
              isOpen={isCSVModalOpen}
              onClose={() => setIsCSVModalOpen(false)}
            />
          </Suspense>
        </BrowserRouter>
      </Provider>
    </ThemeProvider>
  );
}

export default App;