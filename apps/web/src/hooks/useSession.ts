import { useQuery } from '@tanstack/react-query';
import { sessionsApi } from '../api/sessions';

export const useSession = () => {
  const query = useQuery({
    queryKey: ['session', 'me'],
    queryFn: sessionsApi.getMe,
    retry: false
  });

  return {
    ...query,
    session: query.data?.session || null,
  };
};
