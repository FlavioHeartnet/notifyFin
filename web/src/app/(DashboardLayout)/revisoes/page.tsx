import React from 'react';
import { createClient } from '@/lib/supabase/server';
import ReviewsClient, {
  type PluggyReviewItem,
  type ReviewQueueItem,
} from './ReviewsClient';

export const dynamic = 'force-dynamic';

export default async function RevisoesPage() {
  const supabase = await createClient();

  const [openRes, resolvedRes, pluggyRes] = await Promise.all([
    supabase
      .from('review_queue')
      .select(
        'id, review_type, status, priority, message, details, created_at, resolved_at'
      )
      .eq('status', 'open')
      .order('created_at', { ascending: false }),
    supabase
      .from('review_queue')
      .select(
        'id, review_type, status, priority, message, details, created_at, resolved_at'
      )
      .neq('status', 'open')
      .order('resolved_at', { ascending: false })
      .limit(30),
    supabase
      .from('pluggy_reconciliation_reviews')
      .select('id, pluggy_ref_id, reason, status, details, created_at, resolved_at')
      .order('created_at', { ascending: false })
      .limit(40),
  ]);

  return (
    <ReviewsClient
      openQueue={(openRes.data ?? []) as ReviewQueueItem[]}
      recentResolvedQueue={(resolvedRes.data ?? []) as ReviewQueueItem[]}
      pluggyReviews={(pluggyRes.data ?? []) as PluggyReviewItem[]}
    />
  );
}
