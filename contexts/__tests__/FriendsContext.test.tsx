import { act, renderHook } from '@testing-library/react-native';
import type { ReactNode } from 'react';
import { FriendsProvider, useFriends } from '../FriendsContext';

jest.mock('expo-crypto', () => ({
  randomUUID: () => '00000000-0000-4000-8000-000000000000',
}));

function wrapper({ children }: { children: ReactNode }) {
  return <FriendsProvider>{children}</FriendsProvider>;
}

describe('FriendsContext', () => {
  it('addFriends dedupes by id', () => {
    const { result } = renderHook(() => useFriends(), { wrapper });

    act(() => {
      result.current.addFriends([
        { id: '1', name: 'Ada', phone: '111' },
        { id: '2', name: 'Bea', phone: '222' },
      ]);
      result.current.addFriends([{ id: '2', name: 'Bea', phone: '222' }]);
    });

    expect(result.current.friends).toHaveLength(2);
  });

  it('addExpense bumps balance by half the amount', () => {
    const { result } = renderHook(() => useFriends(), { wrapper });

    act(() => {
      result.current.addFriends([{ id: '1', name: 'Ada', phone: '111' }]);
    });
    act(() => {
      result.current.addExpense('1', 'pizza', 30);
    });

    expect(result.current.friends[0].balance).toBe(15);
    expect(result.current.friends[0].expenses).toHaveLength(1);
  });

  it('setBalance overrides balance', () => {
    const { result } = renderHook(() => useFriends(), { wrapper });
    act(() => {
      result.current.addFriends([{ id: '1', name: 'Ada', phone: '111' }]);
    });
    act(() => {
      result.current.setBalance('1', 7.5);
    });
    expect(result.current.friends[0].balance).toBe(7.5);
  });

  it('removeFriend removes by id', () => {
    const { result } = renderHook(() => useFriends(), { wrapper });
    act(() => {
      result.current.addFriends([
        { id: '1', name: 'Ada', phone: '111' },
        { id: '2', name: 'Bea', phone: '222' },
      ]);
    });
    act(() => {
      result.current.removeFriend('1');
    });
    expect(result.current.friends.map((f) => f.id)).toEqual(['2']);
  });
});
