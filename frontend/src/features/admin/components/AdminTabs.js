// src/features/admin/components/AdminTabs.js
export default function AdminTabs({ activeTab, isOperator, handleTabChange, isMobile }) {
  return (
    <div className={`${isMobile ? 'flex flex-col space-y-2' : 'flex space-x-4 overflow-x-auto pb-2'}`}>
      <button
        className={`px-4 py-2 rounded-lg font-semibold transition-all whitespace-nowrap ${
          activeTab === 'products'
            ? 'bg-blue-600 dark:bg-blue-700 text-white'
            : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-100'
        }`}
        onClick={() => handleTabChange('products')}
      >
        Товары
      </button>

      {isOperator && (
        <button
          className={`px-4 py-2 rounded-lg font-semibold transition-all whitespace-nowrap ${
            activeTab === 'users'
              ? 'bg-blue-600 dark:bg-blue-700 text-white'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-100'
          }`}
          onClick={() => handleTabChange('users')}
        >
          Пользователи
        </button>
      )}

      <button
        className={`px-4 py-2 rounded-lg font-semibold transition-all whitespace-nowrap ${
          activeTab === 'robots'
            ? 'bg-blue-600 dark:bg-blue-700 text-white'
            : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-100'
        }`}
        onClick={() => handleTabChange('robots')}
      >
        Роботы
      </button>
    </div>
  );
}