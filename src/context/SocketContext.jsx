import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const { user, token, isAuthenticated } = useAuth();

  useEffect(() => {
    let newSocket = null;

    if (isAuthenticated && token && user) {
      newSocket = io('http://localhost:3001', {
        auth: {
          token
        }
      });

      newSocket.on('connect', () => {
        console.log('Connected to server');
        setConnected(true);
      });

      newSocket.on('disconnect', () => {
        console.log('Disconnected from server');
        setConnected(false);
      });

      newSocket.on('userListUpdate', (users) => {
        setOnlineUsers(users.filter(u => u.id !== user.id));
      });

      setSocket(newSocket);
    } else {
      setSocket(null);
      setConnected(false);
      setOnlineUsers([]);
    }

    return () => {
      if (newSocket) {
        newSocket.close();
      }
    };
  }, [isAuthenticated, token, user]);

  const value = {
    socket,
    connected,
    onlineUsers
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};
