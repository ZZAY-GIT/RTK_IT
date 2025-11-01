// src/features/history/components/History.js
import { useState } from 'react'; // ← ДОБАВЛЕНО: импорт useState
import { useDispatch, useSelector } from 'react-redux';
import { setFilters } from '../../../store/warehouseSlice';
import Header from '../../../components/Header';
import { FilterIcon } from '@heroicons/react/outline';
import { useTheme } from '../../../hooks/useTheme';

// === КОМПОНЕНТЫ ===
import FiltersPanel from './FiltersPanel';
import StatsGrid from './StatsGrid';
import TrendChartCanvas from './TrendChartCanvas';
import HistoryTable from './HistoryTable';
import ProductSelectorModal from './ProductSelectorModal';

// === ХУК ===
import { useHistoryData } from '../hooks/useHistoryData';

import { Chart } from 'chart.js';
import {
  CategoryScale,
  LinearScale,
  PointElement,
  LineController,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

// РЕГИСТРАЦИЯ СКАЛ И ЭЛЕМЕНТОВ ЧАРТА
Chart.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineController,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function History({ onOpenCSVModal }) {
  const dispatch = useDispatch();
  const { historyData: reduxHistoryData, filters } = useSelector(state => state.warehouse);
  const { theme } = useTheme();

  // Используем кастомный хук для всей логики данных
  const {
    historyItems,
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
  } = useHistoryData(reduxHistoryData, filters, dispatch);

  const [filterOpen, setFilterOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <Header onOpenCSVModal={onOpenCSVModal} />
      <div className="p-4 sm:p-6 max-w-7xl mx-auto">

        {/* Фильтры */}
        <div className="mb-6">
          <button onClick={() => setFilterOpen(!filterOpen)} className="sm:hidden w-full flex items-center justify-center space-x-2 p-3 bg-gray-200 dark:bg-gray-700 rounded-lg text-gray-800 dark:text-gray-100 hover:bg-gray-300 dark:hover:bg-gray-600 transition text-sm font-medium">
            <FilterIcon className="h-5 w-5" />
            <span>Фильтры</span>
          </button>
          <div className={`${filterOpen ? 'block' : 'hidden'} sm:block mt-3 sm:mt-0`}>
            <FiltersPanel
              filters={filters}
              activeQuickPeriod={activeQuickPeriod}
              loading={loading}
              availableZones={availableZones}
              handleFilterChange={handleFilterChange}
              handleQuickPeriod={handleQuickPeriod}
              resetFilters={resetFilters}
              hasActiveFilters={hasActiveFilters}
              applyFilters={applyFilters}
            />
          </div>
        </div>

        <StatsGrid 
          finalHistoryData={finalHistoryData} 
          finalTotalItems={finalTotalItems} 
        />

        {/* График */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-4 mb-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 space-y-2 sm:space-y-0">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Тренд остатков</h2>
            <button onClick={() => setShowProductSelector(!showProductSelector)} className="bg-blue-600 dark:bg-blue-700 text-white px-4 py-2 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-800 text-sm">
              {showProductSelector ? 'Скрыть выбор' : 'Выбрать товары'}
            </button>
          </div>

          <ProductSelectorModal
            show={showProductSelector}
            productSearch={productSearch}
            setProductSearch={setProductSearch}
            filteredProducts={filteredProducts}
            chartSelectedItems={chartSelectedItems}
            setChartSelectedItems={setChartSelectedItems}
            clearChartSelection={clearChartSelection}
          />

          <div className="h-[300px] sm:h-[400px] mt-4">
            {hasChartData ? (
              <TrendChartCanvas
                chartSelectedItems={chartSelectedItems}
                finalHistoryData={finalHistoryData}
                theme={theme}
              />
            ) : (
              <div className="h-full flex items-center justify-center bg-gray-50 dark:bg-gray-700 rounded-lg">
                <p className="text-gray-500 dark:text-gray-400 text-center px-4">
                  {chartSelectedItems.length === 0 ? 'Выберите товары для построения графика' : 'Нет данных за выбранный период'}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Кнопки */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <button onClick={selectAllTableItems} className="bg-blue-600 dark:bg-blue-700 text-white px-4 py-2.5 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-800 flex items-center justify-center text-sm font-medium shadow-sm">
            Выбрать все ({getCurrentTableItemsCount()})
          </button>
          <button onClick={clearTableSelection} className="bg-gray-600 dark:bg-gray-700 text-white px-4 py-2.5 rounded-lg hover:bg-gray-700 dark:hover:bg-gray-600 flex items-center justify-center text-sm font-medium shadow-sm">
            Сбросить выбор
          </button>
          <button onClick={exportToExcel} disabled={tableSelectedItems.length === 0} className={`px-4 py-2.5 rounded-lg text-sm font-medium flex items-center justify-center shadow-sm ${tableSelectedItems.length > 0 ? 'bg-green-600 dark:bg-green-700 text-white hover:bg-green-700 dark:hover:bg-green-800' : 'bg-gray-400 dark:bg-gray-600 text-gray-300 dark:text-gray-500 cursor-not-allowed'}`}>
            Экспорт в Excel ({tableSelectedItems.length})
          </button>
        </div>

        {/* Таблица */}
        <div className="overflow-x-auto -mx-4 px-4">
          <HistoryTable
            getCurrentTableItems={getCurrentTableItems}
            isAllTableItemsSelected={isAllTableItemsSelected}
            handleSelectAllTableItems={handleSelectAllTableItems}
            isItemSelected={isItemSelected}
            handleSelectTableItem={handleSelectTableItem}
            pageSize={pageSize}
            setPageSize={setPageSize}
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
            totalPages={totalPages}
            startItem={startItem}
            endItem={endItem}
            finalTotalItems={finalTotalItems}
          />
        </div>
      </div>
    </div>
  );
}