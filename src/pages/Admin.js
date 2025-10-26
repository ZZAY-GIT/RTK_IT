import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchProducts, addProduct, updateProduct, deleteProduct,
  fetchUsers, createUser, updateUser, deleteUser,
  fetchRobots, createRobot, updateRobot, deleteRobot,
  setFilters
} from '../store/warehouseSlice';
import Header from '../components/Header';
import { SearchIcon, ChevronDownIcon, PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/outline';
import { useTheme } from '../hooks/useTheme';
import { useAuth } from '../hooks/useAuth';

function Admin({ onOpenCSVModal }) {
  const dispatch = useDispatch();
  const { products, users, robots, filters } = useSelector((state) => state.warehouse);
  const { theme } = useTheme();
  const { user } = useAuth(); // Получаем текущего пользователя
  const [activeTab, setActiveTab] = useState('products');
  const [pageSize, setPageSize] = useState(20);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedItems, setSelectedItems] = useState([]);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [isRobotModalOpen, setIsRobotModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [editingRobot, setEditingRobot] = useState(null);
  const [productSearch, setProductSearch] = useState('');
  const [userSearch, setUserSearch] = useState('');
  const [robotSearch, setRobotSearch] = useState('');
  const [formData, setFormData] = useState({
    product_id: '',
    product_name: '',
    quantity: '',
    zone: '',
    row: '',
    shelf: '',
  });

  // Проверка роли оператора
  const isOperator = user?.role === 'operator';

  // Тестовые данные
  const mockProducts = [
    { id: 1, product_id: 'TEL-4567', product_name: 'Роутер RT-AC68U', quantity: 45, zone: 'A', row: 12, shelf: 3 },
    { id: 2, product_id: 'TEL-8901', product_name: 'Модем DSL-2640U', quantity: 12, zone: 'B', row: 5, shelf: 2 },
  ];
  const mockUsers = [
    { id: '1', email: 'user1@example.com', name: 'Иван Иванов', role: 'operator' },
    { id: '2', email: 'user2@example.com', name: 'Анна Петрова', role: 'admin' },
  ];
  const mockRobots = [
    { robotId: 'R1', name: 'Робот 1', status: 'active', zone: 'A1' },
    { robotId: 'R2', name: 'Робот 2', status: 'inactive', zone: 'B2' },
  ];

  // Используем тестовые данные, если данные из Redux пустые
  const productsData = products.length > 0 ? products : mockProducts;
  const usersData = users.length > 0 ? users : mockUsers;
  const robotsData = robots.length > 0 ? robots : mockRobots;

  useEffect(() => {
    dispatch(fetchProducts(filters));
    if (isOperator) {
      dispatch(fetchUsers());
    }
    dispatch(fetchRobots());
  }, [dispatch, filters, isOperator]);

  // Фильтрация
  const filteredProducts = productsData.filter(
    (product) =>
      product.product_id.toLowerCase().includes(productSearch.toLowerCase()) ||
      product.product_name.toLowerCase().includes(productSearch.toLowerCase())
  );
  const filteredUsers = usersData.filter(
    (user) =>
      user.name.toLowerCase().includes(userSearch.toLowerCase()) ||
      user.email.toLowerCase().includes(userSearch.toLowerCase())
  );
  const filteredRobots = robotsData.filter(
    (robot) =>
      robot.robotId.toLowerCase().includes(robotSearch.toLowerCase()) ||
      robot.zone.toLowerCase().includes(robotSearch.toLowerCase())
  );

  // Пагинация
  const paginatedProducts = filteredProducts.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const paginatedUsers = filteredUsers.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const paginatedRobots = filteredRobots.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleFilterChange = (newFilters) => {
    dispatch(setFilters({ ...filters, ...newFilters }));
    dispatch(fetchProducts({ ...filters, ...newFilters }));
  };

  // Обработчики для товаров
  const handleAddOrUpdateProduct = () => {
    if (editingProduct) {
      dispatch(updateProduct({ id: editingProduct.id, product: formData }));
    } else {
      dispatch(addProduct({ ...formData, id: Date.now() }));
    }
    setIsProductModalOpen(false);
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

  const handleEditProduct = (product) => {
    setEditingProduct(product);
    setFormData(product);
    setIsProductModalOpen(true);
  };

  const handleDeleteProduct = (id) => {
    if (window.confirm('Вы уверены, что хотите удалить товар?')) {
      dispatch(deleteProduct(id));
    }
  };

  // Обработчики для пользователей
  const handleAddOrUpdateUser = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const userData = {
      id: editingUser?.id || Date.now().toString(),
      email: formData.get('email'),
      name: formData.get('name'),
      role: formData.get('role'),
    };
    if (editingUser) {
      dispatch(updateUser(userData));
    } else {
      dispatch(createUser(userData));
    }
    setIsUserModalOpen(false);
    setEditingUser(null);
  };

  const handleEditUser = (user) => {
    setEditingUser(user);
    setIsUserModalOpen(true);
  };

  const handleDeleteUser = (id) => {
    if (window.confirm('Вы уверены, что хотите удалить пользователя?')) {
      dispatch(deleteUser(id));
    }
  };

  // Обработчики для роботов
  const handleAddOrUpdateRobot = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const robotData = {
      robotId: editingRobot?.robotId || `R${Date.now()}`,
      name: formData.get('name'),
      status: formData.get('status'),
      zone: formData.get('zone'),
    };
    if (editingRobot) {
      dispatch(updateRobot(robotData));
    } else {
      dispatch(createRobot(robotData));
    }
    setIsRobotModalOpen(false);
    setEditingRobot(null);
  };

  const handleEditRobot = (robot) => {
    setEditingRobot(robot);
    setIsRobotModalOpen(true);
  };

  const handleDeleteRobot = (robotId) => {
    if (window.confirm('Вы уверены, что хотите удалить робота?')) {
      dispatch(deleteRobot(robotId));
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <Header onOpenCSVModal={onOpenCSVModal} />
      <div className="p-6">
        {/* Вкладки */}
        <div className="mb-6">
          <div className="flex space-x-4">
            <button
              className={`px-4 py-2 rounded-lg font-semibold ${
                activeTab === 'products'
                  ? 'bg-blue-600 dark:bg-blue-700 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-100'
              }`}
              onClick={() => setActiveTab('products')}
            >
              Товары
            </button>
            {isOperator && (
              <button
                className={`px-4 py-2 rounded-lg font-semibold ${
                  activeTab === 'users'
                    ? 'bg-blue-600 dark:bg-blue-700 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-100'
                }`}
                onClick={() => setActiveTab('users')}
              >
                Пользователи
              </button>
            )}
            <button
              className={`px-4 py-2 rounded-lg font-semibold ${
                activeTab === 'robots'
                  ? 'bg-blue-600 dark:bg-blue-700 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-100'
              }`}
              onClick={() => setActiveTab('robots')}
            >
              Роботы
            </button>
          </div>
        </div>

        {/* Управление товарами */}
        {activeTab === 'products' && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-4 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                Управление товарами
              </h2>
              <button
                onClick={() => setIsProductModalOpen(true)}
                className="bg-blue-600 dark:bg-blue-700 text-white px-4 py-2 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-800 flex items-center"
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                Добавить товар
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm text-gray-600 dark:text-gray-300">
                  Поиск по артикулу или названию
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
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
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-100 dark:bg-gray-700">
                  <th className="p-2 text-left">
                    <input
                      type="checkbox"
                      onChange={(e) => setSelectedItems(e.target.checked ? filteredProducts : [])}
                      className="text-blue-600 dark:text-blue-400 border-gray-300 dark:border-gray-600"
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
                {paginatedProducts.map((product) => (
                  <tr key={product.id} className="border-t dark:border-gray-600">
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
                        className="text-blue-600 dark:text-blue-400 border-gray-300 dark:border-gray-600"
                      />
                    </td>
                    <td className="p-2 text-gray-800 dark:text-gray-100">{product.product_id}</td>
                    <td className="p-2 text-gray-800 dark:text-gray-100">{product.product_name}</td>
                    <td className="p-2 text-gray-800 dark:text-gray-100">{product.quantity}</td>
                    <td className="p-2 text-gray-800 dark:text-gray-100">{product.zone}</td>
                    <td className="p-2 text-gray-800 dark:text-gray-100">{product.row}</td>
                    <td className="p-2 text-gray-800 dark:text-gray-100">{product.shelf}</td>
                    <td className="p-2 flex space-x-2">
                      <button
                        onClick={() => handleEditProduct(product)}
                        className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                      >
                        <PencilIcon className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleDeleteProduct(product.id)}
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
        )}

        {/* Управление пользователями (только для оператора) */}
        {isOperator && activeTab === 'users' && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-4 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                Управление пользователями
              </h2>
              <button
                onClick={() => setIsUserModalOpen(true)}
                className="bg-blue-600 dark:bg-blue-700 text-white px-4 py-2 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-800 flex items-center"
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                Добавить пользователя
              </button>
            </div>
            <div className="mb-4">
              <label className="block text-sm text-gray-600 dark:text-gray-300">
                Поиск по имени или email
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  placeholder="Введите имя или email"
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
                      onChange={(e) => setSelectedItems(e.target.checked ? filteredUsers : [])}
                      className="text-blue-600 dark:text-blue-400 border-gray-300 dark:border-gray-600"
                    />
                  </th>
                  <th className="p-2 text-left text-gray-800 dark:text-gray-100">ID</th>
                  <th className="p-2 text-left text-gray-800 dark:text-gray-100">Email</th>
                  <th className="p-2 text-left text-gray-800 dark:text-gray-100">Имя</th>
                  <th className="p-2 text-left text-gray-800 dark:text-gray-100">Роль</th>
                  <th className="p-2 text-left text-gray-800 dark:text-gray-100">Действия</th>
                </tr>
              </thead>
              <tbody>
                {paginatedUsers.map((user) => (
                  <tr key={user.id} className="border-t dark:border-gray-600">
                    <td className="p-2">
                      <input
                        type="checkbox"
                        checked={selectedItems.includes(user)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedItems([...selectedItems, user]);
                          } else {
                            setSelectedItems(selectedItems.filter((i) => i !== user));
                          }
                        }}
                        className="text-blue-600 dark:text-blue-400 border-gray-300 dark:border-gray-600"
                      />
                    </td>
                    <td className="p-2 text-gray-800 dark:text-gray-100">{user.id}</td>
                    <td className="p-2 text-gray-800 dark:text-gray-100">{user.email}</td>
                    <td className="p-2 text-gray-800 dark:text-gray-100">{user.name}</td>
                    <td className="p-2 text-gray-800 dark:text-gray-100">
                      {user.role === 'operator' ? 'Оператор' : user.role === 'admin' ? 'Админ' : 'Пользователь'}
                    </td>
                    <td className="p-2 flex space-x-2">
                      <button
                        onClick={() => handleEditUser(user)}
                        className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                      >
                        <PencilIcon className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleDeleteUser(user.id)}
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
        )}

        {/* Управление роботами */}
        {activeTab === 'robots' && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-4 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                Управление роботами
              </h2>
              <button
                onClick={() => setIsRobotModalOpen(true)}
                className="bg-blue-600 dark:bg-blue-700 text-white px-4 py-2 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-800 flex items-center"
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                Добавить робота
              </button>
            </div>
            <div className="mb-4">
              <label className="block text-sm text-gray-600 dark:text-gray-300">
                Поиск по ID или зоне
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={robotSearch}
                  onChange={(e) => setRobotSearch(e.target.value)}
                  placeholder="Введите ID или зону"
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
                      onChange={(e) => setSelectedItems(e.target.checked ? filteredRobots : [])}
                      className="text-blue-600 dark:text-blue-400 border-gray-300 dark:border-gray-600"
                    />
                  </th>
                  <th className="p-2 text-left text-gray-800 dark:text-gray-100">ID робота</th>
                  <th className="p-2 text-left text-gray-800 dark:text-gray-100">Название</th>
                  <th className="p-2 text-left text-gray-800 dark:text-gray-100">Статус</th>
                  <th className="p-2 text-left text-gray-800 dark:text-gray-100">Зона</th>
                  <th className="p-2 text-left text-gray-800 dark:text-gray-100">Действия</th>
                </tr>
              </thead>
              <tbody>
                {paginatedRobots.map((robot) => (
                  <tr key={robot.robotId} className="border-t dark:border-gray-600">
                    <td className="p-2">
                      <input
                        type="checkbox"
                        checked={selectedItems.includes(robot)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedItems([...selectedItems, robot]);
                          } else {
                            setSelectedItems(selectedItems.filter((i) => i !== robot));
                          }
                        }}
                        className="text-blue-600 dark:text-blue-400 border-gray-300 dark:border-gray-600"
                      />
                    </td>
                    <td className="p-2 text-gray-800 dark:text-gray-100">{robot.robotId}</td>
                    <td className="p-2 text-gray-800 dark:text-gray-100">{robot.name}</td>
                    <td className="p-2 text-gray-800 dark:text-gray-100">
                      {robot.status === 'active' ? 'Активен' : 'Неактивен'}
                    </td>
                    <td className="p-2 text-gray-800 dark:text-gray-100">{robot.zone}</td>
                    <td className="p-2 flex space-x-2">
                      <button
                        onClick={() => handleEditRobot(robot)}
                        className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                      >
                        <PencilIcon className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleDeleteRobot(robot.robotId)}
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
        )}

        {/* Панель действий */}
        <div className="flex space-x-4 mb-6">
          <button className="bg-green-600 dark:bg-green-700 text-white px-4 py-2 rounded-lg hover:bg-green-700 dark:hover:bg-green-800">
            Экспорт в Excel
          </button>
          <button className="bg-green-600 dark:bg-green-700 text-white px-4 py-2 rounded-lg hover:bg-green-700 dark:hover:bg-green-800">
            Экспорт в PDF
          </button>
        </div>

        {/* Модальное окно для товаров */}
        {isProductModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-md">
              <h2 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-100">
                {editingProduct ? 'Редактировать товар' : 'Добавить товар'}
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-600 dark:text-gray-300">Артикул</label>
                  <input
                    type="text"
                    value={formData.product_id}
                    onChange={(e) => setFormData({ ...formData, product_id: e.target.value })}
                    className="w-full p-2 border rounded-lg bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 dark:text-gray-300">Название</label>
                  <input
                    type="text"
                    value={formData.product_name}
                    onChange={(e) => setFormData({ ...formData, product_name: e.target.value })}
                    className="w-full p-2 border rounded-lg bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 dark:text-gray-300">Количество</label>
                  <input
                    type="number"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                    className="w-full p-2 border rounded-lg bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 dark:text-gray-300">Зона</label>
                  <select
                    value={formData.zone}
                    onChange={(e) => setFormData({ ...formData, zone: e.target.value })}
                    className="w-full p-2 border rounded-lg bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-100"
                  >
                    <option value="">Выберите зону</option>
                    {['A', 'B', 'C'].map((zone) => (
                      <option key={zone} value={zone}>{zone}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-600 dark:text-gray-300">Стеллаж</label>
                  <input
                    type="number"
                    value={formData.row}
                    onChange={(e) => setFormData({ ...formData, row: e.target.value })}
                    className="w-full p-2 border rounded-lg bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 dark:text-gray-300">Полка</label>
                  <input
                    type="number"
                    value={formData.shelf}
                    onChange={(e) => setFormData({ ...formData, shelf: e.target.value })}
                    className="w-full p-2 border rounded-lg bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-100"
                  />
                </div>
              </div>
              <div className="mt-4 flex justify-end space-x-2">
                <button
                  onClick={() => {
                    setIsProductModalOpen(false);
                    setEditingProduct(null);
                    setFormData({ product_id: '', product_name: '', quantity: '', zone: '', row: '', shelf: '' });
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

        {/* Модальное окно для пользователей (только для оператора) */}
        {isOperator && isUserModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-md">
              <h2 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-100">
                {editingUser ? 'Редактировать пользователя' : 'Добавить пользователя'}
              </h2>
              <form onSubmit={handleAddOrUpdateUser}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-gray-600 dark:text-gray-300">Email</label>
                    <input
                      type="email"
                      name="email"
                      defaultValue={editingUser?.email || ''}
                      required
                      className="w-full p-2 border rounded-lg bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 dark:text-gray-300">Имя</label>
                    <input
                      type="text"
                      name="name"
                      defaultValue={editingUser?.name || ''}
                      required
                      className="w-full p-2 border rounded-lg bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 dark:text-gray-300">Роль</label>
                    <select
                      name="role"
                      defaultValue={editingUser?.role || 'operator'}
                      className="w-full p-2 border rounded-lg bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-100"
                    >
                      <option value="operator">Оператор</option>
                      <option value="admin">Админ</option>
                      <option value="user">Пользователь</option>
                    </select>
                  </div>
                </div>
                <div className="mt-4 flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setIsUserModalOpen(false)}
                    className="bg-gray-600 dark:bg-gray-700 text-white px-4 py-2 rounded-lg hover:bg-gray-700 dark:hover:bg-gray-600"
                  >
                    Отмена
                  </button>
                  <button
                    type="submit"
                    className="bg-blue-600 dark:bg-blue-700 text-white px-4 py-2 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-800"
                  >
                    Сохранить
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Модальное окно для роботов */}
        {isRobotModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-md">
              <h2 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-100">
                {editingRobot ? 'Редактировать робота' : 'Добавить робота'}
              </h2>
              <form onSubmit={handleAddOrUpdateRobot}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-gray-600 dark:text-gray-300">Название</label>
                    <input
                      type="text"
                      name="name"
                      defaultValue={editingRobot?.name || ''}
                      required
                      className="w-full p-2 border rounded-lg bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 dark:text-gray-300">Статус</label>
                    <select
                      name="status"
                      defaultValue={editingRobot?.status || 'active'}
                      className="w-full p-2 border rounded-lg bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-100"
                    >
                      <option value="active">Активен</option>
                      <option value="inactive">Неактивен</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 dark:text-gray-300">Зона</label>
                    <input
                      type="text"
                      name="zone"
                      defaultValue={editingRobot?.zone || ''}
                      required
                      className="w-full p-2 border rounded-lg bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-100"
                    />
                  </div>
                </div>
                <div className="mt-4 flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setIsRobotModalOpen(false)}
                    className="bg-gray-600 dark:bg-gray-700 text-white px-4 py-2 rounded-lg hover:bg-gray-700 dark:hover:bg-gray-600"
                  >
                    Отмена
                  </button>
                  <button
                    type="submit"
                    className="bg-blue-600 dark:bg-blue-700 text-white px-4 py-2 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-800"
                  >
                    Сохранить
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Admin;