// src/features/admin/components/TableControls.js
import { CheckCircleIcon, RefreshIcon, DocumentDownloadIcon } from '@heroicons/react/outline';

export default function TableControls({
  activeTab,
  paginatedProducts,
  paginatedUsers,
  paginatedRobots,
  selectAllItems,
  clearSelection,
  exportToExcel,
  selectedItems
}) {
  // Определяем, сколько элементов в текущей таблице
  const itemCount = 
    activeTab === 'products' ? paginatedProducts.length :
    activeTab === 'users' ? paginatedUsers.length :
    activeTab === 'robots' ? paginatedRobots.length : 0;

  return (
    <div className="mb-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
      {/* Кнопка: Выбрать все */}
      <button
        onClick={selectAllItems}
        className="flex items-center justify-center space-x-2 px-4 py-2.5 bg-blue-600 dark:bg-blue-700 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-800 transition-all text-sm font-medium shadow-sm"
      >
        <CheckCircleIcon className="h-5 w-5" />
        <span>Выбрать все ({itemCount})</span>
      </button>

      {/* Кнопка: Сбросить */}
      <button
        onClick={clearSelection}
        className="flex items-center justify-center space-x-2 px-4 py-2.5 bg-gray-600 dark:bg-gray-700 text-white rounded-lg hover:bg-gray-700 dark:hover:bg-gray-600 transition-all text-sm font-medium shadow-sm"
      >
        <RefreshIcon className="h-5 w-5" />
        <span>Сбросить</span>
      </button>

      {/* Кнопка: Экспорт */}
      <button
        onClick={exportToExcel}
        disabled={selectedItems.length === 0}
        className={`flex items-center justify-center space-x-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all shadow-sm ${
          selectedItems.length > 0
            ? 'bg-green-600 dark:bg-green-700 text-white hover:bg-green-700 dark:hover:bg-green-800'
            : 'bg-gray-400 dark:bg-gray-600 text-gray-300 dark:text-gray-500 cursor-not-allowed'
        }`}
      >
        <DocumentDownloadIcon className="h-5 w-5" />
        <span>Экспорт ({selectedItems.length})</span>
      </button>
    </div>
  );
}