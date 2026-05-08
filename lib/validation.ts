import { z } from 'zod';

export const emailSchema = z.string().trim().toLowerCase().email('Email inválido');

export const passwordSchema = z
  .string()
  .min(8, 'La contraseña debe tener al menos 8 caracteres')
  .max(72, 'La contraseña es demasiado larga');

export const amountSchema = z
  .number({ invalid_type_error: 'El monto debe ser un número' })
  .positive('El monto debe ser mayor a 0')
  .finite('El monto no es válido')
  .max(1_000_000, 'El monto excede el máximo permitido');

export const descriptionSchema = z
  .string()
  .trim()
  .min(1, 'La descripción es obligatoria')
  .max(120, 'La descripción es demasiado larga');

export const expenseCategorySchema = z.enum([
  'entertainment',
  'food_drink',
  'home',
  'life',
  'transportation',
  'uncategorized',
  'utilities',
]);

export const currencyCodeSchema = z
  .string()
  .trim()
  .toUpperCase()
  .length(3, 'El código de moneda debe tener 3 letras');

export const createExpenseSchema = z.object({
  payerId: z.string().uuid('payerId inválido'),
  friendId: z.string().uuid('friendId inválido'),
  amount: amountSchema,
  description: descriptionSchema,
  category: expenseCategorySchema.optional(),
  currencyCode: currencyCodeSchema.optional(),
  date: z.string().optional(),
});

export const settleUpSchema = z.object({
  payerId: z.string().uuid(),
  payeeId: z.string().uuid(),
  amount: amountSchema,
  currencyCode: currencyCodeSchema.default('USD'),
  note: z.string().max(160).optional(),
});

export const signInSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

export const signUpSchema = signInSchema;

export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;
export type SettleUpInput = z.infer<typeof settleUpSchema>;
export type SignInInput = z.infer<typeof signInSchema>;

/**
 * Convierte un input numérico desde un TextInput a número validado.
 * Rechaza NaN y valores no positivos.
 */
export function parseAmountInput(raw: string): number {
  const normalized = raw.replace(',', '.').trim();
  const value = Number.parseFloat(normalized);
  return amountSchema.parse(value);
}
