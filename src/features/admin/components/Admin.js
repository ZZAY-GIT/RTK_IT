// src/features/admin/components/Admin.js
import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import Header from '../../../components/Header';
import { useTheme } from '../../../hooks/useTheme';
import { useAuth } from '../../../hooks/useAuth';

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

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <Header onOpenCSVModal={onOpenCSVModal} />
      <div className="p-6">

        {/* Вкладки */}
        <AdminTabs activeTab={activeTab} isOperator={isOperator} handleTabChange={handleTabChange} />

        {/* Панель управления выбором и экспортом */}
        <TableControls
          activeTab={activeTab}
          paginatedProducts={paginatedProducts}
          paginatedUsers={paginatedUsers}
          paginatedRobots={paginatedRobots}
          selectAllItems={selectAllItems}
          clearSelection={clearSelection}
          exportToExcel={exportToExcel}
          selectedItems={selectedItems}
        />

        {/* Управление товарами */}
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

        {/* Управление пользователями */}
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

        {/* Управление роботами */}
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

        {/* Модальные окна */}
        <ProductModal
          isOpen={isProductModalOpen}
          editingProduct={editingProduct}
          handleSubmit={handleAddOrUpdateProduct}
          handleCancel={handleCancelProduct}
        />

        {isOperator && (
          <UserModal
            isOpen={isUserModalOpen}
            editingUser={editingUser}
            handleSubmit={handleAddOrUpdateUser}
            handleCancel={handleCancelUser}
          />
        )}

        <RobotModal
          isOpen={isRobotModalOpen}
          editingRobot={editingRobot}
          handleSubmit={handleAddOrUpdateRobot}
          handleCancel={handleCancelRobot}
        />
      </div>
    </div>
  );
}