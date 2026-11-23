import React from 'react';
import {
  Avatar,
  Box,
  Chip,
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
  ]);

  const connections = connectionsRes.data ?? [];
  const connById = new Map(connections.map((c) => [c.id, c.institution_name]));
  const localAccById = new Map(
    (localAccountsRes.data ?? []).map((a) => [a.id, a.name])
  );
  const catById = new Map((categoriesRes.data ?? []).map((c) => [c.id, c.name]));

  return (
    <Stack spacing={2.5}>
      {/* Active Connections */}
      <Grid container spacing={2}>
        {connections.map((conn) => (
          <Grid key={conn.id} size={{ xs: 12, sm: 6, lg: 4 }}>
            <DashboardCard>
              <Stack spacing={1.5}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Stack direction="row" spacing={1.25} alignItems="center">
                    <Avatar
                      variant="rounded"
                      sx={{
                        bgcolor: 'primary.light',
                        color: 'primary.main',
                        width: 40,
                        height: 40,
                      }}
                    >
                      <IconBuildingBank size={20} />
                    </Avatar>
                    <Box>
                      <Typography variant="subtitle1" fontWeight={700}>
                        {conn.institution_name}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        Item: {conn.item_id.slice(0, 8)}…
                      </Typography>
                    </Box>
                  </Stack>
                  <Chip
                    label={conn.status}
                    size="small"
                    color={conn.status === 'UPDATED' ? 'success' : 'warning'}
                    icon={<IconCheck size={14} />}
                  />
                </Stack>
                <Typography variant="caption" color="textSecondary">
                  <IconRefresh
                    size={13}
                    style={{ verticalAlign: 'middle', marginRight: 4 }}
                  />
                  Última sincronização: <strong>{formatDateTimeBR(conn.last_synced_at)}</strong>
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
        <Stack divider={<Divider flexItem />} spacing={1.25}>
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
                <Typography variant="subtitle2" fontWeight={700}>
                  {pa.label} {pa.last_four ? `(•••• ${pa.last_four})` : ''}
                </Typography>
                <Typography variant="caption" color="textSecondary">
                  {connById.get(pa.connection_id) ?? 'Conexão'} • {pa.account_type} /{' '}
                  {pa.account_subtype}
                </Typography>
              </Box>
              <Stack direction="row" spacing={1} alignItems="center">
                <Chip
                  label={
                    pa.local_account_id
                      ? localAccById.get(pa.local_account_id) ?? 'Vinculada'
                      : 'Sem vínculo'
                  }
                  size="small"
                  color={pa.local_account_id ? 'primary' : 'warning'}
                  variant="outlined"
                />
                <Chip
                  label={pa.mapping_status}
                  size="small"
                  color={pa.mapping_status === 'mapped' ? 'success' : 'default'}
                />
              </Stack>
            </Stack>
          ))}
        </Stack>
      </DashboardCard>

      {/* Recent Sync Runs & Reconciliation Runs */}
      <Grid container spacing={2.5}>
        <Grid size={{ xs: 12, lg: 7 }}>
          <DashboardCard
            title="Últimas Execuções de Sincronização"
            subtitle="Rotina diária automática via Edge Function pluggy-stage-sync"
            noPadding
          >
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Instituição</TableCell>
                    <TableCell>Início</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="right">Lidos</TableCell>
                    <TableCell align="right">Novos</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(syncRunsRes.data ?? []).map((run) => (
                    <TableRow key={run.id} hover>
                      <TableCell>
                        <Typography variant="body2" fontWeight={600}>
                          {(run.connection_id !== null
                            ? connById.get(run.connection_id)
                            : null) ?? `#${run.connection_id ?? '—'}`}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ whiteSpace: 'nowrap' }}>
                        <Typography variant="caption">
                          {formatDateTimeBR(run.started_at)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={run.status}
                          size="small"
                          color={
                            run.status === 'succeeded' || run.status === 'completed'
                              ? 'success'
                              : run.status === 'failed'
                                ? 'error'
                                : 'default'
                          }
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell align="right">{run.fetched_count ?? 0}</TableCell>
                      <TableCell align="right">{run.imported_count ?? 0}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </DashboardCard>
        </Grid>

        <Grid size={{ xs: 12, lg: 5 }}>
          <Stack spacing={2.5}>
            <DashboardCard
              title="Execuções de Reconciliação"
              subtitle="Consolidação de staging para o ledger local"
            >
              <Stack divider={<Divider flexItem />} spacing={1.25}>
                {(reconRunsRes.data ?? []).map((rr) => (
                  <Box key={rr.id}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Typography variant="subtitle2" fontWeight={700}>
                        Run #{rr.id}
                      </Typography>
                      <Chip
                        label={rr.status}
                        size="small"
                        color={rr.status === 'completed' ? 'success' : 'default'}
                      />
                    </Stack>
                    <Typography variant="caption" color="textSecondary" display="block">
                      {formatDateTimeBR(rr.started_at)}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
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
              <Stack divider={<Divider flexItem />} spacing={1}>
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
                    <Chip
                      icon={<IconTag size={13} />}
                      label={catById.get(cm.category_id) ?? `#${cm.category_id}`}
                      size="small"
                      color="primary"
                      variant="outlined"
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
