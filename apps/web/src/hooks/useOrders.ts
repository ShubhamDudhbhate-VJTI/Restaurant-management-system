import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import { OrderWithItems, CreateOrderInput, Bill, PaymentMethod } from '@/contracts';
import { useEffect } from 'react';
import { socket } from '../lib/socket';
import { SocketEvents } from '@/contracts';
import { feedbackApi } from '../api/feedback';

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
    socket.on('session:updated', handleUpdate);

    return () => {
      socket.off(SocketEvents.ORDER_CREATED, handleUpdate);
      socket.off(SocketEvents.ORDER_STATUS_CHANGED, handleUpdate);
      socket.off('session:updated', handleUpdate);
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

  const payMutation = useMutation({
    mutationFn: async ({ method }: { method: PaymentMethod }) => {
      // For customer, we assume they pay for their current session
      const res = await apiClient.post('/orders/me/pay', { method, discountPercent: 0 });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders', 'me'] });
      queryClient.invalidateQueries({ queryKey: ['orders', 'me', 'bill'] });
      queryClient.invalidateQueries({ queryKey: ['orders', 'history'] });
    }
  });

  const historyQuery = useQuery<OrderWithItems[]>({
    queryKey: ['orders', 'history'],
    queryFn: async () => {
      const res = await apiClient.get<{ orders: OrderWithItems[] }>('/orders/history');
      return res.data.orders;
    }
  });

  return {
    orders: ordersQuery.data,
    isLoadingOrders: ordersQuery.isLoading,
    ordersError: ordersQuery.error,
    bill: billQuery.data,
    isLoadingBill: billQuery.isLoading,
    billError: billQuery.error,
    history: historyQuery.data,
    isLoadingHistory: historyQuery.isLoading,
    placeOrder,
    cancelOrder,
    pay: payMutation.mutateAsync,
    isPaying: payMutation.isPending,
    requestBill: useMutation({
      mutationFn: async () => {
        await apiClient.post('/sessions/request-bill');
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['orders', 'me'] });
      }
    }).mutateAsync,
    submitFeedback: useMutation({
      mutationFn: async (data: Parameters<typeof feedbackApi.create>[0]) => feedbackApi.create(data),
    }).mutateAsync
  };
}
