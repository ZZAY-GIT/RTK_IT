// src/components/InteractiveWarehouseMap.jsx
import React, { useRef, useEffect, useState, useCallback } from 'react';

const InteractiveWarehouseMap = ({ 
  zones, 
  robots, 
  recentScans, // ДОБАВЛЕНО: получаем recentScans
  theme, 
  height = 600,
  mapControls,
  onMapControlsChange,
  highlightedZone
}) => {
  const svgRef = useRef(null);
  const viewportRef = useRef(null);
  const [tooltip, setTooltip] = useState(null);
  const [zoneTooltip, setZoneTooltip] = useState(null);
  const tooltipRef = useRef(null);
  const startRef = useRef(null);
  const lastTouchDist = useRef(0);
  const lastTouchCenter = useRef(null);

  // ОБНОВЛЕНО: используем recentScans вместо отдельного запроса
  const [zoneData, setZoneData] = useState({});
  const [loading, setLoading] = useState(false);

  const { scale, translateX, translateY, isPanningEnabled } = mapControls;

  // СТАЛО:
const CELL_SIZE = 20;
const COLS = 26;
const ROWS = 50;
const PADDING = 40;
const MAP_WIDTH = COLS * CELL_SIZE + 2 * PADDING;
const MAP_HEIGHT = ROWS * CELL_SIZE + 2 * PADDING;

// УБИРАЕМ ненужные константы для ограничений
// Размеры только контента, без отступов
// const CONTENT_WIDTH = COLS * CELL_SIZE;
// const CONTENT_HEIGHT = ROWS * CELL_SIZE;

  // ОБНОВЛЕНО: используем recentScans для формирования данных зон
  useEffect(() => {
  console.log('RecentScans received:', recentScans);
  
  if (!recentScans || recentScans.length === 0) {
    // Если нет данных, инициализируем пустыми зонами
    const emptyData = {};
    for (let col = 0; col < COLS; col++) {
      for (let row = 0; row < ROWS; row++) {
        const zoneId = `${String.fromCharCode(65 + col)}${row + 1}`;
        emptyData[zoneId] = null;
      }
    }
    setZoneData(emptyData);
    setLoading(false);
    return;
  }

  setLoading(true);
  
  const zoneDataFromScans = {};
    
    // Обрабатываем recentScans для получения данных зон
    recentScans.forEach(scan => {
    console.log('Processing scan:', scan);
    
    const zone = scan.zone;
    
    if (zone) {
      // ГЕНЕРИРУЕМ СЛУЧАЙНЫЙ row_number от 1 до 50 для демонстрации
      const rowNumber = Math.floor(Math.random() * 50) + 1;
      const zoneId = `${zone}${rowNumber}`;
      
      console.log(`Generated Zone ID: ${zoneId}`, scan);
      
      const existingData = zoneDataFromScans[zoneId];
      const existingTime = existingData?.time ? new Date(existingData.time) : null;
      const newTime = scan.time ? new Date(scan.time) : null;

      // Берем самые свежие данные
      if (!existingData || (newTime && (!existingTime || newTime > existingTime))) {
        // ГЕНЕРИРУЕМ СТАТУС на основе productId для разнообразия
        const productHash = scan.productId ? scan.productId.charCodeAt(0) + scan.productId.charCodeAt(scan.productId.length - 1) : 0;
        let status = 'OK';
        if (productHash % 3 === 0) status = 'LOW_STOCK';
        if (productHash % 5 === 0) status = 'CRITICAL';
        
        zoneDataFromScans[zoneId] = {
          status: status,
          product: scan.productId,
          quantity: Math.floor(Math.random() * 100) + 1, // случайное количество
          time: scan.time,
          robot_id: scan.robotId
        };
      }
    }
  });

    // Заполняем остальные зоны null
    for (let col = 0; col < COLS; col++) {
    for (let row = 0; row < ROWS; row++) {
      const zoneId = `${String.fromCharCode(65 + col)}${row + 1}`;
      if (!zoneDataFromScans[zoneId]) {
        zoneDataFromScans[zoneId] = null;
      }
    }
  }

  console.log('Final zone data:', zoneDataFromScans);
  console.log('Zones with data:', Object.keys(zoneDataFromScans).filter(key => zoneDataFromScans[key] !== null).length);

  setZoneData(zoneDataFromScans);
  setLoading(false);
}, [recentScans]);

  // Применяем трансформацию при изменении контролов
// СТАЛО:
useEffect(() => {
  if (viewportRef.current) {
    viewportRef.current.setAttribute(
      'transform',
      `translate(${translateX},${translateY}) scale(${scale})`
    );
  }
}, [scale, translateX, translateY]);

  // Ограничение панорамирования
  // const clampPan = useCallback((x, y) => {
  //   const svg = svgRef.current;
  //   if (!svg) return { x, y };

  //   const rect = svg.getBoundingClientRect();

  //   const minTranslateX = rect.width / scale - (PADDING + CONTENT_WIDTH);
  //   const minTranslateY = rect.height / scale - (PADDING + CONTENT_HEIGHT);

  //   const maxTranslateX = PADDING;
  //   const maxTranslateY = PADDING;

  //   const finalMinX = Math.min(minTranslateX, maxTranslateX);
  //   const finalMinY = Math.min(minTranslateY, maxTranslateY);

  //   return {
  //     x: Math.min(Math.max(x, finalMinX), maxTranslateX),
  //     y: Math.min(Math.max(y, finalMinY), maxTranslateY),
  //   };
  // }, [scale]);

  // Обновляем панорамирование через callback
// СТАЛО:
// СТАЛО:
const updatePanPosition = useCallback((newX, newY) => {
  if (onMapControlsChange) {
    // ПЕРЕДАЕМ ТОЛЬКО КООРДИНАТЫ
    onMapControlsChange(newX, newY);
  }
}, [onMapControlsChange]);

  // Зум
  // СТАЛО:
// ДОБАВЛЯЕМ useCallback для applyZoom чтобы избежать проблем с зависимостями
// СТАЛО:
// СТАЛО:
const applyZoom = useCallback((delta, clientX, clientY) => {
  const svg = svgRef.current;
  if (!svg) return;

  const oldScale = scale;
  
  // ПРОСТЫЕ ОГРАНИЧЕНИЯ МАСШТАБА
  let newScale = oldScale * delta;
  newScale = Math.max(0.1, Math.min(newScale, 10));

  // Если масштаб не изменился - выходим
  if (Math.abs(newScale - oldScale) < 0.001) return;

  // УПРОЩЕННЫЙ РАСЧЕТ - используем простую математику
  const rect = svg.getBoundingClientRect();
  const mx = clientX - rect.left;
  const my = clientY - rect.top;

  const newTranslateX = translateX + mx * (1 / newScale - 1 / oldScale);
  const newTranslateY = translateY + my * (1 / newScale - 1 / oldScale);

  // Обновляем состояние
  if (onMapControlsChange) {
    onMapControlsChange(newTranslateX, newTranslateY, newScale);
  }
}, [scale, translateX, translateY, onMapControlsChange]);

  // Wheel с предотвращением скролла страницы
  // СТАЛО:
useEffect(() => {
  const svg = svgRef.current;
  if (!svg) return;

  const handleWheel = (e) => {
    if (tooltipRef.current && tooltipRef.current.contains(e.target)) {
      return;
    }
    e.preventDefault();
    
    // ПРОСТАЯ И ПОНЯТНАЯ ЛОГИКА ЗУМА
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    applyZoom(delta, e.clientX, e.clientY);
  };

  svg.addEventListener('wheel', handleWheel, { passive: false });
  return () => svg.removeEventListener('wheel', handleWheel);
}, [applyZoom]);

  // Панорамирование
  const handleMouseDown = (e) => {
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

    updatePanPosition(newX, newY);
  };

  const handleMouseUp = () => {
    startRef.current = null;
    if (svgRef.current) svgRef.current.style.cursor = isPanningEnabled ? 'grab' : 'default';
  };

  // Тач
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
    
    // Останавливаем панорамирование при начале зума
    startRef.current = null;
  } else if (e.touches.length === 1) {
    startRef.current = { 
      x: e.touches[0].clientX, 
      y: e.touches[0].clientY, 
      translateX, 
      translateY 
    };
  }
};

 // СТАЛО:
const handleTouchMove = (e) => {
  if (e.touches.length === 2 && lastTouchCenter.current) {
    e.preventDefault();
    const center = getTouchCenter(e);
    const dist = Math.hypot(
      e.touches[0].clientX - e.touches[1].clientX,
      e.touches[0].clientY - e.touches[1].clientY
    );
    
    // УЛУЧШАЕМ логику зума для тач-устройств
    if (lastTouchDist.current > 0) {
      const delta = dist / lastTouchDist.current;
      applyZoom(delta, center.x, center.y);
    }
    
    lastTouchDist.current = dist;
    lastTouchCenter.current = center;
  } else if (e.touches.length === 1 && startRef.current) {
    const dx = e.touches[0].clientX - startRef.current.x;
    const dy = e.touches[0].clientY - startRef.current.y;

    const newX = startRef.current.translateX + dx / scale;
    const newY = startRef.current.translateY + dy / scale;

    updatePanPosition(newX, newY);
  }
};

  const handleTouchEnd = () => {
    startRef.current = null;
    lastTouchDist.current = 0;
    lastTouchCenter.current = null;
  };

  // ОБНОВЛЕНО: логика определения цвета зоны
  const getZoneColor = (zoneId) => {
    if (highlightedZone === zoneId) {
      return '#ff6b6b'; // Ярко-красный для подсветки
    }

    const cell = zoneData[zoneId];
    if (!cell) return "#e9ecef"; // нет данных — серый

    const statusRaw = (cell.status || "").toString().trim().toUpperCase();
    const scannedAt = cell.time ? new Date(cell.time) : null;
    const now = new Date();

    // Критический статус
    if (statusRaw.includes("CRITICAL") || statusRaw.includes("CRIT")) return "#f8d7da";

    // Низкий остаток
    if (statusRaw.includes("LOW_STOCK") || statusRaw.includes("LOW")) return "#fff3cd";

    // Если нет времени сканирования
    if (!scannedAt) return "#fff3cd";

    // Если сканирование старше 1 часа
    if (now - scannedAt > 60 * 60 * 1000) return "#fff3cd";

    // Все хорошо
    return "#d4edda";
  };

  // ДОБАВЛЕНО: получение названия статуса зоны
  const getZoneStatusName = (zoneId) => {
    const cell = zoneData[zoneId];
    if (!cell) return "Нет данных";

    const statusRaw = (cell.status || "").toString().trim().toUpperCase();
    
    if (statusRaw.includes("CRITICAL") || statusRaw.includes("CRIT")) return "Критические остатки";
    if (statusRaw.includes("LOW_STOCK") || statusRaw.includes("LOW")) return "Низкий остаток";
    
    const scannedAt = cell.time ? new Date(cell.time) : null;
    const now = new Date();
    
    if (!scannedAt) return "Требует проверки";
    if (now - scannedAt > 60 * 60 * 1000) return "Требует проверки";
    
    return "Проверена недавно";
  };

  const getRobotColor = (status) => {
    return status === 'active' ? '#22c55e'
         : status === 'low_battery' ? '#facc15'
         : '#ef4444';
  };

  // Форматирование времени
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

  // Клик по роботу
  const handleRobotClick = (e, robot) => {
    e.stopPropagation();
    const svg = svgRef.current;
    if (!svg) return;

    const col = Math.floor(robot.x / CELL_SIZE);
    const row = Math.floor(robot.y / CELL_SIZE);
    const robotX = PADDING + col * CELL_SIZE + CELL_SIZE / 2;
    const robotY = PADDING + row * CELL_SIZE + CELL_SIZE / 2;

    const TOOLTIP_WIDTH = 240;
    const TOOLTIP_HEIGHT = 180;

    let tooltipX = robotX + 20;
    let tooltipY = robotY - TOOLTIP_HEIGHT - 15;

    // Если тултип выходит за правую границу - показываем слева от робота
    if (tooltipX + TOOLTIP_WIDTH > MAP_WIDTH) {
      tooltipX = robotX - TOOLTIP_WIDTH - 20;
    }

    // Если тултип выходит за верхнюю границу - показываем под роботом
    if (tooltipY < 15) {
      tooltipY = robotY + 25;
    }

    // Если тултип выходит за нижнюю границу - поднимаем выше
    if (tooltipY + TOOLTIP_HEIGHT > MAP_HEIGHT - 15) {
      tooltipY = MAP_HEIGHT - TOOLTIP_HEIGHT - 15;
    }

    // Гарантируем минимальные отступы от краев
    tooltipX = Math.max(15, Math.min(tooltipX, MAP_WIDTH - TOOLTIP_WIDTH - 15));
    tooltipY = Math.max(15, Math.min(tooltipY, MAP_HEIGHT - TOOLTIP_HEIGHT - 15));

    setTooltip({
      robot,
      svgX: tooltipX,
      svgY: tooltipY,
    });
    setZoneTooltip(null);
  };

  // ОБНОВЛЕНО: обработчик наведения на зону
  const handleZoneMouseEnter = (e, zoneId) => {
    const cell = zoneData[zoneId];
    
    const rect = e.target.getBoundingClientRect();
    const svg = svgRef.current;
    if (!svg) return;

    const svgRect = svg.getBoundingClientRect();
    const zoneX = rect.left - svgRect.left + rect.width / 2;
    const zoneY = rect.top - svgRect.top;

    setZoneTooltip({
      zone: {
        id: zoneId,
        data: cell
      },
      x: zoneX,
      y: zoneY - 10
    });
  };

  const handleZoneMouseLeave = () => {
    setZoneTooltip(null);
  };

  const handleTooltipClick = (e) => {
    e.stopPropagation();
  };

  const handleTooltipMouseDown = (e) => {
    e.stopPropagation();
  };

  useEffect(() => {
    const handleClickOutside = () => {
      setTooltip(null);
      setZoneTooltip(null);
    };
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
      onClick={() => {
        setTooltip(null);
        setZoneTooltip(null);
      }}
    >
      {/* Индикатор загрузки */}
      {loading && (
        <text
          x={MAP_WIDTH / 2}
          y={MAP_HEIGHT / 2}
          textAnchor="middle"
          fontSize="16"
          fill={theme === 'dark' ? '#9ca3af' : '#4b5563'}
        >
          Загрузка данных карты...
        </text>
      )}

      <g ref={viewportRef}>
        {/* зоны с цветовой индикацией */}
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
                onMouseEnter={(e) => handleZoneMouseEnter(e, id)}
                onMouseLeave={handleZoneMouseLeave}
                style={{ cursor: 'pointer' }}
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

      {/* Тултип для зоны */}
      {zoneTooltip && (
        <foreignObject 
          x={zoneTooltip.x}
          y={zoneTooltip.y}
          width="220"
          height="140"
          style={{ 
            pointerEvents: 'none',
          }}
        >
          <div
            className={`p-3 rounded-lg shadow-lg border ${
              theme === 'dark'
                ? 'bg-gray-800 border-gray-700 text-gray-100'
                : 'bg-white border-gray-300 text-gray-900'
            }`}
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="font-bold text-sm">Зона:</span>
              <span className="text-sm font-mono">{zoneTooltip.zone.id}</span>
            </div>
            <div className="flex items-center gap-2 mb-2">
              <span className="font-bold text-sm"> Статус:</span>
              <span className={`px-2 py-1 rounded text-xs font-medium ${
                getZoneStatusName(zoneTooltip.zone.id) === "Критические остатки"
                  ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                  : getZoneStatusName(zoneTooltip.zone.id) === "Низкий остаток" || 
                    getZoneStatusName(zoneTooltip.zone.id) === "Требует проверки"
                  ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
                  : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
              }`}>
                {getZoneStatusName(zoneTooltip.zone.id)}
              </span>
            </div>
            {zoneTooltip.zone.data && (
              <>
                {zoneTooltip.zone.data.product && (
                  <div className="text-xs mb-1">
                    <span className="font-medium">Товар:</span> {zoneTooltip.zone.data.product}
                  </div>
                )}
                {zoneTooltip.zone.data.quantity != null && (
                  <div className="text-xs mb-1">
                    <span className="font-medium">Количество:</span> {zoneTooltip.zone.data.quantity}
                  </div>
                )}
                {zoneTooltip.zone.data.time && (
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                     {formatTime(zoneTooltip.zone.data.time)}
                  </div>
                )}
              </>
            )}
          </div>
        </foreignObject>
      )}

      {/* Тултип для робота */}
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
            height="180"
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
                minHeight: '152px',
                boxSizing: 'border-box'
              }}
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="font-bold text-sm"> Робот ID:</span>
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
              
              <div className="flex items-center gap-2 mb-3">
                <span className="font-bold text-sm"> Батарея:</span>
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
              
              <div className="flex items-center gap-2 mb-3">
                <span className="font-bold text-sm"> Позиция:</span>
                <span className="text-sm font-mono select-text">
                  {String.fromCharCode(65 + Math.floor(tooltip.robot.x / CELL_SIZE))}
                  {Math.floor(tooltip.robot.y / CELL_SIZE) + 1}
                </span>
              </div>
              
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-2 select-text">
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