// src/features/dashboard/components/AIPredictions.js
export default function AIPredictions({ aiPredictions, loading, onRefresh }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
          Прогноз ИИ на следующие 7 дней
        </h2>
        <button
          onClick={onRefresh}
          disabled={loading}
          className="bg-blue-600 dark:bg-blue-700 text-white px-3 py-1 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-800 disabled:bg-gray-400 disabled:cursor-not-allowed text-sm md:text-base md:px-3 md:py-1"
        >
          {loading ? 'Генерация...' : 'Обновить прогноз'}
        </button>
      </div>
      <div className="space-y-2">
        {aiPredictions.length > 0 ? (
          aiPredictions.slice(0, 5).map((pred, index) => (
            <div key={pred.product_id || index} className="p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <p className="text-sm font-medium text-gray-800 dark:text-gray-100">
                ID товара: {pred.product_id}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Прогноз исчерпания: {pred.days_until_stockout} дней
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Рекомендуемый заказ: {pred.recommended_order} шт.
              </p>
            </div>
          ))
        ) : (
          !loading && <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
            Нет данных для отображения.
          </p>
        )}
        {aiPredictions.length > 0 && (
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Достоверность прогноза: 75%
          </p>
        )}
      </div>
    </div>
  );
}