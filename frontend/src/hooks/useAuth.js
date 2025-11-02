// src/hooks/useAuth.js
import { useState, useEffect } from 'react';

// Синхронная функция — читает сразу
const getStoredUser = () => {
  const localUser = localStorage.getItem('user');
  const sessionUser = sessionStorage.getItem('user');
  return localUser ? JSON.parse(localUser) : sessionUser ? JSON.parse(sessionUser) : null;
};

export function useAuth() {
  const [user, setUser] = useState(getStoredUser()); // ← сразу читаем

  useEffect(() => {
    const handleStorage = () => {
      setUser(getStoredUser());
    };

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    setUser(null);
  };

  return { user, logout, setUser };
}