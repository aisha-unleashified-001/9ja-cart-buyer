import React from 'react';
import { X, Info, CheckCircle, AlertTriangle, AlertCircle } from 'lucide-react';
import { cn } from '../../lib/utils';
import type { Notification } from '../../hooks/useNotification';

interface ToastProps {
  notification: Notification;
  onClose: (id: string) => void;
}

const iconMap = {
  info: Info,
  success: CheckCircle,
  warning: AlertTriangle,
  error: AlertCircle,
};

const colorMap = {
  info: 'bg-blue-50 border-blue-200 text-blue-800',
  success: 'bg-green-50 border-green-200 text-green-800',
  warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
  error: 'bg-red-50 border-red-200 text-red-800',
};

export const Toast: React.FC<ToastProps> = ({ notification, onClose }) => {
  const Icon = iconMap[notification.type];
  
  return (
    <div className={cn(
      'flex items-center gap-3 p-4 rounded-lg border shadow-sm',
      'animate-in slide-in-from-right-full duration-300',
      colorMap[notification.type]
    )}>
      <Icon className="w-5 h-5 flex-shrink-0" />
      <p className="flex-1 text-sm font-medium">
        {notification.message}
      </p>
      <button
        onClick={() => onClose(notification.id)}
        className="flex-shrink-0 p-1 rounded hover:bg-black/10 transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

interface ToastContainerProps {
  notifications: Notification[];
  onClose: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ 
  notifications, 
  onClose 
}) => {
  if (notifications.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm w-full">
      {notifications.map((notification) => (
        <Toast
          key={notification.id}
          notification={notification}
          onClose={onClose}
        />
      ))}
    </div>
  );
};