import { Link, useNavigate } from 'react-router-dom';
import logo from '../logo.png';

function Header({ onOpenCSVModal }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <header className="bg-white shadow-md p-4 flex items-center justify-between">
      <div className="flex items-center">
        <Link to="/">
          <img src={logo} alt="Ростелеком" className="h-10 w-auto" />
        </Link>
        <h1 className="ml-4 text-xl font-semibold text-gray-800">Умный склад</h1>
      </div>
      <div className="flex items-center space-x-4">
        <div className="text-sm text-gray-600">
          <span>Иван Иванов</span> | <span>Администратор</span>
        </div>
        <button
          onClick={handleLogout}
          className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-all duration-200"
        >
          Выход
        </button>
      </div>
      <nav className="absolute left-0 right-0 top-16 bg-gray-100 p-4 flex justify-between">
        <div className="flex space-x-4">
          <Link to="/dashboard" className="text-blue-600 font-medium hover:underline">
            Текущий мониторинг
          </Link>
          <Link to="/history" className="text-gray-600 hover:text-blue-600 hover:underline">
            Исторические данные
          </Link>
        </div>
        <button
          onClick={onOpenCSVModal}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-all duration-200"
        >
          Загрузить CSV
        </button>
      </nav>
    </header>
  );
}

export default Header;