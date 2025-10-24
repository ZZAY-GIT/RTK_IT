import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';           // Исправлено
import Dashboard from './pages/Dashboard';
import History from './pages/History';
import { useAuth } from './hooks/useAuth';

// Защищённый роут
function ProtectedRoute({ children }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" replace />;
}

function App() {
  const [isCSVModalOpen, setIsCSVModalOpen] = useState(false);

  return (
    <BrowserRouter>
      <Routes>
        {/* Публичный роут */}
        <Route path="/login" element={<Login />} />

        {/* Главная — редирект */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />

        {/* Защищённые роуты */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard
                isCSVModalOpen={isCSVModalOpen}
                setIsCSVModalOpen={setIsCSVModalOpen}
              />
            </ProtectedRoute>
          }
        />

        <Route
          path="/history"
          element={
            <ProtectedRoute>
              <History />
            </ProtectedRoute>
          }
        />

        {/* 404 */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;