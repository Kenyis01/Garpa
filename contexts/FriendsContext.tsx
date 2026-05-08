import { randomUUID } from 'expo-crypto';
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

export type LocalExpense = {
  id: string;
  description: string;
  amount: number;
  date: string;
  payerId: 'user' | string;
};

export type Friend = {
  id: string;
  name: string;
  phone: string;
  email?: string;
  balance: number;
  avatar_url?: string;
  expenses: LocalExpense[];
};

type ContactInput = Pick<Friend, 'id' | 'name' | 'phone' | 'email'>;

type FriendsContextValue = {
  friends: Friend[];
  addFriends: (contacts: ContactInput[]) => void;
  removeFriend: (friendId: string) => void;
  addExpense: (friendId: string, description: string, amount: number) => void;
  setBalance: (friendId: string, balance: number) => void;
};

const FriendsContext = createContext<FriendsContextValue | undefined>(undefined);

export function FriendsProvider({ children }: { children: ReactNode }) {
  const [friends, setFriends] = useState<Friend[]>([]);

  const addFriends = useCallback((contacts: ContactInput[]) => {
    setFriends((prev) => {
      const existingIds = new Set(prev.map((f) => f.id));
      const newcomers: Friend[] = contacts
        .filter((c) => !existingIds.has(c.id))
        .map((c) => ({
          id: c.id,
          name: c.name,
          phone: c.phone,
          email: c.email,
          balance: 0,
          avatar_url: undefined,
          expenses: [],
        }));
      return [...prev, ...newcomers];
    });
  }, []);

  const removeFriend = useCallback((friendId: string) => {
    setFriends((prev) => prev.filter((f) => f.id !== friendId));
  }, []);

  const addExpense = useCallback((friendId: string, description: string, amount: number) => {
    setFriends((prev) =>
      prev.map((f) => {
        if (f.id !== friendId) return f;
        const expense: LocalExpense = {
          id: randomUUID(),
          description,
          amount,
          date: new Date().toISOString(),
          payerId: 'user',
        };
        return {
          ...f,
          expenses: [expense, ...f.expenses],
          balance: f.balance + amount / 2,
        };
      }),
    );
  }, []);

  const setBalance = useCallback((friendId: string, balance: number) => {
    setFriends((prev) => prev.map((f) => (f.id === friendId ? { ...f, balance } : f)));
  }, []);

  const value = useMemo<FriendsContextValue>(
    () => ({ friends, addFriends, removeFriend, addExpense, setBalance }),
    [friends, addFriends, removeFriend, addExpense, setBalance],
  );

  return <FriendsContext.Provider value={value}>{children}</FriendsContext.Provider>;
}

export function useFriends() {
  const ctx = useContext(FriendsContext);
  if (!ctx) {
    throw new Error('useFriends must be used within a FriendsProvider');
  }
  return ctx;
}
