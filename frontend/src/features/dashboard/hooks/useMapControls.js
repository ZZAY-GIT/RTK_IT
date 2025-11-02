// src/hooks/useMapControls.js
import { useState, useCallback } from 'react';

export const useMapControls = (initialScale = 1) => {
  const [mapControls, setMapControls] = useState({
    scale: initialScale,
    translateX: 0,
    translateY: -180,
    isPanningEnabled: false
  });

  const zoomIn = useCallback((clientX = null, clientY = null) => {
    setMapControls(prev => {
      const newScale = Math.min(prev.scale * 1.25, 5);
      return {
        ...prev,
        scale: newScale,
        isPanningEnabled: newScale > 1
      };
    });
  }, []);

  const zoomOut = useCallback((clientX = null, clientY = null) => {
    setMapControls(prev => {
      if (prev.scale <= 1.0) return prev;
      const newScale = Math.max(prev.scale * 0.8, 1);
      return {
        ...prev,
        scale: newScale,
        isPanningEnabled: newScale > 1
      };
    });
  }, []);

  const reset = useCallback(() => {
    setMapControls({
      scale: 1,
      translateX: 0,
      translateY: -180,
      isPanningEnabled: false
    });
  }, []);

  // СТАЛО в useMapControls.js:
// СТАЛО:
const updatePan = useCallback((...args) => {
  // ПОДДЕРЖИВАЕМ РАЗНЫЕ ФОРМАТЫ ВЫЗОВА:
  if (args.length === 1 && typeof args[0] === 'object') {
    // Формат: updatePan({ translateX, translateY, scale })
    const newControls = args[0];
    setMapControls(prev => ({
      ...prev,
      ...newControls
    }));
  } else if (args.length === 2) {
    // Формат: updatePan(x, y)
    const [translateX, translateY] = args;
    setMapControls(prev => ({
      ...prev,
      translateX,
      translateY
    }));
  } else if (args.length === 3) {
    // Формат: updatePan(x, y, scale)
    const [translateX, translateY, scale] = args;
    setMapControls(prev => ({
      ...prev,
      translateX,
      translateY,
      scale
    }));
  }
}, []);

  return {
    mapControls,
    zoomIn,
    zoomOut,
    reset,
    updatePan,
    setMapControls
  };
};