import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../../../hooks/useTheme';
import { SunIcon, MoonIcon } from '@heroicons/react/outline';


export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const { theme, toggleTheme } = useTheme();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Имитация отправки
    setTimeout(() => {
      setSubmitted(true);
      setLoading(false);
    }, 1000);
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
         <h2 className="text-2xl font-bold text-center mb-8 text-gray-800 dark:text-gray-100">
          Восстановление пароля
        </h2>

        {!submitted ? (
          <>
            <p className="text-sm text-gray-600 dark:text-gray-400 text-center mb-6">
              Введите email, и мы отправим инструкции по восстановлению
            </p>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="admin@warehouse.com"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-lg transition-colors"
              >
                {loading ? 'Отправка...' : 'Отправить'}
              </button>
            </form>

            <div className="mt-6 text-center">
              <Link
                to="/login"
                className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
              >
                Вернуться ко входу
              </Link>
            </div>
          </>
        ) : (
          <div className="text-center">
            <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/50 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-2">
              Письмо отправлено!
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Инструкции по восстановлению отправлены на <strong>{email}</strong>
            </p>
            <Link
              to="/login"
              className="mt-6 inline-block text-sm text-blue-600 dark:text-blue-400 hover:underline"
            >
              Вернуться ко входу
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}