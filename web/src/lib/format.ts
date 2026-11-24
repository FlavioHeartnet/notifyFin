const MONTHS_SHORT = [
  'Jan',
  'Fev',
  'Mar',
  'Abr',
  'Mai',
  'Jun',
  'Jul',
  'Ago',
  'Set',
  'Out',
  'Nov',
  'Dez',
];

const MONTHS_LONG = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
];

/**
 * Deterministic BRL formatter (avoids Node vs Browser ICU non-breaking-space
 * hydration mismatches).
 */
export function formatBRL(value: number | null | undefined): string {
  const num = Number(value ?? 0);
  if (!Number.isFinite(num)) return 'R$ 0,00';
  const negative = num < 0;
  const fixed = Math.abs(num).toFixed(2);
  const [intPart, decPart] = fixed.split('.');
  const withThousands = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${negative ? '-' : ''}R$ ${withThousands},${decPart}`;
}

/**
 * Deterministic compact BRL formatter (avoids ICU compact-notation hydration
 * differences across Node/Chrome/Safari).
 */
export function formatCompactBRL(value: number | null | undefined): string {
  const num = Number(value ?? 0);
  if (!Number.isFinite(num)) return 'R$ 0';
  const negative = num < 0;
  const abs = Math.abs(num);
  const sign = negative ? '-' : '';

  if (abs >= 1_000_000) {
    const v = (abs / 1_000_000).toFixed(1).replace(/\.0$/, '').replace('.', ',');
    return `${sign}R$ ${v} mi`;
  }
  if (abs >= 1_000) {
    const v = (abs / 1_000).toFixed(1).replace(/\.0$/, '').replace('.', ',');
    return `${sign}R$ ${v} mil`;
  }
  const v = abs.toFixed(0);
  return `${sign}R$ ${v}`;
}

export function formatDateBR(dateStr: string | null | undefined): string {
  if (!dateStr) return '—';
  const clean = dateStr.slice(0, 10);
  const [y, m, d] = clean.split('-');
  if (!y || !m || !d) return dateStr;
  return `${d}/${m}/${y}`;
}

const saoPauloPartsFormatter = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'America/Sao_Paulo',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});

export function formatDateTimeBR(dateStr: string | null | undefined): string {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  const parts = saoPauloPartsFormatter.formatToParts(d);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '';
  return `${get('day')}/${get('month')}/${get('year')}, ${get('hour')}:${get('minute')}`;
}

export function formatMonthLabel(monthKey: string): string {
  const ym = monthKey.slice(0, 7);
  const [y, m] = ym.split('-');
  const idx = Number(m) - 1;
  if (!y || idx < 0 || idx > 11) return monthKey;
  return `${MONTHS_SHORT[idx]}/${y.slice(-2)}`;
}

export function formatMonthLong(monthKey: string): string {
  const ym = monthKey.slice(0, 7);
  const [y, m] = ym.split('-');
  const idx = Number(m) - 1;
  if (!y || idx < 0 || idx > 11) return monthKey;
  return `${MONTHS_LONG[idx]} de ${y}`;
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
