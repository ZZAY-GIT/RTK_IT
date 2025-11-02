// src/features/history/components/HistoryTable.js
export default function HistoryTable({
  getCurrentTableItems,
  isAllTableItemsSelected,
  handleSelectAllTableItems,
  isItemSelected,
  handleSelectTableItem,
  pageSize,
  setPageSize,
  currentPage,
  setCurrentPage,
  totalPages,
  startItem,
  endItem,
  finalTotalItems,
  sortConfig, // ДОБАВИТЬ
  handleSort // ДОБАВИТЬ
}) {
  const getSortArrow = (key) => {
    if (sortConfig.key !== key) return ' ↕'; // Двойная стрелка когда не активно
    if (sortConfig.direction === 'asc') return ' ↑';
    if (sortConfig.direction === 'desc') return ' ↓';
    return ' ↕';
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">История инвентаризации</h3>
        <div className="text-sm text-gray-600 dark:text-gray-300">Показано {startItem}-{endItem} из {finalTotalItems}</div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[800px]">
          <thead>
            <tr className="bg-gray-100 dark:bg-gray-700">
              <th className="p-2 text-left">
                <input
                  type="checkbox"
                  checked={isAllTableItemsSelected()}
                  onChange={handleSelectAllTableItems}
                  className="text-blue-600 dark:text-blue-400 border-gray-300 dark:border-gray-600"
                />
              </th>
              <th 
                className="p-2 text-left text-gray-800 dark:text-gray-100 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                onClick={() => handleSort('date')}
              >
                Дата{getSortArrow('date')}
              </th>
              <th className="p-2 text-left text-gray-800 dark:text-gray-100">ID робота</th>
              <th className="p-2 text-left text-gray-800 dark:text-gray-100">Зона</th>
              <th className="p-2 text-left text-gray-800 dark:text-gray-100">Полка</th>
              <th className="p-2 text-left text-gray-800 dark:text-gray-100">Артикул</th>
              <th className="p-2 text-left text-gray-800 dark:text-gray-100">Название</th>
              <th className="p-2 text-left text-gray-800 dark:text-gray-100">Ожидаемое</th>
              <th className="p-2 text-left text-gray-800 dark:text-gray-100">Фактическое</th>
              <th 
                className="p-2 text-left text-gray-800 dark:text-gray-100 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                onClick={() => handleSort('discrepancy')}
              >
                Расхождение{getSortArrow('discrepancy')}
              </th>
              <th className="p-2 text-left text-gray-800 dark:text-gray-100">Статус</th>
            </tr>
          </thead>
          <tbody>
            {getCurrentTableItems().map((d, i) => (
              <tr key={d.id} className="border-t dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700">
                <td className="p-2">
                  <input
                    type="checkbox"
                    checked={isItemSelected(d)}
                    onChange={(e) => handleSelectTableItem(d, e)}
                    className="text-blue-600 dark:text-blue-400 border-gray-300 dark:border-gray-600"
                  />
                </td>
                <td className="p-2 text-gray-800 dark:text-gray-100">{d.date}</td>
                <td className="p-2 text-gray-800 dark:text-gray-100">{d.robotId}</td>
                <td className="p-2 text-gray-800 dark:text-gray-100">{d.zone}</td>
                <td className="p-2 text-gray-800 dark:text-gray-100">{d.shelfNumber}</td>
                <td className="p-2 text-gray-800 dark:text-gray-100">{d.productId}</td>
                <td className="p-2 text-gray-800 dark:text-gray-100">{d.productName}</td>
                <td className="p-2 text-gray-800 dark:text-gray-100">{d.expectedQuantity}</td>
                <td className="p-2 text-gray-800 dark:text-gray-100">{d.actualQuantity}</td>
                <td className="p-2 text-gray-800 dark:text-gray-100">
                  <span className={d.discrepancy < 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}>
                    {d.discrepancy > 0 ? '+' : ''}{d.discrepancy}
                  </span>
                </td>
                <td className="p-2">
                  <span className={`px-2 py-1 rounded-full text-xs ${d.status === 'ok' ? 'bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-300' : d.status === 'low' ? 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-300' : 'bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-300'}`}>
                    {d.status === 'ok' ? 'ОК' : d.status === 'low' ? 'Низкий остаток' : 'Критично'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex justify-between items-center mt-4">
        <div>
          <span className="text-sm text-gray-600 dark:text-gray-300 mr-2">Строк:</span>
          <select value={pageSize} onChange={e => { setPageSize(Number(e.target.value)); setCurrentPage(1); }} className="p-2 border rounded-lg bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-100">
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>
        <div className="flex items-center space-x-2">
          <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-3 py-1 bg-gray-600 dark:bg-gray-700 text-white rounded-lg hover:bg-gray-700 dark:hover:bg-gray-600 disabled:opacity-50">Назад</button>
          <span className="mx-2 text-gray-800 dark:text-gray-100">Страница {currentPage} из {totalPages}</span>
          <button onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage >= totalPages} className="px-3 py-1 bg-gray-600 dark:bg-gray-700 text-white rounded-lg hover:bg-gray-700 dark:hover:bg-gray-600 disabled:opacity-50">Вперед</button>
        </div>
      </div>
    </div>
  );
}