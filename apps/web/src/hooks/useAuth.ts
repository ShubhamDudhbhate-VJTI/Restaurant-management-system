import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { authApi } from '../api/auth';

export const useAuth = () => {
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ['me'],
    queryFn: authApi.getMe,
    retry: false, // Don't retry if unauthenticated
    staleTime: 5 * 60 * 1000,
  });

  const loginMutation = useMutation({
    mutationFn: authApi.login,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['me'], refetchType: 'active' });
      await queryClient.refetchQueries({ queryKey: ['me'], type: 'active' });
    },
  });

  const signupMutation = useMutation({
    mutationFn: authApi.signup,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['me'], refetchType: 'active' });
      await queryClient.refetchQueries({ queryKey: ['me'], type: 'active' });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: authApi.logout,
    onSuccess: () => {
      queryClient.setQueryData(['me'], null);
    },
  });

  return {
    user: data?.user || null,
    isLoading,
    error,
    login: loginMutation.mutateAsync,
    signup: signupMutation.mutateAsync,
    logout: logoutMutation.mutateAsync,
    isLoggingIn: loginMutation.isPending,
    isSigningUp: signupMutation.isPending,
    isLoggingOut: logoutMutation.isPending,
  };
};
