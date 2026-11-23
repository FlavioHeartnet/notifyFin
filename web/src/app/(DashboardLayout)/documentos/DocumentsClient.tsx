'use client';
import React, { useMemo, useState } from 'react';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Chip,
  Divider,
  Grid,
  InputAdornment,
  Paper,
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
    <Stack spacing={2.5}>
      {/* Summary */}
      <Grid container spacing={1.5}>
        <Grid size={{ xs: 4 }}>
          <Paper
            elevation={0}
            sx={{
              p: 2,
              borderRadius: 2,
              border: `1px solid ${theme.palette.divider}`,
              bgcolor: 'background.paper',
            }}
          >
            <Typography variant="caption" color="textSecondary" fontWeight={600}>
              Notas fiscais
            </Typography>
            <Typography variant="h5" fontWeight={700}>
              {fiscalDocs.length}
            </Typography>
          </Paper>
        </Grid>
        <Grid size={{ xs: 4 }}>
          <Paper
            elevation={0}
            sx={{
              p: 2,
              borderRadius: 2,
              border: `1px solid ${theme.palette.divider}`,
              bgcolor: 'background.paper',
            }}
          >
            <Typography variant="caption" color="textSecondary" fontWeight={600}>
              Lotes de importação
            </Typography>
            <Typography variant="h5" fontWeight={700}>
              {batches.length}
            </Typography>
          </Paper>
        </Grid>
        <Grid size={{ xs: 4 }}>
          <Paper
            elevation={0}
            sx={{
              p: 2,
              borderRadius: 2,
              border: `1px solid ${theme.palette.divider}`,
              bgcolor: 'background.paper',
            }}
          >
            <Typography variant="caption" color="textSecondary" fontWeight={600}>
              Arquivos fonte
            </Typography>
            <Typography variant="h5" fontWeight={700}>
              {sourceFiles.length}
            </Typography>
          </Paper>
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
          <Stack spacing={2}>
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

            <Stack spacing={1}>
              {filteredDocs.map((doc) => (
                <Accordion
                  key={doc.id}
                  variant="outlined"
                  disableGutters
                  sx={{ borderRadius: '8px !important', '&:before': { display: 'none' } }}
                >
                  <AccordionSummary expandIcon={<IconChevronDown size={18} />}>
                    <Stack
                      direction="row"
                      justifyContent="space-between"
                      alignItems="center"
                      width="100%"
                      pr={1}
                      spacing={1}
                    >
                      <Stack direction="row" spacing={1.25} alignItems="center" minWidth={0}>
                        <IconFileInvoice size={18} color={theme.palette.primary.main} />
                        <Box minWidth={0}>
                          <Typography variant="subtitle2" fontWeight={700} noWrap>
                            {doc.issuer_name || 'Emissor não identificado'}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            {doc.document_type.toUpperCase()} •{' '}
                            {formatDateBR(doc.issued_at)} • {doc.items.length} item(ns)
                          </Typography>
                        </Box>
                      </Stack>
                      <Typography variant="subtitle2" fontWeight={700} flexShrink={0}>
                        {formatBRL(doc.total_amount)}
                      </Typography>
                    </Stack>
                  </AccordionSummary>
                  <AccordionDetails>
                    {doc.items.length === 0 ? (
                      <Typography variant="caption" color="textSecondary">
                        Sem itens detalhados extraídos para este documento.
                      </Typography>
                    ) : (
                      <Stack divider={<Divider flexItem />} spacing={0.75}>
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
                                <Typography variant="caption" color="textSecondary">
                                  Qtd: {item.quantity}
                                  {item.unit_price !== null
                                    ? ` × ${formatBRL(item.unit_price)}`
                                    : ''}
                                </Typography>
                              )}
                            </Box>
                            <Typography variant="body2" fontWeight={600} flexShrink={0}>
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
          <Stack divider={<Divider flexItem />} spacing={1.5}>
            {batches.map((b) => (
              <Stack
                key={b.id}
                direction={{ xs: 'column', sm: 'row' }}
                justifyContent="space-between"
                alignItems={{ xs: 'flex-start', sm: 'center' }}
                spacing={1}
              >
                <Box>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Typography variant="subtitle2" fontWeight={700}>
                      Lote #{b.id} ({b.requested_via})
                    </Typography>
                    <Chip
                      label={b.status}
                      size="small"
                      color={b.status === 'completed' ? 'success' : 'default'}
                      variant="outlined"
                    />
                  </Stack>
                  <Typography variant="caption" color="textSecondary">
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
          <Stack divider={<Divider flexItem />} spacing={1}>
            {sourceFiles.map((f) => (
              <Stack
                key={f.id}
                direction="row"
                justifyContent="space-between"
                alignItems="center"
                spacing={1.25}
                py={0.5}
              >
                <Stack direction="row" spacing={1.25} alignItems="center" minWidth={0}>
                  <IconFolder size={17} color={theme.palette.text.secondary} />
                  <Box minWidth={0}>
                    <Typography variant="subtitle2" fontWeight={600} noWrap>
                      {f.file_name}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      {f.source_kind} • {f.provider} • {formatDateTimeBR(f.created_at)}
                    </Typography>
                  </Box>
                </Stack>
                <Chip
                  label={f.extraction_status}
                  size="small"
                  variant="outlined"
                  color={f.extraction_status === 'extracted' ? 'success' : 'default'}
                />
              </Stack>
            ))}
          </Stack>
        </DashboardCard>
      )}
    </Stack>
  );
}
