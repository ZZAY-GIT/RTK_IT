// src/features/dashboard/components/RecentScansTable.js
export default function RecentScansTable({ recentScans }) {
  // Мобильная версия - карточки
  const MobileScanCard = ({ scan, index }) => (
    <div key={index} className="border border-gray-200 dark:border-gray-600 rounded-lg p-3 mb-3 last:mb-0">
      <div className="flex justify-between items-start mb-2">
        <span className="font-medium text-sm text-gray-800 dark:text-gray-100">{scan.robotId}</span>
        <span className="text-xs text-gray-500 dark:text-gray-400">{scan.time}</span>
      </div>
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div>
          <span className="text-gray-600 dark:text-gray-300">Зона:</span>
          <span className="ml-1 text-gray-800 dark:text-gray-100">{scan.zone}</span>
        </div>
        <div>
          <span className="text-gray-600 dark:text-gray-300">Товар:</span>
          <span className="ml-1 text-gray-800 dark:text-gray-100">{scan.productName}</span>
        </div>
        <div>
          <span className="text-gray-600 dark:text-gray-300">Кол-во:</span>
          <span className="ml-1 text-gray-800 dark:text-gray-100">{scan.quantity}</span>
        </div>
        <div>
          <span className={`px-2 py-1 rounded-full text-xs ${
            scan.status === 'ok' ? 'bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-300' :
            scan.status === 'low' ? 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-300' :
            'bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-300'
          }`}>
            {scan.status === 'ok' ? 'ОК' : scan.status === 'low' ? 'Низкий' : 'Критично'}
          </span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
          Последние сканирования
        </h2>
      </div>
      
      {/* Мобильная версия */}
      <div className="lg:hidden">
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {recentScans.slice(0, 10).map((scan, index) => (
            <MobileScanCard key={index} scan={scan} index={index} />
          ))}
        </div>
      </div>
      
      {/* Десктопная версия */}
      <div className="hidden lg:block">
        <div className="overflow-y-auto max-h-64">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-100 dark:bg-gray-700">
                <th className="p-2 text-left text-gray-800 dark:text-gray-100">Время</th>
                <th className="p-2 text-left text-gray-800 dark:text-gray-100">ID робота</th>
                <th className="p-2 text-left text-gray-800 dark:text-gray-100">Зона</th>
                <th className="p-2 text-left text-gray-800 dark:text-gray-100">Товар</th>
                <th className="p-2 text-left text-gray-800 dark:text-gray-100">Количество</th>
                <th className="p-2 text-left text-gray-800 dark:text-gray-100">Статус</th>
              </tr>
            </thead>
            <tbody>
              {recentScans.slice(0, 20).map((scan, index) => (
                <tr key={index} className="border-t dark:border-gray-600">
                  <td className="p-2 text-gray-800 dark:text-gray-100">{scan.time}</td>
                  <td className="p-2 text-gray-800 dark:text-gray-100">{scan.robotId}</td>
                  <td className="p-2 text-gray-800 dark:text-gray-100">{scan.zone}</td>
                  <td className="p-2 text-gray-800 dark:text-gray-100">{`${scan.productName} (${scan.productId})`}</td>
                  <td className="p-2 text-gray-800 dark:text-gray-100">{scan.quantity}</td>
                  <td className="p-2">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      scan.status === 'ok' ? 'bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-300' :
                      scan.status === 'low' ? 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-300' :
                      'bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-300'
                    }`}>
                      {scan.status === 'ok' ? 'ОК' : scan.status === 'low' ? 'Низкий остаток' : 'Критично'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}