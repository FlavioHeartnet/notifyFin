'use client';
import React, { useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import {
  Box,
  Button,
  Chip,
  Divider,
  Grid,
  Paper,
  Stack,
  Tab,
  Tabs,
  Typography,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import type { ApexOptions } from 'apexcharts';
import {
  IconBuildingBank,
  IconCalendarEvent,
  IconCreditCard,
  IconHomeDollar,
} from '@tabler/icons-react';
import DashboardCard from '@/app/components/shared/DashboardCard';
import PageBanner from '@/app/components/shared/PageBanner';
import StatusChip from '@/app/components/shared/StatusChip';
import {
  ACCOUNT_TYPE_LABELS,
  CHART_PALETTE,
  formatBRL,
  formatCompactBRL,
  formatDateBR,
  formatMonthLabel,
} from '@/lib/format';

const Chart = dynamic(() => import('react-apexcharts'), { ssr: false });

export interface AccountCardItem {
  id: number;
  name: string;
  account_type: string;
  external_reference_masked: string | null;
  currency: string;
  active: boolean;
  institutionName: string;
  txCount: number;
  totalDebits: number;
  totalCredits: number;
  latestDate: string | null;
}

export interface BillItem {
  id: number;
  external_account_id: string;
  accountLabel: string;
  due_date: string;
  closing_date: string | null;
  total_amount: number;
}

export interface InstallmentItem {
  id: number;
  merchant_name: string;
  total_amount: number;
  installment_count: number;
  purchase_date: string;
  status: string;
  accountName: string;
  installmentAmount: number | null;
  currentInstallment: number | null;
}

interface AccountsClientProps {
  accounts: AccountCardItem[];
  bills: BillItem[];
  installments: InstallmentItem[];
}

export default function AccountsClient({
  accounts,
  bills,
  installments,
}: AccountsClientProps) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const [tab, setTab] = useState(0);
  const [selectedCard, setSelectedCard] = useState<string>('all');

  const cardLabels = useMemo(() => {
    const s = new Set<string>();
    bills.forEach((b) => s.add(b.accountLabel));
    return Array.from(s).sort();
  }, [bills]);

  const filteredBills = useMemo(
    () =>
      selectedCard === 'all'
        ? bills
        : bills.filter((b) => b.accountLabel === selectedCard),
    [bills, selectedCard]
  );

  const billsByMonth = useMemo(() => {
    const map = new Map<string, number>();
    filteredBills.forEach((b) => {
      const m = b.due_date.slice(0, 7);
      map.set(m, (map.get(m) ?? 0) + b.total_amount);
    });
    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-12);
  }, [filteredBills]);

  const billChartOptions: ApexOptions = useMemo(
    () => ({
      chart: {
        type: 'bar',
        fontFamily: theme.typography.fontFamily,
        foreColor: theme.palette.text.secondary,
        toolbar: { show: false },
      },
      colors: [CHART_PALETTE[0]],
      plotOptions: {
        bar: { borderRadius: 6, columnWidth: '46%', borderRadiusApplication: 'end' },
      },
      dataLabels: { enabled: false },
      grid: { borderColor: theme.palette.divider, strokeDashArray: 4 },
      xaxis: {
        categories: billsByMonth.map(([m]) => formatMonthLabel(m)),
        axisBorder: { show: false },
        axisTicks: { show: false },
      },
      yaxis: {
        labels: { formatter: (v: number) => formatCompactBRL(v) },
      },
      tooltip: {
        theme: isDark ? 'dark' : 'light',
        y: { formatter: (v: number) => formatBRL(v) },
      },
    }),
    [billsByMonth, theme, isDark]
  );

  const getAccountIcon = (type: string) => {
    if (type === 'credit_card') return <IconCreditCard size={22} stroke={1.65} />;
    if (type === 'loan') return <IconHomeDollar size={22} stroke={1.65} />;
    return <IconBuildingBank size={22} stroke={1.65} />;
  };

  const activeInstallments = installments.filter((i) => i.status === 'active');
  const completedInstallments = installments.filter((i) => i.status !== 'active');

  return (
    <Stack spacing={3}>
      <PageBanner
        title="Contas & Faturas"
        subtitle="Contas monitoradas, faturas de cartão e compromissos parcelados"
        breadcrumbs={[
          { label: 'Início', href: '/' },
          { label: 'Contas & Faturas' },
        ]}
      />

      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label={`Contas monitoradas (${accounts.length})`} />
          <Tab label={`Faturas de cartão (${bills.length})`} />
          <Tab label={`Parcelamentos (${installments.length})`} />
        </Tabs>
      </Box>

      {/* TAB 0: Contas monitoradas */}
      {tab === 0 && (
        <Grid container spacing={2.5}>
          {accounts.map((acc) => {
            const tileBg =
              acc.account_type === 'credit_card'
                ? 'primary.light'
                : acc.account_type === 'loan'
                  ? 'warning.light'
                  : 'success.light';
            const tileColor =
              acc.account_type === 'credit_card'
                ? 'primary.main'
                : acc.account_type === 'loan'
                  ? 'warning.main'
                  : 'success.main';

            return (
              <Grid key={acc.id} size={{ xs: 12, sm: 6, lg: 4 }}>
                <DashboardCard>
                  <Stack spacing={2.25} height="100%" justifyContent="space-between">
                    <Stack direction="row" spacing={1.75} alignItems="center">
                      <Box
                        sx={{
                          width: 46,
                          height: 46,
                          borderRadius: '10px',
                          bgcolor: tileBg,
                          color: tileColor,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        {getAccountIcon(acc.account_type)}
                      </Box>
                      <Box minWidth={0} flexGrow={1}>
                        <Typography variant="h6" fontWeight={600} noWrap>
                          {acc.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" display="block">
                          {acc.institutionName}
                          {acc.external_reference_masked
                            ? ` • ${acc.external_reference_masked}`
                            : ''}
                        </Typography>
                      </Box>
                    </Stack>

                    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                      <StatusChip
                        tone="neutral"
                        label={
                          ACCOUNT_TYPE_LABELS[acc.account_type] ?? acc.account_type
                        }
                      />
                      <StatusChip
                        tone="primary"
                        label={`${acc.txCount.toLocaleString('pt-BR')} lançamentos`}
                      />
                    </Stack>

                    <Divider />

                    <Grid container spacing={1.5}>
                      <Grid size={{ xs: 6 }}>
                        <Typography variant="caption" color="text.secondary">
                          Gastos acumulados
                        </Typography>
                        <Typography variant="subtitle1" className="tabular-nums" fontWeight={700}>
                          {formatBRL(acc.totalDebits)}
                        </Typography>
                      </Grid>
                      <Grid size={{ xs: 6 }}>
                        <Typography variant="caption" color="text.secondary">
                          Entradas (renda)
                        </Typography>
                        <Typography
                          variant="subtitle1"
                          className="tabular-nums"
                          fontWeight={700}
                          color="success.main"
                        >
                          {formatBRL(acc.totalCredits)}
                        </Typography>
                      </Grid>
                    </Grid>

                    <Stack
                      direction="row"
                      justifyContent="space-between"
                      alignItems="center"
                    >
                      <Typography variant="caption" color="text.secondary">
                        Último mov.: {formatDateBR(acc.latestDate)}
                      </Typography>
                      <Button
                        component={Link}
                        href={`/movimentacoes?account=${acc.id}`}
                        size="small"
                        variant="text"
                        color="primary"
                      >
                        Ver extrato
                      </Button>
                    </Stack>
                  </Stack>
                </DashboardCard>
              </Grid>
            );
          })}
        </Grid>
      )}

      {/* TAB 1: Faturas de cartão */}
      {tab === 1 && (
        <Stack spacing={3}>
          <Box className="scroll-rail" sx={{ display: 'flex', gap: 1 }}>
            <Chip
              label="Todos os cartões"
              clickable
              onClick={() => setSelectedCard('all')}
              sx={{
                borderRadius: '8px',
                fontWeight: 600,
                bgcolor:
                  selectedCard === 'all'
                    ? 'primary.main'
                    : isDark
                      ? 'rgba(255,255,255,0.06)'
                      : 'rgba(42,53,71,0.05)',
                color: selectedCard === 'all' ? '#FFFFFF' : 'text.secondary',
              }}
            />
            {cardLabels.map((lbl) => (
              <Chip
                key={lbl}
                label={lbl}
                clickable
                onClick={() => setSelectedCard(lbl)}
                sx={{
                  borderRadius: '8px',
                  fontWeight: 600,
                  bgcolor:
                    selectedCard === lbl
                      ? 'primary.main'
                      : isDark
                        ? 'rgba(255,255,255,0.06)'
                        : 'rgba(42,53,71,0.05)',
                  color: selectedCard === lbl ? '#FFFFFF' : 'text.secondary',
                }}
              />
            ))}
          </Box>

          <DashboardCard
            title="Evolução das Faturas de Cartão"
            subtitle="Total consolidado por mês de vencimento (Pluggy Open Finance)"
          >
            {billsByMonth.length > 0 ? (
              <Chart
                options={billChartOptions}
                series={[
                  {
                    name: 'Total faturas',
                    data: billsByMonth.map(([, total]) => Number(total.toFixed(2))),
                  },
                ]}
                type="bar"
                height={270}
                width="100%"
              />
            ) : (
              <Typography color="text.secondary" py={4} textAlign="center">
                Nenhuma fatura encontrada.
              </Typography>
            )}
          </DashboardCard>

          <DashboardCard
            title="Histórico de Faturas"
            subtitle={`${filteredBills.length} fatura(s) registradas`}
          >
            <Stack divider={<Divider flexItem />} spacing={1.5}>
              {filteredBills.map((bill) => (
                <Stack
                  key={bill.id}
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                  spacing={1.5}
                  py={0.5}
                >
                  <Stack direction="row" spacing={1.5} alignItems="center" minWidth={0}>
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
                      <IconCreditCard size={19} stroke={1.65} />
                    </Box>
                    <Box minWidth={0}>
                      <Typography variant="subtitle2" fontWeight={600} noWrap>
                        {bill.accountLabel}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Vencimento: <strong>{formatDateBR(bill.due_date)}</strong>
                        {bill.closing_date
                          ? ` • Fechamento: ${formatDateBR(bill.closing_date)}`
                          : ''}
                      </Typography>
                    </Box>
                  </Stack>
                  <Typography
                    variant="subtitle1"
                    className="tabular-nums"
                    fontWeight={700}
                    flexShrink={0}
                  >
                    {formatBRL(bill.total_amount)}
                  </Typography>
                </Stack>
              ))}
            </Stack>
          </DashboardCard>
        </Stack>
      )}

      {/* TAB 2: Compromissos parcelados */}
      {tab === 2 && (
        <Stack spacing={3}>
          {[
            { title: 'Compromissos Parcelados Ativos', list: activeInstallments },
            { title: 'Parcelamentos Concluídos', list: completedInstallments },
          ].map(
            (group) =>
              group.list.length > 0 && (
                <DashboardCard
                  key={group.title}
                  title={group.title}
                  subtitle={`${group.list.length} plano(s)`}
                >
                  <Grid container spacing={2}>
                    {group.list.map((inst) => (
                      <Grid key={inst.id} size={{ xs: 12, md: 6 }}>
                        <Paper
                          variant="outlined"
                          sx={{
                            p: 2.25,
                            borderRadius: '10px',
                            height: '100%',
                            bgcolor: isDark
                              ? 'rgba(255,255,255,0.02)'
                              : 'rgba(93,135,255,0.03)',
                          }}
                        >
                          <Stack spacing={1.25}>
                            <Stack
                              direction="row"
                              justifyContent="space-between"
                              alignItems="flex-start"
                              spacing={1}
                            >
                              <Typography variant="subtitle1" fontWeight={600}>
                                {inst.merchant_name}
                              </Typography>
                              <StatusChip
                                tone={inst.status === 'active' ? 'primary' : 'success'}
                                label={
                                  inst.status === 'active' ? 'Ativo' : 'Concluído'
                                }
                              />
                            </Stack>
                            <Typography variant="caption" color="text.secondary">
                              {inst.accountName} • Compra em{' '}
                              {formatDateBR(inst.purchase_date)}
                            </Typography>
                            <Stack
                              direction="row"
                              justifyContent="space-between"
                              alignItems="center"
                              pt={0.5}
                            >
                              <Stack direction="row" spacing={0.75} alignItems="center">
                                <IconCalendarEvent size={16} color={theme.palette.primary.main} />
                                <Typography variant="body2" fontWeight={600}>
                                  {inst.installment_count}x{' '}
                                  {inst.installmentAmount
                                    ? `de ${formatBRL(inst.installmentAmount)}`
                                    : ''}
                                </Typography>
                              </Stack>
                              <Typography
                                variant="subtitle2"
                                className="tabular-nums"
                                fontWeight={700}
                              >
                                Total: {formatBRL(inst.total_amount)}
                              </Typography>
                            </Stack>
                          </Stack>
                        </Paper>
                      </Grid>
                    ))}
                  </Grid>
                </DashboardCard>
              )
          )}
        </Stack>
      )}
    </Stack>
  );
}
