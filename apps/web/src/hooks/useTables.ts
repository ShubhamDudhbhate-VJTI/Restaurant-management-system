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
    
    const handleUpdate = (payload: { table?: Table; deletedId?: string }) => {
      queryClient.setQueryData(['tables'], (oldData: { tables: Table[] } | undefined) => {
        if (!oldData) return oldData;
        if (payload.deletedId) {
          return { tables: oldData.tables.filter(t => t.id !== payload.deletedId) };
        }
        if (payload.table) {
          const exists = oldData.tables.find(t => t.id === payload.table!.id);
          if (exists) {
            return { tables: oldData.tables.map(t => t.id === payload.table!.id ? payload.table! : t) };
          } else {
            return { tables: [...oldData.tables, payload.table!] };
          }
        }
        return oldData;
      });
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
