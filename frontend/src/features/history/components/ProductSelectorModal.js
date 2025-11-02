// src/features/history/components/ProductSelectorModal.js
import { SearchIcon } from '@heroicons/react/outline';

export default function ProductSelectorModal({
  show,
  productSearch,
  setProductSearch,
  filteredProducts,
  chartSelectedItems,
  setChartSelectedItems,
  clearChartSelection
}) {
  if (!show) return null;

  return (
    <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
      <div className="flex flex-col sm:flex-row items-stretch gap-2 mb-4">
        <div className="flex-1 relative">
          <input type="text" value={productSearch} onChange={e => setProductSearch(e.target.value)} placeholder="Поиск товара..." className="w-full p-2 pl-10 border rounded-lg bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-100" />
          <SearchIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400 dark:text-gray-300" />
        </div>
        <button onClick={() => setProductSearch('')} className="bg-gray-600 dark:bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-700 dark:hover:bg-gray-400">Очистить</button>
      </div>
      <div className="max-h-60 overflow-y-auto space-y-2">
        {filteredProducts.slice(0, 100).map(p => (
          <label key={p.productId} className="flex items-center space-x-3 bg-white dark:bg-gray-600 p-3 rounded-lg border border-gray-200 dark:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-500 transition">
            <input 
              type="checkbox" 
              checked={chartSelectedItems.some(i => i.productId === p.productId)} 
              onChange={e => e.target.checked ? setChartSelectedItems([...chartSelectedItems, p]) : setChartSelectedItems(chartSelectedItems.filter(i => i.productId !== p.productId))} 
              className="text-blue-600 dark:text-blue-400 w-5 h-5" 
            />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-gray-800 dark:text-gray-100 truncate">{p.productName}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">{p.productId}</div>
            </div>
          </label>
        ))}
      </div>
      {chartSelectedItems.length > 0 && (
        <div className="mt-4">
          <h4 className="text-sm font-medium text-gray-800 dark:text-gray-100 mb-2">Выбрано: {chartSelectedItems.length}</h4>
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
  );
}