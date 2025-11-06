import React from 'react';
import { Wifi, WifiOff, RefreshCw, AlertCircle } from 'lucide-react';
import { Badge } from '../UI';
import { useCart } from '../../hooks/useCart';
import { useAuthStore } from '../../store/useAuthStore';

interface CartSyncStatusProps {
  className?: string;
}

const CartSyncStatus: React.FC<CartSyncStatusProps> = ({ className }) => {
  const { isAuthenticated } = useAuthStore();
  const { isLoading, error } = useCart();

  if (!isAuthenticated) {
    return (
      <Badge variant="outline" className={className}>
        <WifiOff className="w-3 h-3 mr-1" />
        Local Cart
      </Badge>
    );
  }

  if (error) {
    return (
      <Badge variant="destructive" className={className}>
        <AlertCircle className="w-3 h-3 mr-1" />
        Error
      </Badge>
    );
  }

  if (isLoading) {
    return (
      <Badge variant="outline" className={`${className} text-blue-600 border-blue-200`}>
        <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
        Loading...
      </Badge>
    );
  }

  if (isAuthenticated) {
    return (
      <Badge variant="outline" className={`${className} text-green-600 border-green-200`}>
        <Wifi className="w-3 h-3 mr-1" />
        Server Cart
      </Badge>
    );
  }

  return (
    <Badge variant="outline" className={className}>
      <WifiOff className="w-3 h-3 mr-1" />
      Local Cart
    </Badge>
  );
};

export default CartSyncStatus;