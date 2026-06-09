import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

// 检测是否在 Render 环境
const isRender = window.location.hostname.includes('onrender.com');

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [connected, setConnected] = useState(false);
  const { user } = useAuth();

  const connectSocket = useCallback(() => {
    if (!user) return;

    const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || '';
    
    // Render 环境使用 polling，本地使用 websocket
    const transports = isRender ? ['polling'] : ['websocket', 'polling'];
    
    const newSocket = io(SOCKET_URL, {
      transports,
      secure: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
      reconnectionDelayMax: 10000,
      timeout: 20000
    });
    
    newSocket.on('connect', () => {
      console.log('Socket connected, id:', newSocket.id);
      setConnected(true);
      const token = localStorage.getItem('token');
      newSocket.emit('user_online', { userId: user.userId, token });
    });

    newSocket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
      setConnected(false);
    });

    newSocket.on('connect_error', (err) => {
      console.error('Socket connection error:', err.message);
      setConnected(false);
    });

    newSocket.on('friend_online', ({ userId }) => {
      console.log('Friend online:', userId);
      setOnlineUsers(prev => new Set([...prev, userId]));
    });

    newSocket.on('friend_offline', ({ userId }) => {
      console.log('Friend offline:', userId);
      setOnlineUsers(prev => {
        const next = new Set(prev);
        next.delete(userId);
        return next;
      });
    });

    setSocket(newSocket);

    return newSocket;
  }, [user]);

  useEffect(() => {
    if (!user) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setConnected(false);
      }
      return;
    }

    const newSocket = connectSocket();

    // Render 环境：定期重新连接保持活跃
    let reconnectInterval;
    if (isRender) {
      reconnectInterval = setInterval(() => {
        if (!newSocket.connected) {
          console.log('Attempting to reconnect...');
          newSocket.connect();
        }
      }, 30000); // 每30秒检查一次
    }

    return () => {
      if (reconnectInterval) clearInterval(reconnectInterval);
      newSocket.disconnect();
    };
  }, [user, connectSocket]);

  return (
    <SocketContext.Provider value={{ socket, onlineUsers, connected }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
