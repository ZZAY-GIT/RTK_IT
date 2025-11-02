// src/features/history/components/FiltersPanel.js
import { SearchIcon } from '@heroicons/react/outline';

export default function FiltersPanel({
  filters,
  activeQuickPeriod,
  loading,
  availableZones,
  handleFilterChange,
  handleQuickPeriod,
  resetFilters,
  hasActiveFilters,
  applyFilters
}) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-4 mb-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Фильтры</h2>
        <div className="flex items-center gap-4">
          {activeQuickPeriod && (
            <span className="text-sm text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30 px-2 py-1 rounded">
              Период: {activeQuickPeriod}
            </span>
          )}
          {loading && <div className="text-blue-600 dark:text-blue-400">Загрузка...</div>}
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm text-gray-600 dark:text-gray-300">От</label>
          <input
            type="date"
            value={filters.startDate || ''}
            onChange={e => handleFilterChange({ startDate: e.target.value })}
            className="w-full p-2 border rounded-lg bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-100"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-600 dark:text-gray-300">До</label>
          <input
            type="date"
            value={filters.endDate || ''}
            onChange={e => handleFilterChange({ endDate: e.target.value })}
            className="w-full p-2 border rounded-lg bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-100"
          />
        </div>
        <div className="flex space-x-2 items-end flex-wrap gap-2">
          {['Сегодня', 'Вчера', 'Неделя', 'Месяц'].map(p => (
            <button
              key={p}
              onClick={() => handleQuickPeriod(p)}
              className={`px-3 py-1 rounded-lg text-sm ${
                activeQuickPeriod === p
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
        <div>
          <label className="block text-sm text-gray-600 dark:text-gray-300">Зона</label>
          <select
            value={filters.zones?.[0] || ''}
            onChange={e => handleFilterChange({ zones: e.target.value ? [e.target.value] : [] })}
            className="w-full p-2 border rounded-lg bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-100"
          >
            <option value="">Все зоны</option>
            {availableZones.map(z => (
              <option key={z} value={z}>
                {z}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm text-gray-600 dark:text-gray-300">Статус</label>
          <select
            value={filters.status?.[0] || ''}
            onChange={e => {
              const selectedStatus = e.target.value;
              const newStatus = selectedStatus ? [selectedStatus] : [];
              handleFilterChange({ status: newStatus });
            }}
            className="w-full p-2 border rounded-lg bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-100"
          >
            <option value="">Все статусы</option>
            <option value="ok">ОК</option>
            <option value="low">Низкий остаток</option>
            <option value="critical">Критично</option>
          </select>
        </div>
        <div className="col-span-1 sm:col-span-2">
          <label className="block text-sm text-gray-600 dark:text-gray-300">Поиск по артикулу или названию</label>
          <div className="relative">
            <input
              type="text"
              value={filters.search || ''}
              onChange={e => handleFilterChange({ search: e.target.value })}
              placeholder="Введите артикул или название товара" // ← ИЗМЕНИТЬ
              className="w-full p-2 pl-10 border rounded-lg bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-100"
            />
            <SearchIcon className="absolute left-3 top-3 h-5 w-5 text-gray-400 dark:text-gray-300" />
            </div>
          </div>
        <div className="flex space-x-2 items-end col-span-1 sm:col-span-1">
          <button
            onClick={applyFilters}
            disabled={loading}
            className="bg-blue-600 dark:bg-blue-700 text-white px-4 py-2 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-800 disabled:opacity-50 flex-1 sm:flex-none"
          >
            {loading ? 'Загрузка...' : 'Применить'}
          </button>
          <button
            onClick={resetFilters}
            disabled={loading}
            className="bg-gray-600 dark:bg-gray-700 text-white px-4 py-2 rounded-lg hover:bg-gray-700 dark:hover:bg-gray-600 disabled:opacity-50 flex-1 sm:flex-none"
          >
            Сброс
          </button>
        </div>
      </div>
      {hasActiveFilters && (
        <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-sm text-blue-800 dark:text-blue-300 flex flex-wrap gap-2">
          <strong>Активные:</strong>
          {filters.startDate && ` От: ${filters.startDate}`}
          {filters.endDate && ` До: ${filters.endDate}`}
          {filters.zones?.length > 0 && ` Зона: ${filters.zones.join(', ')}`}
          {filters.status?.length > 0 &&
            ` Статус: ${filters.status
              .map(s => (s === 'ok' ? 'ОК' : s === 'low' ? 'Низкий остаток' : 'Критично'))
              .join(', ')}`}
          {filters.search && ` Поиск: "${filters.search}"`}
        </div>
      )}
    </div>
  );
}