// src/features/admin/components/ProductManager/ProductManager.js
import { useState, useEffect } from 'react';
// src/features/admin/components/ProductManager/ProductManager.js
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchProducts, addProduct, updateProduct, deleteProduct
} from '../../../../store/warehouseSlice';// Правильный путь
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/outline';
import * as XLSX from 'xlsx';

export default function ProductManager() {
  const dispatch = useDispatch();
  const { products, filters } = useSelector((state) => state.warehouse);
  const [pageSize, setPageSize] = useState(20);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedItems, setSelectedItems] = useState([]);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [productSearch, setProductSearch] = useState('');

  useEffect(() => {
    dispatch(fetchProducts(filters));
  }, [dispatch, filters]);

  const filteredProducts = products.filter(
    (product) =>
      (product.id || '').toLowerCase().includes(productSearch.toLowerCase()) ||
      (product.name || '').toLowerCase().includes(productSearch.toLowerCase())
  );

  const paginatedProducts = filteredProducts.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const totalPages = Math.ceil(filteredProducts.length / pageSize);

  const selectAllItems = () => {
    if (selectedItems.length === paginatedProducts.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(paginatedProducts.map(p => p.id));
    }
  };

  const toggleSelectItem = (id) => {
    setSelectedItems(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleDeleteSelected = () => {
    selectedItems.forEach(id => dispatch(deleteProduct(id)));
    setSelectedItems([]);
  };

  const handleEditProduct = (product) => {
    setEditingProduct(product);
    setIsProductModalOpen(true);
  };

  const handleSaveProduct = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = {
      id: formData.get('id'),
      name: formData.get('name'),
      quantity: Number(formData.get('quantity')),
      price: Number(formData.get('price')),
    };

    if (editingProduct) {
      dispatch(updateProduct({ id: editingProduct.id, product: data }));
    } else {
      dispatch(addProduct(data));
    }
    setIsProductModalOpen(false);
    setEditingProduct(null);
  };

  const handleCancelProduct = () => {
    setIsProductModalOpen(false);
    setEditingProduct(null);
  };

  const exportToExcel = () => {
    const ws = XLSX.utils.json_to_sheet(filteredProducts);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Products");
    XLSX.writeFile(wb, "products.xlsx");
  };

  return (
    <div>
      <div className="flex justify-between mb-4">
        <input
          type="text"
          placeholder="Поиск по ID или названию..."
          value={productSearch}
          onChange={(e) => setProductSearch(e.target.value)}
          className="px-4 py-2 border rounded-lg bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-100"
        />
        <div className="space-x-2">
          <button
            onClick={exportToExcel}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
          >
            Экспорт в Excel
          </button>
          <button
            onClick={() => setIsProductModalOpen(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            <PlusIcon className="h-5 w-5 inline mr-1" /> Добавить
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="p-3">
                <input
                  type="checkbox"
                  checked={selectedItems.length === paginatedProducts.length && paginatedProducts.length > 0}
                  onChange={selectAllItems}
                  className="rounded"
                />
              </th>
              <th className="p-3 text-left">ID</th>
              <th className="p-3 text-left">Название</th>
              <th className="p-3 text-left">Количество</th>
              <th className="p-3 text-left">Цена</th>
              <th className="p-3 text-left">Действия</th>
            </tr>
          </thead>
          <tbody>
            {paginatedProducts.map((product) => (
              <tr key={product.id} className="border-t dark:border-gray-600">
                <td className="p-3">
                  <input
                    type="checkbox"
                    checked={selectedItems.includes(product.id)}
                    onChange={() => toggleSelectItem(product.id)}
                    className="rounded"
                  />
                </td>
                <td className="p-3">{product.id}</td>
                <td className="p-3">{product.name}</td>
                <td className="p-3">{product.quantity}</td>
                <td className="p-3">{product.price}</td>
                <td className="p-3">
                  <button
                    onClick={() => handleEditProduct(product)}
                    className="text-blue-600 hover:underline mr-2"
                  >
                    <PencilIcon className="h-5 w-5 inline" />
                  </button>
                  <button
                    onClick={() => dispatch(deleteProduct(product.id))}
                    className="text-red-600 hover:underline"
                  >
                    <TrashIcon className="h-5 w-5 inline" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex justify-between items-center mt-4">
        <div>
          <span className="text-sm text-gray-600 dark:text-gray-300 mr-2">Строк:</span>
          <select
            value={pageSize}
            onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
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

      {isProductModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">
              {editingProduct ? 'Редактировать товар' : 'Добавить товар'}
            </h3>
            <form onSubmit={handleSaveProduct}>
              <div className="space-y-3">
                <input name="id" defaultValue={editingProduct?.id} placeholder="ID" required className="w-full p-2 border rounded-lg" />
                <input name="name" defaultValue={editingProduct?.name} placeholder="Название" required className="w-full p-2 border rounded-lg" />
                <input name="quantity" type="number" defaultValue={editingProduct?.quantity} placeholder="Количество" className="w-full p-2 border rounded-lg" />
                <input name="price" type="number" step="0.01" defaultValue={editingProduct?.price} placeholder="Цена" className="w-full p-2 border rounded-lg" />
              </div>
              <div className="mt-4 flex justify-end space-x-2">
                <button type="button" onClick={handleCancelProduct} className="bg-gray-600 text-white px-4 py-2 rounded-lg">
                  Отмена
                </button>
                <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg">
                  Сохранить
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}