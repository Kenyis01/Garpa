import { supabase } from '@/lib';
import type { Group } from '@/types';

/** Obtiene todos los grupos en los que participa un usuario. */
export async function getUserGroups(userId: string) {
  const { data, error } = await supabase
    .from('groups')
    .select('*')
    .eq('created_by', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as Group[];
}

type CreateGroupInput = Pick<Group, 'name' | 'description'> & {
  created_by: string;
};

/** Crea un nuevo grupo. */
export async function createGroup(input: CreateGroupInput) {
  const { data, error } = await supabase
    .from('groups')
    .insert({
      name: input.name,
      description: input.description,
      created_by: input.created_by,
    })
    .select()
    .single();

  if (error) throw error;
  return data as Group;
}
