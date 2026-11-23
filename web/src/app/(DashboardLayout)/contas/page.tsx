import React from 'react';
import { createClient } from '@/lib/supabase/server';
import AccountsClient, {
  type AccountCardItem,
  type BillItem,
  type InstallmentItem,
} from './AccountsClient';

export const dynamic = 'force-dynamic';

export default async function ContasPage() {
  const supabase = await createClient();

  const [accountsRes, txStatsRes, billsRes, pluggyAccRes, installmentsRes] =
    await Promise.all([
      supabase
        .from('accounts')
        .select(
          'id, name, account_type, external_reference_masked, currency, active, institutions(name)'
        )
        .order('name', { ascending: true }),
      supabase
        .from('financial_transactions')
        .select('account_id, amount, direction, occurred_on')
        .limit(5000),
      supabase
        .from('pluggy_bills')
        .select('id, external_account_id, due_date, closing_date, total_amount')
        .order('due_date', { ascending: false }),
      supabase
        .from('pluggy_accounts')
        .select('external_account_id, label, local_account_id'),
      supabase
        .from('installment_plans')
        .select(
          'id, account_id, merchant_name, total_amount, installment_count, purchase_date, status, raw_payload'
        )
        .order('purchase_date', { ascending: false }),
    ]);

  const statsByAcc = new Map<
    number,
    { count: number; debits: number; credits: number; latest: string | null }
  >();
  (txStatsRes.data ?? []).forEach((tx) => {
    const s = statsByAcc.get(tx.account_id) ?? {
      count: 0,
      debits: 0,
      credits: 0,
      latest: null,
    };
    s.count += 1;
    if (tx.direction === 'credit') s.credits += Number(tx.amount);
    else s.debits += Number(tx.amount);
    if (!s.latest || tx.occurred_on > s.latest) s.latest = tx.occurred_on;
    statsByAcc.set(tx.account_id, s);
  });

  const accNameById = new Map<number, string>();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const accounts: AccountCardItem[] = ((accountsRes.data as any[]) ?? []).map((a) => {
    accNameById.set(a.id, a.name);
    const st = statsByAcc.get(a.id);
    return {
      id: a.id,
      name: a.name,
      account_type: a.account_type,
      external_reference_masked: a.external_reference_masked,
      currency: a.currency,
      active: a.active,
      institutionName: a.institutions?.name ?? 'Instituição',
      txCount: st?.count ?? 0,
      totalDebits: st?.debits ?? 0,
      totalCredits: st?.credits ?? 0,
      latestDate: st?.latest ?? null,
    };
  });

  const pluggyLabelMap = new Map<string, string>();
  (pluggyAccRes.data ?? []).forEach((pa) => {
    const localName = pa.local_account_id
      ? accNameById.get(pa.local_account_id)
      : null;
    pluggyLabelMap.set(pa.external_account_id, localName || pa.label || 'Cartão');
  });

  const bills: BillItem[] = (billsRes.data ?? []).map((b) => ({
    id: b.id,
    external_account_id: b.external_account_id,
    accountLabel: pluggyLabelMap.get(b.external_account_id) ?? 'Cartão',
    due_date: b.due_date ?? '',
    closing_date: b.closing_date,
    total_amount: Number(b.total_amount ?? 0),
  }));

  const installments: InstallmentItem[] = (installmentsRes.data ?? []).map((i) => {
    const payload = (i.raw_payload ?? {}) as Record<string, unknown>;
    return {
      id: i.id,
      merchant_name: i.merchant_name ?? 'Estabelecimento',
      total_amount: Number(i.total_amount),
      installment_count: i.installment_count,
      purchase_date: i.purchase_date ?? '',
      status: i.status,
      accountName: accNameById.get(i.account_id) ?? 'Cartão',
      installmentAmount:
        typeof payload.installment_amount === 'number'
          ? payload.installment_amount
          : Number((Number(i.total_amount) / Math.max(1, i.installment_count)).toFixed(2)),
      currentInstallment:
        typeof payload.current_installment === 'number'
          ? payload.current_installment
          : null,
    };
  });

  return (
    <AccountsClient
      accounts={accounts}
      bills={bills}
      installments={installments}
    />
  );
}
