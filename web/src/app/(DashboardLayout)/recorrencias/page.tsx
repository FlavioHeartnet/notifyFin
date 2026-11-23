import React from 'react';
import { createClient } from '@/lib/supabase/server';
import RecurrencesClient, {
  type RecurringCandidateItem,
  type RecurringTxItem,
} from './RecurrencesClient';

export const dynamic = 'force-dynamic';

export default async function RecorrenciasPage() {
  const supabase = await createClient();

  const [txRes, rulesRes, candidatesRes] = await Promise.all([
    supabase
      .from('v_recurring_transactions')
      .select(
        'transaction_id, occurred_on, account_name, amount, raw_description, recurring_name, expense_type, classification_source'
      )
      .order('occurred_on', { ascending: false })
      .limit(500),
    supabase
      .from('recurring_classification_rules')
      .select('id, label, expense_type, match_text, active')
      .order('label', { ascending: true }),
    supabase
      .from('v_recurring_review_candidates')
      .select('transaction_id, occurred_on, amount, raw_description, review_reason')
      .order('occurred_on', { ascending: false }),
  ]);

  const recurringTx: RecurringTxItem[] = (txRes.data ?? [])
    .filter((r) => r.transaction_id !== null && r.occurred_on !== null)
    .map((r) => ({
      transaction_id: Number(r.transaction_id),
      occurred_on: String(r.occurred_on),
      account_name: r.account_name ?? 'Conta',
      amount: Number(r.amount ?? 0),
      raw_description: r.raw_description ?? '',
      recurring_name: r.recurring_name ?? 'Recorrente',
      expense_type: r.expense_type ?? 'other',
      classification_source: r.classification_source ?? 'rule',
    }));

  const candidates: RecurringCandidateItem[] = (candidatesRes.data ?? [])
    .filter((c) => c.transaction_id !== null && c.occurred_on !== null)
    .map((c) => ({
      transaction_id: Number(c.transaction_id),
      occurred_on: String(c.occurred_on),
      amount: Number(c.amount ?? 0),
      raw_description: c.raw_description ?? '',
      review_reason: c.review_reason ?? 'ambiguous',
    }));

  return (
    <RecurrencesClient
      recurringTx={recurringTx}
      rules={rulesRes.data ?? []}
      candidates={candidates}
    />
  );
}
