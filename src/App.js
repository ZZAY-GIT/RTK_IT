import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './store';
import { useAuth } from './hooks/useAuth';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import History from './pages/History';
import Admin from './pages/Admin';
import CSVUploadModal from './components/CSVUploadModal';

function ProtectedRoute({ children, adminOnly = false }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" />;
  if (adminOnly && user.role !== 'operator' && user.role !== 'admin') return <Navigate to="/dashboard" />;
  return children;
}

function App() {
  const [isCSVModalOpen, setIsCSVModalOpen] = useState(false);

  return (
    <Provider store={store}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
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
              <ProtectedRoute adminOnly={true}>
                <Admin onOpenCSVModal={() => setIsCSVModalOpen(true)} />
              </ProtectedRoute>
            }
          />
          <Route path="/" element={<Navigate to="/dashboard" />} />
        </Routes>
        <CSVUploadModal
          isOpen={isCSVModalOpen}
          onClose={() => setIsCSVModalOpen(false)}
        />
      </BrowserRouter>
    </Provider>
  );
}

export default App;