export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export interface Profile {
  id: string;
  full_name: string | null;
  email: string | null;
  avatar_url: string | null;
  currency: string;
  language: string;
  privacy_searchable: boolean;
  created_at: string;
}

export interface Friendship {
  id: string;
  user_id_1: string;
  user_id_2: string;
  status: 'pending' | 'accepted' | 'blocked';
  created_at: string;
}

export interface Group {
  id: string;
  name: string;
  description: string | null;
  type: string | null;
  created_by: string;
  created_at: string;
}

export interface GroupMember {
  id: string;
  group_id: string;
  user_id: string;
  role: 'admin' | 'member';
  created_at: string;
}

export interface Expense {
  id: string;
  description: string;
  amount: number;
  currency_code: string;
  date: string | null;
  category: string | null;
  notes: string | null;
  receipt_url: string | null;
  recurrence: 'never' | 'weekly' | 'biweekly' | 'monthly' | 'yearly';
  payer_id: string;
  group_id: string | null;
  is_settlement: boolean;
  created_at: string;
}

export interface ExpenseSplit {
  id: string;
  expense_id: string;
  user_id: string;
  amount: number;
  created_at: string;
}

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Omit<Profile, 'created_at' | 'currency' | 'language' | 'privacy_searchable'>;
        Update: Partial<Omit<Profile, 'id' | 'created_at'>>;
      };
      friendships: {
        Row: Friendship;
        Insert: Omit<Friendship, 'id' | 'created_at'>;
        Update: Partial<Pick<Friendship, 'status'>>;
      };
      groups: {
        Row: Group;
        Insert: Omit<Group, 'id' | 'created_at'>;
        Update: Partial<Pick<Group, 'name' | 'description' | 'type'>>;
      };
      group_members: {
        Row: GroupMember;
        Insert: Omit<GroupMember, 'id' | 'created_at'>;
        Update: Partial<Pick<GroupMember, 'role'>>;
      };
      expenses: {
        Row: Expense;
        Insert: Omit<Expense, 'id' | 'created_at'>;
        Update: Partial<Omit<Expense, 'id' | 'created_at' | 'payer_id'>>;
      };
      expense_splits: {
        Row: ExpenseSplit;
        Insert: Omit<ExpenseSplit, 'id' | 'created_at'>;
        Update: Partial<Pick<ExpenseSplit, 'amount'>>;
      };
    };
  };
}
