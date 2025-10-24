import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Line } from 'react-chartjs-2';
import { fetchHistoryData, setFilters } from '../store/warehouseSlice';
import Header from '../components/Header';
import { ChevronDownIcon } from '@heroicons/react/24/outline';


function History() {
  const dispatch = useDispatch();
  const { historyData, filters } = useSelector((state) => state.warehouse);
  const [selectedItems, setSelectedItems] = useState([]);
  const [pageSize, setPageSize] = useState(20);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    dispatch(fetchHistoryData(filters));
  }, [dispatch, filters]);

  const handleFilterChange = (newFilters) => {
    dispatch(setFilters({ ...filters, ...newFilters }));
  };

  const chartData = {
    labels: historyData.map(d => d.date),
    datasets: selectedItems.map((item, index) => ({
      label: item.productName,
      data: historyData.filter(d => d.productId === item.productId).map(d => d.actualQuantity),
      borderColor: `hsl(${index * 60}, 70%, 50%)`,
      fill: false,
    })),
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Header />
      <div className="p-6">
        {/* Панель фильтров */}
        <div className="bg-white rounded-2xl shadow-md p-4 mb-6">
          <h2 className="text-lg font-semibold mb-4">Фильтры</h2>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-gray-600">От</label>
              <input
                type="date"
                value={filters.startDate || ''}
                onChange={(e) => handleFilterChange({ startDate: e.target.value })}
                className="w-full p-2 border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600">До</label>
              <input
                type="date"
                value={filters.endDate || ''}
                onChange={(e) => handleFilterChange({ endDate: e.target.value })}
                className="w-full p-2 border rounded-lg"
              />
            </div>
            <div className="flex space-x-2">
              {['Сегодня', 'Вчера', 'Неделя', 'Месяц'].map(period => (
                <button
                  key={period}
                  onClick={() => handleFilterChange({ period })}
                  className="px-3 py-1 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  {period}
                </button>
              ))}
            </div>
            <div>
              <label className="block text-sm text-gray-600">Зоны</label>
              <div className="relative">
                <select
                  multiple
                  value={filters.zones}
                  onChange={(e) => handleFilterChange({ zones: Array.from(e.target.selectedOptions, opt => opt.value) })}
                  className="w-full p-2 border rounded-lg"
                >
                  {['A', 'B', 'C'].map(zone => <option key={zone} value={zone}>{zone}</option>)}
                </select>
                <ChevronDownIcon className="absolute right-2 top-2 h-5 w-5 text-gray-400" />
              </div>
            </div>
            <div>
              <label className="block text-sm text-gray-600">Категории</label>
              <div className="relative">
                <select
                  multiple
                  value={filters.categories}
                  onChange={(e) => handleFilterChange({ categories: Array.from(e.target.selectedOptions, opt => opt.value) })}
                  className="w-full p-2 border rounded-lg"
                >
                  {['Электроника', 'Кабели', 'Аксессуары'].map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
                <ChevronDownIcon className="absolute right-2 top-2 h-5 w-5 text-gray-400" />
              </div>
            </div>
            <div>
              <label className="block text-sm text-gray-600">Статус</label>
              {['Все', 'ОК', 'Низкий остаток', 'Критично'].map(status => (
                <label key={status} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={filters.status.includes(status)}
                    onChange={(e) => {
                      const newStatus = e.target.checked
                        ? [...filters.status, status]
                        : filters.status.filter(s => s !== status);
                      handleFilterChange({ status: newStatus });
                    }}
                    className="mr-2"
                  />
                  {status}
                </label>
              ))}
            </div>
            <div className="col-span-2">
              <label className="block text-sm text-gray-600">Поиск по артикулу или названию</label>
              <div className="relative">
                <input
                  type="text"
                  value={filters.search}
                  onChange={(e) => handleFilterChange({ search: e.target.value })}
                  placeholder="Введите артикул или название"
                  className="w-full p-2 pl-10 border rounded-lg"
                />
                <svg className="absolute left-3 top-3 h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => dispatch(fetchHistoryData(filters))}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                Применить фильтры
              </button>
              <button
                onClick={() => handleFilterChange({ startDate: null, endDate: null, zones: [], categories: [], status: [], search: '' })}
                className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
              >
                Сбросить
              </button>
            </div>
          </div>
        </div>

        {/* Сводная статистика */}
        <div className="bg-white rounded-2xl shadow-md p-4 mb-6 flex justify-between">
          <div>
            <p className="text-sm text-gray-600">Всего проверок за период</p>
            <p className="text-xl font-bold">{historyData.length}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Уникальных товаров</p>
            <p className="text-xl font-bold">{new Set(historyData.map(d => d.productId)).size}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Выявлено расхождений</p>
            <p className="text-xl font-bold">{historyData.filter(d => d.discrepancy !== 0).length}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Среднее время инвентаризации</p>
            <p className="text-xl font-bold">10 мин</p>
          </div>
        </div>

        {/* Таблица данных */}
        <div className="bg-white rounded-2xl shadow-md p-4 mb-6">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-100">
                <th className="p-2 text-left">
                  <input
                    type="checkbox"
                    onChange={(e) => setSelectedItems(e.target.checked ? historyData : [])}
                  />
                </th>
                <th className="p-2 text-left">Дата и время</th>
                <th className="p-2 text-left">ID робота</th>
                <th className="p-2 text-left">Зона</th>
                <th className="p-2 text-left">Артикул</th>
                <th className="p-2 text-left">Название</th>
                <th className="p-2 text-left">Ожидаемое</th>
                <th className="p-2 text-left">Фактическое</th>
                <th className="p-2 text-left">Расхождение</th>
                <th className="p-2 text-left">Статус</th>
              </tr>
            </thead>
            <tbody>
              {historyData.slice((currentPage - 1) * pageSize, currentPage * pageSize).map((data, index) => (
                <tr key={index} className="border-t">
                  <td className="p-2">
                    <input
                      type="checkbox"
                      checked={selectedItems.includes(data)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedItems([...selectedItems, data]);
                        } else {
                          setSelectedItems(selectedItems.filter(i => i !== data));
                        }
                      }}
                    />
                  </td>
                  <td className="p-2">{data.date}</td>
                  <td className="p-2">{data.robotId}</td>
                  <td className="p-2">{data.zone}</td>
                  <td className="p-2">{data.productId}</td>
                  <td className="p-2">{data.productName}</td>
                  <td className="p-2">{data.expectedQuantity}</td>
                  <td className="p-2">{data.actualQuantity}</td>
                  <td className="p-2">{data.discrepancy}</td>
                  <td className="p-2">
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${
                        data.status === 'ok' ? 'bg-green-100 text-green-800' :
                        data.status === 'low' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}
                    >
                      {data.status === 'ok' ? 'ОК' : data.status === 'low' ? 'Низкий остаток' : 'Критично'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="flex justify-between mt-4">
            <div>
              <select
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
                className="p-2 border rounded-lg"
              >
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
            <div>
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                className="px-3 py-1 bg-gray-600 text-white rounded-lg"
              >
                Назад
              </button>
              <span className="mx-2">{currentPage}</span>
              <button
                onClick={() => setCurrentPage(p => p + 1)}
                className="px-3 py-1 bg-gray-600 text-white rounded-lg"
              >
                Вперед
              </button>
            </div>
          </div>
        </div>

        {/* Панель действий */}
        <div className="flex space-x-4 mb-6">
          <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">
            Экспорт в Excel
          </button>
          <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">
            Экспорт в PDF
          </button>
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
            Построить график
          </button>
        </div>

        {/* График тренда */}
        <div className="bg-white rounded-2xl shadow-md p-4">
          <h2 className="text-lg font-semibold mb-4">Тренд остатков</h2>
          <Line data={chartData} />
        </div>
      </div>
    </div>
  );
}

export default History;