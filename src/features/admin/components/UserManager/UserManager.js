// src/features/admin/components/UserManager/UserManager.js
import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchUsers, createUser, updateUser, deleteUser
} from '../../../../store/warehouseSlice';
import { PencilIcon, TrashIcon } from '@heroicons/react/outline';

export default function UserManager() {
  const dispatch = useDispatch();
  const { users } = useSelector((state) => state.warehouse);
  const [pageSize, setPageSize] = useState(20);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedItems, setSelectedItems] = useState([]);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [userSearch, setUserSearch] = useState('');

  useEffect(() => {
    dispatch(fetchUsers());
  }, [dispatch]);

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(userSearch.toLowerCase()) ||
      user.email.toLowerCase().includes(userSearch.toLowerCase())
  );

  const paginatedUsers = filteredUsers.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const totalPages = Math.ceil(filteredUsers.length / pageSize);

  const selectAllItems = () => {
    if (selectedItems.length === paginatedUsers.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(paginatedUsers.map(u => u.id));
    }
  };

  const toggleSelectItem = (id) => {
    setSelectedItems(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleDeleteSelected = () => {
    selectedItems.forEach(id => dispatch(deleteUser(id)));
    setSelectedItems([]);
  };

  const handleEditUser = (user) => {
    setEditingUser(user);
    setIsUserModalOpen(true);
  };

  const handleSaveUser = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = {
      name: formData.get('name'),
      email: formData.get('email'),
      role: formData.get('role'),
      password: formData.get('password') || undefined,
    };

    if (editingUser) {
      dispatch(updateUser({ id: editingUser.id, user: data }));
    } else {
      dispatch(createUser(data));
    }
    setIsUserModalOpen(false);
    setEditingUser(null);
  };

  const handleCancelUser = () => {
    setIsUserModalOpen(false);
    setEditingUser(null);
  };

  return (
    <div>
      <div className="flex justify-between mb-4">
        <input
          type="text"
          placeholder="Поиск по имени или email..."
          value={userSearch}
          onChange={(e) => setUserSearch(e.target.value)}
          className="px-4 py-2 border rounded-lg bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-100"
        />
        <button
          onClick={() => setIsUserModalOpen(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          + Добавить пользователя
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="p-3">
                <input
                  type="checkbox"
                  checked={selectedItems.length === paginatedUsers.length && paginatedUsers.length > 0}
                  onChange={selectAllItems}
                  className="rounded"
                />
              </th>
              <th className="p-3 text-left">Имя</th>
              <th className="p-3 text-left">Email</th>
              <th className="p-3 text-left">Роль</th>
              <th className="p-3 text-left">Действия</th>
            </tr>
          </thead>
          <tbody>
            {paginatedUsers.map((user) => (
              <tr key={user.id} className="border-t dark:border-gray-600">
                <td className="p-3">
                  <input
                    type="checkbox"
                    checked={selectedItems.includes(user.id)}
                    onChange={() => toggleSelectItem(user.id)}
                    className="rounded"
                  />
                </td>
                <td className="p-3">{user.name}</td>
                <td className="p-3">{user.email}</td>
                <td className="p-3">{user.role}</td>
                <td className="p-3">
                  <button
                    onClick={() => handleEditUser(user)}
                    className="text-blue-600 hover:underline mr-2"
                  >
                    <PencilIcon className="h-5 w-5 inline" />
                  </button>
                  <button
                    onClick={() => dispatch(deleteUser(user.id))}
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

      {isUserModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">
              {editingUser ? 'Редактировать пользователя' : 'Добавить пользователя'}
            </h3>
            <form onSubmit={handleSaveUser}>
              <div className="space-y-3">
                <input name="name" defaultValue={editingUser?.name} placeholder="Имя" required className="w-full p-2 border rounded-lg" />
                <input name="email" type="email" defaultValue={editingUser?.email} placeholder="Email" required className="w-full p-2 border rounded-lg" />
                <select name="role" defaultValue={editingUser?.role || 'operator'} className="w-full p-2 border rounded-lg">
                  <option value="operator">Оператор</option>
                  <option value="admin">Админ</option>
                </select>
                {!editingUser && (
                  <input name="password" type="password" placeholder="Пароль" required className="w-full p-2 border rounded-lg" />
                )}
              </div>
              <div className="mt-4 flex justify-end space-x-2">
                <button type="button" onClick={handleCancelUser} className="bg-gray-600 text-white px-4 py-2 rounded-lg">
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