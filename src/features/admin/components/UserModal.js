// src/features/admin/components/UserModal.js
export default function UserModal({ isOpen, editingUser, handleSubmit, handleCancel }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-md">
        <h2 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-100">
          {editingUser ? 'Редактировать пользователя' : 'Добавить пользователя'}
        </h2>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-600 dark:text-gray-300">Email</label>
              <input type="email" name="email" defaultValue={editingUser?.email || ''} required className="w-full p-2 border rounded-lg bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-100" />
            </div>
            <div>
              <label className="block text-sm text-gray-600 dark:text-gray-300">Password</label>
              <input type="password" name="password" placeholder={editingUser ? "Оставьте пустым чтобы не менять" : "Введите пароль"} className="w-full p-2 border rounded-lg bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-100" />
            </div>
            <div>
              <label className="block text-sm text-gray-600 dark:text-gray-300">Имя</label>
              <input type="text" name="name" defaultValue={editingUser?.name || ''} required className="w-full p-2 border rounded-lg bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-100" />
            </div>
            <div>
              <label className="block text-sm text-gray-600 dark:text-gray-300">Роль</label>
              <select name="role" defaultValue={editingUser?.role || 'operator'} className="w-full p-2 border rounded-lg bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-100">
                <option value="operator">Оператор</option>
                <option value="admin">Админ</option>
                <option value="user">Пользователь</option>
              </select>
            </div>
          </div>
          <div className="mt-4 flex justify-end space-x-2">
            <button type="button" onClick={handleCancel} className="bg-gray-600 dark:bg-gray-700 text-white px-4 py-2 rounded-lg hover:bg-gray-700 dark:hover:bg-gray-600">Отмена</button>
            <button type="submit" className="bg-blue-600 dark:bg-blue-700 text-white px-4 py-2 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-800">Сохранить</button>
          </div>
        </form>
      </div>
    </div>
  );
}