import React from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import DashboardShell from './layout/DashboardShell';

export const dynamic = 'force-dynamic';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const [profileRes, openReviewsRes, recurringCandidatesRes] =
    await Promise.all([
      supabase
        .from('financial_profiles')
        .select('id, display_name')
        .eq('auth_user_id', user.id)
        .maybeSingle(),
      supabase
        .from('review_queue')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'open'),
      supabase
        .from('v_recurring_review_candidates')
        .select('transaction_id', { count: 'exact', head: true }),
    ]);

  const displayName =
    profileRes.data?.display_name || user.email?.split('@')[0] || 'Titular';

  return (
    <DashboardShell
      user={{
        displayName,
        email: user.email || '',
        openReviewsCount: openReviewsRes.count ?? 0,
        recurringCandidatesCount: recurringCandidatesRes.count ?? 0,
      }}
    >
      {children}
    </DashboardShell>
  );
}
