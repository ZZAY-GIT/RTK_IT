import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import { fetchHistoryData, setFilters } from '../store/warehouseSlice';
import Header from '../components/Header';
import { ChevronDownIcon, SearchIcon } from '@heroicons/react/outline';
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
  const [loading, setLoading] = useState(false);
  const [activeQuickPeriod, setActiveQuickPeriod] = useState(null);
  const [productSearch, setProductSearch] = useState('');
  const [showProductSelector, setShowProductSelector] = useState(false);

  // Преобразуем данные из API в формат фронтенда
  const transformApiData = (apiData) => {
    if (!apiData || !apiData.items) return [];
    
    return apiData.items.map(item => ({
      id: item.id,
      date: item.scanned_at ? new Date(item.scanned_at).toLocaleDateString('ru-RU') : 'N/A',
      productId: item.product_id || 'N/A',
      productName: item.product_name || `Товар ${item.product_id || 'N/A'}`,
      actualQuantity: item.quantity || 0,
      robotId: item.robot_id || 'N/A',
      zone: item.zone || 'N/A',
      status: item.status ? item.status.toLowerCase() : 'unknown',
      expectedQuantity: item.recommended_order || 0,
      discrepancy: item.discrepancy || 0,
      scanned_at: item.scanned_at,
    }));
  };

  // Получаем данные из Redux store
  const apiResponse = reduxHistoryData || {};
  const historyItems = transformApiData(apiResponse);
  const totalItems = apiResponse.total || 0;

  // Получаем все уникальные продукты из данных
  const allUniqueProducts = [...new Map(historyItems.map(item => [item.productId, {
    productId: item.productId,
    productName: item.productName
  }])).values()];

  // Фильтруем продукты для поиска
  const filteredProducts = allUniqueProducts.filter(product =>
    product.productName.toLowerCase().includes(productSearch.toLowerCase()) ||
    product.productId.toLowerCase().includes(productSearch.toLowerCase())
  );

  // Тестовые данные для отладки (только если API не работает)
  const testHistoryData = [
    {
      date: '2024-01-25',
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
      date: '2024-01-24',
      productId: 'P1',
      productName: 'Товар 1',
      actualQuantity: 90,
      robotId: 'R1',
      zone: 'A1',
      status: 'ok',
      expectedQuantity: 100,
      discrepancy: -10,
    },
  ];

  const finalHistoryData = historyItems.length > 0 ? historyItems : testHistoryData;
  const finalTotalItems = historyItems.length > 0 ? totalItems : testHistoryData.length;

  useEffect(() => {
    // Загружаем данные при монтировании с текущими фильтрами
    loadHistoryData();
  }, []);

  // Подготавливаем параметры для API запроса
  const prepareApiFilters = (filters) => {
    const apiFilters = {};
    
    if (filters.startDate) {
      apiFilters.from_date = filters.startDate;
    }
    if (filters.endDate) {
      apiFilters.to_date = filters.endDate;
    }
    if (filters.zones && filters.zones.length > 0) {
      apiFilters.zone = filters.zones[0];
    }
    if (filters.status && filters.status.length > 0) {
      const statusMap = {
        'ok': 'ok',
        'low': 'low', 
        'Низкий остаток': 'low',
        'Критично': 'critical',
        'critical': 'critical'
      };
      const apiStatus = statusMap[filters.status[0]];
      if (apiStatus) {
        apiFilters.status = apiStatus;
      }
    }
    if (filters.search) {
      apiFilters.search = filters.search;
    }
    
    console.log('API Filters:', apiFilters);
    return apiFilters;
  };

  const loadHistoryData = async (newFilters = filters) => {
    setLoading(true);
    try {
      const apiFilters = prepareApiFilters(newFilters);
      await dispatch(fetchHistoryData(apiFilters));
    } catch (error) {
      console.error('Error loading history data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (newFilters) => {
    const updatedFilters = { ...filters, ...newFilters };
    dispatch(setFilters(updatedFilters));
    
    // Сбрасываем быстрый период если меняются даты вручную
    if (newFilters.startDate || newFilters.endDate) {
      setActiveQuickPeriod(null);
    }
  };

  const applyFilters = () => {
    setCurrentPage(1);
    loadHistoryData();
  };

  const resetFilters = () => {
    const resetFilters = {
      startDate: null,
      endDate: null,
      zones: [],
      categories: [],
      status: [],
      search: '',
    };
    dispatch(setFilters(resetFilters));
    setActiveQuickPeriod(null);
    loadHistoryData(resetFilters);
  };

  // Обработчики для быстрых периодов
  const handleQuickPeriod = (period) => {
    const today = new Date();
    let startDate = null;
    let endDate = null;

    switch (period) {
      case 'Сегодня':
        startDate = today.toISOString().split('T')[0];
        endDate = today.toISOString().split('T')[0];
        break;
      case 'Вчера':
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        startDate = yesterday.toISOString().split('T')[0];
        endDate = yesterday.toISOString().split('T')[0];
        break;
      case 'Неделя':
        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 7);
        startDate = weekAgo.toISOString().split('T')[0];
        endDate = today.toISOString().split('T')[0];
        break;
      case 'Месяц':
        const monthAgo = new Date(today);
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        startDate = monthAgo.toISOString().split('T')[0];
        endDate = today.toISOString().split('T')[0];
        break;
      default:
        break;
    }

    const newFilters = { 
      ...filters, 
      startDate, 
      endDate 
    };
    
    dispatch(setFilters(newFilters));
    setActiveQuickPeriod(period);
    setCurrentPage(1);
    loadHistoryData(newFilters);
  };

  // Автоматическое применение фильтров при изменении дат
  useEffect(() => {
    if (filters.startDate || filters.endDate || filters.zones?.length > 0 || filters.status?.length > 0 || filters.search) {
      const timer = setTimeout(() => {
        applyFilters();
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [filters.startDate, filters.endDate, filters.zones, filters.status, filters.search]);

  // Подготавливаем данные для графика
  const chartData = {
    labels: [...new Set(finalHistoryData
      .filter(item => selectedItems.some(selected => selected.productId === item.productId))
      .map(item => item.date))].sort(),
    datasets: selectedItems.map((item, index) => {
      const itemData = finalHistoryData
        .filter(d => d.productId === item.productId)
        .sort((a, b) => new Date(a.date) - new Date(b.date));
      
      return {
        label: `${item.productName} (${item.productId})`,
        data: itemData.map(d => d.actualQuantity),
        borderColor: theme === 'dark' ? `hsl(${index * 60}, 70%, 80%)` : `hsl(${index * 60}, 70%, 50%)`,
        backgroundColor: theme === 'dark' ? `hsl(${index * 60}, 70%, 80%, 0.2)` : `hsl(${index * 60}, 70%, 50%, 0.2)`,
        fill: false,
        tension: 0.1,
        borderWidth: 2,
      };
    }),
  };

  const chartOptions = {
    maintainAspectRatio: false,
    responsive: true,
    plugins: {
      legend: {
        labels: {
          color: theme === 'dark' ? '#ffffff' : '#1f2937',
          font: {
            size: 14,
          },
        },
      },
      tooltip: {
        backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff',
        titleColor: theme === 'dark' ? '#ffffff' : '#1f2937',
        bodyColor: theme === 'dark' ? '#ffffff' : '#1f2937',
        borderColor: theme === 'dark' ? '#4b5563' : '#d1d5db',
        borderWidth: 1,
      },
    },
    scales: {
      x: {
        ticks: {
          color: theme === 'dark' ? '#ffffff' : '#1f2937',
        },
        grid: {
          color: theme === 'dark' ? '#374151' : '#e5e7eb',
        },
      },
      y: {
        ticks: {
          color: theme === 'dark' ? '#ffffff' : '#1f2937',
        },
        grid: {
          color: theme === 'dark' ? '#374151' : '#e5e7eb',
        },
      },
    },
  };

  // Получаем уникальные зоны из данных
  const availableZones = [...new Set(finalHistoryData.map(item => item.zone))].filter(zone => zone && zone !== 'N/A');
  
  // Рассчитываем пагинацию
  const totalPages = Math.ceil(finalTotalItems / pageSize);
  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, finalTotalItems);

  // Проверяем активные фильтры для отображения
  const hasActiveFilters = filters.startDate || filters.endDate || filters.zones?.length > 0 || filters.status?.length > 0 || filters.search;

  // Проверяем есть ли данные для графика
  const hasChartData = selectedItems.length > 0 && finalHistoryData.some(item => 
    selectedItems.some(selected => selected.productId === item.productId)
  );

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <Header onOpenCSVModal={onOpenCSVModal} />
      <div className="p-6">
        {/* Панель фильтров */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-4 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
              Фильтры {hasActiveFilters && '⚡'}
            </h2>
            <div className="flex items-center gap-4">
              {activeQuickPeriod && (
                <span className="text-sm text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30 px-2 py-1 rounded">
                  Период: {activeQuickPeriod}
                </span>
              )}
              {loading && (
                <div className="text-blue-600 dark:text-blue-400">Загрузка...</div>
              )}
            </div>
          </div>
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
            <div className="flex space-x-2 items-end">
              {['Сегодня', 'Вчера', 'Неделя', 'Месяц'].map((period) => (
                <button
                  key={period}
                  onClick={() => handleQuickPeriod(period)}
                  className={`px-3 py-1 rounded-lg text-sm ${
                    activeQuickPeriod === period
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {period}
                </button>
              ))}
            </div>
            <div>
              <label className="block text-sm text-gray-600 dark:text-gray-300">Зона</label>
              <div className="relative">
                <select
                  value={filters.zones && filters.zones.length > 0 ? filters.zones[0] : ''}
                  onChange={(e) => handleFilterChange({ 
                    zones: e.target.value ? [e.target.value] : [] 
                  })}
                  className="w-full p-2 border rounded-lg bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-100"
                >
                  <option value="">Все зоны</option>
                  {availableZones.map((zone) => (
                    <option key={zone} value={zone}>
                      {zone}
                    </option>
                  ))}
                </select>
                <ChevronDownIcon className="absolute right-2 top-2 h-5 w-5 text-gray-400 dark:text-gray-300" />
              </div>
            </div>
            <div>
              <label className="block text-sm text-gray-600 dark:text-gray-300">Статус</label>
              <div className="relative">
                <select
                  value={filters.status && filters.status.length > 0 ? filters.status[0] : ''}
                  onChange={(e) => handleFilterChange({ 
                    status: e.target.value ? [e.target.value] : [] 
                  })}
                  className="w-full p-2 border rounded-lg bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-100"
                >
                  <option value="">Все статусы</option>
                  <option value="ok">ОК</option>
                  <option value="low">Низкий остаток</option>
                  <option value="critical">Критично</option>
                </select>
                <ChevronDownIcon className="absolute right-2 top-2 h-5 w-5 text-gray-400 dark:text-gray-300" />
              </div>
            </div>
            <div className="col-span-2">
              <label className="block text-sm text-gray-600 dark:text-gray-300">
                Поиск по артикулу
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={filters.search || ''}
                  onChange={(e) => handleFilterChange({ search: e.target.value })}
                  placeholder="Введите артикул товара"
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
            <div className="flex space-x-2 items-end">
              <button
                onClick={applyFilters}
                disabled={loading}
                className="bg-blue-600 dark:bg-blue-700 text-white px-4 py-2 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-800 disabled:opacity-50"
              >
                {loading ? 'Загрузка...' : 'Применить'}
              </button>
              <button
                onClick={resetFilters}
                disabled={loading}
                className="bg-gray-600 dark:bg-gray-700 text-white px-4 py-2 rounded-lg hover:bg-gray-700 dark:hover:bg-gray-600 disabled:opacity-50"
              >
                Сброс
              </button>
            </div>
          </div>

          {/* Индикатор активных фильтров */}
          {hasActiveFilters && (
            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="text-sm text-blue-800 dark:text-blue-300">
                <strong>Активные фильтры:</strong>
                {filters.startDate && ` От: ${filters.startDate}`}
                {filters.endDate && ` До: ${filters.endDate}`}
                {filters.zones?.length > 0 && ` Зона: ${filters.zones.join(', ')}`}
                {filters.status?.length > 0 && ` Статус: ${filters.status.join(', ')}`}
                {filters.search && ` Поиск: "${filters.search}"`}
              </div>
            </div>
          )}
        </div>

        {/* Сводная статистика */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-4 mb-6 grid grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-300">Всего проверок</p>
            <p className="text-xl font-bold text-gray-800 dark:text-gray-100">
              {finalTotalItems}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-300">Уникальных товаров</p>
            <p className="text-xl font-bold text-gray-800 dark:text-gray-100">
              {new Set(finalHistoryData.map(d => d.productId)).size}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-300">Выявлено расхождений</p>
            <p className="text-xl font-bold text-gray-800 dark:text-gray-100">
              {finalHistoryData.filter(d => d.discrepancy !== 0).length}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-300">Активных роботов</p>
            <p className="text-xl font-bold text-gray-800 dark:text-gray-100">
              {new Set(finalHistoryData.map(d => d.robotId)).size}
            </p>
          </div>
        </div>

        {/* График тренда - ПЕРЕМЕЩЕН НАВЕРХ */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-4 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
              Тренд остатков
            </h2>
            <button
              onClick={() => setShowProductSelector(!showProductSelector)}
              className="bg-blue-600 dark:bg-blue-700 text-white px-4 py-2 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-800"
            >
              {showProductSelector ? 'Скрыть выбор' : 'Выбрать товары'}
            </button>
          </div>

          {/* Поиск и выбор товаров для графика */}
          {showProductSelector && (
            <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="flex items-center gap-4 mb-4">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    placeholder="Поиск товара по названию или артикулу..."
                    className="w-full p-2 pl-10 border rounded-lg bg-white dark:bg-gray-600 border-gray-300 dark:border-gray-500 text-gray-800 dark:text-gray-100"
                  />
                  <SearchIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400 dark:text-gray-300" />
                </div>
                <button
                  onClick={() => setProductSearch('')}
                  className="bg-gray-600 dark:bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-700 dark:hover:bg-gray-400"
                >
                  Очистить
                </button>
              </div>

              <div className="max-h-60 overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                  {filteredProducts.slice(0, 100).map(product => (
                    <label key={product.productId} className="flex items-center space-x-2 bg-white dark:bg-gray-600 p-3 rounded-lg border border-gray-200 dark:border-gray-500">
                      <input
                        type="checkbox"
                        checked={selectedItems.some(item => item.productId === product.productId)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedItems([...selectedItems, product]);
                          } else {
                            setSelectedItems(selectedItems.filter(item => item.productId !== product.productId));
                          }
                        }}
                        className="text-blue-600 dark:text-blue-400"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-800 dark:text-gray-100 truncate">
                          {product.productName}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {product.productId}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
                {filteredProducts.length === 0 && (
                  <div className="text-center text-gray-500 dark:text-gray-400 py-4">
                    Товары не найдены
                  </div>
                )}
                {filteredProducts.length > 100 && (
                  <div className="text-center text-gray-500 dark:text-gray-400 py-2">
                    Показано 100 из {filteredProducts.length} товаров
                  </div>
                )}
              </div>

              {/* Выбранные товары */}
              {selectedItems.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium text-gray-800 dark:text-gray-100 mb-2">
                    Выбрано товаров: {selectedItems.length}
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedItems.map(item => (
                      <span
                        key={item.productId}
                        className="inline-flex items-center bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 px-3 py-1 rounded-full text-sm"
                      >
                        {item.productName}
                        <button
                          onClick={() => setSelectedItems(selectedItems.filter(i => i.productId !== item.productId))}
                          className="ml-2 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                  <button
                    onClick={() => setSelectedItems([])}
                    className="mt-2 text-sm text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
                  >
                    Очистить все
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Отображение графика */}
          {hasChartData ? (
            <div className="h-64">
              <Line data={chartData} options={chartOptions} />
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="text-center text-gray-500 dark:text-gray-400">
                {selectedItems.length === 0 ? (
                  <p>Выберите товары для построения графика</p>
                ) : (
                  <p>Нет данных для выбранных товаров в текущем периоде</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Таблица данных */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
              История инвентаризации
            </h3>
            <div className="text-sm text-gray-600 dark:text-gray-300">
              Показано {startItem}-{endItem} из {finalTotalItems}
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-100 dark:bg-gray-700">
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
                {finalHistoryData
                  .slice((currentPage - 1) * pageSize, currentPage * pageSize)
                  .map((data, index) => (
                  <tr key={index} className="border-t dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="p-2 text-gray-800 dark:text-gray-100">{data.date}</td>
                    <td className="p-2 text-gray-800 dark:text-gray-100">{data.robotId}</td>
                    <td className="p-2 text-gray-800 dark:text-gray-100">{data.zone}</td>
                    <td className="p-2 text-gray-800 dark:text-gray-100">{data.productId}</td>
                    <td className="p-2 text-gray-800 dark:text-gray-100">{data.productName}</td>
                    <td className="p-2 text-gray-800 dark:text-gray-100">{data.expectedQuantity}</td>
                    <td className="p-2 text-gray-800 dark:text-gray-100">{data.actualQuantity}</td>
                    <td className="p-2 text-gray-800 dark:text-gray-100">
                      <span className={data.discrepancy < 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}>
                        {data.discrepancy > 0 ? '+' : ''}{data.discrepancy}
                      </span>
                    </td>
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
                          : data.status === 'critical'
                          ? 'Критично'
                          : data.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Пагинация */}
          <div className="flex justify-between items-center mt-4">
            <div>
              <span className="text-sm text-gray-600 dark:text-gray-300 mr-2">Строк на странице:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="p-2 border rounded-lg bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-100"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 bg-gray-600 dark:bg-gray-700 text-white rounded-lg hover:bg-gray-700 dark:hover:bg-gray-600 disabled:opacity-50"
              >
                Назад
              </button>
              <span className="mx-2 text-gray-800 dark:text-gray-100">
                Страница {currentPage} из {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(p => p + 1)}
                disabled={currentPage >= totalPages}
                className="px-3 py-1 bg-gray-600 dark:bg-gray-700 text-white rounded-lg hover:bg-gray-700 dark:hover:bg-gray-600 disabled:opacity-50"
              >
                Вперед
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default History;