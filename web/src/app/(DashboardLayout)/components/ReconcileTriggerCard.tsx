'use client';
import React, { useMemo, useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
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
  { label: string; color: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'info' }
> = {
  link_existing: { label: 'Vincular existente', color: 'info' },
  hold_reconciliation_review: { label: 'Revisão reconcil.', color: 'warning' },
  import_non_spending: { label: 'Não-gasto (auto)', color: 'default' },
  import_classified_rule: { label: 'Regra (auto)', color: 'success' },
  import_classified_history: { label: 'Histórico (auto)', color: 'success' },
  import_classified_pluggy_map: { label: 'Pluggy map (auto)', color: 'success' },
  import_classified_ai: { label: 'IA ≥85% (auto)', color: 'primary' },
  import_needs_classification_review: { label: 'Revisar categoria', color: 'warning' },
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
        elevation={0}
        sx={{
          p: { xs: 2, sm: 2.5 },
          borderRadius: 2.5,
          border: `1px solid ${
            unlinkedPostedCount > 0
              ? theme.palette.primary.main
              : theme.palette.divider
          }`,
          bgcolor:
            unlinkedPostedCount > 0
              ? isDark
                ? 'rgba(93, 135, 255, 0.1)'
                : '#F3F7FF'
              : 'background.paper',
        }}
      >
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          justifyContent="space-between"
          alignItems={{ xs: 'flex-start', md: 'center' }}
          spacing={2}
        >
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Box
              sx={{
                width: 42,
                height: 42,
                borderRadius: '10px',
                bgcolor: 'primary.main',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <IconSparkles size={21} />
            </Box>
            <Box>
              <Typography variant="subtitle1" fontWeight={700}>
                {unlinkedPostedCount > 0
                  ? `${unlinkedPostedCount} movimentação(ões) do Open Finance prontas para conciliar`
                  : 'Open Finance em dia com o ledger'}
              </Typography>
              <Typography variant="caption" color="textSecondary" display="block">
                Aplica regras + histórico + mapeamento Pluggy e aciona a IA (OpenRouter) só nos casos residuais.{' '}
                {unlinkedPendingCount > 0
                  ? `(${unlinkedPendingCount} PENDING seguem retidos aguardando confirmação do banco.)`
                  : ''}
              </Typography>
            </Box>
          </Stack>

          <Stack direction="row" spacing={1} flexShrink={0} flexWrap="wrap" useFlexGap>
            <Button
              variant="outlined"
              size="small"
              disabled={isPending || unlinkedPostedCount === 0}
              onClick={() => handleRun('preview')}
              startIcon={
                isPending && runningMode === 'preview' ? (
                  <CircularProgress size={15} color="inherit" />
                ) : (
                  <IconEye size={16} />
                )
              }
            >
              {isPending && runningMode === 'preview'
                ? 'Simulando...'
                : 'Simular (Preview)'}
            </Button>
            <Button
              variant="contained"
              size="small"
              disabled={isPending || unlinkedPostedCount === 0}
              onClick={() => handleRun('apply')}
              startIcon={
                isPending && runningMode === 'apply' ? (
                  <CircularProgress size={15} color="inherit" />
                ) : (
                  <IconSparkles size={16} />
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
                <Typography variant="caption" color="textSecondary">
                  Modelo IA: {result.model} • Limiar automático:{' '}
                  {Math.round(result.confidence_threshold * 100)}% •{' '}
                  {result.summary.ai_items_evaluated} item(ns) avaliados pela IA
                </Typography>
              )}
            </Box>
            <Button
              size="small"
              color="inherit"
              onClick={() => setDialogOpen(false)}
              sx={{ minWidth: 32 }}
            >
              <IconX size={18} />
            </Button>
          </Stack>
        </DialogTitle>

        <DialogContent dividers>
          {result && (
            <Stack spacing={2}>
              {result.warning && (
                <Alert severity="warning" variant="outlined">
                  {result.warning}
                </Alert>
              )}

              {/* Summary Chips */}
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                <Chip
                  label={`Analisadas: ${result.summary.total_unlinked_posted}`}
                  size="small"
                  variant="outlined"
                />
                {result.summary.linked_existing > 0 && (
                  <Chip
                    label={`Vinculadas: ${result.summary.linked_existing}`}
                    size="small"
                    color="info"
                  />
                )}
                <Chip
                  label={`Regras/Hist./Pluggy: ${
                    result.summary.classified_by_rule +
                    result.summary.classified_by_history +
                    result.summary.classified_by_pluggy_map
                  }`}
                  size="small"
                  color="success"
                />
                <Chip
                  label={`Não-gastos: ${result.summary.imported_non_spending}`}
                  size="small"
                />
                <Chip
                  label={`Auto IA (≥85%): ${result.summary.classified_by_ai}`}
                  size="small"
                  color="primary"
                />
                <Chip
                  label={`Para revisão: ${
                    result.summary.sent_to_classification_review +
                    result.summary.held_for_reconciliation_review
                  }`}
                  size="small"
                  color="warning"
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
                <Typography color="textSecondary" py={3} textAlign="center">
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
                            mb={0.35}
                          >
                            <Chip
                              label={meta.label}
                              size="small"
                              color={meta.color}
                              sx={{ height: 20, fontSize: '0.68rem' }}
                            />
                            {item.category_name && (
                              <Chip
                                label={item.category_name}
                                size="small"
                                variant="outlined"
                                color="primary"
                                sx={{ height: 20, fontSize: '0.68rem' }}
                              />
                            )}
                            {item.confidence !== null && (
                              <Typography variant="caption" color="textSecondary">
                                {Math.round(item.confidence * 100)}%
                              </Typography>
                            )}
                          </Stack>
                          <Typography variant="subtitle2" fontWeight={700}>
                            {item.description}
                          </Typography>
                          <Typography variant="caption" color="textSecondary" display="block">
                            {formatDateBR(item.occurred_on)} • {item.account_name} —{' '}
                            {item.rationale}
                          </Typography>
                        </Box>
                        <Typography
                          variant="subtitle2"
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
