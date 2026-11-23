'use client';
import React, { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  Divider,
  FormControl,
  FormControlLabel,
  Grid,
  IconButton,
  InputLabel,
  ListSubheader,
  MenuItem,
  Paper,
  Select,
  Snackbar,
  Stack,
  Switch,
  Tab,
  Tabs,
  TextField,
  Typography,
} from '@mui/material';
import {
  IconCheck,
  IconPlus,
  IconRotateClockwise,
  IconSparkles,
  IconTrash,
  IconX,
} from '@tabler/icons-react';
import DashboardCard from '@/app/components/shared/DashboardCard';
import {
  formatBRL,
  formatDateBR,
  formatDateTimeBR,
  PLUGGY_REASON_LABELS,
  REVIEW_TYPE_LABELS,
} from '@/lib/format';
import {
  createClassificationRuleAction,
  deleteClassificationRuleAction,
  resolveClassificationReviewAction,
  toggleClassificationRuleAction,
  updatePluggyReviewStatusAction,
  updateReviewQueueStatusAction,
} from '../actions/finance';

export interface ReviewQueueItem {
  id: number;
  transaction_id: number | null;
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

export interface CategoryOption {
  id: number;
  name: string;
  parent_id: number | null;
}

export interface ClassificationRuleItem {
  id: number;
  priority: number;
  field_name: string;
  match_type: string;
  pattern: string;
  category_id: number;
  active: boolean;
}

interface ReviewsClientProps {
  openQueue: ReviewQueueItem[];
  recentResolvedQueue: ReviewQueueItem[];
  pluggyReviews: PluggyReviewItem[];
  categories: CategoryOption[];
  rules: ClassificationRuleItem[];
}

export default function ReviewsClient({
  openQueue,
  recentResolvedQueue,
  pluggyReviews,
  categories,
  rules,
}: ReviewsClientProps) {
  const router = useRouter();
  const [tab, setTab] = useState(0);
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ open: boolean; ok: boolean; msg: string }>({
    open: false,
    ok: true,
    msg: '',
  });

  // Per-review interactive state for classification items
  const [selectedCats, setSelectedCats] = useState<Record<number, string>>(() => {
    const init: Record<number, string> = {};
    for (const item of openQueue) {
      const sugId = item.details?.suggested_category_id;
      if (typeof sugId === 'number') init[item.id] = String(sugId);
    }
    return init;
  });
  const [saveAsRuleMap, setSaveAsRuleMap] = useState<Record<number, boolean>>({});
  const [rulePatternMap, setRulePatternMap] = useState<Record<number, string>>(() => {
    const init: Record<number, string> = {};
    for (const item of openQueue) {
      const sugPat = item.details?.suggested_rule_pattern;
      if (typeof sugPat === 'string' && sugPat.trim()) init[item.id] = sugPat;
    }
    return init;
  });

  // New rule quick form state
  const [newPattern, setNewPattern] = useState('');
  const [newRuleCatId, setNewRuleCatId] = useState('');

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

  const catLabelById = useMemo(() => {
    const byId = new Map(categories.map((c) => [c.id, c]));
    const labels = new Map<number, string>();
    for (const c of categories) {
      const parent = c.parent_id ? byId.get(c.parent_id) : null;
      labels.set(c.id, parent ? `${parent.name} > ${c.name}` : c.name);
    }
    return labels;
  }, [categories]);

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

  const handleResolveClassification = (item: ReviewQueueItem) => {
    const catId = Number(selectedCats[item.id] || item.details?.suggested_category_id || 0);
    if (!catId) {
      setFeedback({ open: true, ok: false, msg: 'Escolha uma categoria antes de aprovar.' });
      return;
    }
    startTransition(async () => {
      const res = await resolveClassificationReviewAction({
        reviewId: item.id,
        transactionId: item.transaction_id,
        categoryId: catId,
        createRule: Boolean(saveAsRuleMap[item.id]),
        rulePattern: rulePatternMap[item.id] ?? '',
        reason:
          typeof item.details?.rationale === 'string'
            ? `Aprovado pelo Titular (IA: ${item.details.rationale})`
            : 'Aprovado na fila de revisão',
      });
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

  const handleAddRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPattern.trim() || !newRuleCatId) return;
    startTransition(async () => {
      const res = await createClassificationRuleAction({
        pattern: newPattern,
        categoryId: Number(newRuleCatId),
      });
      setFeedback({ open: true, ok: res.ok, msg: res.message });
      if (res.ok) {
        setNewPattern('');
        setNewRuleCatId('');
        router.refresh();
      }
    });
  };

  const openPluggyCount = pluggyReviews.filter((r) => r.status === 'open').length;

  return (
    <Stack spacing={2.5}>
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="scrollable">
          <Tab label={`Em aberto (${openQueue.length})`} />
          <Tab label={`Reconciliação Pluggy (${openPluggyCount}/${pluggyReviews.length})`} />
          <Tab label={`Regras de classificação (${rules.length})`} />
          <Tab label={`Resolvidas (${recentResolvedQueue.length})`} />
        </Tabs>
      </Box>

      {/* TAB 0: Open Review Queue (including 1-click AI classification approval) */}
      {tab === 0 && (
        <DashboardCard
          title="Fila de Revisão em Aberto"
          subtitle="Aprove sugestões da IA em 1 clique, corrija categorias ou salve novas regras"
        >
          {openQueue.length === 0 ? (
            <Alert severity="success" variant="outlined">
              Nenhuma pendência em aberto na fila de revisão!
            </Alert>
          ) : (
            <Stack spacing={2}>
              {openQueue.map((item) => {
                const d = item.details ?? {};
                const isClassification = item.review_type === 'classification';
                const issuer = typeof d.issuer === 'string' ? d.issuer : null;
                const desc = typeof d.description === 'string' ? d.description : null;
                const amount = typeof d.amount === 'number' ? d.amount : null;
                const occurredOn = typeof d.occurred_on === 'string' ? d.occurred_on : null;
                const accountName = typeof d.account_name === 'string' ? d.account_name : null;
                const sugCatName =
                  typeof d.suggested_category_name === 'string'
                    ? d.suggested_category_name
                    : null;
                const confidence =
                  typeof d.confidence === 'number' ? d.confidence : null;
                const rationale =
                  typeof d.rationale === 'string' ? d.rationale : null;

                const chosenCat = selectedCats[item.id] ?? '';
                const saveRule = Boolean(saveAsRuleMap[item.id]);
                const rulePattern = rulePatternMap[item.id] ?? '';

                return (
                  <Paper
                    key={item.id}
                    variant="outlined"
                    sx={{ p: { xs: 2, sm: 2.5 }, borderRadius: 2 }}
                  >
                    <Stack spacing={1.5}>
                      <Stack
                        direction="row"
                        justifyContent="space-between"
                        alignItems="center"
                        flexWrap="wrap"
                        gap={1}
                      >
                        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                          <Chip
                            label={
                              REVIEW_TYPE_LABELS[item.review_type] ??
                              item.review_type
                            }
                            size="small"
                            color={isClassification ? 'primary' : 'warning'}
                          />
                          {sugCatName && (
                            <Chip
                              icon={<IconSparkles size={13} />}
                              label={`IA: ${sugCatName}${
                                confidence !== null
                                  ? ` (${Math.round(confidence * 100)}%)`
                                  : ''
                              }`}
                              size="small"
                              color="secondary"
                              variant="outlined"
                            />
                          )}
                        </Stack>
                        <Typography variant="caption" color="textSecondary">
                          {occurredOn
                            ? formatDateBR(occurredOn)
                            : formatDateTimeBR(item.created_at)}
                        </Typography>
                      </Stack>

                      <Stack
                        direction={{ xs: 'column', sm: 'row' }}
                        justifyContent="space-between"
                        alignItems={{ xs: 'flex-start', sm: 'center' }}
                        spacing={0.5}
                      >
                        <Box>
                          <Typography variant="subtitle1" fontWeight={700}>
                            {desc || issuer || item.message}
                          </Typography>
                          {(accountName || rationale) && (
                            <Typography variant="caption" color="textSecondary" display="block">
                              {accountName ? `${accountName} • ` : ''}
                              {rationale || item.message}
                            </Typography>
                          )}
                        </Box>
                        {amount !== null && (
                          <Typography variant="h6" fontWeight={700} flexShrink={0}>
                            {formatBRL(amount)}
                          </Typography>
                        )}
                      </Stack>

                      {isClassification ? (
                        <>
                          <Divider />
                          <Grid container spacing={1.5} alignItems="center">
                            <Grid size={{ xs: 12, md: 5 }}>
                              <FormControl fullWidth size="small">
                                <InputLabel>Categoria</InputLabel>
                                <Select
                                  label="Categoria"
                                  value={chosenCat}
                                  onChange={(e) =>
                                    setSelectedCats((prev) => ({
                                      ...prev,
                                      [item.id]: e.target.value,
                                    }))
                                  }
                                >
                                  {groupedCategories.flatMap(({ parent, children }) => [
                                    <ListSubheader key={`hdr-${parent.id}`}>
                                      {parent.name}
                                    </ListSubheader>,
                                    <MenuItem key={parent.id} value={String(parent.id)}>
                                      {parent.name} (geral)
                                    </MenuItem>,
                                    ...children.map((ch) => (
                                      <MenuItem
                                        key={ch.id}
                                        value={String(ch.id)}
                                        sx={{ pl: 3.5 }}
                                      >
                                        {ch.name}
                                      </MenuItem>
                                    )),
                                  ])}
                                </Select>
                              </FormControl>
                            </Grid>

                            <Grid size={{ xs: 12, md: 7 }}>
                              <Stack
                                direction={{ xs: 'column', sm: 'row' }}
                                spacing={1}
                                alignItems={{ xs: 'stretch', sm: 'center' }}
                              >
                                <FormControlLabel
                                  sx={{ mr: 0, flexShrink: 0 }}
                                  control={
                                    <Checkbox
                                      size="small"
                                      checked={saveRule}
                                      onChange={(e) =>
                                        setSaveAsRuleMap((prev) => ({
                                          ...prev,
                                          [item.id]: e.target.checked,
                                        }))
                                      }
                                    />
                                  }
                                  label={
                                    <Typography variant="caption" fontWeight={600}>
                                      Salvar como regra
                                    </Typography>
                                  }
                                />
                                {saveRule && (
                                  <TextField
                                    size="small"
                                    fullWidth
                                    label="Contém texto"
                                    value={rulePattern}
                                    onChange={(e) =>
                                      setRulePatternMap((prev) => ({
                                        ...prev,
                                        [item.id]: e.target.value,
                                      }))
                                    }
                                    placeholder="Ex.: KALUNGA"
                                  />
                                )}
                              </Stack>
                            </Grid>
                          </Grid>

                          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                            <Button
                              size="small"
                              variant="contained"
                              color="primary"
                              disabled={isPending || !chosenCat}
                              startIcon={<IconCheck size={15} />}
                              onClick={() => handleResolveClassification(item)}
                            >
                              Aprovar & Classificar
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
                        </>
                      ) : (
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
                      )}
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
                typeof d.resolution === 'string'
                  ? d.resolution
                  : typeof d.rationale === 'string'
                    ? d.rationale
                    : null;

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
                      {desc}{' '}
                      {amount !== null ? `• ${formatBRL(Math.abs(amount))}` : ''}
                    </Typography>
                    {resolution && (
                      <Typography variant="caption" color="textSecondary" display="block">
                        {resolution}
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

      {/* TAB 2: Classification Rules Manager */}
      {tab === 2 && (
        <Stack spacing={2.5}>
          <DashboardCard
            title="Nova Regra de Classificação"
            subtitle="Regras determinísticas têm prioridade sobre a IA e custam R$ 0"
          >
            <Box component="form" onSubmit={handleAddRule}>
              <Grid container spacing={1.5} alignItems="center">
                <Grid size={{ xs: 12, sm: 5 }}>
                  <TextField
                    size="small"
                    fullWidth
                    required
                    label="Se a descrição contiver"
                    value={newPattern}
                    onChange={(e) => setNewPattern(e.target.value)}
                    placeholder="Ex.: SUPERMERCADO IMPERATRIZ"
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 5 }}>
                  <FormControl fullWidth size="small" required>
                    <InputLabel>Classificar como</InputLabel>
                    <Select
                      label="Classificar como"
                      value={newRuleCatId}
                      onChange={(e) => setNewRuleCatId(e.target.value)}
                    >
                      {groupedCategories.flatMap(({ parent, children }) => [
                        <ListSubheader key={`nhdr-${parent.id}`}>
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
                </Grid>
                <Grid size={{ xs: 12, sm: 2 }}>
                  <Button
                    type="submit"
                    variant="contained"
                    fullWidth
                    disabled={isPending || !newPattern.trim() || !newRuleCatId}
                    startIcon={<IconPlus size={16} />}
                    sx={{ height: 40 }}
                  >
                    Salvar
                  </Button>
                </Grid>
              </Grid>
            </Box>
          </DashboardCard>

          <DashboardCard
            title={`Regras Cadastradas (${rules.length})`}
            subtitle="Aplicadas em ordem de prioridade durante a conciliação"
          >
            <Stack divider={<Divider flexItem />} spacing={1}>
              {rules.map((r) => (
                <Stack
                  key={r.id}
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                  spacing={1}
                  py={0.5}
                >
                  <Box minWidth={0}>
                    <Typography variant="subtitle2" fontWeight={700} noWrap>
                      {r.pattern}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      {r.match_type} • Prioridade {r.priority} →{' '}
                      <strong>{catLabelById.get(r.category_id) ?? `#${r.category_id}`}</strong>
                    </Typography>
                  </Box>
                  <Stack direction="row" spacing={0.5} alignItems="center" flexShrink={0}>
                    <Switch
                      size="small"
                      checked={r.active}
                      disabled={isPending}
                      onChange={(_, checked) =>
                        startTransition(async () => {
                          const res = await toggleClassificationRuleAction({
                            ruleId: r.id,
                            active: checked,
                          });
                          setFeedback({ open: true, ok: res.ok, msg: res.message });
                          if (res.ok) router.refresh();
                        })
                      }
                    />
                    <IconButton
                      size="small"
                      color="error"
                      disabled={isPending}
                      onClick={() =>
                        startTransition(async () => {
                          const res = await deleteClassificationRuleAction({
                            ruleId: r.id,
                          });
                          setFeedback({ open: true, ok: res.ok, msg: res.message });
                          if (res.ok) router.refresh();
                        })
                      }
                    >
                      <IconTrash size={16} />
                    </IconButton>
                  </Stack>
                </Stack>
              ))}
            </Stack>
          </DashboardCard>
        </Stack>
      )}

      {/* TAB 3: Recently Resolved */}
      {tab === 3 && (
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
