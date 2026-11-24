import React from 'react';
import {
  Box,
  Divider,
  Grid,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import {
  IconBuildingBank,
  IconCheck,
  IconRefresh,
  IconTag,
} from '@tabler/icons-react';
import { createClient } from '@/lib/supabase/server';
import DashboardCard from '@/app/components/shared/DashboardCard';
import PageBanner from '@/app/components/shared/PageBanner';
import StatusChip from '@/app/components/shared/StatusChip';
import ReconcileTriggerCard from '../components/ReconcileTriggerCard';
import { formatDateTimeBR } from '@/lib/format';

export const dynamic = 'force-dynamic';

export default async function SincronizacaoPage() {
  const supabase = await createClient();

  const [
    connectionsRes,
    pluggyAccountsRes,
    localAccountsRes,
    syncRunsRes,
    reconRunsRes,
    catMappingsRes,
    categoriesRes,
    unlinkedRefsRes,
    resolvedPluggyReviewsRes,
  ] = await Promise.all([
    supabase
      .from('pluggy_connections')
      .select('id, institution_name, item_id, status, last_synced_at')
      .order('institution_name', { ascending: true }),
    supabase
      .from('pluggy_accounts')
      .select(
        'id, connection_id, label, account_type, account_subtype, last_four, local_account_id, mapping_status, last_seen_at'
      )
      .order('label', { ascending: true }),
    supabase.from('accounts').select('id, name'),
    supabase
      .from('pluggy_sync_runs')
      .select(
        'id, connection_id, status, started_at, completed_at, fetched_count, imported_count, matched_count, error_code'
      )
      .order('started_at', { ascending: false })
      .limit(20),
    supabase
      .from('pluggy_reconciliation_runs')
      .select(
        'id, started_at, completed_at, status, ledger_before, ledger_after, linked_existing, imported_new, held_for_review, pending_count'
      )
      .order('started_at', { ascending: false })
      .limit(10),
    supabase
      .from('pluggy_category_mappings')
      .select('id, source_category, category_id, confidence, approved, active')
      .order('source_category', { ascending: true }),
    supabase.from('categories').select('id, name'),
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

  const connections = connectionsRes.data ?? [];
  const connById = new Map(connections.map((c) => [c.id, c.institution_name]));
  const localAccById = new Map(
    (localAccountsRes.data ?? []).map((a) => [a.id, a.name])
  );
  const catById = new Map((categoriesRes.data ?? []).map((c) => [c.id, c.name]));

  return (
    <Stack spacing={3}>
      <PageBanner
        title="Open Finance (Pluggy)"
        subtitle="Sincronização financeira, contas mapeadas e execuções de conciliação"
        breadcrumbs={[
          { label: 'Início', href: '/' },
          { label: 'Open Finance (Pluggy)' },
        ]}
      />

      {/* On-demand Reconcile & Classify Trigger */}
      <ReconcileTriggerCard
        unlinkedPostedCount={unlinkedPostedCount}
        unlinkedPendingCount={unlinkedPendingCount}
      />

      {/* Active Connections */}
      <Grid container spacing={2.5}>
        {connections.map((conn) => (
          <Grid key={conn.id} size={{ xs: 12, sm: 6, lg: 4 }}>
            <DashboardCard>
              <Stack spacing={1.75}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1}>
                  <Stack direction="row" spacing={1.5} alignItems="center" minWidth={0}>
                    <Box
                      sx={{
                        width: 42,
                        height: 42,
                        borderRadius: '10px',
                        bgcolor: 'primary.light',
                        color: 'primary.main',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <IconBuildingBank size={20} stroke={1.65} />
                    </Box>
                    <Box minWidth={0}>
                      <Typography variant="h6" fontWeight={600} noWrap>
                        {conn.institution_name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Item: {conn.item_id.slice(0, 8)}…
                      </Typography>
                    </Box>
                  </Stack>
                  <StatusChip
                    tone={conn.status === 'UPDATED' ? 'success' : 'warning'}
                    icon={<IconCheck size={13} />}
                    label={conn.status}
                  />
                </Stack>
                <Typography variant="caption" color="text.secondary">
                  <IconRefresh
                    size={13}
                    style={{ verticalAlign: 'middle', marginRight: 5 }}
                  />
                  Última sincronização:{' '}
                  <strong>{formatDateTimeBR(conn.last_synced_at)}</strong>
                </Typography>
              </Stack>
            </DashboardCard>
          </Grid>
        ))}
      </Grid>

      {/* Mapped Pluggy Accounts */}
      <DashboardCard
        title="Contas Open Finance Mapeadas"
        subtitle="Vínculo entre contas retornadas pela Pluggy e suas Contas monitoradas"
      >
        <Stack divider={<Divider flexItem />} spacing={1.5}>
          {(pluggyAccountsRes.data ?? []).map((pa) => (
            <Stack
              key={pa.id}
              direction={{ xs: 'column', sm: 'row' }}
              justifyContent="space-between"
              alignItems={{ xs: 'flex-start', sm: 'center' }}
              spacing={1}
              py={0.5}
            >
              <Box>
                <Typography variant="subtitle2" fontWeight={600}>
                  {pa.label} {pa.last_four ? `(•••• ${pa.last_four})` : ''}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {connById.get(pa.connection_id) ?? 'Conexão'} • {pa.account_type} /{' '}
                  {pa.account_subtype}
                </Typography>
              </Box>
              <Stack direction="row" spacing={1} alignItems="center">
                <StatusChip
                  tone={pa.local_account_id ? 'primary' : 'warning'}
                  label={
                    pa.local_account_id
                      ? localAccById.get(pa.local_account_id) ?? 'Vinculada'
                      : 'Sem vínculo'
                  }
                />
                <StatusChip
                  tone={pa.mapping_status === 'mapped' ? 'success' : 'neutral'}
                  label={pa.mapping_status}
                />
              </Stack>
            </Stack>
          ))}
        </Stack>
      </DashboardCard>

      {/* Recent Sync Runs & Reconciliation Runs */}
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, lg: 7 }}>
          <DashboardCard
            title="Últimas Execuções de Sincronização"
            subtitle="Rotina diária automática via Edge Function pluggy-stage-sync"
            noPadding
          >
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ pl: 3.5 }}>Instituição</TableCell>
                    <TableCell>Início</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="right">Lidos</TableCell>
                    <TableCell align="right" sx={{ pr: 3.5 }}>
                      Novos
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(syncRunsRes.data ?? []).map((run) => (
                    <TableRow key={run.id} hover>
                      <TableCell sx={{ pl: 3.5 }}>
                        <Typography variant="subtitle2" fontWeight={600}>
                          {(run.connection_id !== null
                            ? connById.get(run.connection_id)
                            : null) ?? `#${run.connection_id ?? '—'}`}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ whiteSpace: 'nowrap', color: 'text.secondary' }}>
                        <Typography variant="caption">
                          {formatDateTimeBR(run.started_at)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <StatusChip
                          tone={
                            run.status === 'succeeded' || run.status === 'completed'
                              ? 'success'
                              : run.status === 'failed'
                                ? 'error'
                                : 'neutral'
                          }
                          label={run.status}
                        />
                      </TableCell>
                      <TableCell align="right" className="tabular-nums">
                        {run.fetched_count ?? 0}
                      </TableCell>
                      <TableCell align="right" sx={{ pr: 3.5 }} className="tabular-nums">
                        {run.imported_count ?? 0}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </DashboardCard>
        </Grid>

        <Grid size={{ xs: 12, lg: 5 }}>
          <Stack spacing={3}>
            <DashboardCard
              title="Execuções de Reconciliação"
              subtitle="Consolidação de staging para o ledger local"
            >
              <Stack divider={<Divider flexItem />} spacing={1.5}>
                {(reconRunsRes.data ?? []).map((rr) => (
                  <Box key={rr.id}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Typography variant="subtitle2" fontWeight={600}>
                        Run #{rr.id}
                      </Typography>
                      <StatusChip
                        tone={rr.status === 'completed' ? 'success' : 'neutral'}
                        label={rr.status}
                      />
                    </Stack>
                    <Typography variant="caption" color="text.secondary" display="block">
                      {formatDateTimeBR(rr.started_at)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Vinculados: {rr.linked_existing} • Novos: {rr.imported_new} •
                      Revisão: {rr.held_for_review}
                    </Typography>
                  </Box>
                ))}
              </Stack>
            </DashboardCard>

            <DashboardCard
              title="Mapeamento de Categorias Pluggy"
              subtitle={`${(catMappingsRes.data ?? []).length} regra(s) de tradução`}
            >
              <Stack divider={<Divider flexItem />} spacing={1.25}>
                {(catMappingsRes.data ?? []).map((cm) => (
                  <Stack
                    key={cm.id}
                    direction="row"
                    justifyContent="space-between"
                    alignItems="center"
                    spacing={1}
                  >
                    <Typography variant="body2" noWrap>
                      {cm.source_category}
                    </Typography>
                    <StatusChip
                      tone="primary"
                      icon={<IconTag size={13} />}
                      label={catById.get(cm.category_id) ?? `#${cm.category_id}`}
                    />
                  </Stack>
                ))}
              </Stack>
            </DashboardCard>
          </Stack>
        </Grid>
      </Grid>
    </Stack>
  );
}
