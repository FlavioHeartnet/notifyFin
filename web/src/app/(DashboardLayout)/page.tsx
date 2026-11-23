import React from 'react';
import { createClient } from '@/lib/supabase/server';
import {
  fetchAllLedgerTransactions,
  fetchAllTransactionAllocations,
} from '@/lib/finance-queries';
import OverviewDashboard, {
  type BillSnapshot,
  type MonthlyLedgerSummary,
  type RecentTxRow,
  type RecurringMonthRow,
  type SpendingCategoryMonthRow,
} from './components/OverviewDashboard';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const supabase = await createClient();

  const today = new Date();
  const currentMonthKey = `${today.getFullYear()}-${String(
    today.getMonth() + 1
  ).padStart(2, '0')}`;
  const todayIso = today.toISOString().slice(0, 10);

  const [
    profileRes,
    allTransactions,
    allAllocations,
    categoriesRes,
    recurringRes,
    accountsRes,
    recentTxRes,
    billsRes,
    pluggyAccountsRes,
    connectionsRes,
    openReviewsRes,
    recurringCandidatesRes,
    installmentsRes,
    unlinkedRefsRes,
    resolvedPluggyReviewsRes,
  ] = await Promise.all([
    supabase
      .from('financial_profiles')
      .select('display_name')
      .limit(1)
      .maybeSingle(),
    fetchAllLedgerTransactions(supabase),
    fetchAllTransactionAllocations(supabase),
    supabase.from('categories').select('id, name, parent_id'),
    supabase
      .from('v_recurring_spending_monthly')
      .select('month, amount, charges'),
    supabase
      .from('accounts')
      .select('id, name, account_type')
      .eq('active', true),
    supabase
      .from('financial_transactions')
      .select(
        'id, occurred_on, raw_description, amount, direction, economic_effect, is_spending, is_own_transfer, account_id, transaction_allocations(category_id, categories(name))'
      )
      .lte('occurred_on', todayIso)
      .order('occurred_on', { ascending: false })
      .order('id', { ascending: false })
      .limit(10),
    supabase
      .from('pluggy_bills')
      .select('id, external_account_id, due_date, closing_date, total_amount')
      .order('due_date', { ascending: false })
      .limit(8),
    supabase
      .from('pluggy_accounts')
      .select('external_account_id, label, local_account_id'),
    supabase
      .from('pluggy_connections')
      .select('id, institution_name, status, last_synced_at')
      .order('institution_name', { ascending: true }),
    supabase
      .from('review_queue')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'open'),
    supabase
      .from('v_recurring_review_candidates')
      .select('transaction_id', { count: 'exact', head: true }),
    supabase
      .from('installment_plans')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'active'),
    supabase
      .from('pluggy_transaction_refs')
      .select('id, status')
      .is('transaction_id', null)
      .is('deleted_at', null),
    supabase
      .from('pluggy_reconciliation_reviews')
      .select('pluggy_ref_id')
      .in('status', ['resolved', 'dismissed']),
  ]);

  const resolvedRefIds = new Set(
    (resolvedPluggyReviewsRes.data ?? []).map((r) => r.pluggy_ref_id)
  );
  const unlinkedRefs = unlinkedRefsRes.data ?? [];
  const unlinkedPostedCount = unlinkedRefs.filter(
    (r) => r.status === 'POSTED' && !resolvedRefIds.has(r.id)
  ).length;
  const unlinkedPendingCount = unlinkedRefs.filter(
    (r) => r.status !== 'POSTED'
  ).length;

  const accountNameById = new Map<number, string>();
  (accountsRes.data ?? []).forEach((a) => accountNameById.set(a.id, a.name));

  const categoryNameById = new Map<number, string>();
  (categoriesRes.data ?? []).forEach((c) => categoryNameById.set(c.id, c.name));

  const allocsByTxId = new Map<number, { category_id: number; amount: number }[]>();
  for (const a of allAllocations) {
    const list = allocsByTxId.get(a.transaction_id) ?? [];
    list.push({ category_id: a.category_id, amount: a.amount });
    allocsByTxId.set(a.transaction_id, list);
  }

  // Income competence rule: entries from day 25 onward finance the following month
  // (e.g., salary paid on Oct 26–31 belongs to Nov's observed income window: 25/Oct – 24/Nov).
  const INCOME_CUTOFF_DAY = 25;
  const getIncomeCompetenceMonth = (isoDate: string): string => {
    const year = Number(isoDate.slice(0, 4));
    const month = Number(isoDate.slice(5, 7)); // 1..12
    const day = Number(isoDate.slice(8, 10));
    if (day >= INCOME_CUTOFF_DAY) {
      const next = new Date(year, month, 1); // JS month is 0-indexed, so `month` is next month
      return `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, '0')}`;
    }
    return isoDate.slice(0, 7);
  };

  // Consolidate 100% from financial_transactions (single source of truth)
  const monthlyMap = new Map<string, MonthlyLedgerSummary>();
  const spendingCatMap = new Map<string, number>(); // key: `${ym}||${catName}`

  const ensureMonth = (ym: string): MonthlyLedgerSummary => {
    let m = monthlyMap.get(ym);
    if (!m) {
      m = {
        month: ym,
        spending: 0,
        income: 0,
        refunds: 0,
        netResult: 0,
        transfers: 0,
        settlements: 0,
        investmentApplied: 0,
        investmentRedeemed: 0,
        txCount: 0,
      };
      monthlyMap.set(ym, m);
    }
    return m;
  };

  for (const tx of allTransactions) {
    const ym = tx.occurred_on.slice(0, 7);
    const m = ensureMonth(ym);
    m.txCount += 1;

    if (tx.is_spending) {
      m.spending += tx.amount;

      // Attribute to categories (and unallocated difference to "Sem categoria")
      const allocs = allocsByTxId.get(tx.id);
      if (allocs && allocs.length > 0) {
        let allocatedSum = 0;
        for (const a of allocs) {
          const catName = categoryNameById.get(a.category_id) ?? 'Sem categoria';
          const key = `${ym}||${catName}`;
          spendingCatMap.set(key, (spendingCatMap.get(key) ?? 0) + a.amount);
          allocatedSum += a.amount;
        }
        const remainder = tx.amount - allocatedSum;
        if (remainder > 0.01) {
          const key = `${ym}||Sem categoria`;
          spendingCatMap.set(key, (spendingCatMap.get(key) ?? 0) + remainder);
        }
      } else {
        const key = `${ym}||Sem categoria`;
        spendingCatMap.set(key, (spendingCatMap.get(key) ?? 0) + tx.amount);
      }
    } else if (tx.economic_effect === 'income') {
      const incomeMonth = getIncomeCompetenceMonth(tx.occurred_on);
      const targetMonth = ensureMonth(incomeMonth);
      targetMonth.income += tx.amount;
    } else if (tx.economic_effect === 'refund') {
      m.refunds += tx.amount;
    } else if (tx.economic_effect === 'settlement') {
      if (tx.direction === 'debit') {
        m.settlements += tx.amount;
      }
    } else if (tx.is_own_transfer || tx.economic_effect === 'transfer') {
      if (tx.direction === 'debit') {
        m.transfers += tx.amount;
      }
    } else if (tx.economic_effect === 'investment') {
      if (tx.direction === 'debit') {
        m.investmentApplied += tx.amount;
      } else {
        m.investmentRedeemed += tx.amount;
      }
    }
  }

  // Finalize net economic result per month: income - (spending - refunds)
  const monthlySummaries: MonthlyLedgerSummary[] = Array.from(monthlyMap.values())
    .map((m) => ({
      ...m,
      spending: Number(m.spending.toFixed(2)),
      income: Number(m.income.toFixed(2)),
      refunds: Number(m.refunds.toFixed(2)),
      netResult: Number((m.income - m.spending + m.refunds).toFixed(2)),
      transfers: Number(m.transfers.toFixed(2)),
      settlements: Number(m.settlements.toFixed(2)),
      investmentApplied: Number(m.investmentApplied.toFixed(2)),
      investmentRedeemed: Number(m.investmentRedeemed.toFixed(2)),
    }))
    .sort((a, b) => a.month.localeCompare(b.month));

  const spendingByMonthCategory: SpendingCategoryMonthRow[] = Array.from(
    spendingCatMap.entries()
  ).map(([key, amount]) => {
    const [month, category] = key.split('||');
    return {
      month,
      category,
      amount: Number(amount.toFixed(2)),
    };
  });

  // Aggregate recurring spending by month
  const recMap = new Map<string, RecurringMonthRow>();
  (recurringRes.data ?? []).forEach((r) => {
    if (!r.month) return;
    const m = String(r.month).slice(0, 7);
    const prev = recMap.get(m) ?? { month: m, amount: 0, charges: 0 };
    prev.amount += Number(r.amount ?? 0);
    prev.charges += Number(r.charges ?? 0);
    recMap.set(m, prev);
  });

  const pluggyAccountLabel = new Map<string, string>();
  (pluggyAccountsRes.data ?? []).forEach((pa) => {
    const mapped = pa.local_account_id
      ? accountNameById.get(pa.local_account_id)
      : null;
    pluggyAccountLabel.set(pa.external_account_id, mapped || pa.label || 'Cartão');
  });

  const recentTransactions: RecentTxRow[] = (recentTxRes.data ?? []).map((tx) => {
    const allocs = Array.isArray(tx.transaction_allocations)
      ? tx.transaction_allocations
      : [];
    const firstCat = allocs[0]?.categories as { name?: string } | null | undefined;
    return {
      id: tx.id,
      occurred_on: tx.occurred_on,
      raw_description: tx.raw_description,
      amount: Number(tx.amount),
      direction: tx.direction,
      economic_effect: tx.economic_effect,
      is_spending: tx.is_spending,
      is_own_transfer: tx.is_own_transfer,
      accountName: accountNameById.get(tx.account_id) ?? 'Conta',
      categoryName: firstCat?.name ?? null,
    };
  });

  const latestBills: BillSnapshot[] = (billsRes.data ?? []).map((b) => ({
    id: b.id,
    due_date: b.due_date ?? '',
    closing_date: b.closing_date,
    total_amount: Number(b.total_amount ?? 0),
    accountLabel: pluggyAccountLabel.get(b.external_account_id) ?? 'Cartão',
  }));

  const connections = (connectionsRes.data ?? []).map((c) => ({
    id: c.id,
    institution_name: c.institution_name ?? 'Instituição',
    status: c.status,
    last_synced_at: c.last_synced_at,
  }));

  return (
    <OverviewDashboard
      profileName={profileRes.data?.display_name ?? 'Titular'}
      currentMonthKey={currentMonthKey}
      monthlySummaries={monthlySummaries}
      spendingByMonthCategory={spendingByMonthCategory}
      recurringByMonth={Array.from(recMap.values())}
      recentTransactions={recentTransactions}
      latestBills={latestBills}
      connections={connections}
      accountsCount={(accountsRes.data ?? []).length}
      totalTransactionsCount={allTransactions.length}
      openReviewsCount={openReviewsRes.count ?? 0}
      recurringCandidatesCount={recurringCandidatesRes.count ?? 0}
      activeInstallmentsCount={installmentsRes.count ?? 0}
      unlinkedPostedCount={unlinkedPostedCount}
      unlinkedPendingCount={unlinkedPendingCount}
    />
  );
}
