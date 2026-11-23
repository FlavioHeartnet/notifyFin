'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

export interface ActionResult {
  ok: boolean;
  message: string;
}

async function getAuthenticatedProfile() {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { supabase, profileId: null as number | null, error: 'Sessão expirada. Faça login novamente.' };
  }

  const { data: profile, error: profileError } = await supabase
    .from('financial_profiles')
    .select('id')
    .eq('auth_user_id', user.id)
    .maybeSingle();

  if (profileError || !profile) {
    return { supabase, profileId: null as number | null, error: 'Perfil financeiro do titular não encontrado.' };
  }

  return { supabase, profileId: profile.id, error: null };
}

export async function reclassifyTransactionAction(input: {
  transactionId: number;
  categoryId: number;
  reason?: string;
}): Promise<ActionResult> {
  const { supabase, profileId, error } = await getAuthenticatedProfile();
  if (error || !profileId) return { ok: false, message: error ?? 'Não autenticado.' };

  const txId = Number(input.transactionId);
  const categoryId = Number(input.categoryId);
  const reason = input.reason?.trim() || 'Reclassificação manual pelo Titular no webapp';

  if (!Number.isInteger(txId) || txId <= 0 || !Number.isInteger(categoryId) || categoryId <= 0) {
    return { ok: false, message: 'Dados inválidos para reclassificação.' };
  }

  // Fetch transaction + existing allocations
  const { data: tx, error: txErr } = await supabase
    .from('financial_transactions')
    .select('id, amount, transaction_allocations(id, category_id)')
    .eq('id', txId)
    .eq('profile_id', profileId)
    .maybeSingle();

  if (txErr || !tx) {
    return { ok: false, message: 'Movimentação financeira não encontrada.' };
  }

  const existingAllocs = Array.isArray(tx.transaction_allocations)
    ? tx.transaction_allocations
    : [];
  const previousCategoryId = existingAllocs[0]?.category_id ?? null;

  // Replace single allocation cleanly or update existing primary allocation
  if (existingAllocs.length === 1) {
    const { error: updErr } = await supabase
      .from('transaction_allocations')
      .update({
        category_id: categoryId,
        amount: tx.amount,
        classification_source: 'user',
        confidence: 1,
        note: reason,
      })
      .eq('id', existingAllocs[0].id)
      .eq('profile_id', profileId);

    if (updErr) {
      return { ok: false, message: `Erro ao atualizar categoria: ${updErr.message}` };
    }
  } else {
    if (existingAllocs.length > 1) {
      const { error: delErr } = await supabase
        .from('transaction_allocations')
        .delete()
        .eq('transaction_id', txId)
        .eq('profile_id', profileId);
      if (delErr) {
        return { ok: false, message: `Erro ao limpar alocações anteriores: ${delErr.message}` };
      }
    }

    const { error: insErr } = await supabase
      .from('transaction_allocations')
      .insert({
        profile_id: profileId,
        transaction_id: txId,
        category_id: categoryId,
        amount: tx.amount,
        classification_source: 'user',
        confidence: 1,
        note: reason,
      });

    if (insErr) {
      return { ok: false, message: `Erro ao salvar nova classificação: ${insErr.message}` };
    }
  }

  // Update transaction status
  await supabase
    .from('financial_transactions')
    .update({
      classification_status: 'classified',
      needs_review: false,
      updated_at: new Date().toISOString(),
    })
    .eq('id', txId)
    .eq('profile_id', profileId);

  // Append classification history + audit event
  await Promise.all([
    supabase.from('classification_history').insert({
      profile_id: profileId,
      transaction_id: txId,
      category_id: categoryId,
      previous_category_id: previousCategoryId,
      source: 'user',
      confidence: 1,
      reason,
    }),
    supabase.from('audit_events').insert({
      profile_id: profileId,
      entity_type: 'financial_transaction',
      entity_id: txId,
      action: 'reclassify',
      actor_type: 'user',
      details: {
        previous_category_id: previousCategoryId,
        category_id: categoryId,
        reason,
      },
    }),
  ]);

  revalidatePath('/');
  revalidatePath('/movimentacoes');
  revalidatePath('/revisoes');

  return { ok: true, message: 'Categoria atualizada com sucesso.' };
}

export async function updateReviewQueueStatusAction(input: {
  reviewId: number;
  status: 'resolved' | 'dismissed' | 'open';
}): Promise<ActionResult> {
  const { supabase, profileId, error } = await getAuthenticatedProfile();
  if (error || !profileId) return { ok: false, message: error ?? 'Não autenticado.' };

  if (!['resolved', 'dismissed', 'open'].includes(input.status)) {
    return { ok: false, message: 'Status inválido.' };
  }

  const { error: updErr } = await supabase
    .from('review_queue')
    .update({
      status: input.status,
      resolved_at: input.status === 'open' ? null : new Date().toISOString(),
    })
    .eq('id', input.reviewId)
    .eq('profile_id', profileId);

  if (updErr) {
    return { ok: false, message: `Erro ao atualizar revisão: ${updErr.message}` };
  }

  await supabase.from('audit_events').insert({
    profile_id: profileId,
    entity_type: 'review_queue',
    entity_id: input.reviewId,
    action: `mark_${input.status}`,
    actor_type: 'user',
    details: { status: input.status },
  });

  revalidatePath('/');
  revalidatePath('/revisoes');

  return {
    ok: true,
    message:
      input.status === 'resolved'
        ? 'Revisão marcada como resolvida.'
        : input.status === 'dismissed'
          ? 'Revisão dispensada.'
          : 'Revisão reaberta.',
  };
}

export async function updatePluggyReviewStatusAction(input: {
  reviewId: number;
  status: 'resolved' | 'dismissed' | 'open';
}): Promise<ActionResult> {
  const { supabase, profileId, error } = await getAuthenticatedProfile();
  if (error || !profileId) return { ok: false, message: error ?? 'Não autenticado.' };

  if (!['resolved', 'dismissed', 'open'].includes(input.status)) {
    return { ok: false, message: 'Status inválido.' };
  }

  const { error: updErr } = await supabase
    .from('pluggy_reconciliation_reviews')
    .update({
      status: input.status,
      resolved_at: input.status === 'open' ? null : new Date().toISOString(),
    })
    .eq('id', input.reviewId)
    .eq('profile_id', profileId);

  if (updErr) {
    return { ok: false, message: `Erro ao atualizar revisão Pluggy: ${updErr.message}` };
  }

  await supabase.from('audit_events').insert({
    profile_id: profileId,
    entity_type: 'pluggy_reconciliation_review',
    entity_id: input.reviewId,
    action: `mark_${input.status}`,
    actor_type: 'user',
    details: { status: input.status },
  });

  revalidatePath('/revisoes');
  revalidatePath('/sincronizacao');

  return { ok: true, message: 'Revisão de reconciliação atualizada.' };
}

const VALID_EXPENSE_TYPES = [
  'streaming',
  'software',
  'mobile',
  'internet',
  'insurance',
  'health',
  'fitness',
  'other',
] as const;

export async function saveRecurringOverrideAction(input: {
  transactionId: number;
  status: 'confirmed' | 'excluded';
  label?: string;
  expenseType?: string;
  note?: string;
}): Promise<ActionResult> {
  const { supabase, profileId, error } = await getAuthenticatedProfile();
  if (error || !profileId) return { ok: false, message: error ?? 'Não autenticado.' };

  const txId = Number(input.transactionId);
  if (!Number.isInteger(txId) || txId <= 0) {
    return { ok: false, message: 'Transação inválida.' };
  }

  if (input.status === 'confirmed') {
    if (!input.label?.trim()) {
      return { ok: false, message: 'Informe um rótulo para confirmar a recorrência.' };
    }
    if (
      !input.expenseType ||
      !VALID_EXPENSE_TYPES.includes(
        input.expenseType as (typeof VALID_EXPENSE_TYPES)[number]
      )
    ) {
      return { ok: false, message: 'Tipo de despesa recorrente inválido.' };
    }
  }

  const { error: upsertErr } = await supabase
    .from('recurring_transaction_overrides')
    .upsert(
      {
        transaction_id: txId,
        profile_id: profileId,
        status: input.status,
        label: input.status === 'confirmed' ? input.label!.trim() : null,
        expense_type:
          input.status === 'confirmed' ? input.expenseType! : null,
        note: input.note?.trim() || null,
      },
      { onConflict: 'transaction_id' }
    );

  if (upsertErr) {
    return { ok: false, message: `Erro ao salvar recorrência: ${upsertErr.message}` };
  }

  await supabase.from('audit_events').insert({
    profile_id: profileId,
    entity_type: 'recurring_transaction_override',
    entity_id: txId,
    action: input.status === 'confirmed' ? 'confirm_recurring' : 'exclude_recurring',
    actor_type: 'user',
    details: {
      status: input.status,
      label: input.label ?? null,
      expense_type: input.expenseType ?? null,
    },
  });

  revalidatePath('/');
  revalidatePath('/recorrencias');

  return {
    ok: true,
    message:
      input.status === 'confirmed'
        ? 'Transação confirmada como recorrência.'
        : 'Transação excluída dos candidatos de recorrência.',
  };
}
