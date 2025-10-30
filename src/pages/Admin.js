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
import * as XLSX from 'xlsx';

function Admin({ onOpenCSVModal }) {
  const dispatch = useDispatch();
  const { products, users, robots, filters } = useSelector((state) => state.warehouse);
  const { theme } = useTheme();
  const { user } = useAuth();
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

  // Проверка роли оператора
  const isOperator = user?.role === 'operator';

  // Используем только данные из Redux
  const productsData = products;
  const usersData = users;
  const robotsData = robots;

  useEffect(() => {
    dispatch(fetchProducts(filters));
    if (isOperator) {
      dispatch(fetchUsers());
    }
    dispatch(fetchRobots());
  }, [dispatch, filters, isOperator]);

  // Очистка выбора при смене вкладки
  useEffect(() => {
    setSelectedItems([]);
    setCurrentPage(1);
  }, [activeTab]);

  // Фильтрация
  const filteredProducts = productsData.filter(
    (product) =>
      (product.id || '').toLowerCase().includes(productSearch.toLowerCase()) ||
      (product.name || '').toLowerCase().includes(productSearch.toLowerCase())
  );
  const filteredUsers = usersData.filter(
    (user) =>
      user.name.toLowerCase().includes(userSearch.toLowerCase()) ||
      user.email.toLowerCase().includes(userSearch.toLowerCase())
  );
  const filteredRobots = robotsData.filter(
    (robot) =>
      (robot.id || '').toLowerCase().includes(robotSearch.toLowerCase()) ||
      (robot.current_zone || '').toLowerCase().includes(robotSearch.toLowerCase())
  );

  // Пагинация
  const paginatedProducts = filteredProducts.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const paginatedUsers = filteredUsers.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const paginatedRobots = filteredRobots.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // Функции для управления выбором элементов
  const selectAllItems = () => {
    let currentItems = [];
    
    if (activeTab === 'products') {
      currentItems = paginatedProducts;
    } else if (activeTab === 'users') {
      currentItems = paginatedUsers;
    } else if (activeTab === 'robots') {
      currentItems = paginatedRobots;
    }
    
    setSelectedItems(currentItems);
  };

  const clearSelection = () => {
    setSelectedItems([]);
  };

  // Функция экспорта в Excel
  const exportToExcel = () => {
    if (selectedItems.length === 0) {
      alert('Выберите элементы для экспорта');
      return;
    }

    // Создаем рабочую книгу
    const workbook = XLSX.utils.book_new();
    
    // В зависимости от активной вкладки формируем данные
    let worksheetData = [];
    let fileName = '';

    if (activeTab === 'products') {
      worksheetData = selectedItems.map(item => ({
        'ID': item.id,
        'Название': item.name,
        'Категория': item.category,
        'Мин. запас': item.min_stock,
        'Опт. запас': item.optimal_stock
      }));
      fileName = 'товары.xlsx';
    } else if (activeTab === 'users') {
      worksheetData = selectedItems.map(item => ({
        'ID': item.id,
        'Email': item.email,
        'Имя': item.name,
        'Роль': item.role === 'operator' ? 'Оператор' : item.role === 'admin' ? 'Админ' : 'Пользователь'
      }));
      fileName = 'пользователи.xlsx';
    } else if (activeTab === 'robots') {
      worksheetData = selectedItems.map(item => ({
        'ID робота': item.id,
        'Статус': item.status === 'active' ? 'Активен' : 'Неактивен',
        'Батарея': `${item.battery_level || item.battery}%`,
        'Зона': item.current_zone,
        'Ряд': item.current_row,
        'Полка': item.current_shelf
      }));
      fileName = 'роботы.xlsx';
    }

    // Создаем worksheet
    const worksheet = XLSX.utils.json_to_sheet(worksheetData);
    
    // Добавляем worksheet в workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Данные');
    
    // Скачиваем файл
    XLSX.writeFile(workbook, fileName);
  };

  // Функции отмены для модальных окон
  const handleCancelProduct = () => {
    setIsProductModalOpen(false);
    setEditingProduct(null);
  };

  const handleCancelUser = () => {
    setIsUserModalOpen(false);
    setEditingUser(null);
  };

  const handleCancelRobot = () => {
    setIsRobotModalOpen(false);
    setEditingRobot(null);
  };

  // Обработчики для товаров
  const handleAddOrUpdateProduct = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const productData = {
      id: formData.get('id'),
      name: formData.get('name'),
      category: formData.get('category'),
      min_stock: parseInt(formData.get('min_stock')),
      optimal_stock: parseInt(formData.get('optimal_stock'))
    };

    console.log('📤 Отправка данных товара:', productData);

    try {
      if (editingProduct) {
        console.log('🔄 Редактирование товара:', editingProduct.id);
        await dispatch(updateProduct({
          id: editingProduct.id,
          product: productData
        })).unwrap();
        console.log('✅ Товар успешно обновлен');
      } else {
        console.log('➕ Создание нового товара');
        await dispatch(addProduct(productData)).unwrap();
        console.log('✅ Товар успешно создан');
      }

      setIsProductModalOpen(false);
      setEditingProduct(null);
    } catch (error) {
      console.error('❌ Ошибка:', error);
      console.log(productData)
      alert(`Ошибка: ${error.message}`);
    }
  };

  const handleEditProduct = (product) => {
    console.log('✏️ Редактирование товара:', product);
    setEditingProduct(product);
    setIsProductModalOpen(true);
  };

  const handleDeleteProduct = async (id) => {
    if (window.confirm('Вы уверены, что хотите удалить товар?')) {
      try {
        await dispatch(deleteProduct(id)).unwrap();
        console.log('✅ Товар успешно удален');
      } catch (error) {
        console.error('❌ Ошибка удаления:', error);
        alert(`Ошибка: ${error.message}`);
      }
    }
  };

  // Обработчики для пользователей
  const handleAddOrUpdateUser = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const userData = {
      email: formData.get('email'),
      password: formData.get('password'),
      name: formData.get('name'),
      role: formData.get('role'),
    };

    console.log('📤 Отправка данных пользователя:', userData);
    console.log('🆔 Редактируемый пользователь ID:', editingUser?.id);
    console.log('🆔 Мой ID:', user?.id);

    try {
      if (editingUser) {
        console.log('🔄 Редактирование пользователя:', editingUser.id);
        await dispatch(updateUser({ 
          id: editingUser.id, 
          user: userData
        })).unwrap();

        console.log('✅ Пользователь успешно обновлен');
      } else {
        console.log('➕ Создание нового пользователя');
        await dispatch(createUser(userData)).unwrap();
        console.log('✅ Пользователь успешно создан');
      }

      setIsUserModalOpen(false);
      setEditingUser(null);
    } catch (error) {
      console.error('❌ Ошибка:', error);
      alert(`Ошибка: ${error.message}`);
    }
  };

  const handleEditUser = (user) => {
    console.log('✏️ Редактирование пользователя:', user);
    setEditingUser(user);
    setIsUserModalOpen(true);
  };

  const handleDeleteUser = async (id) => {
    if (window.confirm('Вы уверены, что хотите удалить пользователя?')) {
      try {
        await dispatch(deleteUser(id)).unwrap();
        console.log('✅ Пользователь успешно удален');
      } catch (error) {
        console.error('❌ Ошибка удаления:', error);
        alert(`Ошибка: ${error.message}`);
      }
    }
  };

  // Обработчики для роботов
  const handleAddOrUpdateRobot = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const robotData = {
      id: formData.get('id'),
      status: formData.get('status'),
      battery_level: parseInt(formData.get('battery_level')),
      current_zone: formData.get('current_zone'),
      current_row: parseInt(formData.get('current_row')),
      current_shelf: parseInt(formData.get('current_shelf'))
    };

    console.log('📤 Отправка данных робота:', robotData);

    try {
      if (editingRobot) {
        console.log('🔄 Редактирование робота:', editingRobot.id);
        await dispatch(updateRobot({ 
          id: editingRobot.id, 
          robot: robotData
        })).unwrap();
        console.log('✅ Робот успешно обновлен');
      } else {
        console.log('➕ Создание нового робота');
        await dispatch(createRobot(robotData)).unwrap();
        console.log('✅ Робот успешно создан');
      }

      setIsRobotModalOpen(false);
      setEditingRobot(null);
    } catch (error) {
      console.error('❌ Ошибка:', error);
      alert(`Ошибка: ${error.message}`);
    }
  };

  const handleEditRobot = (robot) => {
    console.log('✏️ Редактирование робота:', robot);
    setEditingRobot(robot);
    setIsRobotModalOpen(true);
  };

  const handleDeleteRobot = async (id) => {
    if (window.confirm('Вы уверены, что хотите удалить робота?')) {
      try {
        await dispatch(deleteRobot(id)).unwrap();
        console.log('✅ Робот успешно удален');
      } catch (error) {
        console.error('❌ Ошибка удаления:', error);
        alert(`Ошибка: ${error.message}`);
      }
    }
  };

  // Обработчик смены вкладки
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    // Выбор очистится автоматически благодаря useEffect
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
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-100 bg-white'
              }`}
              onClick={() => handleTabChange('products')}
            >
              Товары
            </button>
            
            {isOperator && (
              <button
                className={`px-4 py-2 rounded-lg font-semibold ${
                  activeTab === 'users'
                    ? 'bg-blue-600 dark:bg-blue-700 text-white '
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-100 bg-white'
                }`}
                onClick={() => handleTabChange('users')}
              >
                Пользователи
              </button>
            )}
            <button
              className={`px-4 py-2 rounded-lg font-semibold ${
                activeTab === 'robots'
                  ? 'bg-blue-600 dark:bg-blue-700 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-100 bg-white'
              }`}
              onClick={() => handleTabChange('robots')}
            >
              Роботы
            </button>
          </div>
        </div>

        {/* Панель управления выбором и экспортом */}
        <div className="flex space-x-4 mb-6">
          <button 
            onClick={selectAllItems}
            className="bg-blue-600 dark:bg-blue-700 text-white px-4 py-2 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-800 flex items-center"
          >
            Выбрать все {
              activeTab === 'products' ? paginatedProducts.length :
              activeTab === 'users' ? paginatedUsers.length :
              activeTab === 'robots' ? paginatedRobots.length : 0
            }
          </button>
          <button 
            onClick={clearSelection}
            className="bg-gray-600 dark:bg-gray-700 text-white px-4 py-2 rounded-lg hover:bg-gray-700 dark:hover:bg-gray-600 flex items-center"
          >
            Сбросить выбор
          </button>
          <button 
            onClick={exportToExcel}
            className="bg-green-600 dark:bg-green-700 text-white px-4 py-2 rounded-lg hover:bg-green-700 dark:hover:bg-green-800 flex items-center"
          >
            Экспорт в Excel ({selectedItems.length})
          </button>
        </div>

        {/* Управление товарами */}
        {activeTab === 'products' && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-4 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                Управление товарами
              </h2>
              <button
                onClick={() => {
                  setEditingProduct(null);
                  setIsProductModalOpen(true);
                }}
                className="bg-blue-600 dark:bg-blue-700 text-white px-4 py-2 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-800 flex items-center"
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                Добавить товар
              </button>
            </div>
            <div className="mb-4">
              <label className="block text-sm text-gray-600 dark:text-gray-300">
                Поиск по ID или названию
              </label>
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
                      onChange={(e) => {
                        if (e.target.checked) {
                          selectAllItems();
                        } else {
                          clearSelection();
                        }
                      }}
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
                          checked={selectedItems.some((item) => item.id === product.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedItems([...selectedItems, product]);
                            } else {
                              setSelectedItems(selectedItems.filter((i) => i.id !== product.id));
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
                onClick={() => {
                  setEditingUser(null);
                  setIsUserModalOpen(true);
                }}
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
                      checked={selectedItems.length === paginatedUsers.length && paginatedUsers.length > 0}
                      onChange={(e) => {
                        if (e.target.checked) {
                          selectAllItems();
                        } else {
                          clearSelection();
                        }
                      }}
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
                {paginatedUsers.length > 0 ? (
                  paginatedUsers.map((user) => (
                    <tr key={user.id} className="border-t dark:border-gray-600">
                      <td className="p-2">
                        <input
                          type="checkbox"
                          checked={selectedItems.some((item) => item.id === user.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedItems([...selectedItems, user]);
                            } else {
                              setSelectedItems(selectedItems.filter((i) => i.id !== user.id));
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
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="p-4 text-center text-gray-500 dark:text-gray-400">
                      Нет пользователей. Нажмите "Добавить пользователя" чтобы создать первого пользователя.
                    </td>
                  </tr>
                )}
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
                onClick={() => {
                  setEditingRobot(null);
                  setIsRobotModalOpen(true);
                }}
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
                      checked={selectedItems.length === paginatedRobots.length && paginatedRobots.length > 0}
                      onChange={(e) => {
                        if (e.target.checked) {
                          selectAllItems();
                        } else {
                          clearSelection();
                        }
                      }}
                      className="text-blue-600 dark:text-blue-400 border-gray-300 dark:border-gray-600"
                    />
                  </th>
                  <th className="p-2 text-left text-gray-800 dark:text-gray-100">ID робота</th>
                  <th className="p-2 text-left text-gray-800 dark:text-gray-100">Статус</th>
                  <th className="p-2 text-left text-gray-800 dark:text-gray-100">Батарея</th>
                  <th className="p-2 text-left text-gray-800 dark:text-gray-100">Зона</th>
                  <th className="p-2 text-left text-gray-800 dark:text-gray-100">Ряд</th>
                  <th className="p-2 text-left text-gray-800 dark:text-gray-100">Полка</th>
                  <th className="p-2 text-left text-gray-800 dark:text-gray-100">Действия</th>
                </tr>
              </thead>
              <tbody>
                {paginatedRobots.length > 0 ? (
                  paginatedRobots.map((robot) => (
                    <tr key={robot.id} className="border-t dark:border-gray-600">
                      <td className="p-2">
                        <input
                          type="checkbox"
                          checked={selectedItems.some((item) => item.id === robot.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedItems([...selectedItems, robot]);
                            } else {
                              setSelectedItems(selectedItems.filter((item) => item.id !== robot.id));
                            }
                          }}
                          className="text-blue-600 dark:text-blue-400 border-gray-300 dark:border-gray-600"
                        />
                      </td>
                      <td className="p-2 text-gray-800 dark:text-gray-100">{robot.id}</td>
                      <td className="p-2 text-gray-800 dark:text-gray-100">
                        {robot.status === 'active' ? 'Активен' : 'Неактивен'}
                      </td>
                      <td className="p-2 text-gray-800 dark:text-gray-100">{robot.battery_level || robot.battery}%</td>
                      <td className="p-2 text-gray-800 dark:text-gray-100">{robot.current_zone}</td>
                      <td className="p-2 text-gray-800 dark:text-gray-100">{robot.current_row}</td>
                      <td className="p-2 text-gray-800 dark:text-gray-100">{robot.current_shelf}</td>
                      <td className="p-2 flex space-x-2">
                        <button
                          onClick={() => handleEditRobot(robot)}
                          className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                        >
                          <PencilIcon className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleDeleteRobot(robot.id)}
                          className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="8" className="p-4 text-center text-gray-500 dark:text-gray-400">
                      Нет роботов. Нажмите "Добавить робота" чтобы создать первого робота.
                    </td>
                  </tr>
                )}
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

        {/* Модальное окно для товаров */}
        {isProductModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-md">
              <h2 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-100">
                {editingProduct ? 'Редактировать товар' : 'Добавить товар'}
              </h2>
              <form onSubmit={handleAddOrUpdateProduct}>
                <div className="space-y-4">
                    <div>
                      <label className="block text-sm text-gray-600 dark:text-gray-300">ID товара</label>
                      <input
                        type="text"
                        name="id"
                        defaultValue={editingProduct?.id || ''}
                        readOnly={!!editingProduct}
                        className={`w-full p-2 border rounded-lg border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-100 ${
                          editingProduct 
                            ? 'bg-gray-100 dark:bg-gray-600 cursor-not-allowed'
                            : 'bg-white dark:bg-gray-700'
                        }`}
                      />
                    </div>
                  <div>
                    <label className="block text-sm text-gray-600 dark:text-gray-300">Название</label>
                    <input
                      type="text"
                      name="name"
                      defaultValue={editingProduct?.name || ''}
                      required
                      className="w-full p-2 border rounded-lg bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 dark:text-gray-300">Категория</label>
                    <input
                      type="text"
                      name="category"
                      defaultValue={editingProduct?.category || ''}
                      required
                      className="w-full p-2 border rounded-lg bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 dark:text-gray-300">Мин. запас</label>
                    <input
                      type="number"
                      name="min_stock"
                      defaultValue={editingProduct?.min_stock || ''}
                      required
                      className="w-full p-2 border rounded-lg bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 dark:text-gray-300">Опт. запас</label>
                    <input
                      type="number"
                      name="optimal_stock"
                      defaultValue={editingProduct?.optimal_stock || ''}
                      required
                      className="w-full p-2 border rounded-lg bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-100"
                    />
                  </div>
                </div>
                <div className="mt-4 flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={handleCancelProduct}
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
                    <label className="block text-sm text-gray-600 dark:text-gray-300">Password</label>
                    <input
                      type="password"
                      name="password"
                      placeholder={editingUser ? "Оставьте пустым чтобы не менять" : "Введите пароль"}
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
                    onClick={handleCancelUser}
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
                    <label className="block text-sm text-gray-600 dark:text-gray-300">ID робота</label>
                    <input
                      type="text"
                      name="id"
                      defaultValue={editingRobot?.id || ''}
                      readOnly={!!editingRobot}
                      className={`w-full p-2 border rounded-lg border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-100 ${
                        editingRobot 
                          ? 'bg-gray-100 dark:bg-gray-600 cursor-not-allowed'
                          : 'bg-white dark:bg-gray-700'
                      }`}
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
                    <label className="block text-sm text-gray-600 dark:text-gray-300">Уровень батареи (%)</label>
                    <input
                      type="number"
                      name="battery_level"
                      min="0"
                      max="100"
                      defaultValue={editingRobot?.battery_level || editingRobot?.battery || 100}
                      required
                      className="w-full p-2 border rounded-lg bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 dark:text-gray-300">Зона</label>
                    <input
                      type="text"
                      name="current_zone"
                      defaultValue={editingRobot?.current_zone || ''}
                      className="w-full p-2 border rounded-lg bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 dark:text-gray-300">Ряд</label>
                    <input
                      type="number"
                      name="current_row"
                      defaultValue={editingRobot?.current_row || ''}
                      className="w-full p-2 border rounded-lg bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 dark:text-gray-300">Полка</label>
                    <input
                      type="number"
                      name="current_shelf"
                      defaultValue={editingRobot?.current_shelf || ''}
                      className="w-full p-2 border rounded-lg bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-100"
                    />
                  </div>
                </div>
                <div className="mt-4 flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={handleCancelRobot}
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