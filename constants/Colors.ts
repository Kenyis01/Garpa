const tintColorLight = '#5BC5A7'; // El verde Splitwise
const tintColorDark = '#fff';

export default {
  light: {
    text: '#000',
    background: '#fff',
    tint: tintColorLight,
    tabIconDefault: '#ccc',
    tabIconSelected: tintColorLight,
    border: '#e5e7eb',
    danger: '#ef4444', // Rojo para errores o borrar
    inputBackground: '#f9fafb',
  },
  dark: {
    text: '#fff',
    background: '#000',
    tint: tintColorDark,
    tabIconDefault: '#ccc',
    tabIconSelected: tintColorDark,
    border: '#27272a',
    danger: '#ef4444',
    inputBackground: '#18181b',
  },
  // Colores semánticos (independientes del tema)
  brand: {
    primary: '#5BC5A7',
    secondary: '#4338ca',
    muted: '#6b7280',
    orange: '#FF652F', // Para "Settle up"
  }
};