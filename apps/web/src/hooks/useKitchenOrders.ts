import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import type { OrderWithItems, OrderStatus } from '@/contracts';
import { useEffect } from 'react';
import { socket } from '../lib/socket';
import { SocketEvents } from '@/contracts';

export function useKitchenOrders() {
  const queryClient = useQueryClient();

  const ordersQuery = useQuery<OrderWithItems[]>({
    queryKey: ['orders', 'active'],
    queryFn: async () => {
      const res = await apiClient.get<{ orders: OrderWithItems[] }>('/orders');
      return res.data.orders;
    }
  });

  useEffect(() => {
    const handleUpdate = () => {
      queryClient.invalidateQueries({ queryKey: ['orders', 'active'] });
    };

    socket.on(SocketEvents.ORDER_CREATED, handleUpdate);
    socket.on(SocketEvents.ORDER_STATUS_CHANGED, handleUpdate);
    socket.on(SocketEvents.SESSION_UPDATED, handleUpdate);
    return () => {
      socket.off(SocketEvents.ORDER_CREATED, handleUpdate);
      socket.off(SocketEvents.ORDER_STATUS_CHANGED, handleUpdate);
      socket.off(SocketEvents.SESSION_UPDATED, handleUpdate);
    };
  }, [queryClient]);

  const updateStatus = useMutation({
    mutationFn: async ({ orderId, status }: { orderId: string, status: OrderStatus }) => {
      if (status === 'cancelled') {
        await apiClient.post(`/orders/${orderId}/cancel`);
      } else {
        await apiClient.patch(`/orders/${orderId}/status`, { status });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders', 'active'] });
    }
  });

  return {
    orders: ordersQuery.data,
    isLoading: ordersQuery.isLoading,
    error: ordersQuery.error,
    updateStatus
  };
}
