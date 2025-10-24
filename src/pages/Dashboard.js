import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import { fetchDashboardData, fetchAIPredictions, setWebsocketStatus } from '../store/warehouseSlice';
import Header from '../components/Header';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

function Dashboard() {
  const dispatch = useDispatch();
  const { robots, zones, recentScans, aiPredictions, websocketStatus } = useSelector((state) => state.warehouse);
  const [scale, setScale] = useState(1);
  const [pauseUpdates, setPauseUpdates] = useState(false);

  useEffect(() => {
    dispatch(fetchDashboardData());
    dispatch(fetchAIPredictions());
    const ws = new WebSocket('wss://your-websocket-api.com');
    ws.onopen = () => dispatch(setWebsocketStatus('connected'));
    ws.onclose = () => dispatch(setWebsocketStatus('disconnected'));
    ws.onerror = () => dispatch(setWebsocketStatus('reconnecting'));

    const interval = setInterval(() => {
      if (!pauseUpdates) dispatch(fetchDashboardData());
    }, 5000);

    return () => {
      ws.close();
      clearInterval(interval);
    };
  }, [dispatch, pauseUpdates]);

  const chartData = {
    labels: ['-60min', '-50min', '-40min', '-30min', '-20min', '-10min', 'Now'],
    datasets: [
      {
        label: 'Активность роботов',
        data: [10, 15, 12, 18, 20, 17, 22],
        borderColor: 'rgba(59, 130, 246, 1)',
        fill: false,
      },
    ],
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Header />
      <div className="p-6 grid grid-cols-2 gap-6">
        {/* Блок 1: Карта склада */}
        <div className="col-span-1 bg-white rounded-2xl shadow-md p-4">
          <h2 className="text-lg font-semibold mb-4">Карта склада</h2>
          <div className="relative">
            <svg
              width="100%"
              height="400"
              viewBox={`0 0 ${26 * 20 * scale} ${50 * 20 * scale}`}
              className="border"
            >
              {/* Сетка зон */}
              {Array.from({ length: 26 }).map((_, col) => (
                Array.from({ length: 50 }).map((_, row) => (
                  <rect
                    key={`${String.fromCharCode(65 + col)}${row + 1}`}
                    x={col * 20 * scale}
                    y={row * 20 * scale}
                    width={20 * scale}
                    height={20 * scale}
                    fill={zones.find(z => z.id === `${String.fromCharCode(65 + col)}${row + 1}`)?.status === 'recent' ? 'green' : zones.find(z => z.id === `${String.fromCharCode(65 + col)}${row + 1}`)?.status === 'needs_check' ? 'yellow' : 'red'}
                    stroke="gray"
                    strokeWidth="0.5"
                  />
                ))
              ))}
              {/* Роботы */}
              {robots.map(robot => (
                <g key={robot.id} transform={`translate(${robot.x * scale}, ${robot.y * scale})`}>
                  <circle
                    cx={10 * scale}
                    cy={10 * scale}
                    r={5 * scale}
                    fill={robot.status === 'active' ? 'green' : robot.status === 'low_battery' ? 'yellow' : 'red'}
                  />
                  <title>{`ID: ${robot.id}, Батарея: ${robot.battery}%, Обновлено: ${robot.lastUpdate}`}</title>
                </g>
              ))}
            </svg>
            <div className="absolute top-2 right-2 flex space-x-2">
              <button onClick={() => setScale(s => s * 1.2)} className="bg-blue-600 text-white px-2 py-1 rounded">+</button>
              <button onClick={() => setScale(s => s / 1.2)} className="bg-blue-600 text-white px-2 py-1 rounded">-</button>
              <button onClick={() => setScale(1)} className="bg-blue-600 text-white px-2 py-1 rounded">Центр</button>
            </div>
          </div>
        </div>

        {/* Блок 2: Статистика */}
        <div className="col-span-1 space-y-4">
          <div className="bg-white rounded-2xl shadow-md p-4">
            <h2 className="text-lg font-semibold mb-4">Статистика в реальном времени</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">Активных роботов</p>
                <p className="text-xl font-bold">{robots.filter(r => r.status === 'active').length}/{robots.length}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">Проверено сегодня</p>
                <p className="text-xl font-bold">{recentScans.length}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">Критических остатков</p>
                <p className="text-xl font-bold">{recentScans.filter(s => s.status === 'critical').length}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">Средний заряд батарей</p>
                <p className="text-xl font-bold">{Math.round(robots.reduce((sum, r) => sum + r.battery, 0) / robots.length)}%</p>
              </div>
            </div>
            <Line data={chartData} />
          </div>

          {/* Блок 3: Последние сканирования */}
          <div className="bg-white rounded-2xl shadow-md p-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Последние сканирования</h2>
              <button
                onClick={() => setPauseUpdates(!pauseUpdates)}
                className="bg-gray-600 text-white px-3 py-1 rounded-lg hover:bg-gray-700"
              >
                {pauseUpdates ? 'Возобновить' : 'Пауза'}
              </button>
            </div>
            <div className="overflow-y-auto max-h-64">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="p-2 text-left">Время</th>
                    <th className="p-2 text-left">ID робота</th>
                    <th className="p-2 text-left">Зона</th>
                    <th className="p-2 text-left">Товар</th>
                    <th className="p-2 text-left">Количество</th>
                    <th className="p-2 text-left">Статус</th>
                  </tr>
                </thead>
                <tbody>
                  {recentScans.slice(0, 20).map((scan, index) => (
                    <tr key={index} className="border-t">
                      <td className="p-2">{scan.time}</td>
                      <td className="p-2">{scan.robotId}</td>
                      <td className="p-2">{scan.zone}</td>
                      <td className="p-2">{`${scan.productName} (${scan.productId})`}</td>
                      <td className="p-2">{scan.quantity}</td>
                      <td className="p-2">
                        <span
                          className={`px-2 py-1 rounded-full text-xs ${
                            scan.status === 'ok' ? 'bg-green-100 text-green-800' :
                            scan.status === 'low' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}
                        >
                          {scan.status === 'ok' ? 'ОК' : scan.status === 'low' ? 'Низкий остаток' : 'Критично'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Блок 4: Предиктивная аналитика */}
          <div className="bg-white rounded-2xl shadow-md p-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Прогноз ИИ на следующие 7 дней</h2>
              <button
                onClick={() => dispatch(fetchAIPredictions())}
                className="bg-blue-600 text-white px-3 py-1 rounded-lg hover:bg-blue-700"
              >
                Обновить прогноз
              </button>
            </div>
            <div className="space-y-2">
              {aiPredictions.slice(0, 5).map((pred, index) => (
                <div key={index} className="p-2 bg-gray-50 rounded-lg">
                  <p className="text-sm font-medium">{pred.productName}</p>
                  <p className="text-sm text-gray-600">Текущий остаток: {pred.currentStock}</p>
                  <p className="text-sm text-gray-600">Прогноз исчерпания: {pred.exhaustionDate}</p>
                  <p className="text-sm text-gray-600">Рекомендуемый заказ: {pred.recommendedOrder}</p>
                </div>
              ))}
              <p className="text-sm text-gray-600">Достоверность прогноза: {aiPredictions[0]?.confidence || 0}%</p>
            </div>
          </div>
        </div>
      </div>
      {/* WebSocket индикатор */}
      <div className="fixed bottom-4 right-4">
        <div
          className={`w-4 h-4 rounded-full ${
            websocketStatus === 'connected' ? 'bg-green-500' :
            websocketStatus === 'disconnected' ? 'bg-red-500' :
            'bg-gray-500'
          }`}
        />
      </div>
    </div>
  );
}

export default Dashboard;