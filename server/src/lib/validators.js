import { z } from 'zod';

export const createTransactionSchema = z.object({
  amount: z.coerce.number().positive('Amount must be greater than 0'),
  category: z.string().min(1, 'Category is required').max(40),
  date: z.coerce.date().optional(),
  note: z.string().max(140).optional().nullable(),
});

export const listTransactionsSchema = z.object({
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  category: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(50).optional().default(20),
  cursor: z.string().optional(),
});

export const statsSchema = z.object({
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
});

export const createCategorySchema = z.object({
  name: z.string().min(1).max(40),
  color: z
    .string()
    .regex(/^#([0-9a-fA-F]{3}){1,2}$/, 'color must be a hex code like #6366F1'),
});
