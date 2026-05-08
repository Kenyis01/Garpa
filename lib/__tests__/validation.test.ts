import {
  amountSchema,
  createExpenseSchema,
  emailSchema,
  parseAmountInput,
  signInSchema,
} from '../validation';

describe('validation', () => {
  describe('amountSchema', () => {
    it('accepts positive numbers', () => {
      expect(amountSchema.parse(12.5)).toBe(12.5);
    });

    it('rejects zero or negative', () => {
      expect(() => amountSchema.parse(0)).toThrow();
      expect(() => amountSchema.parse(-1)).toThrow();
    });

    it('rejects non-finite', () => {
      expect(() => amountSchema.parse(Number.POSITIVE_INFINITY)).toThrow();
      expect(() => amountSchema.parse(Number.NaN)).toThrow();
    });
  });

  describe('emailSchema', () => {
    it('lowercases and trims', () => {
      expect(emailSchema.parse('  Foo@Bar.COM ')).toBe('foo@bar.com');
    });

    it('rejects invalid', () => {
      expect(() => emailSchema.parse('not-email')).toThrow();
    });
  });

  describe('parseAmountInput', () => {
    it('parses comma as decimal', () => {
      expect(parseAmountInput('12,50')).toBe(12.5);
    });

    it('throws on invalid', () => {
      expect(() => parseAmountInput('abc')).toThrow();
      expect(() => parseAmountInput('-3')).toThrow();
    });
  });

  describe('signInSchema', () => {
    it('requires password >= 8', () => {
      const r = signInSchema.safeParse({ email: 'a@b.com', password: 'short' });
      expect(r.success).toBe(false);
    });
  });

  describe('createExpenseSchema', () => {
    it('requires uuids', () => {
      const r = createExpenseSchema.safeParse({
        payerId: 'not-uuid',
        friendId: 'also-not-uuid',
        amount: 10,
        description: 'pizza',
      });
      expect(r.success).toBe(false);
    });

    it('accepts a valid payload', () => {
      const r = createExpenseSchema.safeParse({
        payerId: '11111111-1111-4111-8111-111111111111',
        friendId: '22222222-2222-4222-8222-222222222222',
        amount: 25,
        description: 'pizza',
      });
      expect(r.success).toBe(true);
    });
  });
});
