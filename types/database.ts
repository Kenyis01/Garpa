/**
 * Tipos de la base de datos para el proyecto Garpa.
 * Mantener sincronizado con las migraciones en supabase/migrations.
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

export type Profile = {
  id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  website: string | null;
  email: string | null;
  phone: string | null;
  currency: string | null;
  timezone: string | null;
  language: string | null;
  privacy_searchable: boolean | null;
  updated_at: string | null;
};

export type Group = {
  id: string;
  name: string;
  description: string | null;
  created_by: string;
  created_at: string;
};

export type GroupMember = {
  group_id: string;
  user_id: string;
  created_at: string;
};

export type Expense = {
  id: string;
  group_id: string | null;
  payer_id: string;
  amount: number;
  description: string;
  created_at: string;
  category: ExpenseCategory | null;
  currency_code: string | null;
  date: string | null;
  receipt_url: string | null;
  notes: string | null;
};

export type ExpenseSplit = {
  id: string;
  expense_id: string;
  user_id: string;
  amount: number;
  created_at: string;
};

export type Friendship = {
  id: string;
  user_id_1: string;
  user_id_2: string;
  status: FriendshipStatus;
  created_at: string;
};

export type Settlement = {
  id: string;
  payer_id: string;
  payee_id: string;
  amount: number;
  currency_code: string;
  note: string | null;
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
        Update: Partial<Profile>;
        Relationships: [];
      };
      groups: {
        Row: Group;
        Insert: Omit<Group, 'id' | 'created_at'>;
        Update: Partial<Omit<Group, 'id'>>;
        Relationships: [];
      };
      group_members: {
        Row: GroupMember;
        Insert: GroupMember;
        Update: Partial<GroupMember>;
        Relationships: [];
      };
      expenses: {
        Row: Expense;
        Insert: Omit<Expense, 'id' | 'created_at'>;
        Update: Partial<Omit<Expense, 'id'>>;
        Relationships: [];
      };
      expense_splits: {
        Row: ExpenseSplit;
        Insert: Omit<ExpenseSplit, 'id' | 'created_at'>;
        Update: Partial<Omit<ExpenseSplit, 'id'>>;
        Relationships: [];
      };
      friendships: {
        Row: Friendship;
        Insert: Omit<Friendship, 'id' | 'created_at'>;
        Update: Partial<Omit<Friendship, 'id'>>;
        Relationships: [];
      };
      settlements: {
        Row: Settlement;
        Insert: Omit<Settlement, 'id' | 'created_at'>;
        Update: Partial<Omit<Settlement, 'id'>>;
        Relationships: [];
      };
    };
    Views: { [_ in never]: never };
    Functions: {
      create_expense_with_splits: {
        Args: {
          p_payer_id: string;
          p_friend_id: string;
          p_amount: number;
          p_description: string;
          p_category: ExpenseCategory;
          p_currency_code: string;
          p_date: string;
        };
        Returns: Expense;
      };
    };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
};
