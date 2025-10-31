import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../hooks/useTheme';
import { SunIcon, MoonIcon } from '@heroicons/react/outline';
import logo from '../assets/logo.png';

function Header({ onOpenCSVModal }) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActiveLink = (path) => location.pathname === path;

  // Кнопка CSV: всегда передаётся onOpenCSVModal, но:
  // - на /dashboard — visibility: hidden + pointer-events: none
  // - на других страницах — visible + clickable
  const isDashboard = location.pathname === '/dashboard';
  const showCSVButton = !!onOpenCSVModal;

  return (
    <header className="bg-white dark:bg-gray-800 shadow-md">
      {/* Верхняя панель */}
      <div className="px-6 py-3 flex items-center justify-between border-b dark:border-gray-700">
        <div className="flex items-center space-x-4">
          <Link to="/dashboard">
            <img src={logo} alt="Ростелеком" className="h-10 w-auto" />
          </Link>
          <h1 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
            Умный склад
          </h1>
        </div>

        <div className="flex items-center space-x-6">
          {/* Пользователь */}
          {user ? (
            <div className="text-sm text-gray-700 dark:text-gray-200 text-right">
              <div className="font-medium">{user.name || user.email}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {user.role}
              </div>
            </div>
          ) : (
            <div className="text-sm text-gray-500 dark:text-gray-400">Гость</div>
          )}

          {/* Переключение темы */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition"
            aria-label="Переключить тему"
          >
            {theme === 'light' ? (
              <MoonIcon className="h-5 w-5 text-gray-600 dark:text-gray-300" />
            ) : (
              <SunIcon className="h-5 w-5 text-gray-600 dark:text-gray-300" />
            )}
          </button>

          {/* Выход */}
          <button
            onClick={handleLogout}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-all text-sm"
          >
            Выход
          </button>
        </div>
      </div>

      {/* Навигация */}
      <nav className="px-6 py-3 bg-gray-50 dark:bg-gray-700 flex justify-between items-center">
        <div className="flex space-x-8">
          <Link
            to="/dashboard"
            className={`transition ${
              isActiveLink('/dashboard')
                ? 'text-blue-600 dark:text-blue-400 font-medium underline'
                : 'text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:underline'
            }`}
          >
            Текущий мониторинг
          </Link>
          <Link
            to="/history"
            className={`transition ${
              isActiveLink('/history')
                ? 'text-blue-600 dark:text-blue-400 font-medium underline'
                : 'text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:underline'
            }`}
          >
            Исторические данные
          </Link>
          {['operator', 'admin'].includes(user?.role) && (
            <Link
              to="/admin"
              className={`transition ${
                isActiveLink('/admin')
                  ? 'text-blue-600 dark:text-blue-400 font-medium underline'
                  : 'text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:underline'
              }`}
            >
              Панель администратора
            </Link>
          )}
        </div>

        {/* КНОПКА CSV — ВСЕГДА ЕСТЬ, НО НА DASHBOARD: НЕВИДИМА + НЕКЛИКАБЕЛЬНА */}
        {showCSVButton && (
          <button
            onClick={isDashboard ? undefined : onOpenCSVModal}
            className={`bg-blue-600 dark:bg-blue-700 text-white px-4 py-2 rounded-lg transition-all text-sm ${
              isDashboard
                ? 'invisible pointer-events-none'  // ← НЕВИДИМА + НЕКЛИКАБЕЛЬНА
                : 'hover:bg-blue-700 dark:hover:bg-blue-800'
            }`}
            disabled={isDashboard}
            aria-hidden={isDashboard}
          >
            Загрузить CSV
          </button>
        )}
      </nav>
    </header>
  );
}

export default Header;