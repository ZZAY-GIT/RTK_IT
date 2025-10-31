// src/features/admin/components/RobotManager/RobotManager.js
import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchRobots, createRobot, updateRobot, deleteRobot
} from '../../../../store/warehouseSlice';
import { PencilIcon, TrashIcon } from '@heroicons/react/outline';

export default function RobotManager() {
  const dispatch = useDispatch();
  const { robots } = useSelector((state) => state.warehouse);
  const [pageSize, setPageSize] = useState(20);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedItems, setSelectedItems] = useState([]);
  const [isRobotModalOpen, setIsRobotModalOpen] = useState(false);
  const [editingRobot, setEditingRobot] = useState(null);
  const [robotSearch, setRobotSearch] = useState('');

  useEffect(() => {
    dispatch(fetchRobots());
  }, [dispatch]);

  const filteredRobots = robots.filter(
    (robot) =>
      (robot.id || '').toLowerCase().includes(robotSearch.toLowerCase()) ||
      (robot.current_zone || '').toLowerCase().includes(robotSearch.toLowerCase())
  );

  const paginatedRobots = filteredRobots.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const totalPages = Math.ceil(filteredRobots.length / pageSize);

  const selectAllItems = () => {
    if (selectedItems.length === paginatedRobots.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(paginatedRobots.map(r => r.id));
    }
  };

  const toggleSelectItem = (id) => {
    setSelectedItems(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleEditRobot = (robot) => {
    setEditingRobot(robot);
    setIsRobotModalOpen(true);
  };

  const handleSaveRobot = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = {
      status: formData.get('status'),
      battery_level: Number(formData.get('battery_level')),
      current_zone: formData.get('current_zone'),
      current_row: Number(formData.get('current_row')) || null,
      current_shelf: Number(formData.get('current_shelf')) || null,
    };

    if (editingRobot) {
      dispatch(updateRobot({ id: editingRobot.id, robot: data }));
    } else {
      dispatch(createRobot(data));
    }
    setIsRobotModalOpen(false);
    setEditingRobot(null);
  };

  const handleCancelRobot = () => {
    setIsRobotModalOpen(false);
    setEditingRobot(null);
  };

  return (
    <div>
      <div className="flex justify-between mb-4">
        <input
          type="text"
          placeholder="Поиск по ID или зоне..."
          value={robotSearch}
          onChange={(e) => setRobotSearch(e.target.value)}
          className="px-4 py-2 border rounded-lg bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-100"
        />
        <button
          onClick={() => setIsRobotModalOpen(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          + Добавить робота
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="p-3">
                <input
                  type="checkbox"
                  checked={selectedItems.length === paginatedRobots.length && paginatedRobots.length > 0}
                  onChange={selectAllItems}
                  className="rounded"
                />
              </th>
              <th className="p-3 text-left">ID</th>
              <th className="p-3 text-left">Статус</th>
              <th className="p-3 text-left">Батарея</th>
              <th className="p-3 text-left">Зона</th>
              <th className="p-3 text-left">Ряд</th>
              <th className="p-3 text-left">Полка</th>
              <th className="p-3 text-left">Действия</th>
            </tr>
          </thead>
          <tbody>
            {paginatedRobots.map((robot) => (
              <tr key={robot.id} className="border-t dark:border-gray-600">
                <td className="p-3">
                  <input
                    type="checkbox"
                    checked={selectedItems.includes(robot.id)}
                    onChange={() => toggleSelectItem(robot.id)}
                    className="rounded"
                  />
                </td>
                <td className="p-3">{robot.id}</td>
                <td className="p-3">{robot.status}</td>
                <td className="p-3">{robot.battery_level || robot.battery}%</td>
                <td className="p-3">{robot.current_zone}</td>
                <td className="p-3">{robot.current_row}</td>
                <td className="p-3">{robot.current_shelf}</td>
                <td className="p-3">
                  <button
                    onClick={() => handleEditRobot(robot)}
                    className="text-blue-600 hover:underline mr-2"
                  >
                    <PencilIcon className="h-5 w-5 inline" />
                  </button>
                  <button
                    onClick={() => dispatch(deleteRobot(robot.id))}
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

      {isRobotModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">
              {editingRobot ? 'Редактировать робота' : 'Добавить робота'}
            </h3>
            <form onSubmit={handleSaveRobot}>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-gray-600 dark:text-gray-300">Статус</label>
                  <select name="status" defaultValue={editingRobot?.status || 'active'} className="w-full p-2 border rounded-lg">
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
                    className="w-full p-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 dark:text-gray-300">Зона</label>
                  <input
                    type="text"
                    name="current_zone"
                    defaultValue={editingRobot?.current_zone || ''}
                    className="w-full p-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 dark:text-gray-300">Ряд</label>
                  <input
                    type="number"
                    name="current_row"
                    defaultValue={editingRobot?.current_row || ''}
                    className="w-full p-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 dark:text-gray-300">Полка</label>
                  <input
                    type="number"
                    name="current_shelf"
                    defaultValue={editingRobot?.current_shelf || ''}
                    className="w-full p-2 border rounded-lg"
                  />
                </div>
              </div>
              <div className="mt-4 flex justify-end space-x-2">
                <button type="button" onClick={handleCancelRobot} className="bg-gray-600 text-white px-4 py-2 rounded-lg">
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