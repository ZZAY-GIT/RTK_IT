// src/features/history/components/TrendChartCanvas.js
import { useEffect } from 'react';
import { Chart } from 'chart.js';

export default function TrendChartCanvas({ chartSelectedItems, finalHistoryData, theme }) {
  useEffect(() => {
    const canvas = document.getElementById('trendChart');
    if (!canvas || chartSelectedItems.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (window.trendChartInstance) {
      window.trendChartInstance.destroy();
    }

    const isDark = theme === 'dark';
    const textColor = isDark ? '#f3f4f6' : '#1f2937';
    const gridColor = isDark ? '#4b5563' : '#e5e7eb';

    const labels = [...new Set(finalHistoryData
      .filter(item => chartSelectedItems.some(s => s.productId === item.productId))
      .map(item => item.date))].sort();

    const datasets = chartSelectedItems.map((item, index) => {
      const itemData = finalHistoryData
        .filter(d => d.productId === item.productId)
        .sort((a, b) => new Date(a.date) - new Date(b.date));

      const hue = index * 60;
      const borderColor = isDark ? `hsl(${hue}, 70%, 80%)` : `hsl(${hue}, 70%, 50%)`;
      const bgColor = isDark ? `hsla(${hue}, 70%, 80%, 0.2)` : `hsla(${hue}, 70%, 50%, 0.2)`;

      return {
        label: `${item.productName} (${item.productId})`,
        data: itemData.map(d => d.actualQuantity),
        borderColor,
        backgroundColor: bgColor,
        fill: false,
        tension: 0.3,
        borderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
        pointBackgroundColor: borderColor,
      };
    });

    window.trendChartInstance = new Chart(ctx, {
      type: 'line',
      data: { labels, datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { labels: { color: textColor, font: { size: 13 } } },
          tooltip: {
            backgroundColor: isDark ? '#1f2937' : '#ffffff',
            titleColor: textColor,
            bodyColor: textColor,
            borderColor: gridColor,
            borderWidth: 1,
            padding: 10,
            cornerRadius: 8,
          },
          title: {
            display: true,
            text: 'Тренд остатков по выбранным товарам',
            color: textColor,
            font: { size: 14, weight: '600' },
            padding: { bottom: 10 }
          }
        },
        scales: {
          x: {
            title: { display: true, text: 'Дата', color: textColor },
            ticks: { color: textColor, maxRotation: 45 },
            grid: { color: gridColor }
          },
          y: {
            beginAtZero: true,
            title: { display: true, text: 'Количество', color: textColor },
            ticks: { color: textColor, stepSize: 1 },
            grid: { color: gridColor }
          }
        },
        interaction: { mode: 'nearest', axis: 'x', intersect: false }
      }
    });

    return () => {
      if (window.trendChartInstance) {
        window.trendChartInstance.destroy();
        window.trendChartInstance = null;
      }
    };
  }, [chartSelectedItems, finalHistoryData, theme]);

  return <canvas id="trendChart" style={{ width: '100%', height: '100%' }} />;
}