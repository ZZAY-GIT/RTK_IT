// src/features/dashboard/components/ActivityChartCanvas.js
import { useEffect } from 'react';
import { Chart } from 'chart.js';
import {
  CategoryScale, LinearScale, PointElement, LineController, LineElement,
  Title, Tooltip, Legend, Filler
} from 'chart.js';

Chart.register(CategoryScale, LinearScale, PointElement, LineController, LineElement, Title, Tooltip, Legend, Filler);

export default function ActivityChartCanvas({ activityHistory, theme, robots }) {
  useEffect(() => {
    const canvas = document.getElementById('activityChart');
    if (!canvas || activityHistory.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (window.activityChartInstance) {
      window.activityChartInstance.destroy();
    }

    const isDark = theme === 'dark';
    const isMobile = window.innerWidth < 640;

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
          pointBorderWidth: isMobile ? 1 : 2,
          pointRadius: isMobile ? 2 : 4,
          pointHoverRadius: isMobile ? 4 : 6,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        layout: {
          padding: isMobile ? 10 : { bottom: 30, left: 10, right: 10, top: 10 }
        },

        elements: {
          point: {
            radius: isMobile ? 2 : 4
          }
        },

        plugins: {
          legend: { 
            position: 'top', 
            labels: { 
              color: textColor, 
              usePointStyle: true, 
              font: { size: isMobile ? 10 : 12 }
            }
          },
          tooltip: {
            backgroundColor: isDark ? '#1f2937' : '#ffffff',
            titleColor: textColor,
            bodyColor: textColor,
            borderColor: gridColor,
            borderWidth: 1,
            padding: isMobile ? 6 : 10,
            cornerRadius: 6,
            callbacks: {
              label: (ctx) => `Активных роботов: ${ctx.parsed.y}`
            }
          },
        },

        scales: {
          x: {
            title: { 
              display: !isMobile,
              text: 'Время',
              color: textColor,
              font: { size: 12 }
            },
            ticks: {
              color: textColor,
              autoSkip: true,
              maxTicksLimit: isMobile ? 4 : 8,
              maxRotation: isMobile ? 0 : 45,
              callback: function(value, index) {
                return index % (isMobile ? 3 : 2) === 0 ? this.getLabelForValue(value) : '';
              }
            },
            grid: { color: gridColor }
          },

          y: {
            beginAtZero: true,
            max: Math.max(robots.length, 1),
            title: { 
              display: !isMobile,
              text: 'Количество роботов',
              color: textColor,
              font: { size: 12 }
            },
            ticks: {
              color: textColor,
              stepSize: 1
            },
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

  return (
    <div className="mt-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 sm:p-4">
      <h3 className="text-lg sm:text-md font-semibold mb-3 text-gray-800 dark:text-gray-100">
        Активность роботов за последний час
      </h3>

      {activityHistory.length > 0 ? (
        <div className="h-56 sm:h-[340px] -mx-2 sm:mx-0">
          <canvas id="activityChart" className="w-full h-full" />
        </div>
      ) : (
        <div className="h-56 sm:h-[340px] flex flex-col items-center justify-center text-center text-gray-500 dark:text-gray-400 px-4">
          <p className="text-base sm:text-sm">Сбор данных для графика...</p>
          <p className="text-sm sm:text-xs mt-2">
            Первые данные появятся через 10 минут
          </p>
          <p className="text-sm sm:text-sm mt-1">
            Текущее количество активных роботов: {robots.filter(r => r.status === 'active').length}
          </p>
        </div>
      )}
    </div>
  );
}
