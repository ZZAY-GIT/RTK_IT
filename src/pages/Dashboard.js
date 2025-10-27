import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import { fetchDashboardData, fetchAIPredictions } from '../store/warehouseSlice';
import Header from '../components/Header';
import { useTheme } from '../hooks/useTheme';
import { useWarehouseWebSocket } from '../hooks/useWarehouseWebSocket';
import InteractiveWarehouseMap from '../components/InteractiveWarehouseMap';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

function Dashboard({ onOpenCSVModal }) {
  const dispatch = useDispatch();
  const { robots, zones, recentScans, aiPredictions, websocketStatus } = useSelector((state) => state.warehouse);
  const { theme } = useTheme();
  const [activityHistory, setActivityHistory] = useState([]);

  useWarehouseWebSocket();

  useEffect(() => {
    dispatch(fetchDashboardData());
    dispatch(fetchAIPredictions());
  }, [dispatch]);

  // Функция для форматирования даты в русском формате
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

  // Обновляем историю активности каждые 10 минут
  useEffect(() => {
    const activeRobotsCount = robots.filter(r => r.status === 'active').length;
    const now = new Date();
    
    setActivityHistory(prev => {
      let newHistory = [...prev];
      
      // Добавляем новую точку данных
      newHistory.push({
        timestamp: now.getTime(), // Сохраняем timestamp для сортировки
        timeDisplay: formatDateTime(now),
        count: activeRobotsCount
      });
      
      // Оставляем только данные за последний час (6 точек по 10 минут)
      const oneHourAgo = now.getTime() - 60 * 60 * 1000;
      newHistory = newHistory.filter(item => item.timestamp >= oneHourAgo);
      
      // Сортируем по времени
      newHistory.sort((a, b) => a.timestamp - b.timestamp);
      
      return newHistory;
    });
  }, [robots]); // Обновляется при изменении роботов

  // Автоматическое обновление каждые 10 минут (даже если данные не менялись)
  useEffect(() => {
    const interval = setInterval(() => {
      const activeRobotsCount = robots.filter(r => r.status === 'active').length;
      const now = new Date();
      
      setActivityHistory(prev => {
        let newHistory = [...prev];
        
        // Добавляем новую точку данных
        newHistory.push({
          timestamp: now.getTime(),
          timeDisplay: formatDateTime(now),
          count: activeRobotsCount
        });
        
        // Оставляем только данные за последний час
        const oneHourAgo = now.getTime() - 60 * 60 * 1000;
        newHistory = newHistory.filter(item => item.timestamp >= oneHourAgo);
        
        // Сортируем по времени
        newHistory.sort((a, b) => a.timestamp - b.timestamp);
        
        return newHistory;
      });
    }, 10 * 60 * 1000); // 10 минут

    return () => clearInterval(interval);
  }, [robots]);

  // Формируем данные для графика
  const chartData = {
    labels: activityHistory.map(item => {
      // Форматируем для отображения на графике (только время для компактности)
      const date = new Date(item.timestamp);
      return date.toLocaleTimeString('ru-RU', { 
        hour: '2-digit', 
        minute: '2-digit',
        second: '2-digit'
      });
    }),
    datasets: [
      {
        label: 'Активных роботов',
        data: activityHistory.map(item => item.count),
        borderColor: theme === 'dark' ? 'rgba(147, 197, 253, 1)' : 'rgba(59, 130, 246, 1)',
        backgroundColor: theme === 'dark' ? 'rgba(147, 197, 253, 0.2)' : 'rgba(59, 130, 246, 0.2)',
        fill: true,
        tension: 0.4,
        pointBackgroundColor: theme === 'dark' ? 'rgba(147, 197, 253, 1)' : 'rgba(59, 130, 246, 1)',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: theme === 'dark' ? '#f3f4f6' : '#1f2937',
          usePointStyle: true,
        },
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        backgroundColor: theme === 'dark' ? '#1f2937' : '#fff',
        titleColor: theme === 'dark' ? '#f3f4f6' : '#1f2937',
        bodyColor: theme === 'dark' ? '#f3f4f6' : '#1f2937',
        borderColor: theme === 'dark' ? '#4b5563' : '#e5e7eb',
        borderWidth: 1,
        callbacks: {
          title: (context) => {
            // В тултипе показываем полную дату и время
            const index = context[0].dataIndex;
            return activityHistory[index].timeDisplay;
          },
          label: (context) => {
            return `Активных роботов: ${context.parsed.y}`;
          }
        }
      },
      title: {
        display: true,
        text: 'Активность роботов за последний час (обновление каждые 10 минут)',
        color: theme === 'dark' ? '#f3f4f6' : '#1f2937',
        font: {
          size: 14
        }
      }
    },
    scales: {
      x: {
        title: {
          display: true,
          text: 'Время',
          color: theme === 'dark' ? '#f3f4f6' : '#1f2937',
        },
        ticks: {
          color: theme === 'dark' ? '#f3f4f6' : '#1f2937',
          maxRotation: 45,
          callback: function(value, index) {
            // Показываем время каждые 2 точки для лучшей читаемости
            if (index % 2 === 0) {
              return this.getLabelForValue(value);
            }
            return '';
          }
        },
        grid: {
          color: theme === 'dark' ? '#4b5563' : '#e5e7eb',
        },
      },
      y: {
        beginAtZero: true,
        max: Math.max(robots.length, 1),
        title: {
          display: true,
          text: 'Количество роботов',
          color: theme === 'dark' ? '#f3f4f6' : '#1f2937',
        },
        ticks: {
          color: theme === 'dark' ? '#f3f4f6' : '#1f2937',
          stepSize: 1,
          precision: 0
        },
        grid: {
          color: theme === 'dark' ? '#4b5563' : '#e5e7eb',
        },
      },
    },
    interaction: {
      mode: 'nearest',
      axis: 'x',
      intersect: false,
    },
    maintainAspectRatio: false,
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <Header onOpenCSVModal={onOpenCSVModal} />
      <div className="p-6 grid grid-cols-2 gap-6">
        {/* Блок 1: Карта склада */}
        <div className="flex flex-col h-full">
          <div className="flex justify-between items-center mb-4 px-6 pt-6">
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
          <div className="flex-grow bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <InteractiveWarehouseMap
              zones={zones}
              robots={robots}
              theme={theme}
            />
          </div>
        </div>

        {/* Блок 2: Статистика */}
        <div className="col-span-1 space-y-4 h-full">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-4">
            <h2 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-100">
              Статистика в реальном времени
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-300">Активных роботов</p>
                <p className="text-xl font-bold text-gray-800 dark:text-gray-100">
                  {robots.filter((r) => r.status === 'active').length}/{robots.length}
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
                  {recentScans.filter((s) => s.status === 'critical').length}
                </p>
              </div>
              <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-300">Средний заряд батарей</p>
                <p className="text-xl font-bold text-gray-800 dark:text-gray-100">
                  {robots.length > 0
                    ? Math.round(robots.reduce((sum, r) => sum + r.battery, 0) / robots.length)
                    : 0}%
                </p>
              </div>
            </div>
            
            {/* График активности роботов */}
            <div className="mt-6" style={{ height: '300px' }}>
              <h3 className="text-md font-semibold mb-3 text-gray-800 dark:text-gray-100">
                Активность роботов за последний час
              </h3>
              {activityHistory.length > 0 ? (
                <Line data={chartData} options={chartOptions} />
              ) : (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <p>Сбор данных для графика...</p>
                  <p className="text-sm mt-2">Первые данные появятся через 10 минут</p>
                  <p className="text-sm">Текущее количество активных роботов: {robots.filter(r => r.status === 'active').length}</p>
                </div>
              )}
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                Обновление каждые 10 минут • Последнее обновление: {formatDateTime(new Date())}
              </div>
            </div>
          </div>

          {/* Остальные блоки остаются без изменений */}
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
                        <span
                          className={`px-2 py-1 rounded-full text-xs ${
                            scan.status === 'ok'
                              ? 'bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-300'
                              : scan.status === 'low'
                              ? 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-300'
                              : 'bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-300'
                          }`}
                        >
                          {scan.status === 'ok'
                            ? 'ОК'
                            : scan.status === 'low'
                            ? 'Низкий остаток'
                            : 'Критично'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                Прогноз ИИ на следующие 7 дней
              </h2>
              <button
                onClick={() => dispatch(fetchAIPredictions())}
                className="bg-blue-600 dark:bg-blue-700 text-white px-3 py-1 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-800"
              >
                Обновить прогноз
              </button>
            </div>
            <div className="space-y-2">
              {aiPredictions.slice(0, 5).map((pred, index) => (
                <div key={index} className="p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-100">
                    {pred.productName}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Текущий остаток: {pred.currentStock}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Прогноз исчерпания: {pred.exhaustionDate}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Рекомендуемый заказ: {pred.recommendedOrder}
                  </p>
                </div>
              ))}
              {aiPredictions.length > 0 && (
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Достоверность прогноза: {aiPredictions[0]?.confidence || 0}%
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