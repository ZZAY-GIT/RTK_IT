// src/components/NotificationsPanel.jsx
import React from 'react';

const NotificationsPanel = ({ 
  notifications, 
  unreadCount, 
  onMarkAsRead, 
  onMarkAllAsRead, 
  onClearAll,
  onClearRead, // ДОБАВЛЕНО
  onNotificationClick,
  isOpen,
  onClose 
}) => {
  if (!isOpen) return null;

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'critical': return '🔴';
      case 'warning': return '🟡';
      case 'info': return '🔵';
      default: return 'ℹ️';
    }
  };

  const getNotificationStyle = (type) => {
    switch (type) {
      case 'critical': return 'border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800';
      case 'warning': return 'border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20 dark:border-yellow-800';
      case 'info': return 'border-blue-200 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-800';
      default: return 'border-gray-200 bg-gray-50 dark:bg-gray-800 dark:border-gray-700';
    }
  };

  const hasReadNotifications = notifications.some(n => n.read);
  const hasUnreadNotifications = notifications.some(n => !n.read);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Overlay */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />
      
      {/* Panel */}
      <div className="absolute right-0 top-0 h-full w-96 max-w-full bg-white dark:bg-gray-800 shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
              Уведомления
            </h2>
            {unreadCount > 0 && (
              <span className="px-2 py-1 text-xs font-medium bg-red-500 text-white rounded-full">
                {unreadCount}
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            {hasUnreadNotifications && (
              <button
                onClick={onMarkAllAsRead}
                className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
              >
                Прочитать все
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Notifications List */}
        <div className="h-full overflow-y-auto pb-20">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-gray-500 dark:text-gray-400">
              <div className="text-2xl mb-2">🔔</div>
              <p>Нет уведомлений</p>
            </div>
          ) : (
            <div className="p-2 space-y-2">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-3 rounded-lg border cursor-pointer transition-all hover:shadow-md ${
                    getNotificationStyle(notification.type)
                  } ${notification.read ? 'opacity-60' : ''}`}
                  onClick={() => onNotificationClick(notification)}
                >
                  <div className="flex items-start gap-3">
                    <div className="text-lg">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-medium text-sm text-gray-800 dark:text-gray-100 truncate">
                          {notification.title}
                        </h3>
                        {!notification.read && (
                          <div className="w-2 h-2 bg-red-500 rounded-full" />
                        )}
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-300 mb-2">
                        {notification.message}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {notification.timestamp.toLocaleTimeString('ru-RU', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onMarkAsRead(notification.id);
                          }}
                          className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                        >
                          {notification.read ? 'Прочитано' : 'Прочитать'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {notifications.length > 0 && (
          <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 space-y-2">
            {hasReadNotifications && (
              <button
                onClick={onClearRead}
                className="w-full py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 border border-gray-200 dark:border-gray-700 rounded-lg transition-colors"
              >
                Очистить прочитанные
              </button>
            )}
            <button
              onClick={onClearAll}
              className="w-full py-2 text-sm text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 border border-red-200 dark:border-red-800 rounded-lg transition-colors"
            >
              Очистить все
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationsPanel;