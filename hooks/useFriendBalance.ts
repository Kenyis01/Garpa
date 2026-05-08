import { getBalanceWithFriend } from '@/lib/expenses';
import { queryKeys } from '@/lib/queryClient';
import { useQuery } from '@tanstack/react-query';

export function useFriendBalance(userId: string | undefined, friendId: string) {
  return useQuery({
    queryKey: queryKeys.balanceWith(userId ?? 'anon', friendId),
    enabled: Boolean(userId && friendId),
    queryFn: async () => {
      const result = await getBalanceWithFriend(userId!, friendId);
      if (!result.success) throw result.error;
      return result.data;
    },
  });
}
