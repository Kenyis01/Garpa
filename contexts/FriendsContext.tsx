import React, { createContext, useContext, useState, type ReactNode } from 'react';

// 1. Definimos qué es un Gasto
export type Expense = {
  id: string;
  description: string;
  amount: number;
  date: string;
  payerId: 'user' | string;
};

type Friend = {
  id: string;
  name: string;
  phone: string;
  email?: string;
  balance: number; 
  avatar_url?: string;
  expenses: Expense[]; // <--- Agregamos el historial aquí
};

type FriendsContextValue = {
  friends: Friend[];
  addFriends: (contacts: { id: string; name: string; phone: string; email?: string }[]) => void;
  removeFriend: (friendId: string) => void;
  // Cambiamos updateBalance por addExpense, que es más completo
  addExpense: (friendId: string, description: string, amount: number) => void;
};

const FriendsContext = createContext<FriendsContextValue | undefined>(undefined);

export function FriendsProvider({ children }: { children: ReactNode }) {
  const [friends, setFriends] = useState<Friend[]>([]);

  function addFriends(contacts: { id: string; name: string; phone: string; email?: string }[]) {
    const newFriends: Friend[] = contacts.map((contact) => ({
      id: contact.id,
      name: contact.name,
      phone: contact.phone,
      email: contact.email,
      balance: 0,
      avatar_url: undefined,
      expenses: [], // Empiezan sin gastos
    }));

    setFriends((prevFriends) => {
      const existingIds = new Set(prevFriends.map((f) => f.id));
      const uniqueNewFriends = newFriends.filter((f) => !existingIds.has(f.id));
      return [...prevFriends, ...uniqueNewFriends];
    });
  }

  function removeFriend(friendId: string) {
    setFriends((prevFriends) => prevFriends.filter((f) => f.id !== friendId));
  }

  // ESTA ES LA FUNCIÓN MÁGICA NUEVA
  function addExpense(friendId: string, description: string, amount: number) {
    setFriends((prevFriends) =>
      prevFriends.map((f) => {
        if (f.id === friendId) {
          const newExpense: Expense = {
            id: Math.random().toString(36).substr(2, 9),
            description,
            amount,
            date: new Date().toISOString(),
            payerId: 'user',
          };
          
          return {
            ...f,
            expenses: [newExpense, ...f.expenses], // Agregamos al historial
            balance: f.balance + (amount / 2), // Sumamos la mitad al saldo
          };
        }
        return f;
      })
    );
  }

  const value: FriendsContextValue = {
    friends,
    addFriends,
    removeFriend,
    addExpense, // La exportamos
  };

  return <FriendsContext.Provider value={value}>{children}</FriendsContext.Provider>;
}

export function useFriends() {
  const ctx = useContext(FriendsContext);
  if (!ctx) {
    throw new Error('useFriends must be used within a FriendsProvider');
  }
  return ctx;
}