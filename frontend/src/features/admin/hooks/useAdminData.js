// src/features/admin/hooks/useAdminData.js
import { useEffect, useState } from 'react';
import { useDispatch,useSelector } from 'react-redux';
import {
    fetchProducts, addProduct, updateProduct, deleteProduct,
  fetchUsers, createUser, updateUser, deleteUser,
  fetchRobots, createRobot, updateRobot, deleteRobot,
  setFilters
} from '../../../store/warehouseSlice';
import * as XLSX from 'xlsx';

export function useAdminData(user, dispatch) {
  const { products, users, robots, filters } = useSelector((state) => state.warehouse);
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

  const isOperator = user?.role === 'operator';

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

  useEffect(() => {
    setSelectedItems([]);
    setCurrentPage(1);
  }, [activeTab]);

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

  const paginatedProducts = filteredProducts.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const paginatedUsers = filteredUsers.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const paginatedRobots = filteredRobots.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const selectAllItems = () => {
    let currentItems = [];
    if (activeTab === 'products') currentItems = paginatedProducts;
    else if (activeTab === 'users') currentItems = paginatedUsers;
    else if (activeTab === 'robots') currentItems = paginatedRobots;
    setSelectedItems(currentItems);
  };

  const clearSelection = () => setSelectedItems([]);

  const exportToExcel = () => {
    if (selectedItems.length === 0) {
      alert('Выберите элементы для экспорта');
      return;
    }

    const workbook = XLSX.utils.book_new();
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

    const worksheet = XLSX.utils.json_to_sheet(worksheetData);
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Данные');
    XLSX.writeFile(workbook, fileName);
  };

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

    try {
      if (editingProduct) {
        await dispatch(updateProduct({ id: editingProduct.id, product: productData })).unwrap();
      } else {
        await dispatch(addProduct(productData)).unwrap();
      }
      setIsProductModalOpen(false);
      setEditingProduct(null);
    } catch (error) {
      alert(`Ошибка: ${error.message}`);
    }
  };

  const handleEditProduct = (product) => {
    setEditingProduct(product);
    setIsProductModalOpen(true);
  };

  const handleDeleteProduct = async (id) => {
    if (window.confirm('Вы уверены, что хотите удалить товар?')) {
      try {
        await dispatch(deleteProduct(id)).unwrap();
      } catch (error) {
        alert(`Ошибка: ${error.message}`);
      }
    }
  };

  const handleAddOrUpdateUser = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const userData = {
      email: formData.get('email'),
      password: formData.get('password'),
      name: formData.get('name'),
      role: formData.get('role'),
    };

    try {
      if (editingUser) {
        await dispatch(updateUser({ id: editingUser.id, user: userData })).unwrap();
      } else {
        await dispatch(createUser(userData)).unwrap();
      }
      setIsUserModalOpen(false);
      setEditingUser(null);
    } catch (error) {
      alert(`Ошибка: ${error.message}`);
    }
  };

  const handleEditUser = (user) => {
    setEditingUser(user);
    setIsUserModalOpen(true);
  };

  const handleDeleteUser = async (id) => {
    if (window.confirm('Вы уверены, что хотите удалить пользователя?')) {
      try {
        await dispatch(deleteUser(id)).unwrap();
      } catch (error) {
        alert(`Ошибка: ${error.message}`);
      }
    }
  };

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

    try {
      if (editingRobot) {
        await dispatch(updateRobot({ id: editingRobot.id, robot: robotData })).unwrap();
      } else {
        await dispatch(createRobot(robotData)).unwrap();
      }
      setIsRobotModalOpen(false);
      setEditingRobot(null);
    } catch (error) {
      alert(`Ошибка: ${error.message}`);
    }
  };

  const handleEditRobot = (robot) => {
    setEditingRobot(robot);
    setIsRobotModalOpen(true);
  };

  const handleDeleteRobot = async (id) => {
    if (window.confirm('Вы уверены, что хотите удалить робота?')) {
      try {
        await dispatch(deleteRobot(id)).unwrap();
      } catch (error) {
        alert(`Ошибка: ${error.message}`);
      }
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  return {
    products,
    users,
    robots,
    filters,
    activeTab,
    setActiveTab,
    pageSize,
    setPageSize,
    currentPage,
    setCurrentPage,
    selectedItems,
    setSelectedItems,
    isProductModalOpen,
    setIsProductModalOpen,
    isUserModalOpen,
    setIsUserModalOpen,
    isRobotModalOpen,
    setIsRobotModalOpen,
    editingProduct,
    setEditingProduct,
    editingUser,
    setEditingUser,
    editingRobot,
    setEditingRobot,
    productSearch,
    setProductSearch,
    userSearch,
    setUserSearch,
    robotSearch,
    setRobotSearch,
    isOperator,
    filteredProducts,
    filteredUsers,
    filteredRobots,
    paginatedProducts,
    paginatedUsers,
    paginatedRobots,
    selectAllItems,
    clearSelection,
    exportToExcel,
    handleCancelProduct,
    handleCancelUser,
    handleCancelRobot,
    handleAddOrUpdateProduct,
    handleEditProduct,
    handleDeleteProduct,
    handleAddOrUpdateUser,
    handleEditUser,
    handleDeleteUser,
    handleAddOrUpdateRobot,
    handleEditRobot,
    handleDeleteRobot,
    handleTabChange
  };
}