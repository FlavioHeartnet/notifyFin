const brlFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const compactBrlFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  notation: 'compact',
  maximumFractionDigits: 1,
});

export function formatBRL(value: number | null | undefined): string {
  return brlFormatter.format(Number(value ?? 0));
}

export function formatCompactBRL(value: number | null | undefined): string {
  return compactBrlFormatter.format(Number(value ?? 0));
}

export function formatDateBR(dateStr: string | null | undefined): string {
  if (!dateStr) return '—';
  const clean = dateStr.slice(0, 10);
  const [y, m, d] = clean.split('-');
  if (!y || !m || !d) return dateStr;
  return `${d}/${m}/${y}`;
}

export function formatDateTimeBR(dateStr: string | null | undefined): string {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
    timeZone: 'America/Sao_Paulo',
  }).format(d);
}

export function formatMonthLabel(monthKey: string): string {
  // Accepts 'YYYY-MM' or ISO timestamp 'YYYY-MM-01...'
  const ym = monthKey.slice(0, 7);
  const [y, m] = ym.split('-');
  if (!y || !m) return monthKey;
  const date = new Date(Number(y), Number(m) - 1, 1);
  const label = new Intl.DateTimeFormat('pt-BR', {
    month: 'short',
    year: '2-digit',
  }).format(date);
  return label.replace('.', '').replace(/^./, (c) => c.toUpperCase());
}

export function formatMonthLong(monthKey: string): string {
  const ym = monthKey.slice(0, 7);
  const [y, m] = ym.split('-');
  if (!y || !m) return monthKey;
  const date = new Date(Number(y), Number(m) - 1, 1);
  const label = new Intl.DateTimeFormat('pt-BR', {
    month: 'long',
    year: 'numeric',
  }).format(date);
  return label.replace(/^./, (c) => c.toUpperCase());
}

export const ACCOUNT_TYPE_LABELS: Record<string, string> = {
  checking: 'Conta corrente',
  credit_card: 'Cartão de crédito',
  loan: 'Financiamento',
  savings: 'Poupança',
  investment: 'Investimento',
};

export const ECONOMIC_EFFECT_LABELS: Record<string, string> = {
  expense: 'Gasto',
  income: 'Entrada',
  transfer: 'Transferência interna',
  settlement: 'Pagamento de fatura',
  investment: 'Investimento',
  refund: 'Estorno',
  adjustment: 'Ajuste',
};

export const EXPENSE_TYPE_LABELS: Record<string, string> = {
  streaming: 'Streaming',
  software: 'Software',
  mobile: 'Celular',
  internet: 'Internet',
  insurance: 'Seguro',
  health: 'Saúde',
  fitness: 'Academia / Fitness',
  other: 'Outro',
};

export const REVIEW_TYPE_LABELS: Record<string, string> = {
  reconciliation: 'Reconciliação',
  classification: 'Classificação',
  ocr: 'Extração / OCR',
  duplicate: 'Duplicidade',
  data_quality: 'Qualidade de dados',
};

export const PLUGGY_REASON_LABELS: Record<string, string> = {
  ambiguous_match: 'Correspondência ambígua',
  date_mismatch: 'Divergência de data',
  pending: 'Lançamento pendente',
  unmatched_existing_period: 'Fora de correspondência',
  account_mapping: 'Mapeamento de conta',
  data_quality: 'Qualidade de dados',
  classification: 'Classificação',
  potential_duplicate: 'Possível duplicidade',
};

export const CHART_PALETTE = [
  '#5D87FF',
  '#49BEFF',
  '#13DEB9',
  '#FFAE1F',
  '#FA896B',
  '#763EBD',
  '#0074BA',
  '#0A7EA4',
  '#2A3547',
  '#5A6A85',
];
