// src/features/admin/components/AdminTabs.js
export default function AdminTabs({ activeTab, isOperator, handleTabChange }) {
  return (
    <div className="mb-6">
      <div className="flex space-x-4">
        <button
          className={`px-4 py-2 rounded-lg font-semibold ${
            activeTab === 'products'
              ? 'bg-blue-600 dark:bg-blue-700 text-white'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-100 bg-white'
          }`}
          onClick={() => handleTabChange('products')}
        >
          Товары
        </button>

        {isOperator && (
          <button
            className={`px-4 py-2 rounded-lg font-semibold ${
              activeTab === 'users'
                ? 'bg-blue-600 dark:bg-blue-700 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-100 bg-white'
            }`}
            onClick={() => handleTabChange('users')}
          >
            Пользователи
          </button>
        )}

        <button
          className={`px-4 py-2 rounded-lg font-semibold ${
            activeTab === 'robots'
              ? 'bg-blue-600 dark:bg-blue-700 text-white'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-100 bg-white'
          }`}
          onClick={() => handleTabChange('robots')}
        >
          Роботы
        </button>
      </div>
    </div>
  );
}