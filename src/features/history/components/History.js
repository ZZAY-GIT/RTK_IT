// src/features/history/components/History.js
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Header from '../../../components/Header';
import { SearchIcon } from '@heroicons/react/outline';
import { useTheme } from '../../../hooks/useTheme';
import * as XLSX from 'xlsx';

// === КОМПОНЕНТЫ ===
import FiltersPanel from './FiltersPanel';
import StatsGrid from './StatsGrid';
import TrendChartCanvas from './TrendChartCanvas';
import TableControls from './TableControls';
import HistoryTable from './HistoryTable';
import ProductSelectorModal from './ProductSelectorModal';
import { useHistoryData } from '../hooks/useHistoryData';

export default function History({ onOpenCSVModal }) {
  const dispatch = useDispatch();
  const { historyData: reduxHistoryData, filters } = useSelector((state) => state.warehouse);
  const { theme } = useTheme();

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
    hasChartData
  } = useHistoryData(reduxHistoryData, filters, dispatch);

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <Header onOpenCSVModal={onOpenCSVModal} />
      <div className="p-6">

        {/* === ФИЛЬТРЫ === */}
        <FiltersPanel
          filters={filters}
          activeQuickPeriod={activeQuickPeriod}
          loading={loading}
          availableZones={availableZones}
          handleFilterChange={handleFilterChange}
          handleQuickPeriod={handleQuickPeriod}
          resetFilters={resetFilters}
          hasActiveFilters={hasActiveFilters}
        />

        {/* === СТАТИСТИКА === */}
        <StatsGrid finalHistoryData={finalHistoryData} finalTotalItems={finalTotalItems} />

        {/* === ГРАФИК ТРЕНДА === */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-4 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Тренд остатков</h2>
            <button
              onClick={() => setShowProductSelector(!showProductSelector)}
              className="bg-blue-600 dark:bg-blue-700 text-white px-4 py-2 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-800"
            >
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

          <div style={{ height: '300px' }}>
            {hasChartData ? (
              <TrendChartCanvas
                chartSelectedItems={chartSelectedItems}
                finalHistoryData={finalHistoryData}
                theme={theme}
              />
            ) : (
              <div className="h-full flex items-center justify-center bg-gray-50 dark:bg-gray-700 rounded-lg">
                <p className="text-gray-500 dark:text-gray-400">
                  {chartSelectedItems.length === 0 ? 'Выберите товары для графика' : 'Нет данных'}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* === КНОПКИ УПРАВЛЕНИЯ ТАБЛИЦЕЙ === */}
        <TableControls
          selectAllTableItems={selectAllTableItems}
          clearTableSelection={clearTableSelection}
          exportToExcel={exportToExcel}
          getCurrentTableItemsCount={getCurrentTableItemsCount}
          tableSelectedItems={tableSelectedItems}
        />

        {/* === ТАБЛИЦА === */}
        <HistoryTable
          getCurrentTableItems={getCurrentTableItems}
          isAllTableItemsSelected={isAllTableItemsSelected}
          handleSelectAllTableItems={selectAllTableItems}
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
  );
}