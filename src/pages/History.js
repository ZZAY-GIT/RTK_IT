import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Chart } from 'chart.js';
import { fetchHistoryData, setFilters } from '../store/warehouseSlice';
import Header from '../components/Header';
import { SearchIcon } from '@heroicons/react/outline';
import { useTheme } from '../hooks/useTheme';
import * as XLSX from 'xlsx';

function History({ onOpenCSVModal }) {
  const dispatch = useDispatch();
  const { historyData: reduxHistoryData, filters } = useSelector((state) => state.warehouse);
  const { theme } = useTheme();
  const [tableSelectedItems, setTableSelectedItems] = useState([]);
  const [chartSelectedItems, setChartSelectedItems] = useState([]);
  const [pageSize, setPageSize] = useState(20);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [activeQuickPeriod, setActiveQuickPeriod] = useState(null);
  const [productSearch, setProductSearch] = useState('');
  const [showProductSelector, setShowProductSelector] = useState(false);

  // Преобразуем данные из API - ВАЖНО: приводим id к строке
  const transformApiData = (apiData) => {
    if (!apiData || !apiData.items) return [];
    
    return apiData.items.map(item => ({
      id: Number(item.id),
      date: item.scanned_at ? new Date(item.scanned_at).toLocaleDateString('ru-RU') : 'N/A',
      productId: item.product_id || 'N/A',
      productName: item.product_name || `Товар ${item.product_id || 'N/A'}`,
      actualQuantity: item.quantity || 0,
      robotId: item.robot_id || 'N/A',
      zone: item.zone || 'N/A',
      shelfNumber: item.shelf_number || 'N/A',
      status: item.status ? item.status.toLowerCase() : 'unknown',
      expectedQuantity: item.recommended_order || 0,
      discrepancy: item.discrepancy || 0,
      predictionConfidence: item.prediction_confidence || null,
      scanned_at: item.scanned_at,
    }));
  };

  const apiResponse = reduxHistoryData || {};
  const historyItems = transformApiData(apiResponse);
  const totalItems = apiResponse.total || 0;

  const allUniqueProducts = [...new Map(historyItems.map(item => [item.productId, {
    productId: item.productId,
    productName: item.productName
  }])).values()];

  const filteredProducts = allUniqueProducts.filter(product =>
    product.productName.toLowerCase().includes(productSearch.toLowerCase()) ||
    product.productId.toLowerCase().includes(productSearch.toLowerCase())
  );

  const testHistoryData = [
    { id: 1, date: '2024-01-25', productId: 'P1', productName: 'Товар 1', actualQuantity: 100, robotId: 'R1', zone: 'A1', status: 'ok', expectedQuantity: 100, discrepancy: 0 },
    { id: 2, date: '2024-01-24', productId: 'P1', productName: 'Товар 1', actualQuantity: 90, robotId: 'R1', zone: 'A1', status: 'ok', expectedQuantity: 100, discrepancy: -10 },
  ];

  const finalHistoryData = historyItems.length > 0 ? historyItems : testHistoryData;
  const finalTotalItems = historyItems.length > 0 ? totalItems : testHistoryData.length;

  useEffect(() => {
    loadHistoryData();
  }, []);

  const prepareApiFilters = (filters) => {
    const apiFilters = {};
    if (filters.startDate) apiFilters.from_date = filters.startDate;
    if (filters.endDate) apiFilters.to_date = filters.endDate;
    if (filters.zones?.length > 0) apiFilters.zone = filters.zones[0];
    if (filters.status?.length > 0) {
      const statusMap = { 'ok': 'ok', 'low': 'low', 'Низкий остаток': 'low', 'Критично': 'critical', 'critical': 'critical' };
      const apiStatus = statusMap[filters.status[0]];
      if (apiStatus) apiFilters.status = apiStatus;
    }
    if (filters.search) apiFilters.search = filters.search;
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
    if (newFilters.startDate || newFilters.endDate) setActiveQuickPeriod(null);
  };

  const applyFilters = () => {
    setCurrentPage(1);
    loadHistoryData();
  };

  const resetFilters = () => {
    const resetFilters = { startDate: null, endDate: null, zones: [], categories: [], status: [], search: '' };
    dispatch(setFilters(resetFilters));
    setActiveQuickPeriod(null);
    loadHistoryData(resetFilters);
  };

  const handleQuickPeriod = (period) => {
    const today = new Date();
    let startDate = null, endDate = null;
    switch (period) {
      case 'Сегодня': startDate = endDate = today.toISOString().split('T')[0]; break;
      case 'Вчера': const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1); startDate = endDate = yesterday.toISOString().split('T')[0]; break;
      case 'Неделя': const weekAgo = new Date(today); weekAgo.setDate(weekAgo.getDate() - 7); startDate = weekAgo.toISOString().split('T')[0]; endDate = today.toISOString().split('T')[0]; break;
      case 'Месяц': const monthAgo = new Date(today); monthAgo.setMonth(monthAgo.getMonth() - 1); startDate = monthAgo.toISOString().split('T')[0]; endDate = today.toISOString().split('T')[0]; break;
    }
    const newFilters = { ...filters, startDate, endDate };
    dispatch(setFilters(newFilters));
    setActiveQuickPeriod(period);
    setCurrentPage(1);
    loadHistoryData(newFilters);
  };

  useEffect(() => {
    if (filters.startDate || filters.endDate || filters.zones?.length > 0 || filters.status?.length > 0 || filters.search) {
      const timer = setTimeout(applyFilters, 500);
      return () => clearTimeout(timer);
    }
  }, [filters.startDate, filters.endDate, filters.zones, filters.status, filters.search]);

  // Получаем элементы текущей страницы таблицы
  const getCurrentTableItems = () => {
    return finalHistoryData.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  };

  // Функции для управления выбором элементов ТАБЛИЦЫ (исправленные)
  const selectAllTableItems = () => {
    const currentItems = getCurrentTableItems();
    setTableSelectedItems(currentItems);
  };

  const clearTableSelection = () => {
    setTableSelectedItems([]);
  };

  // Проверка выбраны ли все элементы таблицы на текущей странице (ИСПРАВЛЕННАЯ)
  const isAllTableItemsSelected = () => {
    const currentItems = getCurrentTableItems();
    if (currentItems.length === 0) return false;
    
    // Проверяем, что ВСЕ элементы текущей страницы находятся в выбранных
    return currentItems.every(currentItem => 
      tableSelectedItems.some(selectedItem => selectedItem.id === currentItem.id)
    );
  };

  // Проверка выбран ли конкретный элемент
  const isItemSelected = (item) => {
    return tableSelectedItems.some(selectedItem => selectedItem.id === item.id);
  };

  // Обработчик выбора/снятия выбора всех элементов
  const handleSelectAllTableItems = (e) => {
    if (e.target.checked) {
      selectAllTableItems();
    } else {
      clearTableSelection();
    }
  };

  // Обработчик выбора отдельного элемента (ИСПРАВЛЕННЫЙ)
  const handleSelectTableItem = (item, e) => {
    if (e.target.checked) {
      // Добавляем элемент, если его еще нет в выбранных
      if (!isItemSelected(item)) {
        setTableSelectedItems([...tableSelectedItems, item]);
      }
    } else {
      // Удаляем элемент из выбранных
      setTableSelectedItems(tableSelectedItems.filter(selectedItem => selectedItem.id !== item.id));
    }
  };

  // Функции для управления выбором элементов ГРАФИКА
  const clearChartSelection = () => {
    setChartSelectedItems([]);
  };

  // Функция экспорта в Excel (только для таблицы)
  const exportToExcel = () => {
    if (tableSelectedItems.length === 0) {
      alert('Выберите элементы из таблицы для экспорта');
      return;
    }

    // Создаем рабочую книгу
    const workbook = XLSX.utils.book_new();
    
    // Формируем данные для экспорта
    const worksheetData = tableSelectedItems.map(item => ({
      'Дата': item.date,
      'ID робота': item.robotId,
      'Зона': item.zone,
      'Полка': item.shelfNumber,
      'Артикул': item.productId,
      'Название': item.productName,
      'Ожидаемое количество': item.expectedQuantity,
      'Фактическое количество': item.actualQuantity,
      'Расхождение': item.discrepancy,
      'Статус': item.status === 'ok' ? 'ОК' : item.status === 'low' ? 'Низкий остаток' : 'Критично',
      'Уверенность предсказания': item.predictionConfidence || 'N/A'
    }));

    // Создаем worksheet
    const worksheet = XLSX.utils.json_to_sheet(worksheetData);
    
    // Добавляем worksheet в workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'История инвентаризации');
    
    // Скачиваем файл
    XLSX.writeFile(workbook, 'история_инвентаризации.xlsx');
  };

  // Функция для получения количества элементов текущей страницы таблицы
  const getCurrentTableItemsCount = () => {
    return getCurrentTableItems().length;
  };

  // === ГРАФИК ТРЕНДА ОСТАТКОВ НА ЧИСТОМ Chart.js ===
  useEffect(() => {
    const canvas = document.getElementById('trendChart');
    if (!canvas || chartSelectedItems.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (window.trendChartInstance) {
      window.trendChartInstance.destroy();
    }

    const isDark = theme === 'dark';
    const textColor = isDark ? '#f3f4f6' : '#1f2937';
    const gridColor = isDark ? '#4b5563' : '#e5e7eb';

    const labels = [...new Set(finalHistoryData
      .filter(item => chartSelectedItems.some(s => s.productId === item.productId))
      .map(item => item.date))].sort();

    const datasets = chartSelectedItems.map((item, index) => {
      const itemData = finalHistoryData
        .filter(d => d.productId === item.productId)
        .sort((a, b) => new Date(a.date) - new Date(b.date));

      const hue = index * 60;
      const borderColor = isDark ? `hsl(${hue}, 70%, 80%)` : `hsl(${hue}, 70%, 50%)`;
      const bgColor = isDark ? `hsla(${hue}, 70%, 80%, 0.2)` : `hsla(${hue}, 70%, 50%, 0.2)`;

      return {
        label: `${item.productName} (${item.productId})`,
        data: itemData.map(d => d.actualQuantity),
        borderColor,
        backgroundColor: bgColor,
        fill: false,
        tension: 0.3,
        borderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
        pointBackgroundColor: borderColor,
      };
    });

    window.trendChartInstance = new Chart(ctx, {
      type: 'line',
      data: { labels, datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { labels: { color: textColor, font: { size: 13 } } },
          tooltip: {
            backgroundColor: isDark ? '#1f2937' : '#ffffff',
            titleColor: textColor,
            bodyColor: textColor,
            borderColor: gridColor,
            borderWidth: 1,
            padding: 10,
            cornerRadius: 8,
          },
          title: {
            display: true,
            text: 'Тренд остатков по выбранным товарам',
            color: textColor,
            font: { size: 14, weight: '600' },
            padding: { bottom: 10 }
          }
        },
        scales: {
          x: {
            title: { display: true, text: 'Дата', color: textColor },
            ticks: { color: textColor, maxRotation: 45 },
            grid: { color: gridColor }
          },
          y: {
            beginAtZero: true,
            title: { display: true, text: 'Количество', color: textColor },
            ticks: { color: textColor, stepSize: 1 },
            grid: { color: gridColor }
          }
        },
        interaction: { mode: 'nearest', axis: 'x', intersect: false }
      }
    });

    return () => {
      if (window.trendChartInstance) {
        window.trendChartInstance.destroy();
        window.trendChartInstance = null;
      }
    };
  }, [chartSelectedItems, finalHistoryData, theme]);

  const availableZones = [...new Set(finalHistoryData.map(item => item.zone))].filter(z => z && z !== 'N/A');
  const totalPages = Math.ceil(finalTotalItems / pageSize);
  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, finalTotalItems);
  const hasActiveFilters = filters.startDate || filters.endDate || filters.zones?.length > 0 || filters.status?.length > 0 || filters.search;
  const hasChartData = chartSelectedItems.length > 0 && finalHistoryData.some(item => chartSelectedItems.some(s => s.productId === item.productId));
  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <Header onOpenCSVModal={onOpenCSVModal} />
      <div className="p-6">
        {/* === ФИЛЬТРЫ === */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-4 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Фильтры</h2>
            <div className="flex items-center gap-4">
              {activeQuickPeriod && <span className="text-sm text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30 px-2 py-1 rounded">Период: {activeQuickPeriod}</span>}
              {loading && <div className="text-blue-600 dark:text-blue-400">Загрузка...</div>}
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div><label className="block text-sm text-gray-600 dark:text-gray-300">От</label><input type="date" value={filters.startDate || ''} onChange={e => handleFilterChange({ startDate: e.target.value })} className="w-full p-2 border rounded-lg bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-100" /></div>
            <div><label className="block text-sm text-gray-600 dark:text-gray-300">До</label><input type="date" value={filters.endDate || ''} onChange={e => handleFilterChange({ endDate: e.target.value })} className="w-full p-2 border rounded-lg bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-100" /></div>
            <div className="flex space-x-2 items-end">
              {['Сегодня', 'Вчера', 'Неделя', 'Месяц'].map(p => (
                <button key={p} onClick={() => handleQuickPeriod(p)} className={`px-3 py-1 rounded-lg text-sm ${activeQuickPeriod === p ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-600'}`}>{p}</button>
              ))}
            </div>
            <div>
              <label className="block text-sm text-gray-600 dark:text-gray-300">Зона</label>
              <select value={filters.zones?.[0] || ''} onChange={e => handleFilterChange({ zones: e.target.value ? [e.target.value] : [] })} className="w-full p-2 border rounded-lg bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-100">
                <option value="">Все зоны</option>
                {availableZones.map(z => <option key={z} value={z}>{z}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-600 dark:text-gray-300">Статус</label>
              <select value={filters.status?.[0] || ''} onChange={e => handleFilterChange({ status: e.target.value ? [e.target.value] : [] })} className="w-full p-2 border rounded-lg bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-100">
                <option value="">Все статусы</option>
                <option value="ok">ОК</option>
                <option value="low">Низкий остаток</option>
                <option value="critical">Критично</option>
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-sm text-gray-600 dark:text-gray-300">Поиск по артикулу</label>
              <div className="relative">
                <input type="text" value={filters.search || ''} onChange={e => handleFilterChange({ search: e.target.value })} placeholder="Введите артикул товара" className="w-full p-2 pl-10 border rounded-lg bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-100" />
                <SearchIcon className="absolute left-3 top-3 h-5 w-5 text-gray-400 dark:text-gray-300" />
              </div>
            </div>
            <div className="flex space-x-2 items-end">
              <button onClick={applyFilters} disabled={loading} className="bg-blue-600 dark:bg-blue-700 text-white px-4 py-2 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-800 disabled:opacity-50">{loading ? 'Загрузка...' : 'Применить'}</button>
              <button onClick={resetFilters} disabled={loading} className="bg-gray-600 dark:bg-gray-700 text-white px-4 py-2 rounded-lg hover:bg-gray-700 dark:hover:bg-gray-600 disabled:opacity-50">Сброс</button>
            </div>
          </div>
          {hasActiveFilters && (
            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="text-sm text-blue-800 dark:text-blue-300">
                <strong>Активные фильтры:</strong>
                {filters.startDate && ` От: ${filters.startDate}`}
                {filters.endDate && ` До: ${filters.endDate}`}
                {filters.zones?.length > 0 && ` Зон: ${filters.zones.join(', ')}`}
                {filters.status?.length > 0 && ` Статус: ${filters.status.join(', ')}`}
                {filters.search && ` Поиск: "${filters.search}"`}
              </div>
            </div>
          )}
        </div>

        {/* === СТАТИСТИКА === */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-4 mb-6 grid grid-cols-4 gap-4">
          <div><p className="text-sm text-gray-600 dark:text-gray-300">Всего проверок</p><p className="text-xl font-bold text-gray-800 dark:text-gray-100">{finalTotalItems}</p></div>
          <div><p className="text-sm text-gray-600 dark:text-gray-300">Уникальных товаров</p><p className="text-xl font-bold text-gray-800 dark:text-gray-100">{new Set(finalHistoryData.map(d => d.productId)).size}</p></div>
          <div><p className="text-sm text-gray-600 dark:text-gray-300">Выявлено расхождений</p><p className="text-xl font-bold text-gray-800 dark:text-gray-100">{finalHistoryData.filter(d => d.discrepancy !== 0).length}</p></div>
          <div><p className="text-sm text-gray-600 dark:text-gray-300">Активных роботов</p><p className="text-xl font-bold text-gray-800 dark:text-gray-100">{new Set(finalHistoryData.map(d => d.robotId)).size}</p></div>
        </div>

        {/* === ГРАФИК ТРЕНДА === */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-4 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Тренд остатков</h2>
            <button onClick={() => setShowProductSelector(!showProductSelector)} className="bg-blue-600 dark:bg-blue-700 text-white px-4 py-2 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-800">
              {showProductSelector ? 'Скрыть выбор' : 'Выбрать товары'}
            </button>
          </div>

          {showProductSelector && (
            <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="flex items-center gap-4 mb-4">
                <div className="flex-1 relative">
                  <input type="text" value={productSearch} onChange={e => setProductSearch(e.target.value)} placeholder="Поиск товара..." className="w-full p-2 pl-10 border rounded-lg bg-white dark:bg-gray-600 border-gray-300 dark:border-gray-500 text-gray-800 dark:text-gray-100" />
                  <SearchIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400 dark:text-gray-300" />
                </div>
                <button onClick={() => setProductSearch('')} className="bg-gray-600 dark:bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-700 dark:hover:bg-gray-400">Очистить</button>
              </div>
              <div className="max-h-60 overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                  {filteredProducts.slice(0, 100).map(p => (
                    <label key={p.productId} className="flex items-center space-x-2 bg-white dark:bg-gray-600 p-3 rounded-lg border border-gray-200 dark:border-gray-500">
                      <input 
                        type="checkbox" 
                        checked={chartSelectedItems.some(i => i.productId === p.productId)} 
                        onChange={e => e.target.checked ? setChartSelectedItems([...chartSelectedItems, p]) : setChartSelectedItems(chartSelectedItems.filter(i => i.productId !== p.productId))} 
                        className="text-blue-600 dark:text-blue-400" 
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-800 dark:text-gray-100 truncate">{p.productName}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">{p.productId}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
              {chartSelectedItems.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium text-gray-800 dark:text-gray-100 mb-2">Выбрано для графика: {chartSelectedItems.length}</h4>
                  <div className="flex flex-wrap gap-2">
                    {chartSelectedItems.map(i => (
                      <span key={i.productId} className="inline-flex items-center bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 px-3 py-1 rounded-full text-sm">
                        {i.productName}
                        <button onClick={() => setChartSelectedItems(chartSelectedItems.filter(x => x.productId !== i.productId))} className="ml-2">×</button>
                      </span>
                    ))}
                  </div>
                  <button onClick={clearChartSelection} className="mt-2 text-sm text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300">Очистить все</button>
                </div>
              )}
            </div>
          )}

          <div style={{ height: '300px' }}>
            {hasChartData ? (
              <canvas id="trendChart" style={{ width: '100%', height: '100%' }} />
            ) : (
              <div className="h-full flex items-center justify-center bg-gray-50 dark:bg-gray-700 rounded-lg">
                <p className="text-gray-500 dark:text-gray-400">{chartSelectedItems.length === 0 ? 'Выберите товары для графика' : 'Нет данных'}</p>
              </div>
            )}
          </div>
        </div>

        {/* === ПАНЕЛЬ УПРАВЛЕНИЯ ВЫБОРОМ И ЭКСПОРТОМ ТАБЛИЦЫ === */}
        <div className="flex space-x-4 mb-6">
          <button 
            onClick={selectAllTableItems}
            className="bg-blue-600 dark:bg-blue-700 text-white px-4 py-2 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-800 flex items-center"
          >
            Выбрать все в таблице ({getCurrentTableItemsCount()})
          </button>
          <button 
            onClick={clearTableSelection}
            className="bg-gray-600 dark:bg-gray-700 text-white px-4 py-2 rounded-lg hover:bg-gray-700 dark:hover:bg-gray-600 flex items-center"
          >
            Сбросить выбор таблицы
          </button>
          <button 
            onClick={exportToExcel}
            className="bg-green-600 dark:bg-green-700 text-white px-4 py-2 rounded-lg hover:bg-green-700 dark:hover:bg-green-800 flex items-center"
          >
            Экспорт таблицы в Excel ({tableSelectedItems.length})
          </button>
        </div>

        {/* === ТАБЛИЦА === */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">История инвентаризации</h3>
            <div className="text-sm text-gray-600 dark:text-gray-300">Показано {startItem}-{endItem} из {finalTotalItems}</div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
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
                  <th className="p-2 text-left text-gray-800 dark:text-gray-100">Дата</th>
                  <th className="p-2 text-left text-gray-800 dark:text-gray-100">ID робота</th>
                  <th className="p-2 text-left text-gray-800 dark:text-gray-100">Зона</th>
                  <th className="p-2 text-left text-gray-800 dark:text-gray-100">Полка</th>
                  <th className="p-2 text-left text-gray-800 dark:text-gray-100">Артикул</th>
                  <th className="p-2 text-left text-gray-800 dark:text-gray-100">Название</th>
                  <th className="p-2 text-left text-gray-800 dark:text-gray-100">Ожидаемое</th>
                  <th className="p-2 text-left text-gray-800 dark:text-gray-100">Фактическое</th>
                  <th className="p-2 text-left text-gray-800 dark:text-gray-100">Расхождение</th>
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
      </div>
    </div>
  );
}

export default History;