import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import type { OrderWithItems, CreateOrderInput, Bill } from '@/contracts';
import { useEffect } from 'react';
import { socket } from '../lib/socket';
import { SocketEvents } from '@/contracts';

export function useOrders() {
  const queryClient = useQueryClient();

  const ordersQuery = useQuery<OrderWithItems[]>({
    queryKey: ['orders', 'me'],
    queryFn: async () => {
      const res = await apiClient.get<{ orders: OrderWithItems[] }>('/orders/me');
      return res.data.orders;
    }
  });

  const billQuery = useQuery<Bill>({
    queryKey: ['orders', 'me', 'bill'],
    queryFn: async () => {
      const res = await apiClient.get<{ bill: Bill }>('/orders/me/bill');
      return res.data.bill;
    }
  });

  useEffect(() => {
    const handleUpdate = () => {
      queryClient.invalidateQueries({ queryKey: ['orders', 'me'] });
      queryClient.invalidateQueries({ queryKey: ['orders', 'me', 'bill'] });
    };

    socket.on(SocketEvents.ORDER_CREATED, handleUpdate);
    socket.on(SocketEvents.ORDER_STATUS_CHANGED, handleUpdate);
    return () => {
      socket.off(SocketEvents.ORDER_CREATED, handleUpdate);
      socket.off(SocketEvents.ORDER_STATUS_CHANGED, handleUpdate);
    };
  }, [queryClient]);

  const placeOrder = useMutation({
    mutationFn: async (data: CreateOrderInput) => {
      await apiClient.post('/orders', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders', 'me'] });
      queryClient.invalidateQueries({ queryKey: ['orders', 'me', 'bill'] });
    }
  });

  const cancelOrder = useMutation({
    mutationFn: async (orderId: string) => {
      await apiClient.post(`/orders/${orderId}/cancel`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders', 'me'] });
      queryClient.invalidateQueries({ queryKey: ['orders', 'me', 'bill'] });
    }
  });

  return {
    orders: ordersQuery.data,
    isLoadingOrders: ordersQuery.isLoading,
    ordersError: ordersQuery.error,
    bill: billQuery.data,
    isLoadingBill: billQuery.isLoading,
    billError: billQuery.error,
    placeOrder,
    cancelOrder
  };
}
