/**
 * Tipos de la base de datos para el proyecto Garpa.
 * Mantener sincronizado con el esquema Supabase.
 */

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type ExpenseCategory =
  | 'entertainment'
  | 'food_drink'
  | 'home'
  | 'life'
  | 'transportation'
  | 'uncategorized'
  | 'utilities';

export type FriendshipStatus = 'pending' | 'accepted' | 'blocked';

export type Recurrence = 'never' | 'weekly' | 'biweekly' | 'monthly' | 'yearly';

export type GroupRole = 'admin' | 'member';

export type Profile = {
  id: string;
  full_name: string | null;
  email: string | null;
  avatar_url: string | null;
  username: string | null;
  website: string | null;
  phone: string | null;
  currency: string;
  language: string;
  timezone: string | null;
  privacy_searchable: boolean;
  updated_at: string | null;
  created_at: string;
};

export type Friendship = {
  id: string;
  user_id_1: string;
  user_id_2: string;
  status: FriendshipStatus;
  created_at: string;
};

export type Group = {
  id: string;
  name: string;
  description: string | null;
  type: string | null;
  created_by: string;
  created_at: string;
};

export type GroupMember = {
  id: string;
  group_id: string;
  user_id: string;
  role: GroupRole;
  created_at: string;
};

export type Expense = {
  id: string;
  description: string;
  amount: number;
  currency_code: string;
  date: string | null;
  category: ExpenseCategory | string | null;
  notes: string | null;
  receipt_url: string | null;
  recurrence: Recurrence;
  payer_id: string;
  group_id: string | null;
  is_settlement: boolean;
  created_at: string;
};

export type ExpenseSplit = {
  id: string;
  expense_id: string;
  user_id: string;
  amount: number;
  created_at: string;
};

export type ExpenseParticipant = ExpenseSplit;

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: '12';
  };
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Partial<Profile> & { id: string };
        Update: Partial<Omit<Profile, 'id' | 'created_at'>>;
        Relationships: [];
      };
      friendships: {
        Row: Friendship;
        Insert: Omit<Friendship, 'id' | 'created_at'>;
        Update: Partial<Pick<Friendship, 'status'>>;
        Relationships: [];
      };
      groups: {
        Row: Group;
        Insert: Omit<Group, 'id' | 'created_at'>;
        Update: Partial<Pick<Group, 'name' | 'description' | 'type'>>;
        Relationships: [];
      };
      group_members: {
        Row: GroupMember;
        Insert: Omit<GroupMember, 'id' | 'created_at'>;
        Update: Partial<Pick<GroupMember, 'role'>>;
        Relationships: [];
      };
      expenses: {
        Row: Expense;
        Insert: Omit<Expense, 'id' | 'created_at'>;
        Update: Partial<Omit<Expense, 'id' | 'created_at' | 'payer_id'>>;
        Relationships: [];
      };
      expense_splits: {
        Row: ExpenseSplit;
        Insert: Omit<ExpenseSplit, 'id' | 'created_at'>;
        Update: Partial<Pick<ExpenseSplit, 'amount'>>;
        Relationships: [];
      };
    };
    Views: { [_ in never]: never };
    Functions: { [_ in never]: never };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
};
