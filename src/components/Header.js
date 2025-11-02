// src/components/Header.js
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../hooks/useTheme';
import { SunIcon, MoonIcon, MenuIcon, XIcon, UserCircleIcon, ChevronDownIcon } from '@heroicons/react/outline';
import logo from '../assets/logo.png';
import { useState } from 'react';

function Header({ onOpenCSVModal }) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false); // ← НОВОЕ: профиль

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActiveLink = (path) => location.pathname === path;
  const isDashboard = location.pathname === '/dashboard';
  const isAdmin = location.pathname === '/admin';
  const showCSVButton = !!onOpenCSVModal;

  return (
    <header className="bg-white dark:bg-gray-800 shadow-md">
      {/* Верхняя панель */}
      <div className="px-4 sm:px-6 py-3 flex items-center justify-between border-b dark:border-gray-700">
        {/* Логотип + название */}
        <div className="flex items-center space-x-3">
          <Link to="/dashboard" className="flex items-center space-x-2">
            <img src={logo} alt="Ростелеком" className="h-8 w-auto sm:h-10" />
            <h1 className="text-lg sm:text-xl font-semibold text-gray-800 dark:text-gray-100 hidden sm:block">
              Умный склад
            </h1>
          </Link>
        </div>

        {/* Правая часть */}
        <div className="flex items-center space-x-2 sm:space-x-4">
          {/* Тема */}
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
          {/* --- МОБИЛЬНЫЙ ПРОФИЛЬ --- */}
          <div className="relative">
            <button
              onClick={() => setProfileOpen(!profileOpen)}
              className="flex items-center space-x-1 p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
            >
              <div className="w-8 h-8 rounded-full bg-blue-600 dark:bg-blue-700 text-white flex items-center justify-center text-sm font-medium">
                {user?.name?.[0] || user?.email?.[0] || 'Г'}
              </div>
              <ChevronDownIcon className={`h-4 w-4 text-gray-600 dark:text-gray-300 transition-transform ${profileOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Выдвижная панель профиля */}
            {profileOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-700 rounded-lg shadow-lg border dark:border-gray-600 z-50">
                <div className="p-3 border-b dark:border-gray-600">
                  <div className="font-medium text-gray-800 dark:text-gray-100">
                    {user?.name || user?.email}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {user?.role === 'admin' ? 'Администратор' : 
                     user?.role === 'operator' ? 'Оператор' : 'Пользователь'}
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition"
                >
                  Выйти
                </button>
              </div>
            )}
          </div>

          {/* Гамбургер */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="sm:hidden p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700"
          >
            {mobileMenuOpen ? <XIcon className="h-5 w-5" /> : <MenuIcon className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Навигация */}
      <nav className={`${mobileMenuOpen ? 'block' : 'hidden'} sm:block bg-gray-50 dark:bg-gray-700`}>
        <div className="px-4 sm:px-6 py-3 flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-3 sm:space-y-0">
          <div className="flex flex-col sm:flex-row sm:space-x-6 space-y-2 sm:space-y-0 text-sm">
            <Link
              to="/dashboard"
              onClick={() => setMobileMenuOpen(false)}
              className={`px-3 py-1.5 rounded-lg transition ${
                isActiveLink('/dashboard')
                  ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 font-medium'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              Мониторинг
            </Link>
            <Link
              to="/history"
              onClick={() => setMobileMenuOpen(false)}
              className={`px-3 py-1.5 rounded-lg transition ${
                isActiveLink('/history')
                  ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 font-medium'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              История
            </Link>
            {['operator', 'admin'].includes(user?.role) && (
              <Link
                to="/admin"
                onClick={() => setMobileMenuOpen(false)}
                className={`px-3 py-1.5 rounded-lg transition ${
                  isActiveLink('/admin')
                    ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 font-medium'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                Панель администратора
              </Link>
            )}
          </div>

          {showCSVButton && (
            <button
              onClick={(isDashboard || isAdmin) ? undefined : onOpenCSVModal}
              className={`w-full sm:w-auto px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                isDashboard || isAdmin
                  ? 'invisible pointer-events-none'
                  : 'bg-blue-600 dark:bg-blue-700 text-white hover:bg-blue-700 dark:hover:bg-blue-800'
              }`}
              disabled={isDashboard || isAdmin}
            >
              Загрузить CSV
            </button>
          )}
        </div>
      </nav>
    </header>
  );
}

export default Header;