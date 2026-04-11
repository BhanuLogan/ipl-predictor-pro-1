import { useQuery } from '@tanstack/react-query';
import { api } from './api';
import { IPL_SCHEDULE, type Match } from './data';

export function useMatches(): Match[] {
  const { data } = useQuery({
    queryKey: ['matches'],
    queryFn: () => api.getMatches(),
    staleTime: 60 * 60 * 1000, // 1 hour
    initialData: IPL_SCHEDULE,
  });
  return (data || IPL_SCHEDULE) as Match[];
}
