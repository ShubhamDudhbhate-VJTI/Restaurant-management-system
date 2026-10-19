import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import { Session, Bill, PaymentMethod, OrderWithItems } from '@/contracts';
import { useEffect } from 'react';
import { socket } from '../lib/socket';

export type CashierSession = Session & {
  tableName: string;
  qrToken: string;
  unservedCount: number;
  bill: Bill;
};

export function useCashierSessions() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['cashier-sessions'],
    queryFn: async () => {
      const res = await apiClient.get<{ sessions: CashierSession[] }>('/sessions');
      return res.data;
    },
  });

  const getSessionOrders = async (sessionId: string) => {
    const res = await apiClient.get<{ orders: OrderWithItems[] }>(`/sessions/${sessionId}/orders`);
    return res.data.orders;
  };

  useEffect(() => {
    const handleUpdate = () => {
      queryClient.invalidateQueries({ queryKey: ['cashier-sessions'] });
      queryClient.invalidateQueries({ queryKey: ['tables'] });
    };

    socket.on('session:updated', handleUpdate);
    socket.on('order:status_changed', handleUpdate);
    socket.on('order:created', handleUpdate);

    return () => {
      socket.off('session:updated', handleUpdate);
      socket.off('order:status_changed', handleUpdate);
      socket.off('order:created', handleUpdate);
    };
  }, [queryClient]);

  const payMutation = useMutation({
    mutationFn: async ({ sessionId, method, discountPercent }: { sessionId: string; method: PaymentMethod; discountPercent?: number }) => {
      const res = await apiClient.post(`/sessions/${sessionId}/pay`, { method, discountPercent: discountPercent || 0 });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cashier-sessions'] });
    },
  });

  const forceCloseMutation = useMutation({
    mutationFn: async (sessionId: string) => {
      const res = await apiClient.post(`/sessions/${sessionId}/force-close`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cashier-sessions'] });
    },
  });

  const startSession = useMutation({
    mutationFn: async (tableId: string) => {
      const res = await apiClient.post('/sessions', { tableId });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cashier-sessions'] });
    },
  });

  return {
    ...query,
    getSessionOrders,
    pay: payMutation.mutateAsync,
    isPaying: payMutation.isPending,
    forceClose: forceCloseMutation.mutateAsync,
    isForceClosing: forceCloseMutation.isPending,
    startSession: startSession.mutateAsync,
    isStartingSession: startSession.isPending,
  };
}
