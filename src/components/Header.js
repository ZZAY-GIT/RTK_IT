// Header.js
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import logo from '../logo.png';

function Header({ onOpenCSVModal }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="bg-white shadow-md">
      {/* Верхняя панель: логотип + имя */}
      <div className="px-6 py-3 flex items-center justify-between border-b">
        <div className="flex items-center space-x-4">
          <Link to="/dashboard">
            <img src={logo} alt="Ростелеком" className="h-10 w-auto" />
          </Link>
          <h1 className="text-xl font-semibold text-gray-800">Умный склад</h1>
        </div>

        <div className="flex items-center space-x-6">
          {/* Пользователь */}
          {user ? (
            <div className="text-sm text-gray-700 text-right">
              <div className="font-medium">{user.name || user.email}</div>
              <div className="text-xs text-gray-500">{user.role}</div>
            </div>
          ) : (
            <div className="text-sm text-gray-500">Гость</div>
          )}

          {/* Кнопка выхода */}
          <button
            onClick={handleLogout}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-all text-sm"
          >
            Выход
          </button>
        </div>
      </div>

      {/* Навигация + CSV */}
      <nav className="px-6 py-3 bg-gray-50 flex justify-between items-center">
        <div className="flex space-x-8">
          <Link
            to="/dashboard"
            className="text-blue-600 font-medium hover:underline transition"
          >
            Текущий мониторинг
          </Link>
          <Link
            to="/history"
            className="text-gray-600 hover:text-blue-600 hover:underline transition"
          >
            Исторические данные
          </Link>
        </div>

        <button
          onClick={onOpenCSVModal}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-all text-sm"
        >
          Загрузить CSV
        </button>
      </nav>
    </header>
  );
}

export default Header;