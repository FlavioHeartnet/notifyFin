'use client';
import React, { useMemo, useState } from 'react';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Divider,
  Grid,
  InputAdornment,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
  IconChevronDown,
  IconFileInvoice,
  IconFolder,
  IconSearch,
} from '@tabler/icons-react';
import DashboardCard from '@/app/components/shared/DashboardCard';
import PageBanner from '@/app/components/shared/PageBanner';
import StatTile from '@/app/components/shared/StatTile';
import StatusChip from '@/app/components/shared/StatusChip';
import { formatBRL, formatDateBR, formatDateTimeBR } from '@/lib/format';

export interface FiscalItemRow {
  id: number;
  line_number: number | null;
  description: string;
  quantity: number | null;
  unit_price: number | null;
  total_amount: number | null;
}

export interface FiscalDocRow {
  id: number;
  document_type: string;
  issuer_name: string | null;
  issuer_tax_id_masked: string | null;
  issued_at: string | null;
  total_amount: number | null;
  extraction_status: string;
  items: FiscalItemRow[];
}

export interface ImportBatchRow {
  id: number;
  requested_via: string;
  status: string;
  started_at: string;
  completed_at: string | null;
  files_discovered: number;
  files_imported: number;
  transactions_imported: number;
}

export interface SourceFileRow {
  id: number;
  file_name: string;
  source_kind: string;
  provider: string;
  extraction_status: string;
  created_at: string;
}

interface DocumentsClientProps {
  fiscalDocs: FiscalDocRow[];
  batches: ImportBatchRow[];
  sourceFiles: SourceFileRow[];
}

export default function DocumentsClient({
  fiscalDocs,
  batches,
  sourceFiles,
}: DocumentsClientProps) {
  const theme = useTheme();
  const [tab, setTab] = useState(0);
  const [search, setSearch] = useState('');

  const filteredDocs = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return fiscalDocs;
    return fiscalDocs.filter(
      (d) =>
        (d.issuer_name ?? '').toLowerCase().includes(q) ||
        d.items.some((i) => i.description.toLowerCase().includes(q))
    );
  }, [fiscalDocs, search]);

  const totalDocsAmount = useMemo(
    () =>
      filteredDocs.reduce((acc, d) => acc + Number(d.total_amount ?? 0), 0),
    [filteredDocs]
  );

  return (
    <Stack spacing={3}>
      <PageBanner
        title="Documentos Fiscais & Importações"
        subtitle="Notas fiscais extraídas, lotes auditáveis e arquivos fonte"
        breadcrumbs={[
          { label: 'Início', href: '/' },
          { label: 'Documentos Fiscais' },
        ]}
      />

      <Grid container spacing={2.5}>
        <Grid size={{ xs: 4 }}>
          <StatTile
            label="Notas fiscais"
            value={fiscalDocs.length}
            tone="primary"
            iconSrc="/images/icons/stat-mailbox.svg"
          />
        </Grid>
        <Grid size={{ xs: 4 }}>
          <StatTile
            label="Lotes de importação"
            value={batches.length}
            tone="secondary"
            iconSrc="/images/icons/stat-briefcase.svg"
          />
        </Grid>
        <Grid size={{ xs: 4 }}>
          <StatTile
            label="Arquivos fonte"
            value={sourceFiles.length}
            tone="success"
            iconSrc="/images/icons/stat-connect.svg"
          />
        </Grid>
      </Grid>

      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="scrollable">
          <Tab label={`Notas fiscais (${fiscalDocs.length})`} />
          <Tab label={`Lotes de importação (${batches.length})`} />
          <Tab label={`Arquivos fonte (${sourceFiles.length})`} />
        </Tabs>
      </Box>

      {/* TAB 0: Fiscal Documents */}
      {tab === 0 && (
        <DashboardCard
          title="Documentos Fiscais e Itens"
          subtitle={`Total filtrado: ${formatBRL(totalDocsAmount)}`}
        >
          <Stack spacing={2.25}>
            <TextField
              size="small"
              fullWidth
              placeholder="Buscar por emissor ou item da nota..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <IconSearch size={17} />
                    </InputAdornment>
                  ),
                },
              }}
            />

            <Stack spacing={1.25}>
              {filteredDocs.map((doc) => (
                <Accordion
                  key={doc.id}
                  variant="outlined"
                  disableGutters
                  sx={{
                    borderRadius: '10px !important',
                    borderColor: theme.palette.divider,
                    '&:before': { display: 'none' },
                  }}
                >
                  <AccordionSummary expandIcon={<IconChevronDown size={18} />}>
                    <Stack
                      direction="row"
                      justifyContent="space-between"
                      alignItems="center"
                      width="100%"
                      pr={1}
                      spacing={1.25}
                    >
                      <Stack direction="row" spacing={1.5} alignItems="center" minWidth={0}>
                        <Box
                          sx={{
                            width: 36,
                            height: 36,
                            borderRadius: '8px',
                            bgcolor: 'primary.light',
                            color: 'primary.main',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                          }}
                        >
                          <IconFileInvoice size={18} />
                        </Box>
                        <Box minWidth={0}>
                          <Typography variant="subtitle2" fontWeight={600} noWrap>
                            {doc.issuer_name || 'Emissor não identificado'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {doc.document_type.toUpperCase()} •{' '}
                            {formatDateBR(doc.issued_at)} • {doc.items.length} item(ns)
                          </Typography>
                        </Box>
                      </Stack>
                      <Typography
                        variant="subtitle2"
                        className="tabular-nums"
                        fontWeight={700}
                        flexShrink={0}
                      >
                        {formatBRL(doc.total_amount)}
                      </Typography>
                    </Stack>
                  </AccordionSummary>
                  <AccordionDetails>
                    {doc.items.length === 0 ? (
                      <Typography variant="caption" color="text.secondary">
                        Sem itens detalhados extraídos para este documento.
                      </Typography>
                    ) : (
                      <Stack divider={<Divider flexItem />} spacing={1}>
                        {doc.items.map((item) => (
                          <Stack
                            key={item.id}
                            direction="row"
                            justifyContent="space-between"
                            alignItems="center"
                            spacing={1}
                          >
                            <Box minWidth={0}>
                              <Typography variant="body2" noWrap>
                                {item.description}
                              </Typography>
                              {item.quantity !== null && (
                                <Typography variant="caption" color="text.secondary">
                                  Qtd: {item.quantity}
                                  {item.unit_price !== null
                                    ? ` × ${formatBRL(item.unit_price)}`
                                    : ''}
                                </Typography>
                              )}
                            </Box>
                            <Typography
                              variant="body2"
                              className="tabular-nums"
                              fontWeight={600}
                              flexShrink={0}
                            >
                              {formatBRL(item.total_amount)}
                            </Typography>
                          </Stack>
                        ))}
                      </Stack>
                    )}
                  </AccordionDetails>
                </Accordion>
              ))}
            </Stack>
          </Stack>
        </DashboardCard>
      )}

      {/* TAB 1: Import Batches */}
      {tab === 1 && (
        <DashboardCard
          title="Lotes de Importação"
          subtitle="Histórico auditável de importações manuais e em lote"
        >
          <Stack divider={<Divider flexItem />} spacing={1.75}>
            {batches.map((b) => (
              <Stack
                key={b.id}
                direction={{ xs: 'column', sm: 'row' }}
                justifyContent="space-between"
                alignItems={{ xs: 'flex-start', sm: 'center' }}
                spacing={1}
              >
                <Box>
                  <Stack direction="row" spacing={1} alignItems="center" mb={0.25}>
                    <Typography variant="subtitle2" fontWeight={600}>
                      Lote #{b.id} ({b.requested_via})
                    </Typography>
                    <StatusChip
                      tone={b.status === 'completed' ? 'success' : 'neutral'}
                      label={b.status}
                    />
                  </Stack>
                  <Typography variant="caption" color="text.secondary">
                    Início: {formatDateTimeBR(b.started_at)}
                    {b.completed_at
                      ? ` • Fim: ${formatDateTimeBR(b.completed_at)}`
                      : ''}
                  </Typography>
                </Box>
                <Typography variant="body2" fontWeight={600}>
                  {b.files_imported}/{b.files_discovered} arquivos •{' '}
                  {b.transactions_imported} lançamentos
                </Typography>
              </Stack>
            ))}
          </Stack>
        </DashboardCard>
      )}

      {/* TAB 2: Source Files */}
      {tab === 2 && (
        <DashboardCard
          title="Arquivos Fonte Importados"
          subtitle="Extratos bancários, faturas CSV/PDF e comprovantes"
        >
          <Stack divider={<Divider flexItem />} spacing={1.25}>
            {sourceFiles.map((f) => (
              <Stack
                key={f.id}
                direction="row"
                justifyContent="space-between"
                alignItems="center"
                spacing={1.25}
                py={0.5}
              >
                <Stack direction="row" spacing={1.5} alignItems="center" minWidth={0}>
                  <Box
                    sx={{
                      width: 36,
                      height: 36,
                      borderRadius: '8px',
                      bgcolor: 'secondary.light',
                      color: 'secondary.main',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <IconFolder size={18} />
                  </Box>
                  <Box minWidth={0}>
                    <Typography variant="subtitle2" fontWeight={600} noWrap>
                      {f.file_name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {f.source_kind} • {f.provider} • {formatDateTimeBR(f.created_at)}
                    </Typography>
                  </Box>
                </Stack>
                <StatusChip
                  tone={f.extraction_status === 'extracted' ? 'success' : 'neutral'}
                  label={f.extraction_status}
                />
              </Stack>
            ))}
          </Stack>
        </DashboardCard>
      )}
    </Stack>
  );
}
