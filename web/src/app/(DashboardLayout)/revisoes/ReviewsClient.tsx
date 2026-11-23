'use client';
import React, { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  Alert,
  Box,
  Button,
  Chip,
  Divider,
  Paper,
  Snackbar,
  Stack,
  Tab,
  Tabs,
  Typography,
} from '@mui/material';
import { IconCheck, IconRotateClockwise, IconX } from '@tabler/icons-react';
import DashboardCard from '@/app/components/shared/DashboardCard';
import {
  formatBRL,
  formatDateTimeBR,
  PLUGGY_REASON_LABELS,
  REVIEW_TYPE_LABELS,
} from '@/lib/format';
import {
  updatePluggyReviewStatusAction,
  updateReviewQueueStatusAction,
} from '../actions/finance';

export interface ReviewQueueItem {
  id: number;
  review_type: string;
  status: string;
  priority: string;
  message: string;
  details: Record<string, unknown> | null;
  created_at: string;
  resolved_at: string | null;
}

export interface PluggyReviewItem {
  id: number;
  pluggy_ref_id: number;
  reason: string;
  status: string;
  details: Record<string, unknown> | null;
  created_at: string;
  resolved_at: string | null;
}

interface ReviewsClientProps {
  openQueue: ReviewQueueItem[];
  recentResolvedQueue: ReviewQueueItem[];
  pluggyReviews: PluggyReviewItem[];
}

export default function ReviewsClient({
  openQueue,
  recentResolvedQueue,
  pluggyReviews,
}: ReviewsClientProps) {
  const router = useRouter();
  const [tab, setTab] = useState(0);
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ open: boolean; ok: boolean; msg: string }>({
    open: false,
    ok: true,
    msg: '',
  });

  const handleQueueAction = (
    reviewId: number,
    status: 'resolved' | 'dismissed' | 'open'
  ) => {
    startTransition(async () => {
      const res = await updateReviewQueueStatusAction({ reviewId, status });
      setFeedback({ open: true, ok: res.ok, msg: res.message });
      if (res.ok) router.refresh();
    });
  };

  const handlePluggyAction = (
    reviewId: number,
    status: 'resolved' | 'dismissed' | 'open'
  ) => {
    startTransition(async () => {
      const res = await updatePluggyReviewStatusAction({ reviewId, status });
      setFeedback({ open: true, ok: res.ok, msg: res.message });
      if (res.ok) router.refresh();
    });
  };

  const openPluggyCount = pluggyReviews.filter((r) => r.status === 'open').length;

  return (
    <Stack spacing={2.5}>
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="scrollable">
          <Tab label={`Em aberto (${openQueue.length})`} />
          <Tab label={`Reconciliação Pluggy (${pluggyReviews.length})`} />
          <Tab label={`Resolvidas recentes (${recentResolvedQueue.length})`} />
        </Tabs>
      </Box>

      {/* TAB 0: Open Review Queue */}
      {tab === 0 && (
        <DashboardCard
          title="Fila de Revisão em Aberto"
          subtitle="Pendências de reconciliação, classificação ou documentos fiscais"
        >
          {openQueue.length === 0 ? (
            <Alert severity="success" variant="outlined">
              Nenhuma pendência em aberto na fila de revisão!
            </Alert>
          ) : (
            <Stack spacing={1.5}>
              {openQueue.map((item) => {
                const details = item.details ?? {};
                const issuer =
                  typeof details.issuer === 'string' ? details.issuer : null;
                const amount =
                  typeof details.amount === 'number' ? details.amount : null;
                return (
                  <Paper
                    key={item.id}
                    variant="outlined"
                    sx={{ p: 2, borderRadius: 2 }}
                  >
                    <Stack spacing={1.25}>
                      <Stack
                        direction="row"
                        justifyContent="space-between"
                        alignItems="center"
                        flexWrap="wrap"
                        gap={1}
                      >
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Chip
                            label={
                              REVIEW_TYPE_LABELS[item.review_type] ??
                              item.review_type
                            }
                            size="small"
                            color="warning"
                          />
                          <Chip
                            label={`Prioridade: ${item.priority}`}
                            size="small"
                            variant="outlined"
                          />
                        </Stack>
                        <Typography variant="caption" color="textSecondary">
                          {formatDateTimeBR(item.created_at)}
                        </Typography>
                      </Stack>

                      <Typography variant="subtitle2" fontWeight={700}>
                        {issuer ? `${issuer} — ` : ''}
                        {amount !== null ? `${formatBRL(amount)} · ` : ''}
                        {item.message}
                      </Typography>

                      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                        <Button
                          size="small"
                          variant="contained"
                          color="success"
                          disabled={isPending}
                          startIcon={<IconCheck size={15} />}
                          onClick={() => handleQueueAction(item.id, 'resolved')}
                        >
                          Resolver
                        </Button>
                        <Button
                          size="small"
                          variant="outlined"
                          color="inherit"
                          disabled={isPending}
                          startIcon={<IconX size={15} />}
                          onClick={() => handleQueueAction(item.id, 'dismissed')}
                        >
                          Dispensar
                        </Button>
                      </Stack>
                    </Stack>
                  </Paper>
                );
              })}
            </Stack>
          )}
        </DashboardCard>
      )}

      {/* TAB 1: Pluggy Reconciliation Reviews */}
      {tab === 1 && (
        <DashboardCard
          title="Revisões de Reconciliação Open Finance (Pluggy)"
          subtitle={`${openPluggyCount} em aberto • ${pluggyReviews.length} exibidas`}
        >
          <Stack divider={<Divider flexItem />} spacing={1.5}>
            {pluggyReviews.map((pr) => {
              const d = pr.details ?? {};
              const desc =
                typeof d.description === 'string'
                  ? d.description
                  : `Ref #${pr.pluggy_ref_id}`;
              const amount = typeof d.amount === 'number' ? d.amount : null;
              const resolution =
                typeof d.resolution === 'string' ? d.resolution : null;

              return (
                <Stack
                  key={pr.id}
                  direction={{ xs: 'column', sm: 'row' }}
                  justifyContent="space-between"
                  alignItems={{ xs: 'flex-start', sm: 'center' }}
                  spacing={1.25}
                  py={0.5}
                >
                  <Box minWidth={0}>
                    <Stack direction="row" spacing={1} alignItems="center" mb={0.5}>
                      <Chip
                        label={PLUGGY_REASON_LABELS[pr.reason] ?? pr.reason}
                        size="small"
                        color={pr.status === 'open' ? 'warning' : 'default'}
                        variant="outlined"
                      />
                      <Chip
                        label={pr.status}
                        size="small"
                        color={
                          pr.status === 'resolved'
                            ? 'success'
                            : pr.status === 'open'
                              ? 'warning'
                              : 'default'
                        }
                      />
                    </Stack>
                    <Typography variant="subtitle2" fontWeight={700}>
                      {desc} {amount !== null ? `• ${formatBRL(Math.abs(amount))}` : ''}
                    </Typography>
                    {resolution && (
                      <Typography variant="caption" color="textSecondary" display="block">
                        Resolução: {resolution}
                      </Typography>
                    )}
                  </Box>

                  <Stack direction="row" spacing={1} flexShrink={0}>
                    {pr.status === 'open' ? (
                      <>
                        <Button
                          size="small"
                          variant="contained"
                          color="success"
                          disabled={isPending}
                          onClick={() => handlePluggyAction(pr.id, 'resolved')}
                        >
                          Resolver
                        </Button>
                        <Button
                          size="small"
                          variant="outlined"
                          disabled={isPending}
                          onClick={() => handlePluggyAction(pr.id, 'dismissed')}
                        >
                          Dispensar
                        </Button>
                      </>
                    ) : (
                      <Button
                        size="small"
                        variant="text"
                        disabled={isPending}
                        startIcon={<IconRotateClockwise size={14} />}
                        onClick={() => handlePluggyAction(pr.id, 'open')}
                      >
                        Reabrir
                      </Button>
                    )}
                  </Stack>
                </Stack>
              );
            })}
          </Stack>
        </DashboardCard>
      )}

      {/* TAB 2: Recently Resolved */}
      {tab === 2 && (
        <DashboardCard
          title="Histórico de Revisões Resolvidas"
          subtitle="Últimos 30 registros concluídos"
        >
          <Stack divider={<Divider flexItem />} spacing={1.25}>
            {recentResolvedQueue.map((item) => (
              <Stack
                key={item.id}
                direction={{ xs: 'column', sm: 'row' }}
                justifyContent="space-between"
                alignItems={{ xs: 'flex-start', sm: 'center' }}
                spacing={1}
                py={0.5}
              >
                <Box>
                  <Stack direction="row" spacing={1} mb={0.25}>
                    <Chip
                      label={
                        REVIEW_TYPE_LABELS[item.review_type] ?? item.review_type
                      }
                      size="small"
                      variant="outlined"
                    />
                    <Chip
                      label={item.status}
                      size="small"
                      color={item.status === 'resolved' ? 'success' : 'default'}
                    />
                  </Stack>
                  <Typography variant="body2" fontWeight={600}>
                    {item.message}
                  </Typography>
                  <Typography variant="caption" color="textSecondary">
                    Resolvido em {formatDateTimeBR(item.resolved_at)}
                  </Typography>
                </Box>
                <Button
                  size="small"
                  variant="text"
                  disabled={isPending}
                  startIcon={<IconRotateClockwise size={14} />}
                  onClick={() => handleQueueAction(item.id, 'open')}
                >
                  Reabrir
                </Button>
              </Stack>
            ))}
          </Stack>
        </DashboardCard>
      )}

      <Snackbar
        open={feedback.open}
        autoHideDuration={4000}
        onClose={() => setFeedback((f) => ({ ...f, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={feedback.ok ? 'success' : 'error'} variant="filled">
          {feedback.msg}
        </Alert>
      </Snackbar>
    </Stack>
  );
}
