import { useAuth } from '@/hooks/useAuth';
import {
  addFriend,
  FriendWithBalance,
  getFriendsWithBalances,
  removeFriendship,
} from '@/services/friends';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';

type FriendsContextValue = {
  friends: FriendWithBalance[];
  loading: boolean;
  refreshFriends: () => Promise<void>;
  addFriendById: (friendId: string) => Promise<void>;
  removeFriend: (friendshipId: string) => Promise<void>;
};

const FriendsContext = createContext<FriendsContextValue | undefined>(undefined);

export function FriendsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [friends, setFriends] = useState<FriendWithBalance[]>([]);
  const [loading, setLoading] = useState(false);

  const refreshFriends = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await getFriendsWithBalances(user.id);
      setFriends(data);
    } catch (err) {
      console.error('Error loading friends:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    refreshFriends();
  }, [refreshFriends]);

  async function addFriendById(friendId: string) {
    if (!user) return;
    await addFriend(user.id, friendId);
    await refreshFriends();
  }

  async function removeFriend(friendshipId: string) {
    await removeFriendship(friendshipId);
    setFriends((prev) => prev.filter((f) => f.friendshipId !== friendshipId));
  }

  return (
    <FriendsContext.Provider
      value={{ friends, loading, refreshFriends, addFriendById, removeFriend }}
    >
      {children}
    </FriendsContext.Provider>
  );
}

export function useFriends() {
  const ctx = useContext(FriendsContext);
  if (!ctx) throw new Error('useFriends must be used within a FriendsProvider');
  return ctx;
}
