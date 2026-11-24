'use client';
import React, { useMemo, useState, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Alert,
  Avatar,
  Box,
  Button,
  CircularProgress,
  Divider,
  Drawer,
  FormControl,
  Grid,
  IconButton,
  InputAdornment,
  InputLabel,
  ListSubheader,
  MenuItem,
  Pagination,
  Paper,
  Select,
  Snackbar,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  useMediaQuery,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
  IconArrowDownRight,
  IconArrowUpRight,
  IconCheck,
  IconFilterOff,
  IconSearch,
  IconTag,
  IconX,
} from '@tabler/icons-react';
import DashboardCard from '@/app/components/shared/DashboardCard';
import PageBanner from '@/app/components/shared/PageBanner';
import StatTile from '@/app/components/shared/StatTile';
import StatusChip, { type SoftTone } from '@/app/components/shared/StatusChip';
import {
  ECONOMIC_EFFECT_LABELS,
  formatBRL,
  formatDateBR,
  formatMonthLabel,
} from '@/lib/format';
import { reclassifyTransactionAction } from '../actions/finance';

export interface TxListItem {
  id: number;
  occurred_on: string;
  raw_description: string;
  counterparty_raw: string | null;
  amount: number;
  direction: string;
  economic_effect: string;
  is_spending: boolean;
  is_own_transfer: boolean;
  classification_status: string;
  reconciliation_status: string;
  balance_after: number | null;
  account_id: number;
  accountName: string;
  operationTypeName: string | null;
  categoryId: number | null;
  categoryName: string | null;
  classificationSource: string | null;
}

export interface CategoryOption {
  id: number;
  name: string;
  parent_id: number | null;
}

export interface AccountOption {
  id: number;
  name: string;
  account_type: string;
}

interface TransactionsClientProps {
  transactions: TxListItem[];
  totalCount: number;
  page: number;
  pageSize: number;
  summary: {
    totalDebits: number;
    totalCredits: number;
    totalSpending: number;
  };
  categories: CategoryOption[];
  accounts: AccountOption[];
  months: string[];
  initialFilters: {
    month: string;
    account: string;
    category: string;
    effect: string;
    q: string;
  };
}

export default function TransactionsClient({
  transactions,
  totalCount,
  page,
  pageSize,
  summary,
  categories,
  accounts,
  months,
  initialFilters,
}: TransactionsClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [searchInput, setSearchInput] = useState(initialFilters.q);
  const [selectedTx, setSelectedTx] = useState<TxListItem | null>(null);
  const [newCategoryId, setNewCategoryId] = useState<string>('');
  const [reason, setReason] = useState<string>('');
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ open: boolean; ok: boolean; msg: string }>({
    open: false,
    ok: true,
    msg: '',
  });

  const groupedCategories = useMemo(() => {
    const parents = categories
      .filter((c) => c.parent_id === null)
      .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
    const childrenByParent = new Map<number, CategoryOption[]>();
    categories
      .filter((c) => c.parent_id !== null)
      .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))
      .forEach((c) => {
        const list = childrenByParent.get(c.parent_id!) ?? [];
        list.push(c);
        childrenByParent.set(c.parent_id!, list);
      });
    return parents.map((p) => ({
      parent: p,
      children: childrenByParent.get(p.id) ?? [],
    }));
  }, [categories]);

  const updateFilter = (updates: Record<string, string>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([k, v]) => {
      if (v) params.set(k, v);
      else params.delete(k);
    });
    if (!('page' in updates)) {
      params.delete('page');
    }
    const qs = params.toString();
    router.push(qs ? `/movimentacoes?${qs}` : '/movimentacoes');
  };

  const handleOpenDetail = (tx: TxListItem) => {
    setSelectedTx(tx);
    setNewCategoryId(tx.categoryId ? String(tx.categoryId) : '');
    setReason('');
  };

  const handleSaveReclassification = () => {
    if (!selectedTx || !newCategoryId) return;
    startTransition(async () => {
      const res = await reclassifyTransactionAction({
        transactionId: selectedTx.id,
        categoryId: Number(newCategoryId),
        reason,
      });
      setFeedback({ open: true, ok: res.ok, msg: res.message });
      if (res.ok) {
        setSelectedTx(null);
        router.refresh();
      }
    });
  };

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const hasActiveFilters = Boolean(
    initialFilters.month ||
      initialFilters.account ||
      initialFilters.category ||
      initialFilters.effect ||
      initialFilters.q
  );

  return (
    <Stack spacing={3}>
      <PageBanner
        title="Movimentações Financeiras"
        subtitle="Extrato reconciliado com reclassificação rápida"
        breadcrumbs={[
          { label: 'Início', href: '/' },
          { label: 'Movimentações' },
        ]}
      />

      {/* Modernize Pastel Summary Tiles */}
      <Grid container spacing={2.5}>
        <Grid size={{ xs: 12, sm: 4 }}>
          <StatTile
            label="Gastos (filtro)"
            value={formatBRL(summary.totalSpending)}
            tone="primary"
            iconSrc="/images/icons/stat-user.svg"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <StatTile
            label="Entradas (filtro)"
            value={formatBRL(summary.totalCredits)}
            tone="success"
            iconSrc="/images/icons/stat-speech-bubble.svg"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <StatTile
            label="Registros encontrados"
            value={totalCount.toLocaleString('pt-BR')}
            tone="secondary"
            iconSrc="/images/icons/stat-briefcase.svg"
          />
        </Grid>
      </Grid>

      {/* Filter Bar */}
      <DashboardCard>
        <Grid container spacing={2} alignItems="center">
          <Grid size={{ xs: 12, md: 4 }}>
            <Box
              component="form"
              onSubmit={(e) => {
                e.preventDefault();
                updateFilter({ q: searchInput.trim() });
              }}
            >
              <TextField
                fullWidth
                size="small"
                placeholder="Buscar descrição ou estabelecimento..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <IconSearch size={17} />
                      </InputAdornment>
                    ),
                    endAdornment: searchInput ? (
                      <InputAdornment position="end">
                        <IconButton
                          size="small"
                          onClick={() => {
                            setSearchInput('');
                            updateFilter({ q: '' });
                          }}
                        >
                          <IconX size={15} />
                        </IconButton>
                      </InputAdornment>
                    ) : null,
                  },
                }}
              />
            </Box>
          </Grid>

          <Grid size={{ xs: 6, sm: 4, md: 2 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Mês</InputLabel>
              <Select
                label="Mês"
                value={initialFilters.month}
                onChange={(e) => updateFilter({ month: e.target.value })}
              >
                <MenuItem value="">Todos os meses</MenuItem>
                {months.map((m) => (
                  <MenuItem key={m} value={m}>
                    {formatMonthLabel(m)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid size={{ xs: 6, sm: 4, md: 2 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Conta</InputLabel>
              <Select
                label="Conta"
                value={initialFilters.account}
                onChange={(e) => updateFilter({ account: e.target.value })}
              >
                <MenuItem value="">Todas</MenuItem>
                {accounts.map((a) => (
                  <MenuItem key={a.id} value={String(a.id)}>
                    {a.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid size={{ xs: 6, sm: 4, md: 2 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Categoria</InputLabel>
              <Select
                label="Categoria"
                value={initialFilters.category}
                onChange={(e) => updateFilter({ category: e.target.value })}
              >
                <MenuItem value="">Todas</MenuItem>
                {groupedCategories.flatMap(({ parent, children }) => [
                  <MenuItem key={parent.id} value={String(parent.id)} sx={{ fontWeight: 600 }}>
                    {parent.name}
                  </MenuItem>,
                  ...children.map((ch) => (
                    <MenuItem key={ch.id} value={String(ch.id)} sx={{ pl: 3.5 }}>
                      ↳ {ch.name}
                    </MenuItem>
                  )),
                ])}
              </Select>
            </FormControl>
          </Grid>

          <Grid size={{ xs: 6, sm: 4, md: 2 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Tipo</InputLabel>
              <Select
                label="Tipo"
                value={initialFilters.effect}
                onChange={(e) => updateFilter({ effect: e.target.value })}
              >
                <MenuItem value="">Todos</MenuItem>
                <MenuItem value="spending">Somente gastos</MenuItem>
                <MenuItem value="income">Entradas</MenuItem>
                <MenuItem value="transfer">Transferências internas</MenuItem>
                <MenuItem value="settlement">Pagamento de fatura</MenuItem>
                <MenuItem value="investment">Investimentos</MenuItem>
                <MenuItem value="refund">Estornos</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          {hasActiveFilters && (
            <Grid size={{ xs: 12 }}>
              <Button
                size="small"
                variant="text"
                color="primary"
                startIcon={<IconFilterOff size={16} />}
                onClick={() => {
                  setSearchInput('');
                  router.push('/movimentacoes');
                }}
              >
                Limpar filtros
              </Button>
            </Grid>
          )}
        </Grid>
      </DashboardCard>

      {/* Transactions Table (Modernize Figma Tables 325:5045) */}
      <DashboardCard
        title="Extrato do Ledger"
        subtitle="Clique em qualquer movimentação para ver detalhes e ajustar a categoria"
        noPadding
      >
        {transactions.length === 0 ? (
          <Box py={6} px={2} textAlign="center">
            <Typography color="text.secondary">
              Nenhuma movimentação encontrada para os filtros selecionados.
            </Typography>
          </Box>
        ) : isMobile ? (
          <Stack divider={<Divider flexItem />} sx={{ px: 2.5, pb: 2 }}>
            {transactions.map((tx) => {
              const isCredit = tx.direction === 'credit';
              return (
                <Box
                  key={tx.id}
                  onClick={() => handleOpenDetail(tx)}
                  sx={{
                    py: 1.75,
                    cursor: 'pointer',
                    '&:active': { opacity: 0.75 },
                  }}
                >
                  <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="flex-start"
                    spacing={1.25}
                  >
                    <Stack direction="row" spacing={1.25} minWidth={0}>
                      <Avatar
                        sx={{
                          width: 36,
                          height: 36,
                          mt: 0.25,
                          bgcolor: isCredit ? 'success.light' : 'error.light',
                          color: isCredit ? 'success.main' : 'error.main',
                        }}
                      >
                        {isCredit ? (
                          <IconArrowUpRight size={17} />
                        ) : (
                          <IconArrowDownRight size={17} />
                        )}
                      </Avatar>
                      <Box minWidth={0}>
                        <Typography variant="subtitle2" fontWeight={600} noWrap>
                          {tx.raw_description}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" display="block" noWrap>
                          {formatDateBR(tx.occurred_on)} • {tx.accountName}
                        </Typography>
                        <Stack direction="row" spacing={0.5} mt={0.75} flexWrap="wrap" useFlexGap>
                          {tx.categoryName ? (
                            <StatusChip tone="primary" label={tx.categoryName} />
                          ) : (
                            <StatusChip
                              tone="neutral"
                              label={
                                ECONOMIC_EFFECT_LABELS[tx.economic_effect] ??
                                tx.economic_effect
                              }
                            />
                          )}
                        </Stack>
                      </Box>
                    </Stack>

                    <Typography
                      variant="subtitle2"
                      className="tabular-nums"
                      fontWeight={700}
                      flexShrink={0}
                      color={isCredit ? 'success.main' : 'text.primary'}
                    >
                      {isCredit ? '+' : '-'} {formatBRL(tx.amount)}
                    </Typography>
                  </Stack>
                </Box>
              );
            })}
          </Stack>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ pl: 3.5 }}>Data</TableCell>
                  <TableCell>Movimentação</TableCell>
                  <TableCell>Conta monitorada</TableCell>
                  <TableCell>Categoria</TableCell>
                  <TableCell>Efeito</TableCell>
                  <TableCell align="right" sx={{ pr: 3.5 }}>
                    Valor
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {transactions.map((tx) => {
                  const isCredit = tx.direction === 'credit';
                  const effectTone: SoftTone = tx.is_spending
                    ? 'neutral'
                    : tx.economic_effect === 'income'
                      ? 'success'
                      : tx.economic_effect === 'refund'
                        ? 'info'
                        : 'secondary';

                  return (
                    <TableRow
                      key={tx.id}
                      hover
                      onClick={() => handleOpenDetail(tx)}
                      sx={{ cursor: 'pointer' }}
                    >
                      <TableCell sx={{ pl: 3.5, whiteSpace: 'nowrap', color: 'text.secondary' }}>
                        {formatDateBR(tx.occurred_on)}
                      </TableCell>
                      <TableCell sx={{ maxWidth: 340 }}>
                        <Stack direction="row" spacing={1.5} alignItems="center" minWidth={0}>
                          <Avatar
                            sx={{
                              width: 34,
                              height: 34,
                              bgcolor: isCredit
                                ? 'success.light'
                                : tx.is_own_transfer
                                  ? 'secondary.light'
                                  : 'error.light',
                              color: isCredit
                                ? 'success.main'
                                : tx.is_own_transfer
                                  ? 'secondary.main'
                                  : 'error.main',
                            }}
                          >
                            {isCredit ? (
                              <IconArrowUpRight size={16} />
                            ) : (
                              <IconArrowDownRight size={16} />
                            )}
                          </Avatar>
                          <Box minWidth={0}>
                            <Typography variant="subtitle2" fontWeight={600} noWrap>
                              {tx.raw_description}
                            </Typography>
                            {tx.operationTypeName && (
                              <Typography variant="caption" color="text.secondary" noWrap display="block">
                                {tx.operationTypeName}
                              </Typography>
                            )}
                          </Box>
                        </Stack>
                      </TableCell>
                      <TableCell sx={{ whiteSpace: 'nowrap', color: 'text.secondary' }}>
                        {tx.accountName}
                      </TableCell>
                      <TableCell>
                        {tx.categoryName ? (
                          <StatusChip
                            tone="primary"
                            icon={<IconTag size={13} />}
                            label={tx.categoryName}
                          />
                        ) : (
                          <Typography variant="caption" color="text.secondary">
                            Sem categoria
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <StatusChip
                          tone={effectTone}
                          label={
                            ECONOMIC_EFFECT_LABELS[tx.economic_effect] ??
                            tx.economic_effect
                          }
                        />
                      </TableCell>
                      <TableCell align="right" sx={{ pr: 3.5, whiteSpace: 'nowrap' }}>
                        <Typography
                          variant="subtitle2"
                          className="tabular-nums"
                          fontWeight={700}
                          color={isCredit ? 'success.main' : 'text.primary'}
                        >
                          {isCredit ? '+' : '-'} {formatBRL(tx.amount)}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {totalPages > 1 && (
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              py: 2.5,
              borderTop: `1px solid ${theme.palette.divider}`,
            }}
          >
            <Pagination
              count={totalPages}
              page={page}
              color="primary"
              size={isMobile ? 'small' : 'medium'}
              onChange={(_, p) => updateFilter({ page: String(p) })}
            />
          </Box>
        )}
      </DashboardCard>

      {/* Transaction Detail & Reclassification Drawer */}
      <Drawer
        anchor={isMobile ? 'bottom' : 'right'}
        open={Boolean(selectedTx)}
        onClose={() => setSelectedTx(null)}
        PaperProps={{
          sx: {
            width: isMobile ? '100%' : 420,
            maxHeight: isMobile ? '88dvh' : '100dvh',
            borderTopLeftRadius: isMobile ? 16 : 0,
            borderTopRightRadius: isMobile ? 16 : 0,
            p: 3.5,
          },
        }}
      >
        {selectedTx && (
          <Stack spacing={2.5}>
            <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Movimentação #{selectedTx.id}
                </Typography>
                <Typography variant="h4" className="tabular-nums" fontWeight={700}>
                  {selectedTx.direction === 'credit' ? '+' : '-'}{' '}
                  {formatBRL(selectedTx.amount)}
                </Typography>
              </Box>
              <IconButton onClick={() => setSelectedTx(null)} size="small">
                <IconX size={20} />
              </IconButton>
            </Stack>

            <Paper
              variant="outlined"
              sx={{ p: 2.25, borderRadius: '10px', bgcolor: 'background.default' }}
            >
              <Typography variant="subtitle2" fontWeight={700} gutterBottom>
                {selectedTx.raw_description}
              </Typography>
              <Stack spacing={1} mt={1.5}>
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="caption" color="text.secondary">Data</Typography>
                  <Typography variant="caption" fontWeight={600}>
                    {formatDateBR(selectedTx.occurred_on)}
                  </Typography>
                </Stack>
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="caption" color="text.secondary">Conta</Typography>
                  <Typography variant="caption" fontWeight={600}>
                    {selectedTx.accountName}
                  </Typography>
                </Stack>
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="caption" color="text.secondary">Efeito econômico</Typography>
                  <Typography variant="caption" fontWeight={600}>
                    {ECONOMIC_EFFECT_LABELS[selectedTx.economic_effect] ??
                      selectedTx.economic_effect}
                  </Typography>
                </Stack>
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="caption" color="text.secondary">Reconciliação</Typography>
                  <StatusChip tone="info" label={selectedTx.reconciliation_status} />
                </Stack>
                {selectedTx.balance_after !== null && (
                  <Stack direction="row" justifyContent="space-between">
                    <Typography variant="caption" color="text.secondary">Saldo após</Typography>
                    <Typography variant="caption" className="tabular-nums" fontWeight={600}>
                      {formatBRL(selectedTx.balance_after)}
                    </Typography>
                  </Stack>
                )}
              </Stack>
            </Paper>

            <Divider />

            <Stack spacing={2}>
              <Typography variant="h6" fontWeight={600}>
                Reclassificar Categoria de Gasto
              </Typography>

              <FormControl fullWidth size="small">
                <InputLabel>Categoria</InputLabel>
                <Select
                  label="Categoria"
                  value={newCategoryId}
                  onChange={(e) => setNewCategoryId(e.target.value)}
                >
                  {groupedCategories.flatMap(({ parent, children }) => [
                    <ListSubheader key={`hdr-${parent.id}`}>
                      {parent.name}
                    </ListSubheader>,
                    <MenuItem key={parent.id} value={String(parent.id)}>
                      {parent.name} (geral)
                    </MenuItem>,
                    ...children.map((ch) => (
                      <MenuItem key={ch.id} value={String(ch.id)} sx={{ pl: 3.5 }}>
                        {ch.name}
                      </MenuItem>
                    )),
                  ])}
                </Select>
              </FormControl>

              <TextField
                label="Motivo / observação (opcional)"
                size="small"
                fullWidth
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Ex.: compra de mercado, ajuste manual..."
              />

              <Button
                variant="contained"
                size="large"
                fullWidth
                disabled={!newCategoryId || isPending}
                onClick={handleSaveReclassification}
                startIcon={
                  isPending ? (
                    <CircularProgress size={16} color="inherit" />
                  ) : (
                    <IconCheck size={18} />
                  )
                }
              >
                {isPending ? 'Salvando...' : 'Salvar classificação'}
              </Button>
            </Stack>
          </Stack>
        )}
      </Drawer>

      <Snackbar
        open={feedback.open}
        autoHideDuration={4000}
        onClose={() => setFeedback((f) => ({ ...f, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          severity={feedback.ok ? 'success' : 'error'}
          variant="filled"
          onClose={() => setFeedback((f) => ({ ...f, open: false }))}
        >
          {feedback.msg}
        </Alert>
      </Snackbar>
    </Stack>
  );
}
