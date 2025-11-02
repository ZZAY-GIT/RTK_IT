// src/features/history/hooks/useHistoryData.js
import { useEffect, useState } from 'react';
import { fetchHistoryData } from '../../../store/warehouseSlice';
import * as XLSX from 'xlsx';

export function useHistoryData(reduxHistoryData, filters, dispatch) {
  const [tableSelectedItems, setTableSelectedItems] = useState([]);
  const [chartSelectedItems, setChartSelectedItems] = useState([]);
  const [pageSize, setPageSize] = useState(20);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [activeQuickPeriod, setActiveQuickPeriod] = useState(null);
  const [productSearch, setProductSearch] = useState('');
  const [showProductSelector, setShowProductSelector] = useState(false);

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
      // ИСПРАВЛЕНИЕ: преобразуем статусы из БД в русские для отображения
      status: getDisplayStatus(item.status),
      statusDb: item.status, // сохраняем оригинальный статус из БД
      expectedQuantity: item.recommended_order || 0,
      discrepancy: item.discrepancy || 0,
      predictionConfidence: item.prediction_confidence || null,
      scanned_at: item.scanned_at,
    }));
  };

  // Функция для преобразования статусов БД в русские для отображения
  const getDisplayStatus = (statusDb) => {
    switch (statusDb) {
      case 'OK': return 'ok';
      case 'LOW_STOCK': return 'low';
      case 'CRITICAL': return 'critical';
      default: return 'unknown';
    }
  };

  // Функция для преобразования русских статусов в статусы БД
  const getDbStatus = (displayStatus) => {
    switch (displayStatus) {
      case 'ok': return 'OK';
      case 'low': return 'LOW_STOCK';
      case 'critical': return 'CRITICAL';
      default: return null;
    }
  };

  const apiResponse = reduxHistoryData || {};
  
  const finalHistoryData = transformApiData(apiResponse);
  const finalTotalItems = apiResponse.total || finalHistoryData.length;

  const allUniqueProducts = [...new Map(finalHistoryData.map(item => [item.productId, {
    productId: item.productId,
    productName: item.productName
  }])).values()];

  const filteredProducts = allUniqueProducts.filter(product =>
    product.productName.toLowerCase().includes(productSearch.toLowerCase()) ||
    product.productId.toLowerCase().includes(productSearch.toLowerCase())
  );

  useEffect(() => {
    loadHistoryData();
  }, []);

  const prepareApiFilters = (filters) => {
    const apiFilters = {};
    if (filters.startDate) apiFilters.from_date = filters.startDate;
    if (filters.endDate) apiFilters.to_date = filters.endDate;
    if (filters.zones?.length > 0) apiFilters.zone = filters.zones[0];
    if (filters.status?.length > 0) {
      // ИСПРАВЛЕНИЕ: преобразуем русский статус в статус БД
      const dbStatus = getDbStatus(filters.status[0]);
      if (dbStatus) apiFilters.status = dbStatus;
    }
    if (filters.search) apiFilters.product_id = filters.search;
    return apiFilters;
  };

  const loadHistoryData = async (newFilters = filters) => {
    setLoading(true);
    try {
      const apiFilters = prepareApiFilters(newFilters);
      console.log('Sending request with filters:', apiFilters);
      await dispatch(fetchHistoryData(apiFilters));
    } catch (error) {
      console.error('Error loading history data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (newFilters) => {
    const updatedFilters = { ...filters, ...newFilters };
    dispatch({ type: 'warehouse/setFilters', payload: updatedFilters });
    if (newFilters.startDate || newFilters.endDate) setActiveQuickPeriod(null);
  };

  const applyFilters = () => {
    setCurrentPage(1);
    loadHistoryData();
  };

  const resetFilters = () => {
    const resetFilters = { startDate: null, endDate: null, zones: [], categories: [], status: [], search: '' };
    dispatch({ type: 'warehouse/setFilters', payload: resetFilters });
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
    dispatch({ type: 'warehouse/setFilters', payload: newFilters });
    setActiveQuickPeriod(period);
    setCurrentPage(1);
    loadHistoryData(newFilters);
  };

  // Включаем автоматическое применение фильтров с debounce
  useEffect(() => {
    const hasFilters = filters.startDate || filters.endDate || filters.zones?.length > 0 || filters.status?.length > 0 || filters.search;
    
    if (hasFilters) {
      const timer = setTimeout(() => {
        // Проверяем, действительно ли фильтры изменились
        applyFilters();
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [filters.startDate, filters.endDate, filters.zones, filters.status, filters.search]);

  const getCurrentTableItems = () => {
    return finalHistoryData.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  };

  const selectAllTableItems = () => {
    const currentItems = getCurrentTableItems();
    setTableSelectedItems(currentItems);
  };

  const clearTableSelection = () => {
    setTableSelectedItems([]);
  };

  const isAllTableItemsSelected = () => {
    const currentItems = getCurrentTableItems();
    if (currentItems.length === 0) return false;
    return currentItems.every(currentItem => 
      tableSelectedItems.some(selectedItem => selectedItem.id === currentItem.id)
    );
  };

  const isItemSelected = (item) => {
    return tableSelectedItems.some(selectedItem => selectedItem.id === item.id);
  };

  const handleSelectAllTableItems = (e) => {
    if (e.target.checked) {
      selectAllTableItems();
    } else {
      clearTableSelection();
    }
  };

  const handleSelectTableItem = (item, e) => {
    if (e.target.checked) {
      if (!isItemSelected(item)) {
        setTableSelectedItems([...tableSelectedItems, item]);
      }
    } else {
      setTableSelectedItems(tableSelectedItems.filter(selectedItem => selectedItem.id !== item.id));
    }
  };

  const clearChartSelection = () => {
    setChartSelectedItems([]);
  };

  const exportToExcel = () => {
    if (tableSelectedItems.length === 0) {
      alert('Выберите элементы из таблицы для экспорта');
      return;
    }

    const workbook = XLSX.utils.book_new();
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

    const worksheet = XLSX.utils.json_to_sheet(worksheetData);
    XLSX.utils.book_append_sheet(workbook, worksheet, 'История инвентаризации');
    XLSX.writeFile(workbook, 'история_инвентаризации.xlsx');
  };

  const getCurrentTableItemsCount = () => {
    return getCurrentTableItems().length;
  };

  const availableZones = [...new Set(finalHistoryData.map(item => item.zone))].filter(z => z && z !== 'N/A');
  const totalPages = Math.ceil(finalTotalItems / pageSize);
  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, finalTotalItems);
  const hasActiveFilters = filters.startDate || filters.endDate || filters.zones?.length > 0 || filters.status?.length > 0 || filters.search;
  const hasChartData = chartSelectedItems.length > 0 && finalHistoryData.some(item => chartSelectedItems.some(s => s.productId === item.productId));

  return {
    historyItems: finalHistoryData,
    finalHistoryData,
    finalTotalItems,
    allUniqueProducts,
    filteredProducts,
    tableSelectedItems,
    setTableSelectedItems,
    chartSelectedItems,
    setChartSelectedItems,
    pageSize,
    setPageSize,
    currentPage,
    setCurrentPage,
    loading,
    setLoading,
    activeQuickPeriod,
    setActiveQuickPeriod,
    productSearch,
    setProductSearch,
    showProductSelector,
    setShowProductSelector,
    loadHistoryData,
    handleFilterChange,
    resetFilters,
    handleQuickPeriod,
    selectAllTableItems,
    clearTableSelection,
    isAllTableItemsSelected,
    isItemSelected,
    handleSelectAllTableItems,
    handleSelectTableItem,
    clearChartSelection,
    exportToExcel,
    getCurrentTableItemsCount,
    getCurrentTableItems,
    availableZones,
    totalPages,
    startItem,
    endItem,
    hasActiveFilters,
    hasChartData,
    applyFilters
  };
}