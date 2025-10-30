import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Chart } from 'chart.js';
import {
  CategoryScale,
  LinearScale,
  PointElement,
  LineController,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { fetchDashboardData, fetchAIPredictions } from '../store/warehouseSlice';
import Header from '../components/Header';
import { useTheme } from '../hooks/useTheme';
import { useWarehouseWebSocket } from '../hooks/useWarehouseWebSocket';
import InteractiveWarehouseMap from '../components/InteractiveWarehouseMap';

// РЕГИСТРАЦИЯ ВСЕХ КОМПОНЕНТОВ Chart.js
Chart.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineController,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);
function Dashboard({ onOpenCSVModal }) {
  const dispatch = useDispatch();
  const { robots, zones, recentScans, aiPredictions, websocketStatus, loading } = useSelector((state) => state.warehouse);
  const { theme } = useTheme();
  const [activityHistory, setActivityHistory] = useState([]);

  useWarehouseWebSocket();

  // === ЗАГРУЗКА ДАННЫХ ===
  useEffect(() => {
    dispatch(fetchDashboardData());
    dispatch(fetchAIPredictions());
  }, [dispatch]);

  // === ФОРМАТИРОВАНИЕ ДАТЫ ===
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

  // === ОБНОВЛЕНИЕ АКТИВНОСТИ ПРИ ИЗМЕНЕНИИ РОБОТОВ ===
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

  // === АВТООБНОВЛЕНИЕ КАЖДЫЕ 10 МИНУТ ===
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

useEffect(() => {
  const canvas = document.getElementById('activityChart');
  if (!canvas || activityHistory.length === 0) return;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  if (window.activityChartInstance) {
    window.activityChartInstance.destroy();
  }

  const isDark = theme === 'dark';
  const borderColor = isDark ? 'rgba(147, 197, 253, 1)' : 'rgba(59, 130, 246, 1)';
  const bgColor = isDark ? 'rgba(147, 197, 253, 0.2)' : 'rgba(59, 130, 246, 0.2)';
  const textColor = isDark ? '#f3f4f6' : '#1f2937';
  const gridColor = isDark ? '#4b5563' : '#e5e7eb';

  const labels = activityHistory.map(item =>
    new Date(item.timestamp).toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  );

  window.activityChartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: 'Активных роботов',
        data: activityHistory.map(item => item.count),
        borderColor,
        backgroundColor: bgColor,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: borderColor,
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      layout: {
        padding: {
          bottom: 30,   // ДОПОЛНИТЕЛЬНОЕ МЕСТО ДЛЯ ПОДПИСЕЙ
          left: 10,
          right: 10,
          top: 10
        }
      },
      plugins: {
        legend: {
          position: 'top',
          labels: { color: textColor, usePointStyle: true, font: { size: 12 } }
        },
        tooltip: {
          backgroundColor: isDark ? '#1f2937' : '#ffffff',
          titleColor: textColor,
          bodyColor: textColor,
          borderColor: gridColor,
          borderWidth: 1,
          padding: 10,
          cornerRadius: 8,
          callbacks: {
            title: (ctx) => activityHistory[ctx[0].dataIndex]?.timeDisplay || '',
            label: (ctx) => `Активных роботов: ${ctx.parsed.y}`
          }
        },
      },
      scales: {
        x: {
          title: {
            display: true,
            text: 'Время',
            color: textColor,
            font: { size: 12 },
            padding: { top: 12, bottom: 12 }  // ОТСТУП ДЛЯ СЛОВА "ВРЕМЯ"
          },
          ticks: {
            color: textColor,
            maxRotation: 45,
            minRotation: 0,
            autoSkip: true,
            maxTicksLimit: 8,
            padding: 10,  // ОТСТУП ОТ КРАЯ
            callback: function(value, index) {
              return index % 2 === 0 ? this.getLabelForValue(value) : '';
            }
          },
          grid: { color: gridColor }
        },
        y: {
          beginAtZero: true,
          max: Math.max(robots.length, 1),
          title: { display: true, text: 'Количество роботов', color: textColor, font: { size: 12 } },
          ticks: { color: textColor, stepSize: 1, padding: 10 },
          grid: { color: gridColor }
        }
      }
    }
  });

  return () => {
    if (window.activityChartInstance) {
      window.activityChartInstance.destroy();
      window.activityChartInstance = null;
    }
  };
}, [theme, activityHistory, robots.length]);

  const handleRefreshPredictions = () => {
    dispatch(fetchAIPredictions());
  };

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

        {/* === СТАТИСТИКА + ГРАФИК === */}
        <div className="col-span-1 space-y-4 h-full">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-4">
            <h2 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-100">
              Статистика в реальном времени
            </h2>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-300">Активных роботов</p>
                <p className="text-xl font-bold text-gray-800 dark:text-gray-100">
                  {robots.filter(r => r.status === 'active').length}/{robots.length}
                </p>
              </div>
              <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-300">Проверено сегодня</p>
                <p className="text-xl font-bold text-gray-800 dark:text-gray-100">
                  {recentScans.length}
                </p>
              </div>
              <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-300">Критических остатков</p>
                <p className="text-xl font-bold text-gray-800 dark:text-gray-100">
                  {recentScans.filter(s => s.status === 'critical').length}
                </p>
              </div>
              <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-300">Средний заряд батарей</p>
                <p className="text-xl font-bold text-gray-800 dark:text-gray-100">
                  {robots.length > 0 ? Math.round(robots.reduce((sum, r) => sum + r.battery, 0) / robots.length) : 0}%
                </p>
              </div>
            </div>

            {/* === ГРАФИК НА CANVAS === */}
            <div className="mt-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4" style={{ height: '340px' }}>
              <h3 className="text-md font-semibold mb-3 text-gray-800 dark:text-gray-100">
                Активность роботов за последний час
              </h3>

              {activityHistory.length > 0 ? (
                <canvas id="activityChart" className="w-full h-full" />
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center text-gray-500 dark:text-gray-400">
                  <p>Сбор данных для графика...</p>
                  <p className="text-sm mt-2">Первые данные появятся через 10 минут</p>
                  <p className="text-sm">Текущее количество активных роботов: {robots.filter(r => r.status === 'active').length}</p>
                </div>
              )}

              <div className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
                Обновление каждые 10 минут • Последнее обновление: {formatDateTime(new Date())}
              </div>
            </div>
          </div>

          {/* === ПОСЛЕДНИЕ СКАНИРОВАНИЯ === */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                Последние сканирования
              </h2>
            </div>
            <div className="overflow-y-auto max-h-64">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-100 dark:bg-gray-700">
                    <th className="p-2 text-left text-gray-800 dark:text-gray-100">Время</th>
                    <th className="p-2 text-left text-gray-800 dark:text-gray-100">ID робота</th>
                    <th className="p-2 text-left text-gray-800 dark:text-gray-100">Зона</th>
                    <th className="p-2 text-left text-gray-800 dark:text-gray-100">Товар</th>
                    <th className="p-2 text-left text-gray-800 dark:text-gray-100">Количество</th>
                    <th className="p-2 text-left text-gray-800 dark:text-gray-100">Статус</th>
                  </tr>
                </thead>
                <tbody>
                  {recentScans.slice(0, 20).map((scan, index) => (
                    <tr key={index} className="border-t dark:border-gray-600">
                      <td className="p-2 text-gray-800 dark:text-gray-100">{scan.time}</td>
                      <td className="p-2 text-gray-800 dark:text-gray-100">{scan.robotId}</td>
                      <td className="p-2 text-gray-800 dark:text-gray-100">{scan.zone}</td>
                      <td className="p-2 text-gray-800 dark:text-gray-100">{`${scan.productName} (${scan.productId})`}</td>
                      <td className="p-2 text-gray-800 dark:text-gray-100">{scan.quantity}</td>
                      <td className="p-2">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          scan.status === 'ok' ? 'bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-300' :
                          scan.status === 'low' ? 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-300' :
                          'bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-300'
                        }`}>
                          {scan.status === 'ok' ? 'ОК' : scan.status === 'low' ? 'Низкий остаток' : 'Критично'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* === ПРОГНОЗ ИИ === */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                Прогноз ИИ на следующие 7 дней
              </h2>
              <button
                onClick={handleRefreshPredictions}
                disabled={loading}
                className="bg-blue-600 dark:bg-blue-700 text-white px-3 py-1 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-800 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {loading ? 'Генерация...' : 'Обновить прогноз'}
              </button>
            </div>
            <div className="space-y-2">
              {aiPredictions.length > 0 ? (
                aiPredictions.slice(0, 5).map((pred, index) => (
                  <div key={pred.product_id || index} className="p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-100">
                      ID товара: {pred.product_id}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      Прогноз исчерпания: {pred.days_until_stockout} дней
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      Рекомендуемый заказ: {pred.recommended_order} шт.
                    </p>
                  </div>
                ))
              ) : (
                !loading && <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                  Нет данных для отображения.
                </p>
              )}
              {aiPredictions.length > 0 && (
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Достоверность прогноза: 75%
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;