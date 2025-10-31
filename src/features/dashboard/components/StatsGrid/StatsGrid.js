// src/features/dashboard/components/StatsGrid.js
export default function StatsGrid({ robots, recentScans }) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
        <p className="text-sm text-gray-600 dark:text-gray-300">Активных роботов</p>
        <p className="text-xl font-bold text-gray-800 dark:text-gray-100">
          {robots.filter(r => r.status === 'active').length}/{robots.length}
        </p>
      </div>
      <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
        <p className="text-sm text-gray-600 dark:text-gray-300">Проверено сегодня</p>
        <p className="text-xl font-bold text-gray-800 dark:text-gray-100">
          {recentScans.length}
        </p>
      </div>
      <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
        <p className="text-sm text-gray-600 dark:text-gray-300">Критических остатков</p>
        <p className="text-xl font-bold text-gray-800 dark:text-gray-100">
          {recentScans.filter(s => s.status === 'critical').length}
        </p>
      </div>
      <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
        <p className="text-sm text-gray-600 dark:text-gray-300">Средний заряд батарей</p>
        <p className="text-xl font-bold text-gray-800 dark:text-gray-100">
          {robots.length > 0 ? Math.round(robots.reduce((sum, r) => sum + r.battery, 0) / robots.length) : 0}%
        </p>
      </div>
    </div>
  );
}