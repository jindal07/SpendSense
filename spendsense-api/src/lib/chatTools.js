import { getDb } from './db.js';

export const CHAT_TOOL_DECLARATIONS = [
  {
    name: 'get_spending_summary',
    description: 'Total spending and per-category breakdown for a date range (ISO dates)',
    parametersJsonSchema: {
      type: 'object',
      properties: {
        from: { type: 'string', description: 'Start date YYYY-MM-DD' },
        to: { type: 'string', description: 'End date YYYY-MM-DD' },
      },
      required: ['from', 'to'],
    },
  },
  {
    name: 'get_top_merchants',
    description: 'Top spending categories or notes by total amount',
    parametersJsonSchema: {
      type: 'object',
      properties: {
        from: { type: 'string' },
        to: { type: 'string' },
        n: { type: 'number', description: 'How many results, default 5' },
      },
      required: ['from', 'to'],
    },
  },
  {
    name: 'compare_months',
    description: 'Compare total spending month over month for the last N months',
    parametersJsonSchema: {
      type: 'object',
      properties: {
        months: { type: 'number', description: 'Number of months to compare, default 3' },
      },
    },
  },
  {
    name: 'get_unusual_transactions',
    description: 'Find transactions unusually high for their category',
    parametersJsonSchema: {
      type: 'object',
      properties: {
        from: { type: 'string' },
        to: { type: 'string' },
      },
      required: ['from', 'to'],
    },
  },
  {
    name: 'list_recurring_charges',
    description: 'Detect likely recurring subscriptions or bills',
    parametersJsonSchema: { type: 'object', properties: {} },
  },
];

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}/;

function validateDateArg(val) {
  if (!val || typeof val !== 'string') return null;
  if (!ISO_DATE_RE.test(val)) return null;
  const d = new Date(val);
  if (isNaN(d.getTime())) return null;
  return val;
}

function safeDateRange(args) {
  const from = validateDateArg(args.from);
  const to = validateDateArg(args.to);
  if (!from || !to) {
    return { error: 'Invalid date range. Use YYYY-MM-DD format.' };
  }
  if (new Date(from) > new Date(to)) {
    return { error: '"from" date must be before "to" date.' };
  }
  return { from, to };
}

export async function executeChatTool(name, args, userId) {
  const sql = getDb();
  const n = Math.min(Math.max(parseInt(args.n, 10) || 5, 1), 20);
  const months = Math.min(Math.max(parseInt(args.months, 10) || 3, 1), 12);

  switch (name) {
    case 'get_spending_summary': {
      const range = safeDateRange(args);
      if (range.error) return range;
      const byCat = await sql`
        SELECT category, SUM(amount)::float8 AS total, COUNT(*)::int AS count
        FROM transactions
        WHERE user_id = ${userId}
          AND date >= ${range.from}::timestamptz
          AND date <= ${range.to}::timestamptz
        GROUP BY category
        ORDER BY total DESC
      `;
      const total = byCat.reduce((s, r) => s + Number(r.total), 0);
      return {
        from: range.from,
        to: range.to,
        total,
        count: byCat.reduce((s, r) => s + r.count, 0),
        byCategory: byCat,
      };
    }

    case 'get_top_merchants': {
      const range = safeDateRange(args);
      if (range.error) return range;
      const rows = await sql`
        SELECT COALESCE(NULLIF(note, ''), category) AS label,
               SUM(amount)::float8 AS total,
               COUNT(*)::int AS count
        FROM transactions
        WHERE user_id = ${userId}
          AND date >= ${range.from}::timestamptz
          AND date <= ${range.to}::timestamptz
        GROUP BY label
        ORDER BY total DESC
        LIMIT ${n}
      `;
      return { from: range.from, to: range.to, items: rows };
    }

    case 'compare_months': {
      const from = new Date();
      from.setMonth(from.getMonth() - months);
      const rows = await sql`
        SELECT TO_CHAR(date_trunc('month', date), 'YYYY-MM') AS month,
               SUM(amount)::float8 AS total,
               COUNT(*)::int AS count
        FROM transactions
        WHERE user_id = ${userId}
          AND date >= ${from.toISOString()}::timestamptz
        GROUP BY date_trunc('month', date)
        ORDER BY month ASC
      `;
      return { months: rows };
    }

    case 'get_unusual_transactions': {
      const range = safeDateRange(args);
      if (range.error) return range;
      const rows = await sql`
        WITH stats AS (
          SELECT category, AVG(amount) AS avg_amt, STDDEV(amount) AS std_amt
          FROM transactions
          WHERE user_id = ${userId}
            AND date >= ${range.from}::timestamptz
            AND date <= ${range.to}::timestamptz
          GROUP BY category
          HAVING COUNT(*) >= 2
        )
        SELECT t.id, t.amount, t.category, t.date, t.note
        FROM transactions t
        JOIN stats s ON s.category = t.category
        WHERE t.user_id = ${userId}
          AND t.date >= ${range.from}::timestamptz
          AND t.date <= ${range.to}::timestamptz
          AND t.amount > s.avg_amt + COALESCE(s.std_amt, 0) * 2
        ORDER BY t.amount DESC
        LIMIT 10
      `;
      return { items: rows };
    }

    case 'list_recurring_charges': {
      const rows = await sql`
        SELECT category,
               ROUND(AVG(amount)::numeric, 2)::float8 AS avg_amount,
               COUNT(*)::int AS occurrences,
               MAX(date) AS last_date
        FROM transactions
        WHERE user_id = ${userId}
          AND date >= NOW() - INTERVAL '90 days'
        GROUP BY category, ROUND(amount::numeric, 0)
        HAVING COUNT(*) >= 2
        ORDER BY occurrences DESC
        LIMIT 15
      `;
      return { recurring: rows };
    }

    default:
      return { error: `Unknown tool: ${name}` };
  }
}
