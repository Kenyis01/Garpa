/**
 * Variables de entorno para Supabase.
 * En desarrollo, usa .env (no se sube a git).
 * En EAS Build, configúralas en eas.json o en el dashboard de Expo.
 */

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  if (__DEV__) {
    console.warn(
      'Missing EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY. Create a .env file with these values.'
    );
  }
}

export const env = {
  supabase: {
    url: SUPABASE_URL ?? '',
    anonKey: SUPABASE_ANON_KEY ?? '',
  },
} as const;
