'use client';
import React, { useMemo, useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  Paper,
  Snackbar,
  Stack,
  Tab,
  Tabs,
  Typography,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
  IconCheck,
  IconEye,
  IconSparkles,
  IconX,
} from '@tabler/icons-react';
import StatusChip, { type SoftTone } from '@/app/components/shared/StatusChip';
import { formatBRL, formatDateBR } from '@/lib/format';
import {
  runPluggyReconcileAction,
  type ReconcilePreviewItem,
  type ReconcileResponse,
} from '../actions/finance';

interface ReconcileTriggerCardProps {
  unlinkedPostedCount: number;
  unlinkedPendingCount: number;
  compact?: boolean;
}

const ACTION_META: Record<
  ReconcilePreviewItem['action'],
  { label: string; tone: SoftTone }
> = {
  link_existing: { label: 'Vincular existente', tone: 'info' },
  hold_reconciliation_review: { label: 'Revisão reconcil.', tone: 'warning' },
  import_non_spending: { label: 'Não-gasto (auto)', tone: 'neutral' },
  import_classified_rule: { label: 'Regra (auto)', tone: 'success' },
  import_classified_history: { label: 'Histórico (auto)', tone: 'success' },
  import_classified_pluggy_map: { label: 'Pluggy map (auto)', tone: 'success' },
  import_classified_ai: { label: 'IA ≥85% (auto)', tone: 'primary' },
  import_needs_classification_review: { label: 'Revisar categoria', tone: 'warning' },
};

export default function ReconcileTriggerCard({
  unlinkedPostedCount,
  unlinkedPendingCount,
  compact = false,
}: ReconcileTriggerCardProps) {
  const router = useRouter();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const [isPending, startTransition] = useTransition();
  const [runningMode, setRunningMode] = useState<'preview' | 'apply' | null>(null);
  const [result, setResult] = useState<ReconcileResponse | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [filterTab, setFilterTab] = useState<'all' | 'review' | 'ai' | 'auto'>('all');
  const [feedback, setFeedback] = useState<{ open: boolean; ok: boolean; msg: string }>({
    open: false,
    ok: true,
    msg: '',
  });

  const handleRun = (mode: 'preview' | 'apply') => {
    setRunningMode(mode);
    startTransition(async () => {
      const res = await runPluggyReconcileAction(mode);
      setRunningMode(null);
      if (!res.ok || !res.data) {
        setFeedback({ open: true, ok: false, msg: res.message });
        return;
      }
      setResult(res.data);
      setFilterTab('all');
      setDialogOpen(true);
      setFeedback({ open: true, ok: true, msg: res.message });
      if (mode === 'apply') {
        router.refresh();
      }
    });
  };

  const filteredItems = useMemo(() => {
    if (!result) return [];
    if (filterTab === 'review') {
      return result.items.filter(
        (i) =>
          i.action === 'import_needs_classification_review' ||
          i.action === 'hold_reconciliation_review'
      );
    }
    if (filterTab === 'ai') {
      return result.items.filter((i) => i.source === 'ai');
    }
    if (filterTab === 'auto') {
      return result.items.filter(
        (i) =>
          i.action !== 'import_needs_classification_review' &&
          i.action !== 'hold_reconciliation_review'
      );
    }
    return result.items;
  }, [result, filterTab]);

  if (compact && unlinkedPostedCount === 0) {
    return null;
  }

  return (
    <>
      <Paper
        elevation={unlinkedPostedCount > 0 ? 0 : 9}
        sx={{
          p: { xs: 2.5, sm: 3 },
          borderRadius: '12px',
          border:
            unlinkedPostedCount > 0
              ? `1px solid rgba(93, 135, 255, 0.35)`
              : isDark
                ? `1px solid ${theme.palette.divider}`
                : 'none',
          bgcolor:
            unlinkedPostedCount > 0
              ? isDark
                ? 'rgba(93, 135, 255, 0.14)'
                : 'rgba(93, 135, 255, 0.08)'
              : 'background.paper',
        }}
      >
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          justifyContent="space-between"
          alignItems={{ xs: 'flex-start', md: 'center' }}
          spacing={2}
        >
          <Stack direction="row" spacing={1.75} alignItems="center">
            <Box
              sx={{
                width: 44,
                height: 44,
                borderRadius: '10px',
                bgcolor: 'primary.main',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <IconSparkles size={22} stroke={1.75} />
            </Box>
            <Box>
              <Typography variant="h6" fontWeight={600}>
                {unlinkedPostedCount > 0
                  ? `${unlinkedPostedCount} movimentação(ões) do Open Finance prontas para conciliar`
                  : 'Open Finance em dia com o ledger'}
              </Typography>
              <Typography variant="body2" color="text.secondary" display="block">
                Aplica regras + histórico + mapeamento Pluggy e aciona a IA apenas nos casos residuais.{' '}
                {unlinkedPendingCount > 0
                  ? `(${unlinkedPendingCount} pendente(s) aguardando confirmação bancária.)`
                  : ''}
              </Typography>
            </Box>
          </Stack>

          <Stack direction="row" spacing={1.25} flexShrink={0} flexWrap="wrap" useFlexGap>
            <Button
              variant="outlined"
              size="medium"
              disabled={isPending || unlinkedPostedCount === 0}
              onClick={() => handleRun('preview')}
              startIcon={
                isPending && runningMode === 'preview' ? (
                  <CircularProgress size={15} color="inherit" />
                ) : (
                  <IconEye size={17} />
                )
              }
            >
              {isPending && runningMode === 'preview' ? 'Simulando...' : 'Simular'}
            </Button>
            <Button
              variant="contained"
              size="medium"
              disabled={isPending || unlinkedPostedCount === 0}
              onClick={() => handleRun('apply')}
              startIcon={
                isPending && runningMode === 'apply' ? (
                  <CircularProgress size={15} color="inherit" />
                ) : (
                  <IconSparkles size={17} />
                )
              }
            >
              {isPending && runningMode === 'apply'
                ? 'Conciliando...'
                : 'Conciliar agora'}
            </Button>
          </Stack>
        </Stack>
      </Paper>

      {/* Preview / Result Modal */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        fullWidth
        maxWidth="md"
        scroll="paper"
      >
        <DialogTitle>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Box>
              <Typography variant="h5" fontWeight={700}>
                {result?.mode === 'preview'
                  ? 'Simulação de Conciliação (nada foi gravado ainda)'
                  : `Conciliação concluída${result?.run_id ? ` — Run #${result.run_id}` : ''}`}
              </Typography>
              {result && (
                <Typography variant="caption" color="text.secondary">
                  Modelo IA: {result.model} • Limiar automático:{' '}
                  {Math.round(result.confidence_threshold * 100)}% •{' '}
                  {result.summary.ai_items_evaluated} item(ns) avaliados pela IA
                </Typography>
              )}
            </Box>
            <IconButton size="small" onClick={() => setDialogOpen(false)}>
              <IconX size={18} />
            </IconButton>
          </Stack>
        </DialogTitle>

        <DialogContent dividers>
          {result && (
            <Stack spacing={2}>
              {result.warning && (
                <Alert severity="warning">{result.warning}</Alert>
              )}

              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                <StatusChip
                  tone="neutral"
                  label={`Analisadas: ${result.summary.total_unlinked_posted}`}
                />
                {result.summary.linked_existing > 0 && (
                  <StatusChip
                    tone="info"
                    label={`Vinculadas: ${result.summary.linked_existing}`}
                  />
                )}
                <StatusChip
                  tone="success"
                  label={`Regras/Hist./Pluggy: ${
                    result.summary.classified_by_rule +
                    result.summary.classified_by_history +
                    result.summary.classified_by_pluggy_map
                  }`}
                />
                <StatusChip
                  tone="neutral"
                  label={`Não-gastos: ${result.summary.imported_non_spending}`}
                />
                <StatusChip
                  tone="primary"
                  label={`Auto IA (≥85%): ${result.summary.classified_by_ai}`}
                />
                <StatusChip
                  tone="warning"
                  label={`Para revisão: ${
                    result.summary.sent_to_classification_review +
                    result.summary.held_for_reconciliation_review
                  }`}
                />
              </Stack>

              <Tabs
                value={filterTab}
                onChange={(_, v) => setFilterTab(v)}
                variant="scrollable"
                sx={{ borderBottom: 1, borderColor: 'divider' }}
              >
                <Tab value="all" label={`Todos (${result.items.length})`} />
                <Tab
                  value="review"
                  label={`Revisão (${
                    result.summary.sent_to_classification_review +
                    result.summary.held_for_reconciliation_review
                  })`}
                />
                <Tab
                  value="ai"
                  label={`Avaliados pela IA (${result.summary.ai_items_evaluated})`}
                />
                <Tab value="auto" label="Automáticos" />
              </Tabs>

              {filteredItems.length === 0 ? (
                <Typography color="text.secondary" py={3} textAlign="center">
                  Nenhum item nesta aba.
                </Typography>
              ) : (
                <Stack divider={<Divider flexItem />} spacing={1.25}>
                  {filteredItems.map((item) => {
                    const meta = ACTION_META[item.action];
                    return (
                      <Stack
                        key={item.ref_id}
                        direction={{ xs: 'column', sm: 'row' }}
                        justifyContent="space-between"
                        alignItems={{ xs: 'flex-start', sm: 'center' }}
                        spacing={1}
                        py={0.5}
                      >
                        <Box minWidth={0} flexGrow={1}>
                          <Stack
                            direction="row"
                            spacing={0.75}
                            alignItems="center"
                            flexWrap="wrap"
                            useFlexGap
                            mb={0.5}
                          >
                            <StatusChip tone={meta.tone} label={meta.label} />
                            {item.category_name && (
                              <StatusChip tone="primary" label={item.category_name} />
                            )}
                            {item.confidence !== null && (
                              <Typography variant="caption" color="text.secondary" fontWeight={600}>
                                {Math.round(item.confidence * 100)}%
                              </Typography>
                            )}
                          </Stack>
                          <Typography variant="subtitle2" fontWeight={600}>
                            {item.description}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" display="block">
                            {formatDateBR(item.occurred_on)} • {item.account_name} —{' '}
                            {item.rationale}
                          </Typography>
                        </Box>
                        <Typography
                          variant="subtitle2"
                          className="tabular-nums"
                          fontWeight={700}
                          flexShrink={0}
                          color={
                            item.direction === 'credit'
                              ? 'success.main'
                              : 'text.primary'
                          }
                        >
                          {item.direction === 'credit' ? '+' : '-'}{' '}
                          {formatBRL(item.amount)}
                        </Typography>
                      </Stack>
                    );
                  })}
                </Stack>
              )}
            </Stack>
          )}
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setDialogOpen(false)} color="inherit">
            Fechar
          </Button>
          {result?.mode === 'preview' ? (
            <Button
              variant="contained"
              disabled={isPending}
              onClick={() => handleRun('apply')}
              startIcon={
                isPending ? (
                  <CircularProgress size={16} color="inherit" />
                ) : (
                  <IconCheck size={17} />
                )
              }
            >
              {isPending ? 'Aplicando...' : 'Confirmar e Conciliar Agora'}
            </Button>
          ) : (
            result &&
            result.summary.sent_to_classification_review +
              result.summary.held_for_reconciliation_review >
              0 && (
              <Button
                component={Link}
                href="/revisoes"
                variant="contained"
                color="warning"
                onClick={() => setDialogOpen(false)}
              >
                Ir para Revisões (
                {result.summary.sent_to_classification_review +
                  result.summary.held_for_reconciliation_review}
                )
              </Button>
            )
          )}
        </DialogActions>
      </Dialog>

      <Snackbar
        open={feedback.open}
        autoHideDuration={5000}
        onClose={() => setFeedback((f) => ({ ...f, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={feedback.ok ? 'success' : 'error'} variant="filled">
          {feedback.msg}
        </Alert>
      </Snackbar>
    </>
  );
}
