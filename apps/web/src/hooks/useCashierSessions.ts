import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import { Session, Bill, PaymentMethod } from '@/contracts';
import { useEffect } from 'react';
import { socket } from '../lib/socket';

export type CashierSession = Session & {
  tableName: string;
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

  useEffect(() => {
    const handleSessionUpdated = () => {
      queryClient.invalidateQueries({ queryKey: ['cashier-sessions'] });
    };

    socket.on('session:updated', handleSessionUpdated);
    socket.on('order:status_changed', handleSessionUpdated);
    socket.on('order:created', handleSessionUpdated);

    return () => {
      socket.off('session:updated', handleSessionUpdated);
      socket.off('order:status_changed', handleSessionUpdated);
      socket.off('order:created', handleSessionUpdated);
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

  return {
    ...query,
    pay: payMutation.mutateAsync,
    isPaying: payMutation.isPending,
    forceClose: forceCloseMutation.mutateAsync,
    isForceClosing: forceCloseMutation.isPending,
  };
}
