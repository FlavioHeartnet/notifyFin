import React from 'react';
import { createClient } from '@/lib/supabase/server';
import OverviewDashboard, {
  type BillSnapshot,
  type CashflowMonthRow,
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
    cashflowRes,
    spendingRes,
    recurringRes,
    accountsRes,
    recentTxRes,
    billsRes,
    pluggyAccountsRes,
    connectionsRes,
    openReviewsRes,
    recurringCandidatesRes,
    installmentsRes,
  ] = await Promise.all([
    supabase
      .from('financial_profiles')
      .select('display_name')
      .limit(1)
      .maybeSingle(),
    supabase
      .from('v_cashflow_monthly')
      .select('month, inflows, outflows, net_cashflow')
      .order('month', { ascending: true }),
    supabase
      .from('v_spending_monthly')
      .select('month, category, amount')
      .order('month', { ascending: false }),
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
  ]);

  const accountNameById = new Map<number, string>();
  (accountsRes.data ?? []).forEach((a) => accountNameById.set(a.id, a.name));

  const pluggyAccountLabel = new Map<string, string>();
  (pluggyAccountsRes.data ?? []).forEach((pa) => {
    const mapped = pa.local_account_id
      ? accountNameById.get(pa.local_account_id)
      : null;
    pluggyAccountLabel.set(pa.external_account_id, mapped || pa.label || 'Cartão');
  });

  const cashflowMonths: CashflowMonthRow[] = (cashflowRes.data ?? [])
    .filter((r) => Boolean(r.month))
    .map((r) => ({
      month: String(r.month).slice(0, 7),
      inflows: Number(r.inflows ?? 0),
      outflows: Number(r.outflows ?? 0),
      netCashflow: Number(r.net_cashflow ?? 0),
    }));

  const spendingByMonthCategory: SpendingCategoryMonthRow[] = (
    spendingRes.data ?? []
  )
    .filter((r) => Boolean(r.month) && Boolean(r.category))
    .map((r) => ({
      month: String(r.month).slice(0, 7),
      category: String(r.category),
      amount: Number(r.amount ?? 0),
    }));

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
      cashflowMonths={cashflowMonths}
      spendingByMonthCategory={spendingByMonthCategory}
      recurringByMonth={Array.from(recMap.values())}
      recentTransactions={recentTransactions}
      latestBills={latestBills}
      connections={connections}
      accountsCount={(accountsRes.data ?? []).length}
      openReviewsCount={openReviewsRes.count ?? 0}
      recurringCandidatesCount={recurringCandidatesRes.count ?? 0}
      activeInstallmentsCount={installmentsRes.count ?? 0}
    />
  );
}
