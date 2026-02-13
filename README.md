# My G garpa App (Expo + Supabase)

Clon simplificado de G garpa construido con **Expo**, **expo-router** y **Supabase**.

## Estructura de carpetas

- `app/`: pantallas y navegación (file-based routing de expo-router).
- `components/`: componentes reutilizables de UI.
- `constants/`: constantes globales (colores, etc.).
- `contexts/`:
  - `AuthContext.tsx`: contexto de autenticación (sesión de Supabase).
  - `index.ts`: re-exporta `AuthProvider` y `useAuthContext`.
- `hooks/`:
  - `useAuth.ts`: hook para consumir el contexto de auth.
  - `index.ts`: re-exporta hooks.
- `lib/`:
  - `env.ts`: lectura de variables de entorno (`EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`).
  - `supabase.ts`: cliente de Supabase tipado.
  - `index.ts`: re-exporta `supabase` y `env`.
- `services/`:
  - `groups.ts`: funciones para trabajar con la tabla `groups`.
  - `expenses.ts`: funciones para la tabla `expenses`.
  - `index.ts`: re-exporta servicios.
- `types/`:
  - `database.ts`: tipos de dominio y schema de Supabase.
  - `index.ts`: re-exporta tipos.

## Conexión a la base de datos (Supabase)

1. **Variables de entorno**

   En el archivo `.env` (no se sube a git) define:

   ```env
   EXPO_PUBLIC_SUPABASE_URL=https://TU-PROJECT.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=TU_ANON_KEY
   ```

2. **Cliente de Supabase**

   El cliente está en `lib/supabase.ts` y se importa desde cualquier parte así:

   ```ts
   import { supabase } from '@/lib';

   const { data, error } = await supabase.from('groups').select('*');
   ```

3. **Autenticación**

   - El `AuthProvider` envuelve toda la app en `app/_layout.tsx`.
   - Usa el hook `useAuth` para acceder a la sesión:

   ```ts
   import { useAuth } from '@/hooks';

   const { user, session, loading, signInWithOtp, signOut } = useAuth();
   ```

## Scripts

- `npm start`: inicia el proyecto en Expo.
- `npm run android`: corre en Android.
- `npm run ios`: corre en iOS.
- `npm run web`: corre en web.

