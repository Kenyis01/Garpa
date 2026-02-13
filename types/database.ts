/**
 * Tipos para el proyecto G garpa clone.
 * Actualizado para coincidir con el esquema SQL extendido (Fase 2).
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type ExpenseCategory = 
  | 'entertainment' 
  | 'food_drink' 
  | 'home' 
  | 'life' 
  | 'transportation' 
  | 'uncategorized' 
  | 'utilities';

/** Perfil de usuario (public.profiles) */
export interface Profile {
  id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  website: string | null;
  email: string | null; // A veces útil tenerlo aquí si lo sincronizas
  
  // Nuevos campos de configuración
  phone: string | null;
  currency: string | null; // ej: 'USD', 'ARS'
  timezone: string | null;
  language: string | null;
  privacy_searchable: boolean | null;
  
  updated_at: string | null;
}

/** Grupo (public.groups) */
export interface Group {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  // created_by: string; // Opcional, depende de si agregaste esta columna en tu SQL inicial
}

/** Miembros de grupo (public.group_members) */
export interface GroupMember {
  group_id: string;
  user_id: string;
  created_at: string;
  // role: 'admin' | 'member'; // Si decides implementar roles
}

/** Gastos (public.expenses) */
export interface Expense {
  id: string;
  group_id: string | null; // Puede ser null si es un gasto entre amigos sin grupo
  payer_id: string;
  amount: number;
  description: string;
  created_at: string;
  
  // Campos nuevos Fase 2
  category: ExpenseCategory | null;
  currency_code: string | null;
  date: string | null; // Fecha del gasto (puede ser distinta al created_at)
  receipt_url: string | null;
  notes: string | null;
}

/** Divisiones de gasto (public.expense_splits) */
export interface ExpenseSplit {
  id: string;
  expense_id: string;
  user_id: string;
  amount: number; // Cuánto le corresponde pagar a este usuario
}

/** Amistades (public.friendships) */
export interface Friendship {
  id: string;
  user_id_1: string;
  user_id_2: string;
  status: 'pending' | 'accepted' | 'blocked';
  created_at: string;
}

/** DEFINICIÓN MAESTRA DE LA BASE DE DATOS */
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Profile; // En insert permitimos pasar todo, aunque algunos sean opcionales
        Update: Partial<Profile>; // En update todo es opcional
      };
      groups: {
        Row: Group;
        Insert: Omit<Group, 'id' | 'created_at'>;
        Update: Partial<Omit<Group, 'id'>>;
      };
      group_members: {
        Row: GroupMember;
        Insert: GroupMember;
        Update: Partial<GroupMember>;
      };
      expenses: {
        Row: Expense;
        Insert: Omit<Expense, 'id' | 'created_at'>;
        Update: Partial<Omit<Expense, 'id'>>;
      };
      expense_splits: {
        Row: ExpenseSplit;
        Insert: Omit<ExpenseSplit, 'id'>;
        Update: Partial<Omit<ExpenseSplit, 'id'>>;
      };
      friendships: {
        Row: Friendship;
        Insert: Omit<Friendship, 'id' | 'created_at'>;
        Update: Partial<Omit<Friendship, 'id'>>;
      };
    };
  };
}