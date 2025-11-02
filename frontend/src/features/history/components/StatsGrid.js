export default function StatsGrid({ finalHistoryData = [], finalTotalItems = 0 }) {
  const uniqueProducts = new Set(finalHistoryData.map(d => d.productId)).size;
  const discrepancies = finalHistoryData.filter(d => d.discrepancy !== 0).length;
  const activeRobots = new Set(finalHistoryData.map(d => d.robotId)).size;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-4 mb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg flex flex-col items-center text-center">
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">Всего проверок</p>
        <p className="text-xl font-bold text-gray-800 dark:text-gray-100">{finalTotalItems}</p>
      </div>
      <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg flex flex-col items-center text-center">
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">Уникальных товаров</p>
        <p className="text-xl font-bold text-gray-800 dark:text-gray-100">{uniqueProducts}</p>
      </div>
      <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg flex flex-col items-center text-center">
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">Выявлено расхождений</p>
        <p className="text-xl font-bold text-gray-800 dark:text-gray-100">{discrepancies}</p>
      </div>
      <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg flex flex-col items-center text-center">
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">Активных роботов</p>
        <p className="text-xl font-bold text-gray-800 dark:text-gray-100">{activeRobots}</p>
      </div>
    </div>
  );
}
