// src/features/admin/components/Admin.js
import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import Header from '../../../components/Header';
import { useTheme } from '../../../hooks/useTheme';
import { useAuth } from '../../../hooks/useAuth';
import { MenuIcon, XIcon } from '@heroicons/react/outline';

import AdminTabs from './AdminTabs';
import TableControls from './TableControls';
import ProductsTable from './ProductsTable';
import UsersTable from './UsersTable';
import RobotsTable from './RobotsTable';
import ProductModal from './ProductModal';
import UserModal from './UserModal';
import RobotModal from './RobotModal';

import { useAdminData } from '../hooks/useAdminData';

export default function Admin({ onOpenCSVModal }) {
  const dispatch = useDispatch();
  const { theme } = useTheme();
  const { user } = useAuth();

  const {
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
  } = useAdminData(user, dispatch);

  // Мобильное меню
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <Header onOpenCSVModal={onOpenCSVModal} />

      {/* Мобильное меню */}
      <div className="lg:hidden p-4 flex justify-between items-center border-b dark:border-gray-700">
        <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100">
          {activeTab === 'products' && 'Товары'}
          {activeTab === 'users' && 'Пользователи'}
          {activeTab === 'robots' && 'Роботы'}
        </h1>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 rounded-lg bg-gray-200 dark:bg-gray-700"
        >
          {mobileMenuOpen ? <XIcon className="h-6 w-6" /> : <MenuIcon className="h-6 w-6" />}
        </button>
      </div>

      {/* Мобильные вкладки */}
      {mobileMenuOpen && (
        <div className="lg:hidden p-4 bg-white dark:bg-gray-800 shadow-md">
          <AdminTabs
            activeTab={activeTab}
            isOperator={isOperator}
            handleTabChange={(tab) => {
              handleTabChange(tab);
              setMobileMenuOpen(false);
            }}
            isMobile
          />
        </div>
      )}

      <div className="p-4 lg:p-6 max-w-7xl mx-auto">

        {/* Десктопные вкладки */}
        <div className="hidden lg:block mb-6">
          <AdminTabs activeTab={activeTab} isOperator={isOperator} handleTabChange={handleTabChange} />
        </div>

        {/* Панель управления */}
        <TableControls
          activeTab={activeTab}
          paginatedProducts={paginatedProducts}
          paginatedUsers={paginatedUsers}
          paginatedRobots={paginatedRobots}
          selectAllItems={selectAllItems}
          clearSelection={clearSelection}
          exportToExcel={exportToExcel}
          selectedItems={selectedItems}
          isMobile
        />

        {/* Таблицы */}
        {activeTab === 'products' && (
          <ProductsTable
            paginatedProducts={paginatedProducts}
            selectedItems={selectedItems}
            setSelectedItems={setSelectedItems}
            productSearch={productSearch}
            setProductSearch={setProductSearch}
            setIsProductModalOpen={setIsProductModalOpen}
            setEditingProduct={setEditingProduct}
            handleEditProduct={handleEditProduct}
            handleDeleteProduct={handleDeleteProduct}
            pageSize={pageSize}
            setPageSize={setPageSize}
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
            filteredProducts={filteredProducts}
          />
        )}

        {isOperator && activeTab === 'users' && (
          <UsersTable
            paginatedUsers={paginatedUsers}
            selectedItems={selectedItems}
            setSelectedItems={setSelectedItems}
            userSearch={userSearch}
            setUserSearch={setUserSearch}
            setIsUserModalOpen={setIsUserModalOpen}
            setEditingUser={setEditingUser}
            handleEditUser={handleEditUser}
            handleDeleteUser={handleDeleteUser}
            pageSize={pageSize}
            setPageSize={setPageSize}
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
            filteredUsers={filteredUsers}
          />
        )}

        {activeTab === 'robots' && (
          <RobotsTable
            paginatedRobots={paginatedRobots}
            selectedItems={selectedItems}
            setSelectedItems={setSelectedItems}
            robotSearch={robotSearch}
            setRobotSearch={setRobotSearch}
            setIsRobotModalOpen={setIsRobotModalOpen}
            setEditingRobot={setEditingRobot}
            handleEditRobot={handleEditRobot}
            handleDeleteRobot={handleDeleteRobot}
            pageSize={pageSize}
            setPageSize={setPageSize}
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
            filteredRobots={filteredRobots}
          />
        )}

        {/* Модальные окна — адаптивные */}
        <ProductModal isOpen={isProductModalOpen} editingProduct={editingProduct} handleSubmit={handleAddOrUpdateProduct} handleCancel={handleCancelProduct} />
        {isOperator && <UserModal isOpen={isUserModalOpen} editingUser={editingUser} handleSubmit={handleAddOrUpdateUser} handleCancel={handleCancelUser} />}
        <RobotModal isOpen={isRobotModalOpen} editingRobot={editingRobot} handleSubmit={handleAddOrUpdateRobot} handleCancel={handleCancelRobot} />
      </div>
    </div>
  );
}