import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 5 * 60_000,
      retry: 2,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
    },
  },
});

export const queryKeys = {
  balanceWith: (userId: string, friendId: string) => ['balance', userId, friendId] as const,
  expensesWith: (userId: string, friendId: string) => ['expenses', userId, friendId] as const,
  settlementsBetween: (userId: string, friendId: string) =>
    ['settlements', userId, friendId] as const,
};
