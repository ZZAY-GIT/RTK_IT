// src/features/history/components/TableControls.js
export default function TableControls({
  selectAllTableItems,
  clearTableSelection,
  exportToExcel,
  getCurrentTableItemsCount,
  tableSelectedItems
}) {
  return (
    <div className="flex space-x-4 mb-6">
      <button 
        onClick={selectAllTableItems}
        className="bg-blue-600 dark:bg-blue-700 text-white px-4 py-2 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-800 flex items-center"
      >
        Выбрать все в таблице ({getCurrentTableItemsCount()})
      </button>
      <button 
        onClick={clearTableSelection}
        className="bg-gray-600 dark:bg-gray-700 text-white px-4 py-2 rounded-lg hover:bg-gray-700 dark:hover:bg-gray-600 flex items-center"
      >
        Сбросить выбор таблицы
      </button>
      <button 
        onClick={exportToExcel}
        className="bg-green-600 dark:bg-green-700 text-white px-4 py-2 rounded-lg hover:bg-green-700 dark:hover:bg-green-800 flex items-center"
      >
        Экспорт таблицы в Excel ({tableSelectedItems.length})
      </button>
    </div>
  );
}