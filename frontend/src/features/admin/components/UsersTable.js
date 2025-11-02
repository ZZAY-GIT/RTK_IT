// src/features/admin/components/UsersTable.js
import { PlusIcon, PencilIcon, TrashIcon, SearchIcon } from '@heroicons/react/outline';

export default function UsersTable({
  paginatedUsers,
  selectedItems,
  setSelectedItems,
  userSearch,
  setUserSearch,
  setIsUserModalOpen,
  setEditingUser,
  handleEditUser,
  handleDeleteUser,
  pageSize,
  setPageSize,
  currentPage,
  setCurrentPage,
  filteredUsers
}) {
  return (
   <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-4 mb-6 overflow-x-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 space-y-2 sm:space-y-0">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Управление пользователями</h2>
        <button
          onClick={() => { setEditingUser(null); setIsUserModalOpen(true); }}
          className="bg-blue-600 dark:bg-blue-700 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-800 flex items-center text-sm"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Добавить пользователя
        </button>
      </div>
      <div className="mb-4">
        <label className="block text-sm text-gray-600 dark:text-gray-300">Поиск по имени или email</label>
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

      <div className="overflow-x-auto -mx-4 px-4">
        <table className="w-full text-xs min-w-[600px]">
        <thead>
          <tr className="bg-gray-100 dark:bg-gray-700">
            <th className="p-2 text-left w-8">
              <input
                type="checkbox"
                checked={selectedItems.length === paginatedUsers.length && paginatedUsers.length > 0}
                onChange={(e) => e.target.checked ? setSelectedItems(paginatedUsers) : setSelectedItems([])}
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
                    checked={selectedItems.some(i => i.id === user.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedItems([...selectedItems, user]);
                      } else {
                        setSelectedItems(selectedItems.filter(i => i.id !== user.id));
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
                  <button onClick={() => handleEditUser(user)} className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300">
                    <PencilIcon className="h-5 w-5" />
                  </button>
                  <button onClick={() => handleDeleteUser(user.id)} className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300">
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
      </div>
      
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