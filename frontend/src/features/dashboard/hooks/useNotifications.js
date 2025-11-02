// src/hooks/useNotifications.js
import { useState, useCallback, useEffect, useRef } from 'react';

export const useNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const timeoutsRef = useRef(new Map()); // Храним таймауты для каждого уведомления

  // Очистка таймаутов при размонтировании
  useEffect(() => {
    return () => {
      timeoutsRef.current.forEach((timeout) => clearTimeout(timeout));
      timeoutsRef.current.clear();
    };
  }, []);

  // Добавление нового уведомления
  const addNotification = useCallback((notification) => {
    const newNotification = {
      id: Date.now() + Math.random(), // Добавляем случайность для уникальности
      timestamp: new Date(),
      read: false,
      ...notification
    };

    setNotifications(prev => {
      // Проверяем, нет ли уже такого уведомления
      const isDuplicate = prev.some(n => 
        n.zoneId === notification.zoneId && 
        n.type === notification.type &&
        !n.read
      );
      
      if (isDuplicate) {
        return prev; // Не добавляем дубликат
      }
      
      return [newNotification, ...prev];
    });

    setUnreadCount(prev => prev + 1);

    // Автоматическое скрытие через 10 секунд
    const timeoutId = setTimeout(() => {
      removeNotification(newNotification.id);
    }, 10000);

    timeoutsRef.current.set(newNotification.id, timeoutId);

    return newNotification.id;
  }, []);

  // Удаление уведомления
  const removeNotification = useCallback((id) => {
    // Очищаем таймаут
    if (timeoutsRef.current.has(id)) {
      clearTimeout(timeoutsRef.current.get(id));
      timeoutsRef.current.delete(id);
    }

    setNotifications(prev => {
      const notification = prev.find(n => n.id === id);
      const newNotifications = prev.filter(n => n.id !== id);
      
      // Обновляем счетчик только если уведомление не было прочитано
      if (notification && !notification.read) {
        setUnreadCount(prevCount => Math.max(0, prevCount - 1));
      }
      
      return newNotifications;
    });
  }, []);

  // Отметка как прочитанное
  const markAsRead = useCallback((id) => {
    setNotifications(prev => {
      const updatedNotifications = prev.map(notification =>
        notification.id === id ? { ...notification, read: true } : notification
      );
      
      // Находим уведомление которое отмечаем как прочитанное
      const markedNotification = prev.find(n => n.id === id);
      if (markedNotification && !markedNotification.read) {
        setUnreadCount(prevCount => Math.max(0, prevCount - 1));
      }
      
      return updatedNotifications;
    });
  }, []);

  // Отметка всех как прочитанные
  const markAllAsRead = useCallback(() => {
    setNotifications(prev => {
      // Считаем сколько непрочитанных уведомлений
      const unreadNotifications = prev.filter(n => !n.read);
      
      if (unreadNotifications.length > 0) {
        setUnreadCount(0);
        return prev.map(notification => ({ ...notification, read: true }));
      }
      
      return prev;
    });
  }, []);

  // Очистка всех уведомлений
  const clearAll = useCallback(() => {
    // Очищаем все таймауты
    timeoutsRef.current.forEach((timeout) => clearTimeout(timeout));
    timeoutsRef.current.clear();
    
    setNotifications([]);
    setUnreadCount(0);
  }, []);

  // Очистка только прочитанных уведомлений
  const clearRead = useCallback(() => {
    setNotifications(prev => {
      const unreadNotifications = prev.filter(n => !n.read);
      
      // Очищаем таймауты для удаляемых уведомлений
      prev.forEach(notification => {
        if (notification.read && timeoutsRef.current.has(notification.id)) {
          clearTimeout(timeoutsRef.current.get(notification.id));
          timeoutsRef.current.delete(notification.id);
        }
      });
      
      setUnreadCount(unreadNotifications.length);
      return unreadNotifications;
    });
  }, []);

  return {
    notifications,
    unreadCount,
    addNotification,
    removeNotification,
    markAsRead,
    markAllAsRead,
    clearAll,
    clearRead
  };
};