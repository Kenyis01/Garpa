import { supabase } from '@/lib';
import { logError } from '@/lib/logger';
import type { ServiceResult } from '@/lib/expenses';
import { settleUpSchema, type SettleUpInput } from '@/lib/validation';
import type { Settlement } from '@/types';

/** Crea una liquidación entre dos usuarios. */
export async function createSettlement(input: SettleUpInput): Promise<ServiceResult<Settlement>> {
  const parsed = settleUpSchema.safeParse(input);
  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? 'Datos inválidos';
    return { success: false, error: new Error(message) };
  }

  const { payerId, payeeId, amount, currencyCode, note } = parsed.data;

  try {
    const { data, error } = await supabase
      .from('settlements')
      .insert({
        payer_id: payerId,
        payee_id: payeeId,
        amount,
        currency_code: currencyCode,
        note: note ?? null,
      })
      .select()
      .single();

    if (error) throw error;
    if (!data) throw new Error('Settlement not created');
    return { success: true, data };
  } catch (err) {
    const error = err instanceof Error ? err : new Error('Unknown error');
    logError('createSettlement', error, { payerId, payeeId, amount });
    return { success: false, error };
  }
}

/** Lista las liquidaciones entre dos usuarios. */
export async function listSettlementsBetween(
  userA: string,
  userB: string,
): Promise<ServiceResult<Settlement[]>> {
  try {
    const { data, error } = await supabase
      .from('settlements')
      .select('*')
      .or(
        `and(payer_id.eq.${userA},payee_id.eq.${userB}),and(payer_id.eq.${userB},payee_id.eq.${userA})`,
      )
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { success: true, data: data ?? [] };
  } catch (err) {
    const error = err instanceof Error ? err : new Error('Unknown error');
    logError('listSettlementsBetween', error, { userA, userB });
    return { success: false, error };
  }
}
