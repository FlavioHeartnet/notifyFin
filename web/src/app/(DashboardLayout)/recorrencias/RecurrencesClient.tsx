'use client';
import React, { useMemo, useState, useTransition } from 'react';
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
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  Snackbar,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
} from '@mui/material';
import { IconCheck, IconRepeat, IconX } from '@tabler/icons-react';
import DashboardCard from '@/app/components/shared/DashboardCard';
import PageBanner from '@/app/components/shared/PageBanner';
import StatTile from '@/app/components/shared/StatTile';
import StatusChip from '@/app/components/shared/StatusChip';
import {
  EXPENSE_TYPE_LABELS,
  formatBRL,
  formatDateBR,
  formatMonthLabel,
} from '@/lib/format';
import { saveRecurringOverrideAction } from '../actions/finance';

export interface RecurringTxItem {
  transaction_id: number;
  occurred_on: string;
  account_name: string;
  amount: number;
  raw_description: string;
  recurring_name: string;
  expense_type: string;
  classification_source: string;
}

export interface RecurringRuleItem {
  id: number;
  label: string;
  expense_type: string;
  match_text: string;
  active: boolean;
}

export interface RecurringCandidateItem {
  transaction_id: number;
  occurred_on: string;
  amount: number;
  raw_description: string;
  review_reason: string;
}

interface RecurrencesClientProps {
  recurringTx: RecurringTxItem[];
  rules: RecurringRuleItem[];
  candidates: RecurringCandidateItem[];
}

export default function RecurrencesClient({
  recurringTx,
  rules,
  candidates,
}: RecurrencesClientProps) {
  const router = useRouter();
  const [tab, setTab] = useState(candidates.length > 0 ? 1 : 0);
  const [confirmTarget, setConfirmTarget] =
    useState<RecurringCandidateItem | null>(null);
  const [label, setLabel] = useState('');
  const [expenseType, setExpenseType] = useState('internet');
  const [note, setNote] = useState('');
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ open: boolean; ok: boolean; msg: string }>({
    open: false,
    ok: true,
    msg: '',
  });

  const groupedServices = useMemo(() => {
    const map = new Map<
      string,
      {
        name: string;
        expenseType: string;
        charges: number;
        total: number;
        latestAmount: number;
        latestDate: string;
        accountName: string;
      }
    >();
    recurringTx.forEach((tx) => {
      const cur = map.get(tx.recurring_name);
      if (!cur) {
        map.set(tx.recurring_name, {
          name: tx.recurring_name,
          expenseType: tx.expense_type,
          charges: 1,
          total: tx.amount,
          latestAmount: tx.amount,
          latestDate: tx.occurred_on,
          accountName: tx.account_name,
        });
      } else {
        cur.charges += 1;
        cur.total += tx.amount;
        if (tx.occurred_on > cur.latestDate) {
          cur.latestDate = tx.occurred_on;
          cur.latestAmount = tx.amount;
        }
      }
    });
    return Array.from(map.values()).sort((a, b) => b.latestAmount - a.latestAmount);
  }, [recurringTx]);

  const estimatedMonthlyTotal = useMemo(
    () => groupedServices.reduce((acc, s) => acc + s.latestAmount, 0),
    [groupedServices]
  );

  const openConfirmDialog = (c: RecurringCandidateItem) => {
    setConfirmTarget(c);
    setLabel(
      c.raw_description.toLowerCase().includes('claro')
        ? 'Claro'
        : c.raw_description.toLowerCase().includes('amazon')
          ? 'Amazon Digital'
          : c.raw_description.slice(0, 40)
    );
    setExpenseType(
      c.raw_description.toLowerCase().includes('claro') ? 'internet' : 'streaming'
    );
    setNote('');
  };

  const handleConfirm = () => {
    if (!confirmTarget) return;
    startTransition(async () => {
      const res = await saveRecurringOverrideAction({
        transactionId: confirmTarget.transaction_id,
        status: 'confirmed',
        label,
        expenseType,
        note,
      });
      setFeedback({ open: true, ok: res.ok, msg: res.message });
      if (res.ok) {
        setConfirmTarget(null);
        router.refresh();
      }
    });
  };

  const handleExclude = (c: RecurringCandidateItem) => {
    startTransition(async () => {
      const res = await saveRecurringOverrideAction({
        transactionId: c.transaction_id,
        status: 'excluded',
        note: 'Excluído pelo Titular no webapp',
      });
      setFeedback({ open: true, ok: res.ok, msg: res.message });
      if (res.ok) router.refresh();
    });
  };

  return (
    <Stack spacing={3}>
      <PageBanner
        title="Recorrências & Assinaturas"
        subtitle="Gastos fixos recorrentes, candidatos pendentes e regras de detecção"
        breadcrumbs={[
          { label: 'Início', href: '/' },
          { label: 'Recorrências' },
        ]}
      />

      {/* Modernize Pastel Summary Tiles */}
      <Grid container spacing={2.5}>
        <Grid size={{ xs: 12, sm: 4 }}>
          <StatTile
            label="Custo mensal estimado"
            value={formatBRL(estimatedMonthlyTotal)}
            sublabel="Última cobrança por serviço"
            tone="primary"
            iconSrc="/images/icons/stat-mailbox.svg"
          />
        </Grid>
        <Grid size={{ xs: 6, sm: 4 }}>
          <StatTile
            label="Serviços ativos"
            value={groupedServices.length}
            sublabel={`${rules.filter((r) => r.active).length} regras ativas`}
            tone="success"
            iconSrc="/images/icons/stat-connect.svg"
          />
        </Grid>
        <Grid size={{ xs: 6, sm: 4 }}>
          <StatTile
            label="Candidatos a confirmar"
            value={candidates.length}
            sublabel="Lançamentos ambíguos"
            tone={candidates.length > 0 ? 'warning' : 'secondary'}
            iconSrc="/images/icons/stat-favorites.svg"
          />
        </Grid>
      </Grid>

      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="scrollable">
          <Tab label={`Serviços recorrentes (${groupedServices.length})`} />
          <Tab label={`Candidatos pendentes (${candidates.length})`} />
          <Tab label={`Regras (${rules.length})`} />
        </Tabs>
      </Box>

      {/* TAB 0: Services */}
      {tab === 0 && (
        <Grid container spacing={2.5}>
          {groupedServices.map((svc) => (
            <Grid key={svc.name} size={{ xs: 12, sm: 6, lg: 4 }}>
              <DashboardCard>
                <Stack spacing={1.5}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1}>
                    <Stack direction="row" spacing={1.25} alignItems="center" minWidth={0}>
                      <Box
                        sx={{
                          width: 38,
                          height: 38,
                          borderRadius: '8px',
                          bgcolor: 'primary.light',
                          color: 'primary.main',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        <IconRepeat size={19} stroke={1.65} />
                      </Box>
                      <Typography variant="h6" fontWeight={600} noWrap>
                        {svc.name}
                      </Typography>
                    </Stack>
                    <StatusChip
                      tone="secondary"
                      label={EXPENSE_TYPE_LABELS[svc.expenseType] ?? svc.expenseType}
                    />
                  </Stack>

                  <Typography variant="h4" className="tabular-nums" fontWeight={700}>
                    {formatBRL(svc.latestAmount)}
                  </Typography>

                  <Box>
                    <Typography variant="caption" color="text.secondary" display="block">
                      {svc.accountName} • {svc.charges} cobrança(s) • Última em{' '}
                      {formatDateBR(svc.latestDate)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Média histórica: {formatBRL(svc.total / svc.charges)} (Total:{' '}
                      {formatBRL(svc.total)})
                    </Typography>
                  </Box>
                </Stack>
              </DashboardCard>
            </Grid>
          ))}
        </Grid>
      )}

      {/* TAB 1: Candidates */}
      {tab === 1 && (
        <DashboardCard
          title="Candidatos Pendentes de Confirmação"
          subtitle="Confirme se cada lançamento é recorrente ou exclua da fila"
        >
          {candidates.length === 0 ? (
            <Typography color="text.secondary" py={4} textAlign="center">
              Nenhum candidato pendente no momento.
            </Typography>
          ) : (
            <Stack divider={<Divider flexItem />} spacing={1.75}>
              {candidates.map((c) => (
                <Stack
                  key={c.transaction_id}
                  direction={{ xs: 'column', sm: 'row' }}
                  justifyContent="space-between"
                  alignItems={{ xs: 'flex-start', sm: 'center' }}
                  spacing={1.5}
                  py={0.5}
                >
                  <Box minWidth={0}>
                    <Typography variant="subtitle2" fontWeight={600}>
                      {c.raw_description}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {formatDateBR(c.occurred_on)} ({formatMonthLabel(c.occurred_on)}) • Motivo:{' '}
                      {c.review_reason}
                    </Typography>
                  </Box>

                  <Stack direction="row" spacing={1} alignItems="center" flexShrink={0}>
                    <Typography
                      variant="subtitle1"
                      className="tabular-nums"
                      fontWeight={700}
                      mr={1}
                    >
                      {formatBRL(c.amount)}
                    </Typography>
                    <Button
                      size="small"
                      variant="contained"
                      color="primary"
                      disabled={isPending}
                      startIcon={<IconCheck size={15} />}
                      onClick={() => openConfirmDialog(c)}
                    >
                      Confirmar
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      color="inherit"
                      disabled={isPending}
                      startIcon={<IconX size={15} />}
                      onClick={() => handleExclude(c)}
                    >
                      Ignorar
                    </Button>
                  </Stack>
                </Stack>
              ))}
            </Stack>
          )}
        </DashboardCard>
      )}

      {/* TAB 2: Rules */}
      {tab === 2 && (
        <DashboardCard
          title="Regras de Classificação de Recorrências"
          subtitle="Padrões cadastrados em recurring_classification_rules"
        >
          <Stack divider={<Divider flexItem />} spacing={1.5}>
            {rules.map((r) => (
              <Stack
                key={r.id}
                direction="row"
                justifyContent="space-between"
                alignItems="center"
                spacing={1}
                py={0.5}
              >
                <Box>
                  <Typography variant="subtitle2" fontWeight={600}>
                    {r.label}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Match: <code>{r.match_text}</code>
                  </Typography>
                </Box>
                <Stack direction="row" spacing={1}>
                  <StatusChip
                    tone="secondary"
                    label={EXPENSE_TYPE_LABELS[r.expense_type] ?? r.expense_type}
                  />
                  <StatusChip
                    tone={r.active ? 'success' : 'neutral'}
                    label={r.active ? 'Ativa' : 'Inativa'}
                  />
                </Stack>
              </Stack>
            ))}
          </Stack>
        </DashboardCard>
      )}

      {/* Confirm Recurring Dialog */}
      <Dialog
        open={Boolean(confirmTarget)}
        onClose={() => setConfirmTarget(null)}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>Confirmar Gasto Recorrente</DialogTitle>
        <DialogContent>
          {confirmTarget && (
            <Stack spacing={2} pt={1}>
              <Alert severity="info">
                <strong>{confirmTarget.raw_description}</strong> —{' '}
                {formatBRL(confirmTarget.amount)} em{' '}
                {formatDateBR(confirmTarget.occurred_on)}
              </Alert>
              <TextField
                label="Nome do serviço / assinatura"
                fullWidth
                size="small"
                required
                value={label}
                onChange={(e) => setLabel(e.target.value)}
              />
              <FormControl fullWidth size="small">
                <InputLabel>Tipo de recorrência</InputLabel>
                <Select
                  label="Tipo de recorrência"
                  value={expenseType}
                  onChange={(e) => setExpenseType(e.target.value)}
                >
                  {Object.entries(EXPENSE_TYPE_LABELS).map(([k, v]) => (
                    <MenuItem key={k} value={k}>
                      {v}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField
                label="Observação (opcional)"
                fullWidth
                size="small"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </Stack>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setConfirmTarget(null)} color="inherit">
            Cancelar
          </Button>
          <Button
            variant="contained"
            disabled={!label.trim() || isPending}
            onClick={handleConfirm}
            startIcon={
              isPending ? <CircularProgress size={15} color="inherit" /> : undefined
            }
          >
            Confirmar recorrência
          </Button>
        </DialogActions>
      </Dialog>

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
