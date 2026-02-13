import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';

import { supabase } from '@/lib';

type AuthContextValue = {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signInWithOtp: (email: string) => Promise<void>;
  signInWithPassword: (email: string, password: string) => Promise<void>;
  signUpWithPassword: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

type AuthProviderProps = {
  children: ReactNode;
};

export function AuthProvider({ children }: AuthProviderProps) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (!mounted) return;
        setSession(data.session ?? null);
        setLoading(false);
      })
      .catch(() => {
        if (!mounted) return;
        setLoading(false);
      });

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });

    return () => {
      mounted = false;
      subscription.subscription.unsubscribe();
    };
  }, []);

  const value: AuthContextValue = {
    session,
    user: session?.user ?? null,
    loading,
    async signInWithOtp(email: string) {
      setLoading(true);
      try {
        const { error } = await supabase.auth.signInWithOtp({ email });
        if (error) throw error;
      } finally {
        setLoading(false);
      }
    },
    async signInWithPassword(email: string, password: string) {
      setLoading(true);
      try {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } finally {
        setLoading(false);
      }
    },
    async signUpWithPassword(email: string, password: string) {
      setLoading(true);
      try {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
      } finally {
        setLoading(false);
      }
    },
    async signOut() {
      setLoading(true);
      try {
        await supabase.auth.signOut();
      } finally {
        setLoading(false);
      }
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return ctx;
}

