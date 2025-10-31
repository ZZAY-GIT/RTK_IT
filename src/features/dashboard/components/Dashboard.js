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
  const { robots, zones, recentScans, aiPredictions, websocketStatus, loading } = useSelector((state) => state.warehouse);
  const { theme } = useTheme();
  const [activityHistory, setActivityHistory] = useState([]);

  useWarehouseWebSocket();

  useEffect(() => {
    dispatch(fetchDashboardData());
    dispatch(fetchAIPredictions());
  }, [dispatch]);

  const formatDateTime = (date) => {
    return date.toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  useEffect(() => {
    const activeCount = robots.filter(r => r.status === 'active').length;
    const now = new Date();

    setActivityHistory(prev => {
      const newHistory = [...prev, {
        timestamp: now.getTime(),
        timeDisplay: formatDateTime(now),
        count: activeCount
      }];

      const oneHourAgo = now.getTime() - 60 * 60 * 1000;
      return newHistory
        .filter(item => item.timestamp >= oneHourAgo)
        .sort((a, b) => a.timestamp - b.timestamp);
    });
  }, [robots]);

  useEffect(() => {
    const interval = setInterval(() => {
      const activeCount = robots.filter(r => r.status === 'active').length;
      const now = new Date();

      setActivityHistory(prev => {
        const newHistory = [...prev, {
          timestamp: now.getTime(),
          timeDisplay: formatDateTime(now),
          count: activeCount
        }];

        const oneHourAgo = now.getTime() - 60 * 60 * 1000;
        return newHistory
          .filter(item => item.timestamp >= oneHourAgo)
          .sort((a, b) => a.timestamp - b.timestamp);
      });
    }, 10 * 60 * 1000);

    return () => clearInterval(interval);
  }, [robots]);

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <Header onOpenCSVModal={onOpenCSVModal} />

      <div className="p-6 grid grid-cols-2 gap-6">
        {/* === КАРТА СКЛАДА === */}
        <div className="flex flex-col h-full">
          <div className="flex justify-between items-center mb-4 px-6 pt-6">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
              Текущий мониторинг
            </h2>
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${websocketStatus === 'connected' ? 'bg-green-500 animate-pulse' : websocketStatus === 'reconnecting' ? 'bg-yellow-500 animate-pulse' : 'bg-red-500'}`} />
              <span className="text-sm text-gray-600 dark:text-gray-300">
                {websocketStatus === 'connected' ? 'Live' : websocketStatus === 'reconnecting' ? 'Переподключение...' : 'Офлайн'}
              </span>
            </div>
          </div>
          <div className="flex-grow bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <InteractiveWarehouseMap zones={zones} robots={robots} theme={theme} />
          </div>
        </div>

        {/* === ПРАВАЯ КОЛОНКА === */}
        <div className="col-span-1 space-y-4 h-full">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-4">
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