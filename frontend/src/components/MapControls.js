// src/components/MapControls.jsx
import React from 'react';

const MapControls = ({ onZoomIn, onZoomOut, onReset, scale, theme = 'light' }) => {
  return (
    <div className="flex items-center gap-2">
      <div className="flex gap-1 bg-white dark:bg-gray-800 p-1.5 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <button
          onClick={onZoomIn}
          className="w-8 h-8 flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white rounded transition text-lg font-bold"
          title="Приблизить"
        >
          +
        </button>
        <button
          onClick={onZoomOut}
          className={`w-8 h-8 flex items-center justify-center rounded transition text-lg font-bold ${
            scale <= 1.0 
              ? 'bg-gray-400 text-gray-600 cursor-not-allowed' 
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
          title="Отдалить"
          disabled={scale <= 1.0}
        >
          −
        </button>
      </div>
      
      <button
        onClick={onReset}
        className="px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded transition shadow-sm"
        title="Сброс масштаба"
      >
        Сброс
      </button>
    </div>
  );
};

export default MapControls;