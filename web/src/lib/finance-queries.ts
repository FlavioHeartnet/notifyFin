import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database.types';

const POSTGREST_PAGE_SIZE = 1000;

export interface RawLedgerTransaction {
  id: number;
  account_id: number;
  occurred_on: string;
  amount: number;
  direction: string;
  economic_effect: string;
  is_spending: boolean;
  is_own_transfer: boolean;
}

/**
 * Fetches ALL rows from financial_transactions paginating past PostgREST's
 * 1,000-row default ceiling so every KPI and account total reflects 100% of
 * financial_transactions (the single source of truth).
 */
export async function fetchAllLedgerTransactions(
  supabase: SupabaseClient<Database>
): Promise<RawLedgerTransaction[]> {
  const all: RawLedgerTransaction[] = [];
  let from = 0;

  while (true) {
    const { data, error } = await supabase
      .from('financial_transactions')
      .select(
        'id, account_id, occurred_on, amount, direction, economic_effect, is_spending, is_own_transfer'
      )
      .order('id', { ascending: true })
      .range(from, from + POSTGREST_PAGE_SIZE - 1);

    if (error || !data || data.length === 0) {
      break;
    }

    for (const row of data) {
      all.push({
        id: row.id,
        account_id: row.account_id,
        occurred_on: row.occurred_on,
        amount: Number(row.amount ?? 0),
        direction: row.direction,
        economic_effect: row.economic_effect,
        is_spending: Boolean(row.is_spending),
        is_own_transfer: Boolean(row.is_own_transfer),
      });
    }

    if (data.length < POSTGREST_PAGE_SIZE) {
      break;
    }
    from += POSTGREST_PAGE_SIZE;
  }

  return all;
}

export interface RawAllocationRow {
  transaction_id: number;
  category_id: number;
  amount: number;
}

export async function fetchAllTransactionAllocations(
  supabase: SupabaseClient<Database>
): Promise<RawAllocationRow[]> {
  const all: RawAllocationRow[] = [];
  let from = 0;

  while (true) {
    const { data, error } = await supabase
      .from('transaction_allocations')
      .select('transaction_id, category_id, amount')
      .order('id', { ascending: true })
      .range(from, from + POSTGREST_PAGE_SIZE - 1);

    if (error || !data || data.length === 0) {
      break;
    }

    for (const row of data) {
      all.push({
        transaction_id: row.transaction_id,
        category_id: row.category_id,
        amount: Number(row.amount ?? 0),
      });
    }

    if (data.length < POSTGREST_PAGE_SIZE) {
      break;
    }
    from += POSTGREST_PAGE_SIZE;
  }

  return all;
}
