'use client';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  Chip,
  FormControl,
  Grid,
  LinearProgress,
  MenuItem,
  Paper,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import type { ApexOptions } from 'apexcharts';
import {
  IconAlertTriangle,
  IconArrowDownRight,
  IconArrowUpLeft,
  IconArrowUpRight,
  IconBuildingBank,
  IconCreditCard,
  IconCurrencyDollar,
  IconLayoutGrid,
  IconRefresh,
} from '@tabler/icons-react';
import DashboardCard from '@/app/components/shared/DashboardCard';
import StatTile from '@/app/components/shared/StatTile';
import StatusChip, { type SoftTone } from '@/app/components/shared/StatusChip';
import ReconcileTriggerCard from './ReconcileTriggerCard';
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
  unlinkedPostedCount: number;
  unlinkedPendingCount: number;
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
  unlinkedPostedCount,
  unlinkedPendingCount,
}: OverviewDashboardProps) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  // Chronological order: oldest on the left -> current/future on the right
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

  const prevMonthKey = useMemo(() => {
    const idx = availableMonths.indexOf(selectedMonth);
    return idx > 0 ? availableMonths[idx - 1] : null;
  }, [availableMonths, selectedMonth]);

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

  // Last 8 historical months up to currentMonthKey for the Revenue Updates chart
  const chartMonths = useMemo(
    () =>
      monthlySummaries
        .filter((c) => c.month <= currentMonthKey)
        .sort((a, b) => a.month.localeCompare(b.month))
        .slice(-8),
    [monthlySummaries, currentMonthKey]
  );

  // Recurring sparkline history (last 8 months)
  const recurringSparkData = useMemo(() => {
    const sorted = [...recurringByMonth]
      .filter((r) => r.month <= currentMonthKey)
      .sort((a, b) => a.month.localeCompare(b.month))
      .slice(-8);
    if (sorted.length < 2) return [0, selectedRecurring.amount, selectedRecurring.amount];
    return sorted.map((r) => Number(r.amount.toFixed(2)));
  }, [recurringByMonth, currentMonthKey, selectedRecurring.amount]);

  // Modernize Revenue Updates bar chart (Figma 201:20663)
  const cashflowChartOptions: ApexOptions = useMemo(
    () => ({
      chart: {
        type: 'bar',
        fontFamily: theme.typography.fontFamily,
        foreColor: theme.palette.text.secondary,
        toolbar: { show: false },
      },
      colors: [theme.palette.primary.main, theme.palette.secondary.main],
      plotOptions: {
        bar: {
          horizontal: false,
          columnWidth: '34%',
          borderRadius: 5,
          borderRadiusApplication: 'end',
        },
      },
      dataLabels: { enabled: false },
      stroke: { show: true, width: 3, colors: ['transparent'] },
      grid: {
        borderColor: theme.palette.divider,
        strokeDashArray: 4,
        xaxis: { lines: { show: false } },
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
      legend: { show: false },
    }),
    [chartMonths, theme, isDark]
  );

  const cashflowChartSeries = useMemo(
    () => [
      {
        name: 'Entradas observadas',
        data: chartMonths.map((m) => Number(m.income.toFixed(2))),
      },
      {
        name: 'Gastos reais',
        data: chartMonths.map((m) => Number(m.spending.toFixed(2))),
      },
    ],
    [chartMonths]
  );

  // Compact Donut for Medium Chart Card (Figma Yearly Backup 747:12453)
  const donutData = useMemo(() => {
    const top = selectedCategories.slice(0, 3);
    const rest = selectedCategories.slice(3);
    const restSum = rest.reduce((acc, r) => acc + r.amount, 0);
    const items = [...top];
    if (restSum > 0) {
      items.push({ month: selectedMonth, category: 'Outras', amount: restSum });
    }
    return items;
  }, [selectedCategories, selectedMonth]);

  const compactDonutOptions: ApexOptions = useMemo(
    () => ({
      chart: {
        type: 'donut',
        fontFamily: theme.typography.fontFamily,
        sparkline: { enabled: true },
      },
      labels: donutData.map((d) => d.category),
      colors: [
        theme.palette.primary.main,
        theme.palette.secondary.main,
        theme.palette.success.main,
        isDark ? 'rgba(255,255,255,0.14)' : 'rgba(93,135,255,0.14)',
      ],
      stroke: { show: false },
      dataLabels: { enabled: false },
      legend: { show: false },
      plotOptions: {
        pie: {
          donut: {
            size: '74%',
          },
        },
      },
      tooltip: {
        theme: isDark ? 'dark' : 'light',
        y: { formatter: (val: number) => formatBRL(val) },
      },
    }),
    [donutData, theme, isDark]
  );

  // Smooth Wave Sparkline for Medium Chart Card (Figma Monthly Earnings 747:12498)
  const waveSparkOptions: ApexOptions = useMemo(
    () => ({
      chart: {
        type: 'area',
        sparkline: { enabled: true },
        fontFamily: theme.typography.fontFamily,
      },
      stroke: {
        curve: 'smooth',
        width: 2.5,
      },
      colors: [theme.palette.secondary.main],
      fill: {
        type: 'gradient',
        gradient: {
          shadeIntensity: 0,
          opacityFrom: isDark ? 0.28 : 0.2,
          opacityTo: 0.02,
          stops: [0, 100],
        },
      },
      tooltip: {
        theme: isDark ? 'dark' : 'light',
        fixed: { enabled: false },
        x: { show: false },
        y: {
          title: { formatter: () => 'Recorrências' },
          formatter: (val: number) => formatBRL(val),
        },
      },
    }),
    [theme, isDark]
  );

  const totalLatestBills = useMemo(
    () => latestBills.slice(0, 4).reduce((acc, b) => acc + b.total_amount, 0),
    [latestBills]
  );

  const hasExclusions =
    selectedSummary.transfers > 0 ||
    selectedSummary.settlements > 0 ||
    selectedSummary.investmentApplied > 0 ||
    selectedSummary.investmentRedeemed > 0 ||
    selectedSummary.refunds > 0;

  return (
    <Stack spacing={3}>
      {/* Compact Header & Month Selector Rail */}
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        justifyContent="space-between"
        alignItems={{ xs: 'flex-start', md: 'center' }}
        spacing={1.5}
      >
        <Box>
          <Typography
            variant="h4"
            sx={{ fontWeight: 700, letterSpacing: '-0.02em' }}
          >
            Olá, {profileName.split(' ')[0]}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Consolidado de <strong>{formatMonthLong(selectedMonth)}</strong> ·{' '}
            {selectedSummary.txCount} mov. no mês (
            {totalTransactionsCount.toLocaleString('pt-BR')} no ledger)
          </Typography>
        </Box>

        <Box
          className="scroll-rail"
          sx={{
            display: 'flex',
            gap: 0.75,
            maxWidth: '100%',
            py: 0.25,
          }}
        >
          {availableMonths.map((m) => {
            const active = m === selectedMonth;
            const isFuture = m > currentMonthKey;
            return (
              <Chip
                key={m}
                ref={active ? activeMonthPillRef : undefined}
                label={`${formatMonthLabel(m)}${isFuture ? ' • Fut.' : ''}`}
                clickable
                onClick={() => setSelectedMonth(m)}
                sx={{
                  flexShrink: 0,
                  height: 30,
                  borderRadius: '8px',
                  fontWeight: active ? 600 : 500,
                  bgcolor: active
                    ? 'primary.main'
                    : isDark
                      ? 'rgba(255,255,255,0.06)'
                      : 'rgba(42,53,71,0.05)',
                  color: active ? '#FFFFFF' : 'text.secondary',
                  '&:hover': {
                    bgcolor: active
                      ? 'primary.dark'
                      : isDark
                        ? 'rgba(93,135,255,0.18)'
                        : 'rgba(93,135,255,0.12)',
                    color: active ? '#FFFFFF' : 'primary.main',
                  },
                }}
              />
            );
          })}
        </Box>
      </Stack>

      {/* Row 1: 6 Modernize Pastel Stat Tiles (Figma 201:20655) */}
      <Grid container spacing={{ xs: 1.5, sm: 2.5 }}>
        <Grid size={{ xs: 6, sm: 4, lg: 2 }}>
          <StatTile
            label="Gastos reais"
            value={formatCompactBRL(selectedSummary.spending)}
            sublabel={formatBRL(selectedSummary.spending)}
            tone="primary"
            iconSrc="/images/icons/stat-user.svg"
            href={`/movimentacoes?month=${selectedMonth}&effect=spending`}
          />
        </Grid>
        <Grid size={{ xs: 6, sm: 4, lg: 2 }}>
          <StatTile
            label="Entradas"
            value={formatCompactBRL(selectedSummary.income)}
            sublabel={formatBRL(selectedSummary.income)}
            tone="success"
            iconSrc="/images/icons/stat-speech-bubble.svg"
            href={`/movimentacoes?month=${selectedMonth}&effect=income`}
          />
        </Grid>
        <Grid size={{ xs: 6, sm: 4, lg: 2 }}>
          <StatTile
            label="Resultado"
            value={formatCompactBRL(selectedSummary.netResult)}
            sublabel={selectedSummary.netResult >= 0 ? 'Superávit' : 'Déficit'}
            tone={selectedSummary.netResult >= 0 ? 'secondary' : 'error'}
            iconSrc="/images/icons/stat-briefcase.svg"
          />
        </Grid>
        <Grid size={{ xs: 6, sm: 4, lg: 2 }}>
          <StatTile
            label="Recorrências"
            value={formatCompactBRL(selectedRecurring.amount)}
            sublabel={`${selectedRecurring.charges} cobrança(s)`}
            tone="warning"
            iconSrc="/images/icons/stat-mailbox.svg"
            href="/recorrencias"
          />
        </Grid>
        <Grid size={{ xs: 6, sm: 4, lg: 2 }}>
          <StatTile
            label="Revisões"
            value={openReviewsCount}
            sublabel={
              recurringCandidatesCount > 0
                ? `+${recurringCandidatesCount} fixos`
                : 'Em dia'
            }
            tone="error"
            iconSrc="/images/icons/stat-favorites.svg"
            href="/revisoes"
          />
        </Grid>
        <Grid size={{ xs: 6, sm: 4, lg: 2 }}>
          <StatTile
            label="Contas ativas"
            value={accountsCount}
            sublabel={`${activeInstallmentsCount} parcelamento(s)`}
            tone="info"
            iconSrc="/images/icons/stat-connect.svg"
            href="/contas"
          />
        </Grid>
      </Grid>

      {/* Actionable Banners (Reconciliation & Pending Reviews) */}
      <ReconcileTriggerCard
        unlinkedPostedCount={unlinkedPostedCount}
        unlinkedPendingCount={unlinkedPendingCount}
        compact
      />

      {(openReviewsCount > 0 || recurringCandidatesCount > 0) && (
        <Alert
          severity="warning"
          icon={<IconAlertTriangle size={20} />}
          sx={{
            borderRadius: '12px',
            bgcolor: isDark
              ? 'rgba(255, 174, 31, 0.12)'
              : 'rgba(255, 174, 31, 0.1)',
            color: 'text.primary',
            '& .MuiAlert-icon': { color: 'warning.main' },
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
          <Typography variant="subtitle2" fontWeight={600}>
            Pendências para confirmar: {openReviewsCount} item(ns) na fila de revisão e{' '}
            {recurringCandidatesCount} candidato(s) de recorrência.
          </Typography>
        </Alert>
      )}

      {/* Row 2: Revenue Updates (8 cols) + Stacked Yearly Backup & Monthly Earnings (4 cols) */}
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, lg: 8 }}>
          <DashboardCard
            title="Evolução Mensal Real"
            subtitle="Entradas observadas vs. gastos reais — sem contagem dupla"
            action={
              <FormControl size="small" sx={{ minWidth: 132 }}>
                <Select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  sx={{ fontSize: '0.8125rem', fontWeight: 500 }}
                >
                  {availableMonths.map((m) => (
                    <MenuItem key={m} value={m}>
                      {formatMonthLabel(m)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            }
          >
            <Grid container spacing={3} alignItems="center">
              <Grid size={{ xs: 12, md: 8 }}>
                {chartMonths.length > 0 ? (
                  <Box sx={{ width: '100%', minHeight: 310 }}>
                    <Chart
                      options={cashflowChartOptions}
                      series={cashflowChartSeries}
                      type="bar"
                      height={310}
                      width="100%"
                    />
                  </Box>
                ) : (
                  <Typography color="text.secondary" py={8} textAlign="center">
                    Sem dados mensais para exibir.
                  </Typography>
                )}
              </Grid>

              {/* Figma Revenue Updates Right KPI Column */}
              <Grid size={{ xs: 12, md: 4 }}>
                <Stack spacing={3}>
                  <Stack direction="row" spacing={1.75} alignItems="center">
                    <Box
                      sx={{
                        width: 42,
                        height: 42,
                        borderRadius: '8px',
                        bgcolor: 'primary.light',
                        color: 'primary.main',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <IconLayoutGrid size={22} stroke={1.75} />
                    </Box>
                    <Box minWidth={0}>
                      <Typography
                        variant="h4"
                        className="tabular-nums"
                        sx={{ fontWeight: 700, lineHeight: 1.2 }}
                        noWrap
                      >
                        {formatBRL(selectedSummary.netResult)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Resultado de {formatMonthLabel(selectedMonth)}
                      </Typography>
                    </Box>
                  </Stack>

                  <Stack spacing={2.25}>
                    <Stack direction="row" spacing={1.5} alignItems="flex-start">
                      <Box
                        sx={{
                          width: 9,
                          height: 9,
                          borderRadius: '999px',
                          bgcolor: 'primary.main',
                          mt: 0.75,
                          flexShrink: 0,
                        }}
                      />
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Entradas no mês
                        </Typography>
                        <Typography
                          variant="h6"
                          className="tabular-nums"
                          sx={{ fontWeight: 600 }}
                        >
                          {formatBRL(selectedSummary.income)}
                        </Typography>
                      </Box>
                    </Stack>

                    <Stack direction="row" spacing={1.5} alignItems="flex-start">
                      <Box
                        sx={{
                          width: 9,
                          height: 9,
                          borderRadius: '999px',
                          bgcolor: 'secondary.main',
                          mt: 0.75,
                          flexShrink: 0,
                        }}
                      />
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Gastos no mês
                        </Typography>
                        <Typography
                          variant="h6"
                          className="tabular-nums"
                          sx={{ fontWeight: 600 }}
                        >
                          {formatBRL(selectedSummary.spending)}
                        </Typography>
                      </Box>
                    </Stack>
                  </Stack>

                  <Button
                    component={Link}
                    href={`/movimentacoes?month=${selectedMonth}`}
                    variant="contained"
                    color="primary"
                    fullWidth
                    size="large"
                  >
                    Ver extrato completo
                  </Button>
                </Stack>
              </Grid>
            </Grid>

            {/* Transparent Neutral Exclusions Strip */}
            {hasExclusions && (
              <Box
                sx={{
                  mt: 3,
                  pt: 2,
                  borderTop: `1px solid ${theme.palette.divider}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: 1,
                }}
              >
                <Typography variant="caption" color="text.secondary" fontWeight={600}>
                  Excluídos dos gastos em {formatMonthLabel(selectedMonth)}:
                </Typography>
                <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
                  {selectedSummary.transfers > 0 && (
                    <StatusChip
                      tone="neutral"
                      label={`Transf. internas: ${formatBRL(selectedSummary.transfers)}`}
                    />
                  )}
                  {selectedSummary.settlements > 0 && (
                    <StatusChip
                      tone="neutral"
                      label={`Pag. faturas: ${formatBRL(selectedSummary.settlements)}`}
                    />
                  )}
                  {selectedSummary.investmentApplied > 0 && (
                    <StatusChip
                      tone="info"
                      label={`Aplic. invest.: ${formatBRL(selectedSummary.investmentApplied)}`}
                    />
                  )}
                  {selectedSummary.investmentRedeemed > 0 && (
                    <StatusChip
                      tone="info"
                      label={`Resgates: ${formatBRL(selectedSummary.investmentRedeemed)}`}
                    />
                  )}
                  {selectedSummary.refunds > 0 && (
                    <StatusChip
                      tone="success"
                      label={`Estornos: ${formatBRL(selectedSummary.refunds)}`}
                    />
                  )}
                </Stack>
              </Box>
            )}
          </DashboardCard>
        </Grid>

        {/* Right Column: Two Stacked Medium Chart Cards (Figma 747:12453 + 747:12498) */}
        <Grid size={{ xs: 12, lg: 4 }}>
          <Stack spacing={3} height="100%">
            {/* Card A: Yearly Backup style -> Distribuição de Gastos */}
            <DashboardCard sx={{ flex: 1 }}>
              <Stack
                direction="row"
                spacing={2}
                alignItems="center"
                justifyContent="space-between"
                height="100%"
              >
                <Stack spacing={2} minWidth={0} flex={1}>
                  <Typography variant="h5" sx={{ fontWeight: 600 }}>
                    Distribuição do Mês
                  </Typography>

                  <Box>
                    <Typography
                      variant="h4"
                      className="tabular-nums"
                      sx={{ fontWeight: 700, mb: 0.75 }}
                    >
                      {formatBRL(selectedSummary.spending)}
                    </Typography>

                    <Stack direction="row" spacing={1} alignItems="center">
                      <Box
                        sx={{
                          width: 24,
                          height: 24,
                          borderRadius: '999px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          bgcolor:
                            spendingDeltaPct !== null && spendingDeltaPct > 0
                              ? 'error.light'
                              : 'success.light',
                          color:
                            spendingDeltaPct !== null && spendingDeltaPct > 0
                              ? 'error.main'
                              : 'success.main',
                        }}
                      >
                        {spendingDeltaPct !== null && spendingDeltaPct > 0 ? (
                          <IconArrowDownRight size={15} />
                        ) : (
                          <IconArrowUpLeft size={15} />
                        )}
                      </Box>
                      <Typography variant="body2" fontWeight={600}>
                        {spendingDeltaPct !== null
                          ? `${spendingDeltaPct >= 0 ? '+' : ''}${spendingDeltaPct.toFixed(1)}%`
                          : '—'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" noWrap>
                        vs mês ant.
                      </Typography>
                    </Stack>
                  </Box>

                  <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
                    {donutData.slice(0, 2).map((d, i) => (
                      <Stack key={d.category} direction="row" spacing={0.75} alignItems="center">
                        <Box
                          sx={{
                            width: 9,
                            height: 9,
                            borderRadius: '999px',
                            bgcolor: i === 0 ? 'primary.main' : 'secondary.main',
                          }}
                        />
                        <Typography variant="caption" color="text.secondary" noWrap>
                          {d.category}
                        </Typography>
                      </Stack>
                    ))}
                  </Stack>
                </Stack>

                <Box sx={{ width: 124, height: 124, flexShrink: 0 }}>
                  {donutData.length > 0 ? (
                    <Chart
                      options={compactDonutOptions}
                      series={donutData.map((d) => Number(d.amount.toFixed(2)))}
                      type="donut"
                      width={124}
                      height={124}
                    />
                  ) : (
                    <Box
                      sx={{
                        width: 124,
                        height: 124,
                        borderRadius: '999px',
                        border: `12px solid ${theme.palette.divider}`,
                      }}
                    />
                  )}
                </Box>
              </Stack>
            </DashboardCard>

            {/* Card B: Monthly Earnings style -> Recorrências Fixas with full-bleed wave */}
            <Card
              elevation={9}
              sx={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                borderRadius: '12px',
                overflow: 'hidden',
                bgcolor: 'background.paper',
                border: isDark ? `1px solid ${theme.palette.divider}` : 'none',
              }}
            >
              <Box sx={{ p: { xs: 2.5, sm: 3.5 }, pb: 1.5 }}>
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="flex-start"
                  spacing={2}
                >
                  <Box>
                    <Typography variant="h5" sx={{ fontWeight: 600, mb: 1.25 }}>
                      Recorrências Fixas
                    </Typography>
                    <Typography
                      variant="h3"
                      className="tabular-nums"
                      sx={{ fontWeight: 700, mb: 0.75 }}
                    >
                      {formatBRL(selectedRecurring.amount)}
                    </Typography>
                    <Stack direction="row" spacing={0.75} alignItems="center">
                      <Box
                        sx={{
                          width: 22,
                          height: 22,
                          borderRadius: '999px',
                          bgcolor: 'secondary.light',
                          color: 'secondary.main',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <IconArrowUpRight size={14} />
                      </Box>
                      <Typography variant="body2" fontWeight={600}>
                        {selectedRecurring.charges}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        cobrança(s) no mês
                      </Typography>
                    </Stack>
                  </Box>

                  <Avatar
                    sx={{
                      width: 42,
                      height: 42,
                      bgcolor: 'secondary.main',
                      color: '#FFFFFF',
                    }}
                  >
                    <IconCurrencyDollar size={22} stroke={1.75} />
                  </Avatar>
                </Stack>
              </Box>

              <Box sx={{ width: '100%', height: 74, mt: 'auto' }}>
                <Chart
                  options={waveSparkOptions}
                  series={[{ name: 'Recorrências', data: recurringSparkData }]}
                  type="area"
                  height={74}
                  width="100%"
                />
              </Box>
            </Card>
          </Stack>
        </Grid>
      </Grid>

      {/* Row 3: 3-Column Row matching Figma Modern Dashboard (Best Selling + Faturas + Weekly Stats) */}
      <Grid container spacing={3}>
        {/* Left: Best Selling Products Hero Card -> Gastos por Categoria (Figma 201:20674) */}
        <Grid size={{ xs: 12, lg: 4 }}>
          <Card
            elevation={9}
            sx={{
              height: '100%',
              borderRadius: '12px',
              bgcolor: 'primary.main',
              color: '#FFFFFF',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              border: 'none',
            }}
          >
            <Box sx={{ px: 3, pt: 3, pb: 1 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                <Box>
                  <Typography
                    variant="h5"
                    sx={{ fontWeight: 600, color: '#FFFFFF' }}
                  >
                    Gastos por Categoria
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{ color: 'rgba(255,255,255,0.82)', mt: 0.25 }}
                  >
                    {formatMonthLong(selectedMonth)}
                  </Typography>
                </Box>
                <Button
                  component={Link}
                  href={`/movimentacoes?month=${selectedMonth}&effect=spending`}
                  size="small"
                  sx={{
                    color: '#FFFFFF',
                    bgcolor: 'rgba(255,255,255,0.16)',
                    '&:hover': { bgcolor: 'rgba(255,255,255,0.26)' },
                  }}
                >
                  Ver todos
                </Button>
              </Stack>
            </Box>

            <Box
              sx={{
                display: 'flex',
                justifyContent: 'center',
                px: 2,
                my: -1.5,
                position: 'relative',
                zIndex: 0,
              }}
            >
              <Box
                component="img"
                src="/images/banners/hero-analytics.png"
                alt=""
                sx={{
                  width: '100%',
                  maxWidth: 240,
                  height: 148,
                  objectFit: 'contain',
                  display: 'block',
                  pointerEvents: 'none',
                }}
              />
            </Box>

            {/* Floating White/Dark Sheet */}
            <Box sx={{ p: 1.5, pt: 0, flexGrow: 1, display: 'flex' }}>
              <Paper
                elevation={0}
                sx={{
                  p: 2.25,
                  borderRadius: '8px',
                  bgcolor: 'background.paper',
                  color: 'text.primary',
                  width: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  gap: 2,
                }}
              >
                {selectedCategories.length > 0 ? (
                  selectedCategories.slice(0, 4).map((cat, idx) => {
                    const pct =
                      selectedSummary.spending > 0
                        ? (cat.amount / selectedSummary.spending) * 100
                        : 0;
                    const barColor = CHART_PALETTE[idx % CHART_PALETTE.length];
                    const toneOrder: SoftTone[] = ['primary', 'secondary', 'success', 'warning'];
                    return (
                      <Box key={cat.category}>
                        <Stack
                          direction="row"
                          justifyContent="space-between"
                          alignItems="center"
                          spacing={1}
                          mb={0.85}
                        >
                          <Box minWidth={0}>
                            <Typography
                              variant="subtitle2"
                              fontWeight={600}
                              noWrap
                            >
                              {cat.category}
                            </Typography>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              className="tabular-nums"
                            >
                              {formatBRL(cat.amount)}
                            </Typography>
                          </Box>
                          <StatusChip
                            tone={toneOrder[idx % toneOrder.length]}
                            label={`${pct.toFixed(0)}%`}
                          />
                        </Stack>
                        <LinearProgress
                          variant="determinate"
                          value={Math.min(100, pct)}
                          sx={{
                            height: 6,
                            bgcolor: isDark
                              ? 'rgba(255,255,255,0.08)'
                              : 'rgba(93,135,255,0.1)',
                            '& .MuiLinearProgress-bar': {
                              bgcolor: barColor,
                            },
                          }}
                        />
                      </Box>
                    );
                  })
                ) : (
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    textAlign="center"
                    py={4}
                  >
                    Nenhum gasto registrado em {formatMonthLabel(selectedMonth)}.
                  </Typography>
                )}
              </Paper>
            </Box>
          </Card>
        </Grid>

        {/* Middle: Mini Metrics + Faturas Recentes */}
        <Grid size={{ xs: 12, lg: 4 }}>
          <Stack spacing={3} height="100%">
            <Grid container spacing={2.5}>
              <Grid size={{ xs: 6 }}>
                <DashboardCard sx={{ p: 0 }}>
                  <Typography variant="body2" color="text.secondary" mb={0.5}>
                    Faturas recentes
                  </Typography>
                  <Typography
                    variant="h4"
                    className="tabular-nums"
                    fontWeight={700}
                    noWrap
                  >
                    {formatCompactBRL(totalLatestBills)}
                  </Typography>
                  <Stack direction="row" spacing={0.5} alignItems="center" mt={1}>
                    <Box
                      sx={{
                        width: 20,
                        height: 20,
                        borderRadius: '999px',
                        bgcolor: 'primary.light',
                        color: 'primary.main',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <IconCreditCard size={13} />
                    </Box>
                    <Typography variant="caption" color="text.secondary">
                      {latestBills.length} registrada(s)
                    </Typography>
                  </Stack>
                </DashboardCard>
              </Grid>
              <Grid size={{ xs: 6 }}>
                <DashboardCard sx={{ p: 0 }}>
                  <Typography variant="body2" color="text.secondary" mb={0.5}>
                    Parcelamentos
                  </Typography>
                  <Typography variant="h4" className="tabular-nums" fontWeight={700}>
                    {activeInstallmentsCount}
                  </Typography>
                  <Stack direction="row" spacing={0.5} alignItems="center" mt={1}>
                    <Box
                      sx={{
                        width: 20,
                        height: 20,
                        borderRadius: '999px',
                        bgcolor: 'success.light',
                        color: 'success.main',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <IconArrowUpRight size={13} />
                    </Box>
                    <Typography variant="caption" color="text.secondary">
                      ativos agora
                    </Typography>
                  </Stack>
                </DashboardCard>
              </Grid>
            </Grid>

            <DashboardCard
              title="Faturas de Cartão"
              subtitle="Próximos e últimos vencimentos"
              action={
                <Button component={Link} href="/contas" size="small">
                  Ver contas
                </Button>
              }
              sx={{ flexGrow: 1 }}
            >
              <Stack spacing={2}>
                {latestBills.slice(0, 4).map((bill) => (
                  <Stack
                    key={bill.id}
                    direction="row"
                    justifyContent="space-between"
                    alignItems="center"
                    spacing={1.5}
                  >
                    <Stack direction="row" spacing={1.5} alignItems="center" minWidth={0}>
                      <Box
                        sx={{
                          width: 40,
                          height: 40,
                          borderRadius: '8px',
                          bgcolor: 'primary.light',
                          color: 'primary.main',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        <IconCreditCard size={20} stroke={1.65} />
                      </Box>
                      <Box minWidth={0}>
                        <Typography variant="subtitle2" fontWeight={600} noWrap>
                          {bill.accountLabel}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Venc. {formatDateBR(bill.due_date)}
                        </Typography>
                      </Box>
                    </Stack>
                    <Typography
                      variant="subtitle2"
                      className="tabular-nums"
                      fontWeight={700}
                      flexShrink={0}
                    >
                      {formatBRL(bill.total_amount)}
                    </Typography>
                  </Stack>
                ))}
                {latestBills.length === 0 && (
                  <Typography variant="body2" color="text.secondary" py={3} textAlign="center">
                    Nenhuma fatura registrada.
                  </Typography>
                )}
              </Stack>
            </DashboardCard>
          </Stack>
        </Grid>

        {/* Right: Weekly Stats style -> Sincronização Open Finance (Figma 201:20676) */}
        <Grid size={{ xs: 12, lg: 4 }}>
          <DashboardCard
            title="Sincronização Open Finance"
            subtitle="Conexões Pluggy com rotina diária"
            action={
              <Button component={Link} href="/sincronizacao" size="small">
                Monitorar
              </Button>
            }
          >
            <Stack spacing={2.25}>
              {connections.map((conn, index) => {
                const isOk = conn.status === 'UPDATED';
                const tileTone = isOk
                  ? index % 2 === 0
                    ? { bg: 'primary.light', fg: 'primary.main' }
                    : { bg: 'success.light', fg: 'success.main' }
                  : { bg: 'warning.light', fg: 'warning.main' };

                return (
                  <Stack
                    key={conn.id}
                    direction="row"
                    justifyContent="space-between"
                    alignItems="center"
                    spacing={1.5}
                  >
                    <Stack direction="row" spacing={1.5} alignItems="center" minWidth={0}>
                      <Box
                        sx={{
                          width: 40,
                          height: 40,
                          borderRadius: '8px',
                          bgcolor: tileTone.bg,
                          color: tileTone.fg,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        <IconBuildingBank size={20} stroke={1.65} />
                      </Box>
                      <Box minWidth={0}>
                        <Typography variant="subtitle2" fontWeight={600} noWrap>
                          {conn.institution_name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" noWrap display="block">
                          <IconRefresh
                            size={11}
                            style={{ verticalAlign: 'middle', marginRight: 4 }}
                          />
                          {formatDateTimeBR(conn.last_synced_at)}
                        </Typography>
                      </Box>
                    </Stack>
                    <StatusChip
                      tone={isOk ? 'success' : 'warning'}
                      label={conn.status}
                    />
                  </Stack>
                );
              })}
              {connections.length === 0 && (
                <Typography variant="body2" color="text.secondary" py={4} textAlign="center">
                  Nenhuma conexão Pluggy ativa.
                </Typography>
              )}
            </Stack>
          </DashboardCard>
        </Grid>
      </Grid>

      {/* Row 4: Top Projects Table style -> Últimas Movimentações (Figma 201:20677) */}
      <DashboardCard
        title="Últimas Movimentações"
        subtitle="Registros recentes consolidados no ledger local"
        action={
          <Button
            component={Link}
            href="/movimentacoes"
            size="small"
            variant="outlined"
          >
            Ver todas
          </Button>
        }
        noPadding
      >
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ pl: { xs: 2.5, sm: 3.5 } }}>Movimentação</TableCell>
                <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>Data</TableCell>
                <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>Categoria / Efeito</TableCell>
                <TableCell align="right" sx={{ pr: { xs: 2.5, sm: 3.5 } }}>
                  Valor
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {recentTransactions.map((tx) => {
                const isCredit = tx.direction === 'credit';
                const badgeTone: SoftTone = isCredit
                  ? 'success'
                  : tx.is_own_transfer
                    ? 'secondary'
                    : tx.categoryName
                      ? 'primary'
                      : 'warning';

                return (
                  <TableRow key={tx.id} hover>
                    <TableCell sx={{ pl: { xs: 2.5, sm: 3.5 }, maxWidth: 360 }}>
                      <Stack direction="row" spacing={1.5} alignItems="center" minWidth={0}>
                        <Avatar
                          sx={{
                            width: 38,
                            height: 38,
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
                            <IconArrowUpRight size={18} />
                          ) : (
                            <IconArrowDownRight size={18} />
                          )}
                        </Avatar>
                        <Box minWidth={0}>
                          <Typography variant="subtitle2" fontWeight={600} noWrap>
                            {tx.raw_description}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" noWrap display="block">
                            {tx.accountName}
                            <Box
                              component="span"
                              sx={{ display: { xs: 'inline', sm: 'none' } }}
                            >
                              {' '}• {formatDateBR(tx.occurred_on)}
                            </Box>
                          </Typography>
                        </Box>
                      </Stack>
                    </TableCell>

                    <TableCell
                      sx={{
                        display: { xs: 'none', sm: 'table-cell' },
                        whiteSpace: 'nowrap',
                        color: 'text.secondary',
                      }}
                    >
                      {formatDateBR(tx.occurred_on)}
                    </TableCell>

                    <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                      <StatusChip
                        tone={badgeTone}
                        label={
                          tx.categoryName ??
                          ECONOMIC_EFFECT_LABELS[tx.economic_effect] ??
                          tx.economic_effect
                        }
                      />
                    </TableCell>

                    <TableCell
                      align="right"
                      sx={{ pr: { xs: 2.5, sm: 3.5 }, whiteSpace: 'nowrap' }}
                    >
                      <Typography
                        variant="subtitle2"
                        className="tabular-nums"
                        fontWeight={700}
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
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </DashboardCard>
    </Stack>
  );
}
