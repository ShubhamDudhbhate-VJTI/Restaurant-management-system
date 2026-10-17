import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tablesApi } from '../api/tables';
import { useEffect } from 'react';
import { socket } from '../lib/socket';
import { SocketEvents, Table } from '@/contracts';

export const useTables = () => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['tables'],
    queryFn: tablesApi.getAll,
  });

  // Listen for real-time updates
  useEffect(() => {
    socket.connect();
    
    const handleUpdate = (payload: any) => {
      // Handle both { table } and direct Table objects for robustness
      const tableUpdate = payload.table || (payload.id ? payload : null);
      const deletedId = payload.deletedId;

      queryClient.setQueryData(['tables'], (oldData: { tables: Table[] } | undefined) => {
        if (!oldData) return oldData;
        if (deletedId) {
          return { tables: oldData.tables.filter(t => t.id !== deletedId) };
        }
        if (tableUpdate) {
          const exists = oldData.tables.find(t => t.id === tableUpdate.id);
          if (exists) {
            return { tables: oldData.tables.map(t => t.id === tableUpdate.id ? tableUpdate : t) };
          } else {
            return { tables: [...oldData.tables, tableUpdate] };
          }
        }
        return oldData;
      });

      // Also invalidate to be safe
      queryClient.invalidateQueries({ queryKey: ['tables'] });
    };

    socket.on(SocketEvents.TABLE_UPDATED, handleUpdate);

    return () => {
      socket.off(SocketEvents.TABLE_UPDATED, handleUpdate);
    };
  }, [queryClient]);

  const createMutation = useMutation({
    mutationFn: tablesApi.create,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof tablesApi.update>[1] }) => tablesApi.update(id, data),
  });

  const deleteMutation = useMutation({
    mutationFn: tablesApi.delete,
  });

  return {
    ...query,
    create: createMutation.mutateAsync,
    update: updateMutation.mutateAsync,
    delete: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
};
