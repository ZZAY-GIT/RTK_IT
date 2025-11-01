// src/features/dashboard/components/Dashboard.js
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchDashboardData, fetchAIPredictions } from '../../../store/warehouseSlice';
import Header from '../../../components/Header';
import { useTheme } from '../../../hooks/useTheme';
import { useWarehouseWebSocket } from '../hooks/useWarehouseWebSocket';
import InteractiveWarehouseMap from '../../../components/InteractiveWarehouseMap';

// Компоненты
import ActivityChartCanvas from './ActivityChartCanvas';
import RecentScansTable from './RecentScansTable';
import StatsGrid from './StatsGrid';
import AIPredictions from './AIPredictions';

export default function Dashboard({ onOpenCSVModal }) {
  const dispatch = useDispatch();
  const { robots, zones, recentScans, aiPredictions, websocketStatus, loading } = useSelector(
    (state) => state.warehouse
  );
  const { theme } = useTheme();

  // Состояние графика — получаем из API
  const [activityHistory, setActivityHistory] = useState([]);

  useWarehouseWebSocket();

  // Инициализация данных при монтировании
  useEffect(() => {
    dispatch(fetchDashboardData());
    dispatch(fetchAIPredictions());
  }, [dispatch]);

  // Формат даты (для тултипа графика)
  const formatDateTime = (date) => {
    return date.toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  // === Загрузка истории активности ===
  useEffect(() => {
    let isMounted = true;
    let intervalId = null;

    const fetchActivityHistory = async () => {
      try {
        const response = await fetch('http://localhost:8000/api/dashboard/activity_history');
        if (!response.ok) throw new Error('Failed to fetch activity history');

        const data = await response.json();
        if (isMounted) {
          setActivityHistory(data.activityHistory || []);
        }
      } catch (error) {
        console.error('Error fetching activity history:', error);
        // При ошибке оставляем пустой массив (или предыдущие данные)
        if (isMounted) setActivityHistory([]);
      }
    };

    // 1. Первая загрузка сразу
    fetchActivityHistory();

    // 2. Затем каждые 10 минут
    intervalId = setInterval(fetchActivityHistory, 10 * 60 * 1000);

    // Очистка
    return () => {
      isMounted = false;
      if (intervalId) clearInterval(intervalId);
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <Header onOpenCSVModal={onOpenCSVModal} />

      <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* === ЛЕВАЯ КОЛОНКА (КАРТА) === */}
        <div className="flex flex-col h-full">
          <div className="flex-grow bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            {/* Заголовок теперь внутри карты */}
            <div className="flex justify-between items-center p-4 lg:p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                Текущий мониторинг
              </h2>
              <div className="flex items-center gap-2">
                <div
                  className={`w-3 h-3 rounded-full ${
                    websocketStatus === 'connected'
                      ? 'bg-green-500 animate-pulse'
                      : websocketStatus === 'reconnecting'
                      ? 'bg-yellow-500 animate-pulse'
                      : 'bg-red-500'
                  }`}
                />
                <span className="text-sm text-gray-600 dark:text-gray-300">
                  {websocketStatus === 'connected'
                    ? 'Live'
                    : websocketStatus === 'reconnecting'
                    ? 'Переподключение...'
                    : 'Офлайн'}
                </span>
              </div>
            </div>
            {/* Карта */}
            <div className="h-full min-h-[500px]">
              <InteractiveWarehouseMap zones={zones} robots={robots} theme={theme} />
            </div>
          </div>
        </div>

        {/* === ПРАВАЯ КОЛОНКА === */}
        <div className="space-y-6 h-full">
          {/* === СТАТИСТИКА И ГРАФИК === */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-6">
            <h2 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-100">
              Статистика в реальном времени
            </h2>

            <StatsGrid robots={robots} recentScans={recentScans} />

            {/* === ГРАФИК === */}
            <ActivityChartCanvas
              activityHistory={activityHistory}
              theme={theme}
              robots={robots}
              formatDateTime={formatDateTime}
            />
          </div>

          {/* === ПОСЛЕДНИЕ СКАНИРОВАНИЯ === */}
          <RecentScansTable recentScans={recentScans} />

          {/* === ПРОГНОЗ ИИ === */}
          <AIPredictions
            aiPredictions={aiPredictions}
            loading={loading}
            onRefresh={() => dispatch(fetchAIPredictions())}
          />
        </div>
      </div>
    </div>
  );
}