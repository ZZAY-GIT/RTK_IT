// src/features/dashboard/components/Dashboard.js
import { useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchDashboardData, fetchAIPredictions } from '../../../store/warehouseSlice';
import Header from '../../../components/Header';
import { useTheme } from '../../../hooks/useTheme';
import { useWarehouseWebSocket } from '../hooks/useWarehouseWebSocket';
import InteractiveWarehouseMap from '../../../components/InteractiveWarehouseMap';
import MapControls from '../../../components/MapControls';
import { useMapControls } from '../hooks/useMapControls';
import { useNotifications } from '../hooks/useNotifications';
import NotificationsPanel from '../../../components/NotificationsPanel';

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

  // Состояние графика
  const [activityHistory, setActivityHistory] = useState([]);
  
  // Используем хук для управления картой
  const { mapControls, zoomIn, zoomOut, reset, updatePan } = useMapControls();

  // Используем хук для уведомлений
  const {
    notifications,
    unreadCount,
    addNotification,
    removeNotification,
    markAsRead,
    markAllAsRead,
    clearAll,
    clearRead
  } = useNotifications();

  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [highlightedZone, setHighlightedZone] = useState(null);

  useWarehouseWebSocket();

  // Инициализация данных при монтировании
  useEffect(() => {
    dispatch(fetchDashboardData());
    dispatch(fetchAIPredictions());
  }, [dispatch]);

  // Обнаружение критических ситуаций в реальном времени
  useEffect(() => {
    if (!recentScans || recentScans.length === 0) return;

    // Проверяем последние сканирования на критические остатки
    recentScans.forEach(scan => {
      if (scan.status === 'CRITICAL' || (scan.quantity !== undefined && scan.quantity < 10)) {
        // Проверяем, не было ли уже уведомления для этой зоны
        const zoneId = `${scan.zone}${scan.row_number || '1'}`;
        const existingNotification = notifications.find(n => 
          n.zoneId === zoneId && n.type === 'critical'
        );

        if (!existingNotification) {
          // Добавляем новое уведомление
          addNotification({
            type: 'critical',
            title: 'Критический остаток',
            message: `Зона ${zoneId}: товар ${scan.productId} - осталось ${scan.quantity} шт.`,
            zoneId: zoneId,
            productId: scan.productId,
            quantity: scan.quantity
          });
        }
      } else if (scan.status === 'LOW_STOCK' || (scan.quantity !== undefined && scan.quantity < 30)) {
        const zoneId = `${scan.zone}${scan.row_number || '1'}`;
        const existingNotification = notifications.find(n => 
          n.zoneId === zoneId && n.type === 'warning'
        );

        if (!existingNotification) {
          addNotification({
            type: 'warning',
            title: 'Низкий остаток',
            message: `Зона ${zoneId}: товар ${scan.productId} - осталось ${scan.quantity} шт.`,
            zoneId: zoneId,
            productId: scan.productId,
            quantity: scan.quantity
          });
        }
      }
    });
  }, [recentScans, addNotification, notifications]);

  // Обработчик клика по уведомлению
  const handleNotificationClick = useCallback((notification) => {
    // Подсвечиваем зону на карте
    if (notification.zoneId) {
      setHighlightedZone(notification.zoneId);
      
      // Автоматически убираем подсветку через 5 секунд
      setTimeout(() => {
        setHighlightedZone(null);
      }, 5000);
    }

    // Отмечаем уведомление как прочитанное
    markAsRead(notification.id);
    
    // Закрываем панель уведомлений
    setIsNotificationsOpen(false);
  }, [markAsRead]);

  // Формат даты
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

  // Загрузка истории активности
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
        if (isMounted) setActivityHistory([]);
      }
    };

    fetchActivityHistory();
    intervalId = setInterval(fetchActivityHistory, 10 * 60 * 1000);

    return () => {
      isMounted = false;
      if (intervalId) clearInterval(intervalId);
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <Header 
        onOpenCSVModal={onOpenCSVModal}
        notificationCount={unreadCount}
        onNotificationsClick={() => setIsNotificationsOpen(true)}
      />

      {/* Панель уведомлений */}
      <NotificationsPanel
        notifications={notifications}
        unreadCount={unreadCount}
        onMarkAsRead={markAsRead}
        onMarkAllAsRead={markAllAsRead}
        onClearAll={clearAll}
        onClearRead={clearRead}
        onNotificationClick={handleNotificationClick}
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
      />

      <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* === ЛЕВАЯ КОЛОНКА (КАРТА) === */}
        <div className="flex flex-col h-full">
          <div className="flex-grow bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            {/* Заголовок с элементами управления */}
            <div className="p-4 lg:p-6 border-b border-gray-200 dark:border-gray-700">
              {/* Первая строка: заголовок и статус */}
              <div className="flex justify-between items-center mb-3">
                <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                  Текущий мониторинг
                </h2>
                
                <div className="flex items-center gap-4">
                  {/* Статус подключения */}
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

                  {/* Индикатор уведомлений */}
                  {unreadCount > 0 && (
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                      <span className="text-sm text-red-600 dark:text-red-400 font-medium">
                        {unreadCount} предупреждений
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Вторая строка: элементы управления картой ПОД статусом */}
              <div className="flex justify-end">
                <MapControls 
                  onZoomIn={zoomIn}
                  onZoomOut={zoomOut}
                  onReset={reset}
                  scale={mapControls.scale}
                  theme={theme}
                />
              </div>
            </div>
            
            {/* Карта */}
            <div className="h-full min-h-[500px]">
              <InteractiveWarehouseMap 
                zones={zones} 
                robots={robots} 
                recentScans={recentScans}
                theme={theme}
                mapControls={mapControls}
                onMapControlsChange={updatePan}
                highlightedZone={highlightedZone}
              />
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