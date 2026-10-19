import { useEffect } from 'react';
import { socket } from '../lib/socket';
import { SocketEvents, OrderStatus } from '@/contracts';
import { useToast } from './ui/toast';
import { useAuth } from '../hooks/useAuth';

export function NotificationHandler() {
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    const handleOrderStatusChanged = (data: { orderId: string, status: OrderStatus, actorRole?: string }) => {
      if (data.status === OrderStatus.CANCELLED) {
        toast(`Order #${data.orderId.slice(-4)} has been CANCELLED.`, 'error');
      } else if (data.status === OrderStatus.READY) {
         toast(`Order #${data.orderId.slice(-4)} is READY for service.`, 'success');
      }
    };

    socket.on(SocketEvents.ORDER_STATUS_CHANGED, handleOrderStatusChanged);

    return () => {
      socket.off(SocketEvents.ORDER_STATUS_CHANGED, handleOrderStatusChanged);
    };
  }, [user, toast]);

  return null;
}
