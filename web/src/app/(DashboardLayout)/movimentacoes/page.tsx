import React from 'react';
import { createClient } from '@/lib/supabase/server';
import TransactionsClient, { type TxListItem } from './TransactionsClient';

export const dynamic = 'force-dynamic';

const PAGE_SIZE = 30;

interface PageProps {
  searchParams: Promise<{
    month?: string;
    account?: string;
    category?: string;
    effect?: string;
    q?: string;
    page?: string;
  }>;
}

export default async function MovimentacoesPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const supabase = await createClient();

  const month = sp.month?.trim() ?? '';
  const account = sp.account?.trim() ?? '';
  const category = sp.category?.trim() ?? '';
  const effect = sp.effect?.trim() ?? '';
  const q = sp.q?.trim() ?? '';
  const page = Math.max(1, Number(sp.page ?? '1') || 1);

  const [accountsRes, categoriesRes, monthsRes] = await Promise.all([
    supabase
      .from('accounts')
      .select('id, name, account_type')
      .order('name', { ascending: true }),
    supabase
      .from('categories')
      .select('id, name, parent_id')
      .eq('active', true)
      .order('name', { ascending: true }),
    supabase
      .from('v_cashflow_monthly')
      .select('month')
      .order('month', { ascending: false }),
  ]);

  const accounts = accountsRes.data ?? [];
  const categories = categoriesRes.data ?? [];
  const months = (monthsRes.data ?? [])
    .map((m) => (m.month ? String(m.month).slice(0, 7) : ''))
    .filter(Boolean);

  // If filtering by category, include child categories too and use inner join
  const categoryIdNum = Number(category);
  const matchingCategoryIds: number[] = [];
  if (Number.isInteger(categoryIdNum) && categoryIdNum > 0) {
    matchingCategoryIds.push(categoryIdNum);
    categories
      .filter((c) => c.parent_id === categoryIdNum)
      .forEach((c) => matchingCategoryIds.push(c.id));
  }

  const allocSelect =
    matchingCategoryIds.length > 0
      ? 'transaction_allocations!inner(category_id, classification_source, categories(name))'
      : 'transaction_allocations(category_id, classification_source, categories(name))';

  let query = supabase
    .from('financial_transactions')
    .select(
      `id, occurred_on, raw_description, counterparty_raw, amount, direction, economic_effect, is_spending, is_own_transfer, classification_status, reconciliation_status, balance_after, account_id, accounts(name), operation_types(name), ${allocSelect}`,
      { count: 'exact' }
    )
    .order('occurred_on', { ascending: false })
    .order('id', { ascending: false });

  if (month && /^\d{4}-\d{2}$/.test(month)) {
    const [y, m] = month.split('-').map(Number);
    const start = `${month}-01`;
    const nextDate = new Date(y, m, 1);
    const end = `${nextDate.getFullYear()}-${String(
      nextDate.getMonth() + 1
    ).padStart(2, '0')}-01`;
    query = query.gte('occurred_on', start).lt('occurred_on', end);
  }

  if (account && Number(account) > 0) {
    query = query.eq('account_id', Number(account));
  }

  if (matchingCategoryIds.length > 0) {
    query = query.in('transaction_allocations.category_id', matchingCategoryIds);
  }

  if (effect === 'spending') {
    query = query.eq('is_spending', true);
  } else if (effect === 'transfer') {
    query = query.eq('is_own_transfer', true);
  } else if (effect) {
    query = query.eq('economic_effect', effect);
  }

  if (q) {
    query = query.ilike('raw_description', `%${q}%`);
  }

  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;
  const { data: rows, count } = await query.range(from, to);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const transactions: TxListItem[] = ((rows as any[]) ?? []).map((tx) => {
    const allocs = Array.isArray(tx.transaction_allocations)
      ? tx.transaction_allocations
      : [];
    const primary = allocs[0];
    return {
      id: tx.id,
      occurred_on: tx.occurred_on,
      raw_description: tx.raw_description,
      counterparty_raw: tx.counterparty_raw,
      amount: Number(tx.amount),
      direction: tx.direction,
      economic_effect: tx.economic_effect,
      is_spending: tx.is_spending,
      is_own_transfer: tx.is_own_transfer,
      classification_status: tx.classification_status,
      reconciliation_status: tx.reconciliation_status,
      balance_after: tx.balance_after !== null ? Number(tx.balance_after) : null,
      account_id: tx.account_id,
      accountName: tx.accounts?.name ?? 'Conta',
      operationTypeName: tx.operation_types?.name ?? null,
      categoryId: primary?.category_id ?? null,
      categoryName: primary?.categories?.name ?? null,
      classificationSource: primary?.classification_source ?? null,
    };
  });

  const summary = transactions.reduce(
    (acc, t) => {
      if (t.direction === 'credit') acc.totalCredits += t.amount;
      else acc.totalDebits += t.amount;
      if (t.is_spending) acc.totalSpending += t.amount;
      return acc;
    },
    { totalDebits: 0, totalCredits: 0, totalSpending: 0 }
  );

  return (
    <TransactionsClient
      transactions={transactions}
      totalCount={count ?? 0}
      page={page}
      pageSize={PAGE_SIZE}
      summary={summary}
      categories={categories}
      accounts={accounts}
      months={months}
      initialFilters={{ month, account, category, effect, q }}
    />
  );
}
