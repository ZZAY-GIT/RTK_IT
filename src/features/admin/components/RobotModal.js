// src/features/admin/components/RobotModal.js
export default function RobotModal({ isOpen, editingRobot, handleSubmit, handleCancel }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-md">
        <h2 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-100">
          {editingRobot ? 'Редактировать робота' : 'Добавить робота'}
        </h2>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-600 dark:text-gray-300">ID робота</label>
              <input type="text" name="id" defaultValue={editingRobot?.id || ''} readOnly={!!editingRobot} className={`w-full p-2 border rounded-lg border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-100 ${editingRobot ? 'bg-gray-100 dark:bg-gray-600 cursor-not-allowed' : 'bg-white dark:bg-gray-700'}`} />
            </div>
            <div>
              <label className="block text-sm text-gray-600 dark:text-gray-300">Статус</label>
              <select name="status" defaultValue={editingRobot?.status || 'active'} className="w-full p-2 border rounded-lg bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-100">
                <option value="active">Активен</option>
                <option value="inactive">Неактивен</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-600 dark:text-gray-300">Уровень батареи (%)</label>
              <input type="number" name="battery_level" min="0" max="100" defaultValue={editingRobot?.battery_level || editingRobot?.battery || 100} required className="w-full p-2 border rounded-lg bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-100" />
            </div>
            <div>
              <label className="block text-sm text-gray-600 dark:text-gray-300">Зона</label>
              <input type="text" name="current_zone" defaultValue={editingRobot?.current_zone || ''} className="w-full p-2 border rounded-lg bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-100" />
            </div>
            <div>
              <label className="block text-sm text-gray-600 dark:text-gray-300">Ряд</label>
              <input type="number" name="current_row" defaultValue={editingRobot?.current_row || ''} className="w-full p-2 border rounded-lg bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-100" />
            </div>
            <div>
              <label className="block text-sm text-gray-600 dark:text-gray-300">Полка</label>
              <input type="number" name="current_shelf" defaultValue={editingRobot?.current_shelf || ''} className="w-full p-2 border rounded-lg bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-100" />
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