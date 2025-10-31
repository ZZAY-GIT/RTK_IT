// src/features/admin/components/ProductsTable.js
import { PlusIcon, PencilIcon, TrashIcon, SearchIcon } from '@heroicons/react/outline';

export default function ProductsTable({
  paginatedProducts,
  selectedItems,
  setSelectedItems,
  productSearch,
  setProductSearch,
  setIsProductModalOpen,
  setEditingProduct,
  handleEditProduct,
  handleDeleteProduct,
  pageSize,
  setPageSize,
  currentPage,
  setCurrentPage,
  filteredProducts
}) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-4 mb-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Управление товарами</h2>
        <button
          onClick={() => { setEditingProduct(null); setIsProductModalOpen(true); }}
          className="bg-blue-600 dark:bg-blue-700 text-white px-4 py-2 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-800 flex items-center"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Добавить товар
        </button>
      </div>
      <div className="mb-4">
        <label className="block text-sm text-gray-600 dark:text-gray-300">Поиск по ID или названию</label>
        <div className="relative">
          <input
            type="text"
            value={productSearch}
            onChange={(e) => setProductSearch(e.target.value)}
            placeholder="Введите ID или название"
            className="w-full p-2 pl-10 border rounded-lg bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-100"
          />
          <SearchIcon className="absolute left-3 top-3 h-5 w-5 text-gray-400 dark:text-gray-300" />
        </div>
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-100 dark:bg-gray-700">
            <th className="p-2 text-left">
              <input
                type="checkbox"
                checked={selectedItems.length === paginatedProducts.length && paginatedProducts.length > 0}
                onChange={(e) => e.target.checked ? setSelectedItems(paginatedProducts) : setSelectedItems([])}
                className="text-blue-600 dark:text-blue-400 border-gray-300 dark:border-gray-600"
              />
            </th>
            <th className="p-2 text-left text-gray-800 dark:text-gray-100">ID</th>
            <th className="p-2 text-left text-gray-800 dark:text-gray-100">Название</th>
            <th className="p-2 text-left text-gray-800 dark:text-gray-100">Категория</th>
            <th className="p-2 text-left text-gray-800 dark:text-gray-100">Мин. запас</th>
            <th className="p-2 text-left text-gray-800 dark:text-gray-100">Опт. запас</th>
            <th className="p-2 text-left text-gray-800 dark:text-gray-100">Действия</th>
          </tr>
        </thead>
        <tbody>
          {paginatedProducts.length > 0 ? (
            paginatedProducts.map((product) => (
              <tr key={product.id} className="border-t dark:border-gray-600">
                <td className="p-2">
                  <input
                    type="checkbox"
                    checked={selectedItems.some(i => i.id === product.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedItems([...selectedItems, product]);
                      } else {
                        setSelectedItems(selectedItems.filter(i => i.id !== product.id));
                      }
                    }}
                    className="text-blue-600 dark:text-blue-400 border-gray-300 dark:border-gray-600"
                  />
                </td>
                <td className="p-2 text-gray-800 dark:text-gray-100">{product.id}</td>
                <td className="p-2 text-gray-800 dark:text-gray-100">{product.name}</td>
                <td className="p-2 text-gray-800 dark:text-gray-100">{product.category}</td>
                <td className="p-2 text-gray-800 dark:text-gray-100">{product.min_stock}</td>
                <td className="p-2 text-gray-800 dark:text-gray-100">{product.optimal_stock}</td>
                <td className="p-2 flex space-x-2">
                  <button onClick={() => handleEditProduct(product)} className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300">
                    <PencilIcon className="h-5 w-5" />
                  </button>
                  <button onClick={() => handleDeleteProduct(product.id)} className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300">
                    <TrashIcon className="h-5 w-5" />
                  </button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="7" className="p-4 text-center text-gray-500 dark:text-gray-400">
                Нет товаров. Нажмите "Добавить товар" чтобы создать первый товар.
              </td>
            </tr>
          )}
        </tbody>
      </table>
      <div className="flex justify-between mt-4">
        <div>
          <select value={pageSize} onChange={(e) => setPageSize(Number(e.target.value))} className="p-2 border rounded-lg bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-100">
            <option value={20}>20</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>
        <div>
          <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} className="px-3 py-1 bg-gray-600 dark:bg-gray-700 text-white rounded-lg hover:bg-gray-700 dark:hover:bg-gray-600">Назад</button>
          <span className="mx-2 text-gray-800 dark:text-gray-100">{currentPage}</span>
          <button onClick={() => setCurrentPage(p => p + 1)} className="px-3 py-1 bg-gray-600 dark:bg-gray-700 text-white rounded-lg hover:bg-gray-700 dark:hover:bg-gray-600">Вперед</button>
        </div>
      </div>
    </div>
  );
}