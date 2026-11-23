'use client';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  Divider,
  Grid,
  LinearProgress,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import type { ApexOptions } from 'apexcharts';
import {
  IconAlertTriangle,
  IconArrowDownRight,
  IconArrowUpRight,
  IconBuildingBank,
  IconCreditCard,
  IconRefresh,
  IconRepeat,
  IconTrendingDown,
  IconTrendingUp,
  IconWallet,
} from '@tabler/icons-react';
import DashboardCard from '@/app/components/shared/DashboardCard';
import {
  CHART_PALETTE,
  ECONOMIC_EFFECT_LABELS,
  formatBRL,
  formatCompactBRL,
  formatDateBR,
  formatDateTimeBR,
  formatMonthLabel,
  formatMonthLong,
} from '@/lib/format';

const Chart = dynamic(() => import('react-apexcharts'), { ssr: false });

export interface MonthlyLedgerSummary {
  month: string; // YYYY-MM
  spending: number; // is_spending = true
  income: number; // economic_effect = 'income'
  refunds: number; // economic_effect = 'refund'
  netResult: number; // income - spending + refunds
  transfers: number; // own transfer outflows (excluded from spending/income)
  settlements: number; // card bill payment outflows (excluded from spending)
  investmentApplied: number; // investment debits
  investmentRedeemed: number; // investment credits
  txCount: number;
}

export interface SpendingCategoryMonthRow {
  month: string; // YYYY-MM
  category: string;
  amount: number;
}

export interface RecurringMonthRow {
  month: string; // YYYY-MM
  amount: number;
  charges: number;
}

export interface RecentTxRow {
  id: number;
  occurred_on: string;
  raw_description: string;
  amount: number;
  direction: string;
  economic_effect: string;
  is_spending: boolean;
  is_own_transfer: boolean;
  accountName: string;
  categoryName: string | null;
}

export interface BillSnapshot {
  id: number;
  due_date: string;
  closing_date: string | null;
  total_amount: number;
  accountLabel: string;
}

export interface ConnectionSnapshot {
  id: number;
  institution_name: string;
  status: string;
  last_synced_at: string | null;
}

export interface OverviewDashboardProps {
  profileName: string;
  currentMonthKey: string;
  monthlySummaries: MonthlyLedgerSummary[];
  spendingByMonthCategory: SpendingCategoryMonthRow[];
  recurringByMonth: RecurringMonthRow[];
  recentTransactions: RecentTxRow[];
  latestBills: BillSnapshot[];
  connections: ConnectionSnapshot[];
  accountsCount: number;
  totalTransactionsCount: number;
  openReviewsCount: number;
  recurringCandidatesCount: number;
  activeInstallmentsCount: number;
}

export default function OverviewDashboard({
  profileName,
  currentMonthKey,
  monthlySummaries,
  spendingByMonthCategory,
  recurringByMonth,
  recentTransactions,
  latestBills,
  connections,
  accountsCount,
  totalTransactionsCount,
  openReviewsCount,
  recurringCandidatesCount,
  activeInstallmentsCount,
}: OverviewDashboardProps) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  // Chronological order: oldest on the left → current/future on the right
  const availableMonths = useMemo(
    () =>
      monthlySummaries
        .map((m) => m.month)
        .sort((a, b) => a.localeCompare(b)),
    [monthlySummaries]
  );

  // Default to currentMonthKey (or latest month <= currentMonthKey)
  const defaultMonth = useMemo(() => {
    if (availableMonths.includes(currentMonthKey)) return currentMonthKey;
    const pastOrPresent = [...availableMonths]
      .reverse()
      .find((m) => m <= currentMonthKey);
    return pastOrPresent ?? availableMonths[availableMonths.length - 1] ?? currentMonthKey;
  }, [availableMonths, currentMonthKey]);

  const [selectedMonth, setSelectedMonth] = useState<string>(defaultMonth);
  const activeMonthPillRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    activeMonthPillRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest',
      inline: 'center',
    });
  }, [selectedMonth]);

  const selectedSummary = useMemo<MonthlyLedgerSummary>(
    () =>
      monthlySummaries.find((c) => c.month === selectedMonth) ?? {
        month: selectedMonth,
        spending: 0,
        income: 0,
        refunds: 0,
        netResult: 0,
        transfers: 0,
        settlements: 0,
        investmentApplied: 0,
        investmentRedeemed: 0,
        txCount: 0,
      },
    [monthlySummaries, selectedMonth]
  );

  const selectedCategories = useMemo(() => {
    return spendingByMonthCategory
      .filter((r) => r.month === selectedMonth && r.amount > 0)
      .sort((a, b) => b.amount - a.amount);
  }, [spendingByMonthCategory, selectedMonth]);

  // Previous month comparison for spending (ascending array -> idx - 1)
  const prevMonthKey = useMemo(() => {
    const idx = availableMonths.indexOf(selectedMonth);
    return idx > 0 ? availableMonths[idx - 1] : null;
  }, [availableMonths, selectedMonth]);

  const incomeWindowLabel = useMemo(() => {
    const [y, m] = selectedMonth.split('-').map(Number);
    if (!y || !m) return 'Janela 25/mês ant. – 24/mês';
    const prevDate = new Date(y, m - 2, 25);
    const pm = String(prevDate.getMonth() + 1).padStart(2, '0');
    const cm = String(m).padStart(2, '0');
    return `Janela 25/${pm} a 24/${cm} (inclui salário)`;
  }, [selectedMonth]);

  const prevSpending = useMemo(() => {
    if (!prevMonthKey) return 0;
    return monthlySummaries.find((m) => m.month === prevMonthKey)?.spending ?? 0;
  }, [monthlySummaries, prevMonthKey]);

  const spendingDeltaPct =
    prevSpending > 0
      ? ((selectedSummary.spending - prevSpending) / prevSpending) * 100
      : null;

  const selectedRecurring = useMemo(
    () =>
      recurringByMonth.find((r) => r.month === selectedMonth) ?? {
        month: selectedMonth,
        amount: 0,
        charges: 0,
      },
    [recurringByMonth, selectedMonth]
  );

  // Last 10 historical months up to currentMonthKey for the main chart
  const chartMonths = useMemo(
    () =>
      monthlySummaries
        .filter((c) => c.month <= currentMonthKey)
        .sort((a, b) => a.month.localeCompare(b.month))
        .slice(-10),
    [monthlySummaries, currentMonthKey]
  );

  const cashflowChartOptions: ApexOptions = useMemo(
    () => ({
      chart: {
        type: 'bar',
        fontFamily: theme.typography.fontFamily,
        foreColor: theme.palette.text.secondary,
        toolbar: { show: false },
      },
      colors: [
        theme.palette.success.main,
        theme.palette.primary.main,
        theme.palette.secondary.main,
      ],
      plotOptions: {
        bar: {
          horizontal: false,
          columnWidth: '58%',
          borderRadius: 5,
          borderRadiusApplication: 'end',
        },
      },
      dataLabels: { enabled: false },
      stroke: { show: true, width: 2, colors: ['transparent'] },
      grid: {
        borderColor: theme.palette.divider,
        strokeDashArray: 4,
      },
      xaxis: {
        categories: chartMonths.map((m) => formatMonthLabel(m.month)),
        axisBorder: { show: false },
        axisTicks: { show: false },
      },
      yaxis: {
        labels: {
          formatter: (val: number) => formatCompactBRL(val),
        },
      },
      tooltip: {
        theme: isDark ? 'dark' : 'light',
        y: {
          formatter: (val: number) => formatBRL(val),
        },
      },
      legend: {
        position: 'top',
        horizontalAlign: 'left',
      },
    }),
    [chartMonths, theme, isDark]
  );

  const cashflowChartSeries = useMemo(
    () => [
      {
        name: 'Entradas observadas',
        data: chartMonths.map((m) => m.income),
      },
      {
        name: 'Gastos reais',
        data: chartMonths.map((m) => m.spending),
      },
      {
        name: 'Estornos',
        data: chartMonths.map((m) => m.refunds),
      },
    ],
    [chartMonths]
  );

  // Top 6 categories + "Outras" for Donut chart
  const donutData = useMemo(() => {
    const top = selectedCategories.slice(0, 6);
    const rest = selectedCategories.slice(6);
    const restSum = rest.reduce((acc, r) => acc + r.amount, 0);
    const items = [...top];
    if (restSum > 0) {
      items.push({ month: selectedMonth, category: 'Outras', amount: restSum });
    }
    return items;
  }, [selectedCategories, selectedMonth]);

  const donutOptions: ApexOptions = useMemo(
    () => ({
      chart: {
        type: 'donut',
        fontFamily: theme.typography.fontFamily,
        foreColor: theme.palette.text.secondary,
      },
      labels: donutData.map((d) => d.category),
      colors: CHART_PALETTE,
      stroke: { show: false },
      dataLabels: { enabled: false },
      legend: { show: false },
      plotOptions: {
        pie: {
          donut: {
            size: '72%',
            labels: {
              show: true,
              name: { show: true, fontSize: '12px' },
              value: {
                show: true,
                fontSize: '16px',
                fontWeight: 700,
                formatter: (val: string) => formatCompactBRL(Number(val)),
              },
              total: {
                show: true,
                label: 'Gastos',
                formatter: () => formatCompactBRL(selectedSummary.spending),
              },
            },
          },
        },
      },
      tooltip: {
        theme: isDark ? 'dark' : 'light',
        y: {
          formatter: (val: number) => formatBRL(val),
        },
      },
    }),
    [donutData, selectedSummary.spending, theme, isDark]
  );

  const kpis = [
    {
      label: 'Gastos reais do mês',
      value: formatBRL(selectedSummary.spending),
      sub:
        selectedSummary.refunds > 0
          ? `Líquido c/ estornos: ${formatBRL(selectedSummary.spending - selectedSummary.refunds)}`
          : spendingDeltaPct !== null
            ? `${spendingDeltaPct >= 0 ? '+' : ''}${spendingDeltaPct.toFixed(1)}% vs mês ant.`
            : 'Sem base anterior',
      icon: <IconTrendingDown size={22} />,
      bg: isDark ? 'rgba(93, 135, 255, 0.16)' : '#ECF2FF',
      color: theme.palette.primary.main,
      positive: spendingDeltaPct !== null ? spendingDeltaPct <= 0 : true,
    },
    {
      label: 'Entradas observadas',
      value: formatBRL(selectedSummary.income),
      sub: incomeWindowLabel,
      icon: <IconTrendingUp size={22} />,
      bg: isDark ? 'rgba(19, 222, 185, 0.16)' : '#E6FFFA',
      color: theme.palette.success.main,
      positive: true,
    },
    {
      label: 'Resultado do mês',
      value: formatBRL(selectedSummary.netResult),
      sub: 'Entradas − Gastos + Estornos',
      icon: <IconWallet size={22} />,
      bg:
        selectedSummary.netResult >= 0
          ? isDark
            ? 'rgba(73, 190, 255, 0.16)'
            : '#E8F7FF'
          : isDark
            ? 'rgba(250, 137, 107, 0.16)'
            : '#FDEDE8',
      color:
        selectedSummary.netResult >= 0
          ? theme.palette.secondary.main
          : theme.palette.error.main,
      positive: selectedSummary.netResult >= 0,
    },
    {
      label: 'Recorrências',
      value: formatBRL(selectedRecurring.amount),
      sub: `${selectedRecurring.charges} cobrança(s) no mês`,
      icon: <IconRepeat size={22} />,
      bg: isDark ? 'rgba(255, 174, 31, 0.16)' : '#FEF5E5',
      color: theme.palette.warning.main,
      positive: true,
    },
  ];

  // Keep all months chronologically (oldest left -> newest/future right)
  const visibleMonthPills = availableMonths;

  return (
    <Stack spacing={2.5}>
      {/* Welcome & Month Selector Banner */}
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        justifyContent="space-between"
        alignItems={{ xs: 'flex-start', md: 'center' }}
        spacing={1.5}
      >
        <Box>
          <Typography variant="h4" fontWeight={700}>
            Olá, {profileName.split(' ')[0]}
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Consolidado de <strong>{formatMonthLong(selectedMonth)}</strong> ·{' '}
            {selectedSummary.txCount} mov. no mês ({totalTransactionsCount.toLocaleString('pt-BR')} no ledger em {accountsCount} contas)
          </Typography>
        </Box>

        <Stack direction="row" spacing={1}>
          <Button
            component={Link}
            href={`/movimentacoes?month=${selectedMonth}`}
            variant="contained"
            size="small"
          >
            Ver extrato
          </Button>
          <Button
            component={Link}
            href="/revisoes"
            variant="outlined"
            size="small"
            color={openReviewsCount > 0 ? 'warning' : 'primary'}
          >
            Revisões ({openReviewsCount})
          </Button>
        </Stack>
      </Stack>

      {/* Scrollable Month Selector Pills (Chronological: oldest left -> newest right) */}
      <Box className="scroll-rail" sx={{ display: 'flex', gap: 1, pb: 0.5 }}>
        {visibleMonthPills.map((m) => {
          const active = m === selectedMonth;
          const isFuture = m > currentMonthKey;
          return (
            <Chip
              key={m}
              ref={active ? activeMonthPillRef : undefined}
              label={`${formatMonthLabel(m)}${isFuture ? ' • Fut.' : ''}`}
              clickable
              color={active ? 'primary' : 'default'}
              variant={active ? 'filled' : 'outlined'}
              onClick={() => setSelectedMonth(m)}
              sx={{
                fontWeight: active ? 700 : 500,
                flexShrink: 0,
              }}
            />
          );
        })}
      </Box>

      {/* Pending Action Banner */}
      {(openReviewsCount > 0 || recurringCandidatesCount > 0) && (
        <Alert
          severity="warning"
          variant="outlined"
          icon={<IconAlertTriangle size={20} />}
          sx={{
            borderRadius: 2,
            bgcolor: isDark ? 'rgba(255, 174, 31, 0.08)' : '#FFFBF2',
          }}
          action={
            <Stack direction="row" spacing={1}>
              {openReviewsCount > 0 && (
                <Button
                  component={Link}
                  href="/revisoes"
                  size="small"
                  color="warning"
                  variant="contained"
                >
                  Revisar ({openReviewsCount})
                </Button>
              )}
              {recurringCandidatesCount > 0 && (
                <Button
                  component={Link}
                  href="/recorrencias"
                  size="small"
                  color="warning"
                  variant="outlined"
                >
                  Recorrências ({recurringCandidatesCount})
                </Button>
              )}
            </Stack>
          }
        >
          <Typography variant="body2" fontWeight={600}>
            Você tem pendências para confirmar: {openReviewsCount} item(ns) na fila de revisão e {recurringCandidatesCount} candidato(s) de recorrência.
          </Typography>
        </Alert>
      )}

      {/* 4 Modernize KPI Cards */}
      <Grid container spacing={{ xs: 1.5, sm: 2.5 }}>
        {kpis.map((kpi) => (
          <Grid key={kpi.label} size={{ xs: 6, lg: 3 }}>
            <Paper
              elevation={0}
              sx={{
                p: { xs: 2, sm: 2.5 },
                borderRadius: 2.5,
                bgcolor: 'background.paper',
                border: `1px solid ${theme.palette.divider}`,
                height: '100%',
              }}
            >
              <Stack spacing={1.5}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Avatar
                    sx={{
                      width: { xs: 38, sm: 44 },
                      height: { xs: 38, sm: 44 },
                      bgcolor: kpi.bg,
                      color: kpi.color,
                      borderRadius: '10px',
                    }}
                    variant="rounded"
                  >
                    {kpi.icon}
                  </Avatar>
                </Stack>
                <Box>
                  <Typography
                    variant="caption"
                    color="textSecondary"
                    fontWeight={600}
                    sx={{ display: 'block', mb: 0.25 }}
                  >
                    {kpi.label}
                  </Typography>
                  <Typography
                    variant="h5"
                    fontWeight={700}
                    sx={{
                      fontSize: { xs: '1.05rem', sm: '1.35rem' },
                      letterSpacing: '-0.02em',
                    }}
                    noWrap
                  >
                    {kpi.value}
                  </Typography>
                  <Typography
                    variant="caption"
                    color={kpi.positive ? 'textSecondary' : 'error.main'}
                    sx={{ display: 'block', mt: 0.35 }}
                    noWrap
                  >
                    {kpi.sub}
                  </Typography>
                </Box>
              </Stack>
            </Paper>
          </Grid>
        ))}
      </Grid>

      {/* Transparent breakdown of non-spending / neutral movements excluded from KPIs */}
      {(selectedSummary.transfers > 0 ||
        selectedSummary.settlements > 0 ||
        selectedSummary.investmentApplied > 0 ||
        selectedSummary.investmentRedeemed > 0 ||
        selectedSummary.refunds > 0) && (
        <Paper
          elevation={0}
          sx={{
            px: { xs: 1.75, sm: 2.5 },
            py: 1.5,
            borderRadius: 2,
            border: `1px solid ${theme.palette.divider}`,
            bgcolor: 'background.paper',
          }}
        >
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={1}
            alignItems={{ xs: 'flex-start', sm: 'center' }}
            justifyContent="space-between"
            flexWrap="wrap"
            useFlexGap
          >
            <Typography variant="caption" color="textSecondary" fontWeight={600}>
              Excluídos dos gastos/entradas em {formatMonthLabel(selectedMonth)} (sem contagem dupla):
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              {selectedSummary.transfers > 0 && (
                <Chip
                  size="small"
                  variant="outlined"
                  label={`Transf. internas: ${formatBRL(selectedSummary.transfers)}`}
                />
              )}
              {selectedSummary.settlements > 0 && (
                <Chip
                  size="small"
                  variant="outlined"
                  label={`Pag. faturas: ${formatBRL(selectedSummary.settlements)}`}
                />
              )}
              {selectedSummary.investmentApplied > 0 && (
                <Chip
                  size="small"
                  variant="outlined"
                  color="info"
                  label={`Aplic. invest.: ${formatBRL(selectedSummary.investmentApplied)}`}
                />
              )}
              {selectedSummary.investmentRedeemed > 0 && (
                <Chip
                  size="small"
                  variant="outlined"
                  color="info"
                  label={`Resgates invest.: ${formatBRL(selectedSummary.investmentRedeemed)}`}
                />
              )}
              {selectedSummary.refunds > 0 && (
                <Chip
                  size="small"
                  variant="outlined"
                  color="success"
                  label={`Estornos: ${formatBRL(selectedSummary.refunds)}`}
                />
              )}
            </Stack>
          </Stack>
        </Paper>
      )}

      {/* Main Charts Row */}
      <Grid container spacing={{ xs: 2, sm: 2.5 }}>
        <Grid size={{ xs: 12, lg: 8 }}>
          <DashboardCard
            title="Evolução Mensal Real"
            subtitle="Entradas (renda), gastos reais (is_spending) e estornos — sem transferências internas nem pagamento de faturas"
          >
            {chartMonths.length > 0 ? (
              <Box sx={{ width: '100%', minHeight: 300 }}>
                <Chart
                  options={cashflowChartOptions}
                  series={cashflowChartSeries}
                  type="bar"
                  height={300}
                  width="100%"
                />
              </Box>
            ) : (
              <Typography color="textSecondary" py={6} textAlign="center">
                Sem dados mensais para exibir.
              </Typography>
            )}
          </DashboardCard>
        </Grid>

        <Grid size={{ xs: 12, lg: 4 }}>
          <DashboardCard
            title="Gastos por Categoria"
            subtitle={formatMonthLong(selectedMonth)}
            action={
              <Button
                component={Link}
                href={`/movimentacoes?month=${selectedMonth}&effect=spending`}
                size="small"
              >
                Detalhes
              </Button>
            }
          >
            {donutData.length > 0 ? (
              <Stack spacing={2}>
                <Box sx={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
                  <Chart
                    options={donutOptions}
                    series={donutData.map((d) => Number(d.amount.toFixed(2)))}
                    type="donut"
                    height={210}
                    width="100%"
                  />
                </Box>

                <Stack spacing={1.25}>
                  {selectedCategories.slice(0, 6).map((cat, idx) => {
                    const pct =
                      selectedSummary.spending > 0
                        ? (cat.amount / selectedSummary.spending) * 100
                        : 0;
                    return (
                      <Box key={cat.category}>
                        <Stack
                          direction="row"
                          justifyContent="space-between"
                          alignItems="center"
                          mb={0.4}
                        >
                          <Stack direction="row" spacing={1} alignItems="center" minWidth={0}>
                            <Box
                              sx={{
                                width: 9,
                                height: 9,
                                borderRadius: '50%',
                                bgcolor: CHART_PALETTE[idx % CHART_PALETTE.length],
                                flexShrink: 0,
                              }}
                            />
                            <Typography variant="body2" fontWeight={600} noWrap>
                              {cat.category}
                            </Typography>
                          </Stack>
                          <Typography variant="body2" fontWeight={700} flexShrink={0}>
                            {formatBRL(cat.amount)}{' '}
                            <Typography
                              component="span"
                              variant="caption"
                              color="textSecondary"
                            >
                              ({pct.toFixed(0)}%)
                            </Typography>
                          </Typography>
                        </Stack>
                        <LinearProgress
                          variant="determinate"
                          value={Math.min(100, pct)}
                          sx={{
                            height: 6,
                            borderRadius: 3,
                            bgcolor: theme.palette.action.hover,
                            '& .MuiLinearProgress-bar': {
                              borderRadius: 3,
                              bgcolor: CHART_PALETTE[idx % CHART_PALETTE.length],
                            },
                          }}
                        />
                      </Box>
                    );
                  })}
                </Stack>
              </Stack>
            ) : (
              <Typography color="textSecondary" py={6} textAlign="center">
                Nenhum gasto registrado em {formatMonthLabel(selectedMonth)}.
              </Typography>
            )}
          </DashboardCard>
        </Grid>
      </Grid>

      {/* Bottom Row: Recent Transactions + Bills & Pluggy Health */}
      <Grid container spacing={{ xs: 2, sm: 2.5 }}>
        <Grid size={{ xs: 12, lg: 7 }}>
          <DashboardCard
            title="Últimas Movimentações"
            subtitle="Registros recentes consolidados em financial_transactions"
            action={
              <Button component={Link} href="/movimentacoes" size="small">
                Ver todas
              </Button>
            }
          >
            <Stack divider={<Divider flexItem />} spacing={1.25}>
              {recentTransactions.map((tx) => {
                const isCredit = tx.direction === 'credit';
                return (
                  <Stack
                    key={tx.id}
                    direction="row"
                    justifyContent="space-between"
                    alignItems="center"
                    spacing={1.5}
                    sx={{ py: 0.5 }}
                  >
                    <Stack direction="row" spacing={1.5} alignItems="center" minWidth={0}>
                      <Avatar
                        sx={{
                          width: 36,
                          height: 36,
                          bgcolor: isCredit
                            ? isDark
                              ? 'rgba(19,222,185,0.16)'
                              : '#E6FFFA'
                            : tx.is_own_transfer
                              ? isDark
                                ? 'rgba(73,190,255,0.16)'
                                : '#E8F7FF'
                              : isDark
                                ? 'rgba(250,137,107,0.16)'
                                : '#FDEDE8',
                          color: isCredit
                            ? 'success.main'
                            : tx.is_own_transfer
                              ? 'secondary.main'
                              : 'error.main',
                        }}
                      >
                        {isCredit ? (
                          <IconArrowUpRight size={18} />
                        ) : (
                          <IconArrowDownRight size={18} />
                        )}
                      </Avatar>
                      <Box minWidth={0}>
                        <Typography variant="subtitle2" fontWeight={600} noWrap>
                          {tx.raw_description}
                        </Typography>
                        <Stack
                          direction="row"
                          spacing={0.75}
                          alignItems="center"
                          flexWrap="wrap"
                          useFlexGap
                        >
                          <Typography variant="caption" color="textSecondary">
                            {formatDateBR(tx.occurred_on)}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            •
                          </Typography>
                          <Typography variant="caption" color="textSecondary" noWrap>
                            {tx.accountName}
                          </Typography>
                          {tx.categoryName ? (
                            <Chip
                              label={tx.categoryName}
                              size="small"
                              sx={{ height: 18, fontSize: '0.68rem' }}
                            />
                          ) : (
                            <Chip
                              label={
                                ECONOMIC_EFFECT_LABELS[tx.economic_effect] ??
                                tx.economic_effect
                              }
                              size="small"
                              variant="outlined"
                              sx={{ height: 18, fontSize: '0.68rem' }}
                            />
                          )}
                        </Stack>
                      </Box>
                    </Stack>

                    <Typography
                      variant="subtitle2"
                      fontWeight={700}
                      flexShrink={0}
                      color={
                        isCredit
                          ? 'success.main'
                          : tx.is_own_transfer
                            ? 'text.secondary'
                            : 'text.primary'
                      }
                    >
                      {isCredit ? '+' : '-'} {formatBRL(tx.amount)}
                    </Typography>
                  </Stack>
                );
              })}
            </Stack>
          </DashboardCard>
        </Grid>

        <Grid size={{ xs: 12, lg: 5 }}>
          <Stack spacing={2.5} height="100%">
            <DashboardCard
              title="Faturas Recentes"
              subtitle={`${activeInstallmentsCount} compromisso(s) parcelado(s) ativos`}
              action={
                <Button component={Link} href="/contas" size="small">
                  Contas
                </Button>
              }
            >
              <Stack spacing={1.5}>
                {latestBills.slice(0, 4).map((bill) => (
                  <Stack
                    key={bill.id}
                    direction="row"
                    justifyContent="space-between"
                    alignItems="center"
                    spacing={1}
                  >
                    <Stack direction="row" spacing={1.25} alignItems="center" minWidth={0}>
                      <Avatar
                        variant="rounded"
                        sx={{
                          width: 34,
                          height: 34,
                          bgcolor: isDark ? 'rgba(93,135,255,0.16)' : '#ECF2FF',
                          color: 'primary.main',
                        }}
                      >
                        <IconCreditCard size={18} />
                      </Avatar>
                      <Box minWidth={0}>
                        <Typography variant="subtitle2" fontWeight={600} noWrap>
                          {bill.accountLabel}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          Vencimento: {formatDateBR(bill.due_date)}
                        </Typography>
                      </Box>
                    </Stack>
                    <Typography variant="subtitle2" fontWeight={700} flexShrink={0}>
                      {formatBRL(bill.total_amount)}
                    </Typography>
                  </Stack>
                ))}
              </Stack>
            </DashboardCard>

            <DashboardCard
              title="Sincronização Open Finance"
              subtitle="Conexões Pluggy com rotina diária"
              action={
                <Button component={Link} href="/sincronizacao" size="small">
                  Monitorar
                </Button>
              }
            >
              <Stack spacing={1.25}>
                {connections.map((conn) => (
                  <Stack
                    key={conn.id}
                    direction="row"
                    justifyContent="space-between"
                    alignItems="center"
                    spacing={1}
                  >
                    <Stack direction="row" spacing={1.25} alignItems="center" minWidth={0}>
                      <Avatar
                        variant="rounded"
                        sx={{
                          width: 32,
                          height: 32,
                          bgcolor: isDark ? 'rgba(19,222,185,0.16)' : '#E6FFFA',
                          color: 'success.main',
                        }}
                      >
                        <IconBuildingBank size={17} />
                      </Avatar>
                      <Box minWidth={0}>
                        <Typography variant="subtitle2" fontWeight={600} noWrap>
                          {conn.institution_name}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          <IconRefresh
                            size={11}
                            style={{ verticalAlign: 'middle', marginRight: 4 }}
                          />
                          {formatDateTimeBR(conn.last_synced_at)}
                        </Typography>
                      </Box>
                    </Stack>
                    <Chip
                      label={conn.status}
                      size="small"
                      color={conn.status === 'UPDATED' ? 'success' : 'warning'}
                      variant="outlined"
                      sx={{ fontWeight: 600, fontSize: '0.7rem' }}
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
