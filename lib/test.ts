import { supabase } from './supabase';

export async function testConnection() {
  const result = await supabase.from('profiles').select('*').limit(1);
  console.log('Test result:', result);
  return result;
}
