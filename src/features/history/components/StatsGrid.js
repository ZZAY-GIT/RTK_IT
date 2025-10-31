// src/features/history/components/StatsGrid.js
export default function StatsGrid({ finalHistoryData, finalTotalItems }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-4 mb-6 grid grid-cols-4 gap-4">
      <div><p className="text-sm text-gray-600 dark:text-gray-300">Всего проверок</p><p className="text-xl font-bold text-gray-800 dark:text-gray-100">{finalTotalItems}</p></div>
      <div><p className="text-sm text-gray-600 dark:text-gray-300">Уникальных товаров</p><p className="text-xl font-bold text-gray-800 dark:text-gray-100">{new Set(finalHistoryData.map(d => d.productId)).size}</p></div>
      <div><p className="text-sm text-gray-600 dark:text-gray-300">Выявлено расхождений</p><p className="text-xl font-bold text-gray-800 dark:text-gray-100">{finalHistoryData.filter(d => d.discrepancy !== 0).length}</p></div>
      <div><p className="text-sm text-gray-600 dark:text-gray-300">Активных роботов</p><p className="text-xl font-bold text-gray-800 dark:text-gray-100">{new Set(finalHistoryData.map(d => d.robotId)).size}</p></div>
    </div>
  );
}