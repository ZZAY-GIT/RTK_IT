import { useEffect, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { setWebsocketStatus, updateDashboardFromWebSocket } from '../../../store/warehouseSlice';

const WS_URL = 'ws://localhost:8000/api/ws/dashboard'; // Измени на свой URL если нужно

export function useWarehouseWebSocket(enabled = true) {
  const dispatch = useDispatch();
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const pingIntervalRef = useRef(null);

  useEffect(() => {
    if (!enabled) {
      // Если disabled, закрываем соединение если оно есть
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (pingIntervalRef.current) {
        clearInterval(pingIntervalRef.current);
      }
      return;
    }

    function connect() {
      try {
        const ws = new WebSocket(WS_URL);
        wsRef.current = ws;

        ws.onopen = () => {
          console.log('✅ WebSocket connected');
          dispatch(setWebsocketStatus('connected'));
          
          // Отправляем ping каждые 25 секунд для keep-alive
          pingIntervalRef.current = setInterval(() => {
            if (ws.readyState === WebSocket.OPEN) {
              ws.send('ping');
            }
          }, 25000);
        };

        ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            
            switch (message.type) {
              case 'initial_data':
              case 'dashboard_update':
                // Обновляем Redux store
                dispatch(updateDashboardFromWebSocket(message.data));
                break;
                
              case 'ping':
                // Отвечаем на ping от сервера
                ws.send('pong');
                break;
                
              case 'pong':
                // Сервер ответил на наш ping
                break;
                
              default:
                console.log('Unknown message type:', message.type);
            }
          } catch (error) {
            console.error('Error parsing WebSocket message:', error);
          }
        };

        ws.onerror = (error) => {
          console.error('❌ WebSocket error:', error);
          dispatch(setWebsocketStatus('error'));
        };

        ws.onclose = () => {
          console.log('🔌 WebSocket disconnected');
          dispatch(setWebsocketStatus('disconnected'));
          
          // Очищаем ping interval
          if (pingIntervalRef.current) {
            clearInterval(pingIntervalRef.current);
            pingIntervalRef.current = null;
          }
          
          // Переподключаемся через 3 секунды только если enabled
          if (enabled) {
            reconnectTimeoutRef.current = setTimeout(() => {
              console.log('🔄 Reconnecting...');
              dispatch(setWebsocketStatus('reconnecting'));
              connect();
            }, 3000);
          }
        };
      } catch (error) {
        console.error('Error creating WebSocket:', error);
        dispatch(setWebsocketStatus('error'));
      }
    }

    connect();

    // Cleanup
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (pingIntervalRef.current) {
        clearInterval(pingIntervalRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [dispatch, enabled]);

  return wsRef.current;
}