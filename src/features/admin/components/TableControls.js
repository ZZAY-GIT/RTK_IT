// src/features/admin/components/TableControls.js
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
  return (
    <div className="flex space-x-4 mb-6">
      <button 
        onClick={selectAllItems}
        className="bg-blue-600 dark:bg-blue-700 text-white px-4 py-2 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-800 flex items-center"
      >
        Выбрать все {
          activeTab === 'products' ? paginatedProducts.length :
          activeTab === 'users' ? paginatedUsers.length :
          activeTab === 'robots' ? paginatedRobots.length : 0
        }
      </button>
      <button 
        onClick={clearSelection}
        className="bg-gray-600 dark:bg-gray-700 text-white px-4 py-2 rounded-lg hover:bg-gray-700 dark:hover:bg-gray-600 flex items-center"
      >
        Сбросить выбор
      </button>
      <button 
        onClick={exportToExcel}
        className="bg-green-600 dark:bg-green-700 text-white px-4 py-2 rounded-lg hover:bg-green-700 dark:hover:bg-green-800 flex items-center"
      >
        Экспорт в Excel ({selectedItems.length})
      </button>
    </div>
  );
}