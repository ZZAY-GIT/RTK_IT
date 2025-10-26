import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import { fetchHistoryData, setFilters } from '../store/warehouseSlice';
import Header from '../components/Header';
import { ChevronDownIcon } from '@heroicons/react/outline';
import { useTheme } from '../hooks/useTheme';

// Регистрация компонентов Chart.js
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

function History({ onOpenCSVModal }) {
  const dispatch = useDispatch();
  const { historyData: reduxHistoryData, filters } = useSelector((state) => state.warehouse);
  const { theme } = useTheme();
  const [selectedItems, setSelectedItems] = useState([]);
  const [pageSize, setPageSize] = useState(20);
  const [currentPage, setCurrentPage] = useState(1);

  // Тестовые данные для historyData, если API недоступен
  const testHistoryData = [
    {
      date: '2025-10-25',
      productId: 'P1',
      productName: 'Товар 1',
      actualQuantity: 100,
      robotId: 'R1',
      zone: 'A1',
      status: 'ok',
      expectedQuantity: 100,
      discrepancy: 0,
    },
    {
      date: '2025-10-24',
      productId: 'P1',
      productName: 'Товар 1',
      actualQuantity: 90,
      robotId: 'R1',
      zone: 'A1',
      status: 'ok',
      expectedQuantity: 100,
      discrepancy: -10,
    },
    {
      date: '2025-10-25',
      productId: 'P2',
      productName: 'Товар 2',
      actualQuantity: 50,
      robotId: 'R2',
      zone: 'B2',
      status: 'low',
      expectedQuantity: 60,
      discrepancy: -10,
    },
  ];

  // Тестовые данные для selectedItems
  const testSelectedItems = [
    { productId: 'P1', productName: 'Товар 1' },
    { productId: 'P2', productName: 'Товар 2' },
  ];

  // Используем тестовые данные, если reduxHistoryData пустой
  const historyData = reduxHistoryData.length > 0 ? reduxHistoryData : testHistoryData;

  useEffect(() => {
    // Устанавливаем тестовые selectedItems при загрузке, если они не выбраны
    if (selectedItems.length === 0) {
      setSelectedItems(testSelectedItems);
    }
    // Запрашиваем данные из API, если они доступны
    dispatch(fetchHistoryData(filters));
  }, [dispatch, filters, selectedItems.length]);

  const handleFilterChange = (newFilters) => {
    dispatch(setFilters({ ...filters, ...newFilters }));
  };

  const chartData = {
    labels: historyData.map((d) => d.date),
    datasets: selectedItems.map((item, index) => ({
      label: item.productName,
      data: historyData
        .filter((d) => d.productId === item.productId)
        .map((d) => d.actualQuantity),
      borderColor: theme === 'dark' ? `hsl(${index * 60}, 70%, 80%)` : `hsl(${index * 60}, 70%, 50%)`,
      backgroundColor: theme === 'dark' ? `hsl(${index * 60}, 70%, 80%, 0.2)` : `hsl(${index * 60}, 70%, 50%, 0.2)`,
      fill: false,
    })),
  };

  const chartOptions = {
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: theme === 'dark' ? '#ffffff' : '#1f2937',
          font: {
            size: 18, // Увеличен размер шрифта легенды
          },
          textShadow: theme === 'dark' ? '0 0 3px rgba(0, 0, 0, 0.7)' : 'none',
        },
      },
      title: {
        display: false,
      },
      tooltip: {
        backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff',
        titleColor: theme === 'dark' ? '#ffffff' : '#1f2937',
        bodyColor: theme === 'dark' ? '#ffffff' : '#1f2937',
        borderColor: theme === 'dark' ? '#4b5563' : '#d1d5db',
        borderWidth: 1,
        titleFont: { size: 18 },
        bodyFont: { size: 16 },
      },
    },
    scales: {
      x: {
        ticks: {
          color: theme === 'dark' ? '#ffffff' : '#1f2937',
          font: {
            size: 18, // Увеличен размер шрифта для осей
          },
          textShadow: theme === 'dark' ? '0 0 3px rgba(0, 0, 0, 0.7)' : 'none',
        },
        grid: {
          color: theme === 'dark' ? '#374151' : '#e5e7eb',
          borderColor: theme === 'dark' ? '#4b5563' : '#d1d5db',
        },
      },
      y: {
        ticks: {
          color: theme === 'dark' ? '#ffffff' : '#1f2937',
          font: {
            size: 18,
          },
          textShadow: theme === 'dark' ? '0 0 3px rgba(0, 0, 0, 0.7)' : 'none',
        },
        grid: {
          color: theme === 'dark' ? '#374151' : '#e5e7eb',
          borderColor: theme === 'dark' ? '#4b5563' : '#d1d5db',
        },
      },
    },
    backgroundColor: 'transparent',
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <Header onOpenCSVModal={onOpenCSVModal} />
      <div className="p-6">
        {/* Панель фильтров */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-4 mb-6">
          <h2 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-100">
            Фильтры
          </h2>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-gray-600 dark:text-gray-300">От</label>
              <input
                type="date"
                value={filters.startDate || ''}
                onChange={(e) => handleFilterChange({ startDate: e.target.value })}
                className="w-full p-2 border rounded-lg bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-100"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 dark:text-gray-300">До</label>
              <input
                type="date"
                value={filters.endDate || ''}
                onChange={(e) => handleFilterChange({ endDate: e.target.value })}
                className="w-full p-2 border rounded-lg bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-100"
              />
            </div>
            <div className="flex space-x-2">
              {['Сегодня', 'Вчера', 'Неделя', 'Месяц'].map((period) => (
                <button
                  key={period}
                  onClick={() => handleFilterChange({ period })}
                  className="px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-100"
                >
                  {period}
                </button>
              ))}
            </div>
            <div>
              <label className="block text-sm text-gray-600 dark:text-gray-300">Зоны</label>
              <div className="relative">
                <select
                  multiple
                  value={filters.zones}
                  onChange={(e) =>
                    handleFilterChange({
                      zones: Array.from(e.target.selectedOptions, (opt) => opt.value),
                    })
                  }
                  className="w-full p-2 border rounded-lg bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-100"
                >
                  {['A', 'B', 'C'].map((zone) => (
                    <option key={zone} value={zone}>
                      {zone}
                    </option>
                  ))}
                </select>
                <ChevronDownIcon className="absolute right-2 top-2 h-5 w-5 text-gray-400 dark:text-gray-300" />
              </div>
            </div>
            <div>
              <label className="block text-sm text-gray-600 dark:text-gray-300">
                Категории
              </label>
              <div className="relative">
                <select
                  multiple
                  value={filters.categories}
                  onChange={(e) =>
                    handleFilterChange({
                      categories: Array.from(e.target.selectedOptions, (opt) => opt.value),
                    })
                  }
                  className="w-full p-2 border rounded-lg bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-100"
                >
                  {['Электроника', 'Кабели', 'Аксессуары'].map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
                <ChevronDownIcon className="absolute right-2 top-2 h-5 w-5 text-gray-400 dark:text-gray-300" />
              </div>
            </div>
            <div>
              <label className="block text-sm text-gray-600 dark:text-gray-300">Статус</label>
              {['Все', 'ОК', 'Низкий остаток', 'Критично'].map((status) => (
                <label key={status} className="flex items-center text-gray-800 dark:text-gray-100">
                  <input
                    type="checkbox"
                    checked={filters.status.includes(status)}
                    onChange={(e) => {
                      const newStatus = e.target.checked
                        ? [...filters.status, status]
                        : filters.status.filter((s) => s !== status);
                      handleFilterChange({ status: newStatus });
                    }}
                    className="mr-2 text-blue-600 dark:text-blue-400 border-gray-300 dark:border-gray-600"
                  />
                  {status}
                </label>
              ))}
            </div>
            <div className="col-span-2">
              <label className="block text-sm text-gray-600 dark:text-gray-300">
                Поиск по артикулу или названию
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={filters.search}
                  onChange={(e) => handleFilterChange({ search: e.target.value })}
                  placeholder="Введите артикул или название"
                  className="w-full p-2 pl-10 border rounded-lg bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-100"
                />
                <svg
                  className="absolute left-3 top-3 h-5 w-5 text-gray-400 dark:text-gray-300"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => dispatch(fetchHistoryData(filters))}
                className="bg-blue-600 dark:bg-blue-700 text-white px-4 py-2 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-800"
              >
                Применить фильтры
              </button>
              <button
                onClick={() =>
                  handleFilterChange({
                    startDate: null,
                    endDate: null,
                    zones: [],
                    categories: [],
                    status: [],
                    search: '',
                  })
                }
                className="bg-gray-600 dark:bg-gray-700 text-white px-4 py-2 rounded-lg hover:bg-gray-700 dark:hover:bg-gray-600"
              >
                Сбросить
              </button>
            </div>
          </div>
        </div>

        {/* Сводная статистика */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-4 mb-6 flex justify-between">
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-300">Всего проверок за период</p>
            <p className="text-xl font-bold text-gray-800 dark:text-gray-100">{historyData.length}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-300">Уникальных товаров</p>
            <p className="text-xl font-bold text-gray-800 dark:text-gray-100">
              {new Set(historyData.map((d) => d.productId)).size}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-300">Выявлено расхождений</p>
            <p className="text-xl font-bold text-gray-800 dark:text-gray-100">
              {historyData.filter((d) => d.discrepancy !== 0).length}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-300">Среднее время инвентаризации</p>
            <p className="text-xl font-bold text-gray-800 dark:text-gray-100">10 мин</p>
          </div>
        </div>

        {/* Таблица данных */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-4 mb-6">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-100 dark:bg-gray-700">
                <th className="p-2 text-left">
                  <input
                    type="checkbox"
                    onChange={(e) => setSelectedItems(e.target.checked ? historyData : [])}
                    className="text-blue-600 dark:text-blue-400 border-gray-300 dark:border-gray-600"
                  />
                </th>
                <th className="p-2 text-left text-gray-800 dark:text-gray-100">Дата и время</th>
                <th className="p-2 text-left text-gray-800 dark:text-gray-100">ID робота</th>
                <th className="p-2 text-left text-gray-800 dark:text-gray-100">Зона</th>
                <th className="p-2 text-left text-gray-800 dark:text-gray-100">Артикул</th>
                <th className="p-2 text-left text-gray-800 dark:text-gray-100">Название</th>
                <th className="p-2 text-left text-gray-800 dark:text-gray-100">Ожидаемое</th>
                <th className="p-2 text-left text-gray-800 dark:text-gray-100">Фактическое</th>
                <th className="p-2 text-left text-gray-800 dark:text-gray-100">Расхождение</th>
                <th className="p-2 text-left text-gray-800 dark:text-gray-100">Статус</th>
              </tr>
            </thead>
            <tbody>
              {historyData.slice((currentPage - 1) * pageSize, currentPage * pageSize).map((data, index) => (
                <tr key={index} className="border-t dark:border-gray-600">
                  <td className="p-2">
                    <input
                      type="checkbox"
                      checked={selectedItems.includes(data)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedItems([...selectedItems, data]);
                        } else {
                          setSelectedItems(selectedItems.filter((i) => i !== data));
                        }
                      }}
                      className="text-blue-600 dark:text-blue-400 border-gray-300 dark:border-gray-600"
                    />
                  </td>
                  <td className="p-2 text-gray-800 dark:text-gray-100">{data.date}</td>
                  <td className="p-2 text-gray-800 dark:text-gray-100">{data.robotId}</td>
                  <td className="p-2 text-gray-800 dark:text-gray-100">{data.zone}</td>
                  <td className="p-2 text-gray-800 dark:text-gray-100">{data.productId}</td>
                  <td className="p-2 text-gray-800 dark:text-gray-100">{data.productName}</td>
                  <td className="p-2 text-gray-800 dark:text-gray-100">{data.expectedQuantity}</td>
                  <td className="p-2 text-gray-800 dark:text-gray-100">{data.actualQuantity}</td>
                  <td className="p-2 text-gray-800 dark:text-gray-100">{data.discrepancy}</td>
                  <td className="p-2">
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${
                        data.status === 'ok'
                          ? 'bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-300'
                          : data.status === 'low'
                          ? 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-300'
                          : 'bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-300'
                      }`}
                    >
                      {data.status === 'ok'
                        ? 'ОК'
                        : data.status === 'low'
                        ? 'Низкий остаток'
                        : 'Критично'}
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
                className="p-2 border rounded-lg bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-100"
              >
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
            <div>
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1 bg-gray-600 dark:bg-gray-700 text-white rounded-lg hover:bg-gray-700 dark:hover:bg-gray-600"
              >
                Назад
              </button>
              <span className="mx-2 text-gray-800 dark:text-gray-100">{currentPage}</span>
              <button
                onClick={() => setCurrentPage((p) => p + 1)}
                className="px-3 py-1 bg-gray-600 dark:bg-gray-700 text-white rounded-lg hover:bg-gray-700 dark:hover:bg-gray-600"
              >
                Вперед
              </button>
            </div>
          </div>
        </div>

        {/* Панель действий */}
        <div className="flex space-x-4 mb-6">
          <button className="bg-green-600 dark:bg-green-700 text-white px-4 py-2 rounded-lg hover:bg-green-700 dark:hover:bg-green-800">
            Экспорт в Excel
          </button>
          <button className="bg-green-600 dark:bg-green-700 text-white px-4 py-2 rounded-lg hover:bg-green-700 dark:hover:bg-green-800">
            Экспорт в PDF
          </button>
          <button className="bg-blue-600 dark:bg-blue-700 text-white px-4 py-2 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-800">
            Построить график
          </button>
        </div>

        {/* График тренда */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-4">
          <h2 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-100">
            Тренд остатков
          </h2>
          <div className="h-64">
            <Line data={chartData} options={chartOptions} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default History;