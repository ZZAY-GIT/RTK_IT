// src/hooks/useMapControls.js
import { useState, useCallback } from 'react';

export const useMapControls = (initialScale = 1) => {
  const [mapControls, setMapControls] = useState({
    scale: initialScale,
    translateX: 0,
    translateY: -70,
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
      translateY: -70,
      isPanningEnabled: false
    });
  }, []);

  const updatePan = useCallback((translateX, translateY) => {
    setMapControls(prev => ({
      ...prev,
      translateX,
      translateY
    }));
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