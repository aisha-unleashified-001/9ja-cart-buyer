import React, { createContext, useContext } from 'react';
import { useNotification } from '../hooks/useNotification';
import { ToastContainer } from '../components/UI';
import type { Notification } from '../hooks/useNotification';

interface NotificationContextType {
  notifications: Notification[];
  showNotification: (message: string, type?: Notification['type'], duration?: number) => string;
  removeNotification: (id: string) => void;
  clearAll: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotificationContext = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotificationContext must be used within NotificationProvider');
  }
  return context;
};

interface NotificationProviderProps {
  children: React.ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const notificationHook = useNotification();

  return (
    <NotificationContext.Provider value={notificationHook}>
      {children}
      <ToastContainer 
        notifications={notificationHook.notifications}
        onClose={notificationHook.removeNotification}
      />
    </NotificationContext.Provider>
  );
};