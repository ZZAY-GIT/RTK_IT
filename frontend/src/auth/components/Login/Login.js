import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import logo from '../../../assets/logo.png';
import { useAuth } from '../../../hooks/useAuth'; // ← Критично!
import { useTheme } from '../../../hooks/useTheme';
import { MailIcon, LockClosedIcon, SunIcon, MoonIcon } from '@heroicons/react/outline';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { theme, toggleTheme } = useTheme();

  const navigate = useNavigate();
  const { setUser } = useAuth(); // ← Получаем setUser

  const validateEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Валидация
    if (!validateEmail(email)) {
      setError('Некорректный формат email');
      setIsLoading(false);
      return;
    }
    if (password.length < 8) {
      setError('Пароль должен содержать минимум 8 символов');
      setIsLoading(false);
      return;
    }

    try {
      const response = await axios.post('http://backend:8000/api/auth/login', {
        email,
        password,
      });

      const token = response.data.token;
      const user = response.data.user;

      if (token && user) {
        // Сохраняем в нужное хранилище
        if (rememberMe) {
          localStorage.setItem('token', token);
          localStorage.setItem('user', JSON.stringify(user));
        } else {
          sessionStorage.setItem('token', token);
          sessionStorage.setItem('user', JSON.stringify(user));
        }

        // Критично: обновляем состояние авторизации СРАЗУ
        setUser(user);

        console.log('Успешный логин:', { user, token });
        navigate('/dashboard', { replace: true });
      } else {
        setError('Неверный ответ от сервера');
      }
    } catch (err) {
      const message =
        err.response?.data?.detail ||
        err.response?.data?.message ||
        'Ошибка авторизации. Проверьте данные.';
      setError(message);
      console.error('Login error:', err.response?.data);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 to-gray-100 dark:from-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 transform transition-all duration-300 hover:shadow-2xl">
         {/* Кнопка переключения темы */}
        <button
          onClick={toggleTheme}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition"
          aria-label="Переключить тему"
        >
          {theme === 'light' ? (
            <MoonIcon className="h-5 w-5 text-gray-600 dark:text-gray-300" />
          ) : (
            <SunIcon className="h-5 w-5 text-gray-600 dark:text-gray-300" />
          )}
        </button>
        
        {/* Логотип */}
        <div className="flex justify-center mb-6">
          <img src={logo} alt="Company Logo" className="h-12 w-auto hover:opacity-80 transition-opacity duration-200" />
        </div>

        {/* Заголовок */}
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 text-center mb-6">
          Вход в систему
        </h2>

        {/* Ошибка */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/50 border border-red-200 dark:border-red-700 text-red-700 dark:text-red-300 rounded-lg text-sm animate-fade-in">
            {error}
          </div>
        )}

        {/* Форма */}
        <form onSubmit={handleSubmit}>
          <div className="relative mb-5">
            <MailIcon className="absolute h-5 w-5 text-gray-400 dark:text-gray-300 left-8 top-3.5" />
            <input
              type="email"
              placeholder="Введите email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-16 pr-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all duration-200 text-gray-700 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-300"
            />
          </div>

          <div className="relative mb-5">
            <LockClosedIcon className="absolute h-5 w-5 text-gray-400 dark:text-gray-300 left-8 top-3.5" />
            <input
              type="password"
              placeholder="Введите пароль"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-16 pr-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all duration-200 text-gray-700 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-300"
            />
          </div>
          <div className="mb-6 flex items-center">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="h-4 w-4 text-blue-600 dark:text-blue-400 border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500 dark:focus:ring-blue-400"
            />
            <label className="ml-2 text-sm text-gray-600 dark:text-gray-300">
              Запомнить меня
            </label>
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 dark:bg-blue-700 text-white py-3 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-800 disabled:bg-blue-400 dark:disabled:bg-blue-600 flex items-center justify-center transition-all duration-200 font-medium"
          >
            {isLoading && (
              <svg
                className="animate-spin h-5 w-5 mr-2 text-white"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            )}
            Войти
          </button>
        </form>
        <a
          href="/forgot-password"
          className="block text-center mt-4 text-sm text-blue-600 dark:text-blue-400 hover:underline transition-colors duration-200"
        >
          Забыли пароль?
        </a>
      </div>
    </div>
  );
}

export default Login;