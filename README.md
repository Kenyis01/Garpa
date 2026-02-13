# 💸 Garpa (Expo + Supabase)

Construido para gestionar gastos compartidos entre amigos y grupos. Esta aplicación utiliza un sistema de navegación basado en archivos y una arquitectura de servicios desacoplada para garantizar escalabilidad y facilidad de mantenimiento.

## 🚀 Tecnologías Principales

- **Framework:** [Expo](https://expo.dev/) (Managed Workflow)
- **Navegación:** [Expo Router](https://docs.expo.dev/router/introduction/) (v3)
- **Base de Datos & Auth:** [Supabase](https://supabase.com/)
- **Lenguaje:** TypeScript
- **Estado Global:** React Context API

---

## 📂 Estructura de Carpetas

- **`app/`**: Pantallas y lógica de navegación (File-based routing).
  - `(tabs)/`: Contiene la barra de navegación inferior (Amigos, Grupos, Actividad, Cuenta).
  - `(auth)/`: Flujos de inicio de sesión y registro.
  - `add-friends.tsx`, `add-expense.tsx`: Pantallas raíz que actúan como modales de pantalla completa.
- **`components/`**: Componentes reutilizables.
  - `ui/`: Componentes atómicos (Botones, Wrappers) sin lógica de negocio.
  - `AddExpenseModal.tsx`, etc.: Componentes con lógica específica de la app.
- **`constants/`**: Tokens de diseño como la paleta de colores global (`Colors.ts`).
- **`contexts/`**: Estado global de la aplicación.
  - `AuthContext.tsx`: Manejo de sesión de Supabase.
  - `FriendsContext.tsx`: Manejo de la lista de amigos y balances.
- **`hooks/`**: Hooks personalizados (ej. `useAuth`) para consumir contextos de forma simplificada.
- **`lib/`**: Configuración de clientes externos. Destaca `supabaseClient.ts` con soporte para Web y Mobile.
- **`services/`**: Capa de abstracción de datos para interactuar con las tablas de Supabase (`expenses.ts`, `groups.ts`).
- **`types/`**: Definiciones e interfaces de TypeScript para el dominio y el esquema de la DB.

---

## ⚙️ Conexión a la Base de Datos (Supabase)

### 1. Variables de Entorno
Crea un archivo `.env` en la raíz del proyecto (este archivo está ignorado en Git) y define las siguientes variables:

```env
EXPO_PUBLIC_SUPABASE_URL=[https://TU-PROJECT.supabase.co](https://TU-PROJECT.supabase.co)
EXPO_PUBLIC_SUPABASE_ANON_KEY=TU_ANON_KEY

### 2. Cliente de Supabase
El cliente se encuentra en lib/supabaseClient.ts y puede ser importado en cualquier parte de la aplicación:

import { supabaseClient } from '@/lib/supabaseClient';

// Ejemplo de uso:
const { data, error } = await supabaseClient.from('groups').select('*');

### 3. Autenticación
El AuthProvider envuelve toda la aplicación en el archivo raíz app/_layout.tsx. Para acceder a la sesión, utiliza el hook personalizado:

import { useAuth } from '@/hooks';

const { user, session, loading, signOut } = useAuth();