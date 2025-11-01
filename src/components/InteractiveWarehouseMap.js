// src/components/InteractiveWarehouseMap.jsx
import React, { useRef, useEffect, useState, useCallback } from 'react';

const InteractiveWarehouseMap = ({ zones, robots, theme, height = 600 }) => {
  const svgRef = useRef(null);
  const viewportRef = useRef(null);
  const [scale, setScale] = useState(1);
  const [translateX, setTranslateX] = useState(0);
  const [translateY, setTranslateY] = useState(0);
  const [isPanningEnabled, setIsPanningEnabled] = useState(false);
  const startRef = useRef(null);
  const lastTouchDist = useRef(0);
  const lastTouchCenter = useRef(null);
  const [tooltip, setTooltip] = useState(null);
  const tooltipRef = useRef(null);

  const CELL_SIZE = 20;
  const COLS = 26;
  const ROWS = 50;
  const PADDING = 40;
  const MAP_WIDTH = COLS * CELL_SIZE + 2 * PADDING;
  const MAP_HEIGHT = ROWS * CELL_SIZE + 2 * PADDING;

  // Размеры только контента, без отступов
  const CONTENT_WIDTH = COLS * CELL_SIZE;
  const CONTENT_HEIGHT = ROWS * CELL_SIZE;

  /* ---------- инициализация: карта влезает полностью ---------- */
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;

    const rect = svg.getBoundingClientRect();
    const fitScale = Math.min(rect.width / MAP_WIDTH, rect.height / MAP_HEIGHT);
    const targetW = MAP_WIDTH * fitScale;
    const targetH = MAP_HEIGHT * fitScale;

    const targetTranslateX = rect.width / 2 - targetW / 2;
    const targetTranslateY = rect.height / 2 - targetH / 2;

    setScale(1);
    setTranslateX(Math.min(targetTranslateX, 0));
    setTranslateY(Math.min(targetTranslateY, 0));
    setIsPanningEnabled(false);
  }, []);

  /* ---------- трансформация ---------- */
  useEffect(() => {
    if (viewportRef.current) {
      viewportRef.current.setAttribute(
        'transform',
        `translate(${translateX},${translateY}) scale(${scale})`
      );
    }
  }, [scale, translateX, translateY]);

  /* ---------- ограничение панорамирования (ИСПРАВЛЕНО) ---------- */
  const clampPan = useCallback((x, y) => {
    const svg = svgRef.current;
    if (!svg) return { x, y };

    const rect = svg.getBoundingClientRect();

    // --- Новая логика: границы основаны на контенте, а не на всей карте с отступами ---

    // 1. Ограничение pan'а вправо и вниз.
    // Мы можем сдвинуть карту так, чтобы правый/нижний край КОНТЕНТА был у края видимой области.
    const minTranslateX = rect.width / scale - (PADDING + CONTENT_WIDTH);
    const minTranslateY = rect.height / scale - (PADDING + CONTENT_HEIGHT);

    // 2. Ограничение pan'а влево и вверх.
    // Мы можем сдвинуть карту так, чтобы левый/верхний край КОНТЕНТА был у края видимой области.
    // Это значит, что сам <g> можно сдвинуть на величину PADDING.
    const maxTranslateX = PADDING;
    const maxTranslateY = PADDING;

    // Если контент меньше видимой области, не даем ему "болтаться"
    const finalMinX = Math.min(minTranslateX, maxTranslateX);
    const finalMinY = Math.min(minTranslateY, maxTranslateY);

    return {
      x: Math.min(Math.max(x, finalMinX), maxTranslateX),
      y: Math.min(Math.max(y, finalMinY), maxTranslateY),
    };
  }, [scale]);

  /* ---------- зум ---------- */
  const applyZoom = (delta, clientX, clientY) => {
    const svg = svgRef.current;
    if (!svg) return;

    const oldScale = scale;
    const newScale = Math.min(Math.max(oldScale * delta, 1.0), 5);

    if (delta < 1 && oldScale <= 1.0) return;
    if (newScale === oldScale) return;

    const rect = svg.getBoundingClientRect();
    const mx = clientX - rect.left;
    const my = clientY - rect.top;

    const newTranslateX = translateX + mx * (1 / newScale - 1 / oldScale);
    const newTranslateY = translateY + my * (1 / newScale - 1 / oldScale);

    const clamped = clampPan(newTranslateX, newTranslateY);
    setTranslateX(newTranslateX);
    setTranslateY(newTranslateY);

    setScale(newScale);
    setIsPanningEnabled(newScale > 1);
  };

  /* ---------- wheel с предотвращением скролла страницы ---------- */
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;

    const handleWheel = (e) => {
      // Если курсор над тултипом - разрешаем скролл страницы
      if (tooltipRef.current && tooltipRef.current.contains(e.target)) {
        return;
      }
      e.preventDefault();
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      applyZoom(delta, e.clientX, e.clientY);
    };

    svg.addEventListener('wheel', handleWheel, { passive: false });
    return () => svg.removeEventListener('wheel', handleWheel);
  }, [scale, translateX, translateY]);

  /* ---------- панорамирование ---------- */
  const handleMouseDown = (e) => {
    // Если клик по тултипу - не начинаем панорамирование
    if (tooltipRef.current && tooltipRef.current.contains(e.target)) {
      return;
    }
    if (e.button !== 0) return;
    startRef.current = { x: e.clientX, y: e.clientY, translateX, translateY };
    if (svgRef.current) svgRef.current.style.cursor = 'grabbing';
  };

  const handleMouseMove = (e) => {
    if (!startRef.current) return;

    const dx = e.clientX - startRef.current.x;
    const dy = e.clientY - startRef.current.y;

    const newX = startRef.current.translateX + dx / scale;
    const newY = startRef.current.translateY + dy / scale;

    const clamped = clampPan(newX, newY);
    setTranslateX(newX);
    setTranslateY(newY);
  };

  const handleMouseUp = () => {
    startRef.current = null;
    if (svgRef.current) svgRef.current.style.cursor = isPanningEnabled ? 'grab' : 'default';
  };

  /* ---------- тач ---------- */
  const getTouchCenter = (e) => {
    const t1 = e.touches[0], t2 = e.touches[1];
    return { x: (t1.clientX + t2.clientX) / 2, y: (t1.clientY + t2.clientY) / 2 };
  };

  const handleTouchStart = (e) => {
    if (e.touches.length === 2) {
      e.preventDefault();
      const center = getTouchCenter(e);
      lastTouchDist.current = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      lastTouchCenter.current = center;
    } else if (e.touches.length === 1) {
      startRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY, translateX, translateY };
    }
  };

  const handleTouchMove = (e) => {
    if (e.touches.length === 2 && lastTouchCenter.current) {
      e.preventDefault();
      const center = getTouchCenter(e);
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const delta = dist / lastTouchDist.current;
      applyZoom(delta, center.x, center.y);
      lastTouchDist.current = dist;
      lastTouchCenter.current = center;
    } else if (e.touches.length === 1 && startRef.current) {
      const dx = e.touches[0].clientX - startRef.current.x;
      const dy = e.touches[0].clientY - startRef.current.y;

      const newX = startRef.current.translateX + dx / scale;
      const newY = startRef.current.translateY + dy / scale;

      const clamped = clampPan(newX, newY);
      setTranslateX(clamped.x);
      setTranslateY(clamped.y);
    }
  };

  const handleTouchEnd = () => {
    startRef.current = null;
    lastTouchDist.current = 0;
    lastTouchCenter.current = null;
  };

  /* ---------- цвета ---------- */
  const getZoneColor = (id) => {
    const zone = zones.find((z) => z.id === id);
    if (!zone) return '#fef3c7';
    return zone.status === 'recent' ? '#86efac'
         : zone.status === 'needs_check' ? '#fde047'
         : '#fca5a5';
  };
  const getRobotColor = (status) => {
    return status === 'active' ? '#22c55e'
         : status === 'low_battery' ? '#facc15'
         : '#ef4444';
  };

  /* ---------- форматирование времени ---------- */
  const formatTime = (timestamp) => {
    if (!timestamp) return 'Неизвестно';
    
    try {
      const date = new Date(timestamp);
      if (isNaN(date.getTime())) return 'Неверная дата';
      
      return date.toLocaleTimeString('ru-RU', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      }) + ' ' + date.toLocaleDateString('ru-RU');
    } catch (error) {
      return 'Ошибка даты';
    }
  };

  /* ---------- клик по роботу ---------- */
  const handleRobotClick = (e, robot) => {
    e.stopPropagation();
    const svg = svgRef.current;
    if (!svg) return;

    // Получаем координаты робота в системе SVG (без учета трансформации)
    const col = Math.floor(robot.x / CELL_SIZE);
    const row = Math.floor(robot.y / CELL_SIZE);
    const robotX = PADDING + col * CELL_SIZE + CELL_SIZE / 2;
    const robotY = PADDING + row * CELL_SIZE + CELL_SIZE / 2;

    // Вычисляем оптимальную позицию для тултипа
    const TOOLTIP_WIDTH = 240;
    const TOOLTIP_HEIGHT = 140;

    let tooltipX = robotX + 20;
    let tooltipY = robotY - TOOLTIP_HEIGHT - 10;

    // Проверяем границы и корректируем позицию если нужно
    if (tooltipX + TOOLTIP_WIDTH > MAP_WIDTH) {
      tooltipX = robotX - TOOLTIP_WIDTH - 20;
    }
    if (tooltipY < 10) {
      tooltipY = robotY + 25;
    }
    if (tooltipY + TOOLTIP_HEIGHT > MAP_HEIGHT) {
      tooltipY = MAP_HEIGHT - TOOLTIP_HEIGHT - 10;
    }

    // Гарантируем, что тултип не выйдет за левую/верхнюю границу
    tooltipX = Math.max(10, tooltipX);
    tooltipY = Math.max(10, tooltipY);

    setTooltip({
      robot,
      svgX: tooltipX,
      svgY: tooltipY,
    });
  };

  /* ---------- клик по тултипу ---------- */
  const handleTooltipClick = (e) => {
    e.stopPropagation();
    // Предотвращаем закрытие тултипа при клике на него
  };

  /* ---------- предотвращение панорамирования при взаимодействии с тултипом ---------- */
  const handleTooltipMouseDown = (e) => {
    e.stopPropagation();
  };

  useEffect(() => {
    const handleClickOutside = () => setTooltip(null);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  return (
    <svg
      ref={svgRef}
      width="100%"
      height="600"
      viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`}
      preserveAspectRatio="xMidYMid meet"
      className="w-full h-full"
      style={{ cursor: isPanningEnabled ? 'grab' : 'default' }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onClick={() => setTooltip(null)}
    >
      <g ref={viewportRef}>
        {/* зоны, подписи, роботы */}
        {Array.from({ length: COLS }, (_, col) =>
          Array.from({ length: ROWS }, (_, row) => {
            const id = `${String.fromCharCode(65 + col)}${row + 1}`;
            const x = PADDING + col * CELL_SIZE;
            const y = PADDING + row * CELL_SIZE;
            return (
              <rect
                key={id}
                x={x}
                y={y}
                width={CELL_SIZE}
                height={CELL_SIZE}
                fill={getZoneColor(id)}
                stroke={theme === 'dark' ? '#4b5563' : '#d1d5db'}
                strokeWidth="0.5"
              />
            );
          })
        )}

        {Array.from({ length: COLS }, (_, i) => (
          <text
            key={`col-${i}`}
            x={PADDING + i * CELL_SIZE + CELL_SIZE / 2}
            y={PADDING - 10}
            textAnchor="middle"
            fontSize="11"
            fontWeight="bold"
            fill={theme === 'dark' ? '#9ca3af' : '#4b5563'}
            pointerEvents="none"
          >
            {String.fromCharCode(65 + i)}
          </text>
        ))}

        {Array.from({ length: ROWS }, (_, j) => (
          <text
            key={`row-${j}`}
            x={PADDING - 10}
            y={PADDING + j * CELL_SIZE + CELL_SIZE / 2 + 3}
            textAnchor="end"
            fontSize="11"
            fontWeight="bold"
            fill={theme === 'dark' ? '#9ca3af' : '#4b5563'}
            pointerEvents="none"
          >
            {j + 1}
          </text>
        ))}

        {robots.map((robot) => {
          const col = Math.floor(robot.x / CELL_SIZE);
          const row = Math.floor(robot.y / CELL_SIZE);
          const x = PADDING + col * CELL_SIZE + CELL_SIZE / 2;
          const y = PADDING + row * CELL_SIZE + CELL_SIZE / 2;

          return (
            <g
              key={robot.id}
              onClick={(e) => handleRobotClick(e, robot)}
              style={{ cursor: 'pointer' }}
            >
              <circle
                cx={x}
                cy={y}
                r={8}
                fill={getRobotColor(robot.status)}
                stroke="#1f2937"
                strokeWidth="2"
              />
              <text
                x={x}
                y={y + 3}
                textAnchor="middle"
                fontSize="10"
                fill="white"
                fontWeight="bold"
                pointerEvents="none"
              >
                R
              </text>
            </g>
          );
        })}
      </g>

      {/* панель управления */}
      <foreignObject x={MAP_WIDTH - 180} y="12" width="170" height="50">
        <div className="flex gap-2 bg-white dark:bg-gray-900 p-2 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
          <button
            onClick={() => {
              const svg = svgRef.current;
              if (!svg) return;
              const rect = svg.getBoundingClientRect();
              applyZoom(1.25, rect.left + rect.width / 2, rect.top + rect.height / 2);
            }}
            className="w-8 h-8 flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white rounded transition text-lg font-bold"
            title="Приблизить"
          >
            +
          </button>
          <button
            onClick={() => {
              if (scale <= 1.0) return;
              const svg = svgRef.current;
              if (!svg) return;
              const rect = svg.getBoundingClientRect();
              applyZoom(0.8, rect.left + rect.width / 2, rect.top + rect.height / 2);
            }}
            className={`w-8 h-8 flex items-center justify-center rounded transition text-lg font-bold ${
              scale <= 1.0 
                ? 'bg-gray-400 text-gray-600 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
            title="Отдалить"
          >
            −
          </button>
          <button
            onClick={() => {
              const svg = svgRef.current;
              if (!svg) return;
              
              const rect = svg.getBoundingClientRect();
              setScale(1);
              setTranslateX(0);
              setTranslateY(0);
              setIsPanningEnabled(false);
            }}
            className="px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded transition"
            title="Сброс"
          >
            Сброс
          </button>
        </div>
      </foreignObject>

      {/* тултип - вне трансформации чтобы был всегда виден полностью */}
      {tooltip && (
        <g 
          onClick={handleTooltipClick}
          onMouseDown={handleTooltipMouseDown}
          style={{ cursor: 'default' }}
        >
          <foreignObject 
            x={tooltip.svgX}
            y={tooltip.svgY}
            width="240"
            height="170"
            style={{ 
              pointerEvents: 'all',
              userSelect: 'text',
              WebkitUserSelect: 'text',
              MozUserSelect: 'text',
              msUserSelect: 'text'
            }}
            ref={tooltipRef}
          >
            <div
              className={`p-4 rounded-lg shadow-xl border ${
                theme === 'dark'
                  ? 'bg-gray-800 border-gray-700 text-gray-100 hover:bg-gray-750'
                  : 'bg-white border-gray-300 text-gray-900 hover:bg-gray-50'
              } transition-colors duration-200 select-text`}
              style={{ 
                width: '232px',
                minHeight: '132px',
                boxSizing: 'border-box'
              }}
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="font-bold text-sm">Робот ID:</span>
                <span className="text-sm font-mono select-text">{tooltip.robot.id}</span>
              </div>
              
              <div className="flex items-center gap-2 mb-2">
                <span className="font-bold text-sm">Статус:</span>
                <span className={`px-2 py-1 rounded text-xs font-medium select-text ${
                  tooltip.robot.status === 'active'
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                    : tooltip.robot.status === 'low_battery'
                    ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
                    : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                }`}>
                  {tooltip.robot.status === 'active' ? 'Активен' :
                   tooltip.robot.status === 'low_battery' ? 'Низкий заряд' : 'Офлайн'}
                </span>
              </div>
              
              <div className="flex items-center gap-2 mb-2">
                <span className="font-bold text-sm">Батарея:</span>
                <span className="text-sm select-text">{tooltip.robot.battery}%</span>
                <div className="w-16 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${
                      tooltip.robot.battery > 70 ? 'bg-green-500' :
                      tooltip.robot.battery > 30 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${Math.max(5, tooltip.robot.battery)}%` }}
                  />
                </div>
              </div>
              
              <div className="flex items-center gap-2 mb-2">
                <span className="font-bold text-sm">Позиция:</span>
                <span className="text-sm font-mono select-text">
                  {String.fromCharCode(65 + Math.floor(tooltip.robot.x / CELL_SIZE))}
                  {Math.floor(tooltip.robot.y / CELL_SIZE) + 1}
                </span>
              </div>
              
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-3 select-text">
                Обновлено: {tooltip.robot.lastUpdate}
              </div>

            </div>
          </foreignObject>
        </g>
      )}
    </svg>
  );
};

export default InteractiveWarehouseMap;