import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchProducts, addProduct, updateProduct, deleteProduct, setFilters } from '../store/warehouseSlice';
import Header from '../components/Header';
import { SearchIcon, ChevronDownIcon, PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/outline';

function Admin({ onOpenCSVModal }) {
  const dispatch = useDispatch();
  const { products, filters } = useSelector((state) => state.warehouse);
  const [pageSize, setPageSize] = useState(20);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedItems, setSelectedItems] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState({
    product_id: '',
    product_name: '',
    quantity: '',
    zone: '',
    row: '',
    shelf: '',
  });

  // Заглушка для данных
  const mockProducts = [
    {
      id: 1,
      product_id: 'TEL-4567',
      product_name: 'Роутер RT-AC68U',
      quantity: 45,
      zone: 'A',
      row: 12,
      shelf: 3,
    },
    {
      id: 2,
      product_id: 'TEL-8901',
      product_name: 'Модем DSL-2640U',
      quantity: 12,
      zone: 'B',
      row: 5,
      shelf: 2,
    },
  ];

  useEffect(() => {
    dispatch({ type: 'warehouse/fetchProducts/fulfilled', payload: mockProducts });
  }, [dispatch]);

  const handleFilterChange = (newFilters) => {
    dispatch(setFilters({ ...filters, ...newFilters }));
    dispatch(fetchProducts({ ...filters, ...newFilters }));
  };

  const handleAddOrUpdateProduct = () => {
    if (editingProduct) {
      dispatch(updateProduct({ id: editingProduct.id, product: formData }));
    } else {
      dispatch(addProduct({ ...formData, id: Date.now() }));
    }
    setIsModalOpen(false);
    setEditingProduct(null);
    setFormData({
      product_id: '',
      product_name: '',
      quantity: '',
      zone: '',
      row: '',
      shelf: '',
    });
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setFormData(product);
    setIsModalOpen(true);
  };

  const handleDelete = (id) => {
    if (window.confirm('Вы уверены, что хотите удалить товар?')) {
      dispatch(deleteProduct(id));
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <Header onOpenCSVModal={onOpenCSVModal} />
      <div className="p-6">
        {/* Фильтры */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-4 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
              Управление товарами
            </h2>
            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-blue-600 dark:bg-blue-700 text-white px-4 py-2 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-800 flex items-center"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Добавить товар
            </button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
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
                <SearchIcon className="absolute left-3 top-3 h-5 w-5 text-gray-400 dark:text-gray-300" />
              </div>
            </div>
            <div>
              <label className="block text-sm text-gray-600 dark:text-gray-300">
                Зоны
              </label>
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
          </div>
        </div>

        {/* Таблица товаров */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-4 mb-6">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-100 dark:bg-gray-700">
                <th className="p-2 text-left">
                  <input
                    type="checkbox"
                    onChange={(e) => setSelectedItems(e.target.checked ? products : [])}
                    className="text-blue-600 dark:text-blue-400"
                  />
                </th>
                <th className="p-2 text-left text-gray-800 dark:text-gray-100">Артикул</th>
                <th className="p-2 text-left text-gray-800 dark:text-gray-100">Название</th>
                <th className="p-2 text-left text-gray-800 dark:text-gray-100">Количество</th>
                <th className="p-2 text-left text-gray-800 dark:text-gray-100">Зона</th>
                <th className="p-2 text-left text-gray-800 dark:text-gray-100">Стеллаж</th>
                <th className="p-2 text-left text-gray-800 dark:text-gray-100">Полка</th>
                <th className="p-2 text-left text-gray-800 dark:text-gray-100">Действия</th>
              </tr>
            </thead>
            <tbody>
              {products
                .slice((currentPage - 1) * pageSize, currentPage * pageSize)
                .map((product) => (
                  <tr key={product.id} className="border-t dark:border-gray-700">
                    <td className="p-2">
                      <input
                        type="checkbox"
                        checked={selectedItems.includes(product)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedItems([...selectedItems, product]);
                          } else {
                            setSelectedItems(selectedItems.filter((i) => i !== product));
                          }
                        }}
                        className="text-blue-600 dark:text-blue-400"
                      />
                    </td>
                    <td className="p-2 text-gray-800 dark:text-gray-100">
                      {product.product_id}
                    </td>
                    <td className="p-2 text-gray-800 dark:text-gray-100">
                      {product.product_name}
                    </td>
                    <td className="p-2 text-gray-800 dark:text-gray-100">{product.quantity}</td>
                    <td className="p-2 text-gray-800 dark:text-gray-100">{product.zone}</td>
                    <td className="p-2 text-gray-800 dark:text-gray-100">{product.row}</td>
                    <td className="p-2 text-gray-800 dark:text-gray-100">{product.shelf}</td>
                    <td className="p-2 flex space-x-2">
                      <button
                        onClick={() => handleEdit(product)}
                        className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                      >
                        <PencilIcon className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(product.id)}
                        className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
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
                className="px-3 py-1 bg-gray-600 dark:bg-gray-700 text-white rounded-lg"
              >
                Назад
              </button>
              <span className="mx-2 text-gray-800 dark:text-gray-100">{currentPage}</span>
              <button
                onClick={() => setCurrentPage((p) => p + 1)}
                className="px-3 py-1 bg-gray-600 dark:bg-gray-700 text-white rounded-lg"
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
        </div>

        {/* Модальное окно для добавления/редактирования */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-md">
              <h2 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-100">
                {editingProduct ? 'Редактировать товар' : 'Добавить товар'}
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-600 dark:text-gray-300">
                    Артикул
                  </label>
                  <input
                    type="text"
                    value={formData.product_id}
                    onChange={(e) =>
                      setFormData({ ...formData, product_id: e.target.value })
                    }
                    className="w-full p-2 border rounded-lg bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 dark:text-gray-300">
                    Название
                  </label>
                  <input
                    type="text"
                    value={formData.product_name}
                    onChange={(e) =>
                      setFormData({ ...formData, product_name: e.target.value })
                    }
                    className="w-full p-2 border rounded-lg bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 dark:text-gray-300">
                    Количество
                  </label>
                  <input
                    type="number"
                    value={formData.quantity}
                    onChange={(e) =>
                      setFormData({ ...formData, quantity: e.target.value })
                    }
                    className="w-full p-2 border rounded-lg bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 dark:text-gray-300">
                    Зона
                  </label>
                  <select
                    value={formData.zone}
                    onChange={(e) =>
                      setFormData({ ...formData, zone: e.target.value })
                    }
                    className="w-full p-2 border rounded-lg bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-100"
                  >
                    <option value="">Выберите зону</option>
                    {['A', 'B', 'C'].map((zone) => (
                      <option key={zone} value={zone}>
                        {zone}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-600 dark:text-gray-300">
                    Стеллаж
                  </label>
                  <input
                    type="number"
                    value={formData.row}
                    onChange={(e) =>
                      setFormData({ ...formData, row: e.target.value })
                    }
                    className="w-full p-2 border rounded-lg bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 dark:text-gray-300">
                    Полка
                  </label>
                  <input
                    type="number"
                    value={formData.shelf}
                    onChange={(e) =>
                      setFormData({ ...formData, shelf: e.target.value })
                    }
                    className="w-full p-2 border rounded-lg bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-100"
                  />
                </div>
              </div>
              <div className="mt-4 flex justify-end space-x-2">
                <button
                  onClick={() => {
                    setIsModalOpen(false);
                    setEditingProduct(null);
                    setFormData({
                      product_id: '',
                      product_name: '',
                      quantity: '',
                      zone: '',
                      row: '',
                      shelf: '',
                    });
                  }}
                  className="bg-gray-600 dark:bg-gray-700 text-white px-4 py-2 rounded-lg hover:bg-gray-700 dark:hover:bg-gray-600"
                >
                  Отмена
                </button>
                <button
                  onClick={handleAddOrUpdateProduct}
                  className="bg-blue-600 dark:bg-blue-700 text-white px-4 py-2 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-800"
                >
                  Сохранить
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Admin;