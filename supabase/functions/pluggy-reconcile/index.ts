import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const DEFAULT_MODEL = "google/gemini-2.5-flash";
const DEFAULT_CONFIDENCE_THRESHOLD = 0.85;
const AI_BATCH_SIZE = 25;

const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const jsonResponse = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: {
      ...CORS_HEADERS,
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
    },
  });

function getAdminKey(): string {
  const legacy = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (legacy) return legacy;
  const newer = Deno.env.get("SUPABASE_SECRET_KEYS");
  if (newer) {
    try {
      const v = JSON.parse(newer).default;
      if (typeof v === "string") return v;
    } catch {
      // ignore
    }
  }
  throw new Error("ADMIN_KEY_NOT_AVAILABLE");
}

function getAnonKey(): string {
  return (
    Deno.env.get("SUPABASE_ANON_KEY") ||
    Deno.env.get("SUPABASE_PUBLISHABLE_KEY") ||
    getAdminKey()
  );
}

async function fetchJson(url: string, init: RequestInit = {}) {
  const res = await fetch(url, {
    ...init,
    signal: AbortSignal.timeout(45000),
  });
  const text = await res.text();
  let data: unknown = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { raw: text.slice(0, 500) };
  }
  return { ok: res.ok, status: res.status, data };
}

class DbClient {
  constructor(private baseUrl: string, private serviceKey: string) {}

  async request<T = unknown>(
    path: string,
    method = "GET",
    body?: unknown,
    prefer?: string
  ): Promise<T> {
    const headers: Record<string, string> = {
      apikey: this.serviceKey,
      Authorization: `Bearer ${this.serviceKey}`,
      "Content-Type": "application/json",
    };
    if (prefer) headers["Prefer"] = prefer;

    const res = await fetchJson(`${this.baseUrl}/rest/v1/${path}`, {
      method,
      headers,
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    });

    if (!res.ok) {
      const errMsg =
        typeof res.data === "object" && res.data !== null
          ? JSON.stringify(res.data).slice(0, 300)
          : String(res.data);
      throw new Error(`DB_${method}_${path.split("?")[0]}_${res.status}: ${errMsg}`);
    }
    return res.data as T;
  }

  async selectAll<T>(tableAndQuery: string): Promise<T[]> {
    const all: T[] = [];
    const sep = tableAndQuery.includes("?") ? "&" : "?";
    let offset = 0;
    const pageSize = 1000;
    while (true) {
      const chunk = await this.request<T[]>(
        `${tableAndQuery}${sep}limit=${pageSize}&offset=${offset}`
      );
      if (!Array.isArray(chunk) || chunk.length === 0) break;
      all.push(...chunk);
      if (chunk.length < pageSize) break;
      offset += pageSize;
    }
    return all;
  }
}

interface PluggyRef {
  id: number;
  profile_id: number;
  transaction_id: number | null;
  external_transaction_id: string;
  external_account_id: string;
  occurred_on: string;
  amount: number;
  status: string;
  description: string | null;
  raw_payload: Record<string, unknown> | null;
}

interface PluggyAccount {
  external_account_id: string;
  account_type: string;
  account_subtype: string | null;
  label: string | null;
  local_account_id: number | null;
}

interface PreviewRow {
  pluggy_ref_id: number;
  local_account_id: number | null;
  match_status: string;
  candidate_ledger_id: number | null;
  exact_count: number;
  near_count: number;
}

interface CategoryRow {
  id: number;
  name: string;
  parent_id: number | null;
  active: boolean;
}

interface ClassificationRule {
  id: number;
  priority: number;
  field_name: string;
  match_type: string;
  pattern: string;
  category_id: number;
  active: boolean;
}

interface PluggyCategoryMapping {
  source_category: string;
  category_id: number;
  approved: boolean;
  active: boolean;
}

interface AiItemOutput {
  ref_id: number;
  economic_effect:
    | "expense"
    | "income"
    | "transfer"
    | "settlement"
    | "investment"
    | "refund"
    | "adjustment";
  is_spending: boolean;
  is_own_transfer?: boolean;
  category_id: number | null;
  confidence: number;
  rationale: string;
  needs_review: boolean;
  suggested_rule_pattern?: string | null;
}

export interface ReconcilePreviewItem {
  ref_id: number;
  occurred_on: string;
  account_name: string;
  description: string;
  amount: number;
  direction: "debit" | "credit";
  action:
    | "link_existing"
    | "hold_reconciliation_review"
    | "import_non_spending"
    | "import_classified_rule"
    | "import_classified_history"
    | "import_classified_pluggy_map"
    | "import_classified_ai"
    | "import_needs_classification_review";
  economic_effect: string;
  is_spending: boolean;
  is_own_transfer: boolean;
  category_id: number | null;
  category_name: string | null;
  confidence: number | null;
  source: string;
  rationale: string;
  suggested_rule_pattern: string | null;
  linked_transaction_id?: number | null;
}

function normalizeDescription(desc: string): string {
  return desc
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(
      /^(compra no debito|compra no cartao|pix enviado|pix recebido|transferencia enviada pelo pix|transferencia recebida pelo pix|pagamento de fatura)\s*[-:|]?\s*/i,
      ""
    )
    .replace(/\s+/g, " ")
    .trim();
}

function extractRuleSuggestion(desc: string): string {
  const cleaned = desc
    .replace(
      /^(Compra no débito|Compra no debito|Pix enviado|Pix recebido|Transferência enviada pelo Pix)\s*[-:|]?\s*/i,
      ""
    )
    .replace(/\s+(Florianopolis|Sao Jose|São José|Palhoca|BRA|BR)\b.*$/i, "")
    .replace(/\s+/g, " ")
    .trim();
  return cleaned.slice(0, 40) || desc.slice(0, 40);
}

function inferOperationTypeId(
  description: string,
  accountType: string,
  economicEffect: string,
  direction: "debit" | "credit"
): number {
  const d = description.toLowerCase();
  if (economicEffect === "settlement") return 6; // card_statement_payment
  if (economicEffect === "investment") return direction === "credit" ? 9 : 8;
  if (economicEffect === "refund") return 10;
  if (economicEffect === "income" && /salario|salário|nova coop/.test(d)) return 7;
  if (/pix/.test(d)) return 1;
  if (accountType === "CREDIT") return 3; // credit_card
  if (/debito|débito|compra no d/.test(d)) return 2;
  if (/boleto/.test(d)) return 5;
  if (/ted\b/.test(d)) return 4;
  if (/saque/.test(d)) return 13;
  if (/tarifa|iof|anuidade|juros/.test(d)) return 14;
  if (/recarga/.test(d)) return 15;
  if (/transfer/.test(d)) return 11;
  return 16; // other
}

function parseAmountAndDirection(
  ref: PluggyRef,
  accountType: string
): { amount: number; direction: "debit" | "credit"; currency: string } {
  const raw = ref.raw_payload ?? {};
  const rawCurrency =
    typeof raw.currencyCode === "string" ? raw.currencyCode : "BRL";
  const amountInAcc =
    typeof raw.amountInAccountCurrency === "number"
      ? raw.amountInAccountCurrency
      : null;

  const signed =
    rawCurrency !== "BRL" && amountInAcc !== null
      ? amountInAcc
      : Number(ref.amount);
  const absAmount = Math.round(Math.abs(signed) * 100) / 100;
  const rawType = typeof raw.type === "string" ? raw.type.toUpperCase() : "";

  let direction: "debit" | "credit";
  if (accountType === "CREDIT") {
    direction = rawType === "CREDIT" || signed < 0 ? "credit" : "debit";
  } else {
    direction = rawType === "CREDIT" || signed > 0 ? "credit" : "debit";
  }

  return { amount: absAmount, direction, currency: "BRL" };
}

function detectDeterministicEffect(
  description: string,
  pluggyCategory: string | null,
  accountType: string,
  direction: "debit" | "credit",
  profileDisplayName: string
): {
  decided: boolean;
  economic_effect:
    | "expense"
    | "income"
    | "transfer"
    | "settlement"
    | "investment"
    | "refund";
  is_spending: boolean;
  is_own_transfer: boolean;
  rationale: string;
} {
  const d = description
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  const cat = (pluggyCategory ?? "").toLowerCase();
  const ownerTokens = profileDisplayName
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .split(/\s+/)
    .filter((t) => t.length >= 4);

  const hasOwnerName =
    ownerTokens.length >= 2 &&
    ownerTokens.slice(0, 2).every((tok) => d.includes(tok));

  // 1. Same person / own transfer
  if (cat === "same person transfer" || (hasOwnerName && /pix|transfer/.test(d))) {
    return {
      decided: true,
      economic_effect: "transfer",
      is_spending: false,
      is_own_transfer: true,
      rationale: "Transferência interna entre contas do Titular",
    };
  }

  // 2. Credit card bill settlement
  if (
    cat === "credit card payment" ||
    /pagamento (de )?fatura|pagamento recebido|pagto fatura/.test(d) ||
    (accountType === "CREDIT" && direction === "credit" && /pagamento/.test(d))
  ) {
    return {
      decided: true,
      economic_effect: "settlement",
      is_spending: false,
      is_own_transfer: false,
      rationale: "Pagamento de fatura de cartão (excluído dos gastos)",
    };
  }

  // 3. Investments
  if (
    cat === "investments" ||
    /\b(resgate rdb|aplicacao rdb|rdb|cdb|tesouro direto|lci|lca)\b/.test(d)
  ) {
    return {
      decided: true,
      economic_effect: "investment",
      is_spending: false,
      is_own_transfer: false,
      rationale: "Movimentação de investimento (aplicação/resgate)",
    };
  }

  // 4. Salary / known income
  if (
    direction === "credit" &&
    (cat === "salary" || /nova coop|salario recebido|proventos/.test(d))
  ) {
    return {
      decided: true,
      economic_effect: "income",
      is_spending: false,
      is_own_transfer: false,
      rationale: "Entrada de renda/salário identificada por regra determinística",
    };
  }

  // 5. Refunds
  if (
    direction === "credit" &&
    (accountType === "CREDIT" || /estorno|reembolso|cashback|devolucao/.test(d))
  ) {
    return {
      decided: true,
      economic_effect: "refund",
      is_spending: false,
      is_own_transfer: false,
      rationale: "Estorno ou devolução identificada",
    };
  }

  // 6. Regular debit -> expense candidate (will be classified)
  if (direction === "debit") {
    return {
      decided: true,
      economic_effect: "expense",
      is_spending: true,
      is_own_transfer: false,
      rationale: "Saída de consumo",
    };
  }

  // 7. Ambiguous credit (e.g., third-party PIX received) -> let AI decide
  return {
    decided: false,
    economic_effect: "income",
    is_spending: false,
    is_own_transfer: false,
    rationale: "Crédito a classificar pela IA",
  };
}

function matchClassificationRule(
  description: string,
  rules: ClassificationRule[]
): ClassificationRule | null {
  const descLower = description.toLowerCase();
  for (const r of rules) {
    if (!r.active) continue;
    if (r.field_name !== "raw_description" && r.field_name !== "counterparty_raw") {
      continue;
    }
    const pat = r.pattern.trim();
    if (!pat) continue;
    if (r.match_type === "equals" && descLower === pat.toLowerCase()) return r;
    if (r.match_type === "contains" && descLower.includes(pat.toLowerCase())) {
      return r;
    }
    if (r.match_type === "regex") {
      try {
        if (new RegExp(pat, "i").test(description)) return r;
      } catch {
        // ignore invalid regex
      }
    }
  }
  return null;
}

const GENERIC_PLUGGY_CATEGORIES = new Set([
  "shopping",
  "services",
  "transfers",
  "other",
  "miscellaneous",
  "online shopping",
  "debit",
  "credit",
]);

async function classifyWithOpenRouter(
  items: {
    ref_id: number;
    occurred_on: string;
    amount: number;
    direction: "debit" | "credit";
    account_name: string;
    account_type: string;
    description: string;
    pluggy_category: string | null;
    preliminary_effect: string;
  }[],
  categories: { id: number; label: string }[],
  apiKey: string,
  model: string
): Promise<Map<number, AiItemOutput>> {
  const results = new Map<number, AiItemOutput>();
  if (items.length === 0) return results;

  const categoriesText = categories
    .map((c) => `- id=${c.id}: ${c.label}`)
    .join("\n");

  const systemPrompt = `Você é o classificador financeiro do NotifyFin (finanças pessoais brasileiras em BRL).
Sua tarefa é classificar cada movimentação bancária/cartão recebida do Open Finance (Pluggy) usando EXCLUSIVAMENTE a lista de categorias do Titular.

REGRAS ESTRITAS:
1. NUNCA altere valores ou datas.
2. Escolha category_id EXCLUSIVAMENTE dentre os IDs listados abaixo (ou null se não for gasto, ex.: transfer/settlement/investment/refund).
3. Prefira subcategorias específicas quando aplicável (ex.: "Alimentação > Mercado" em vez de "Alimentação", "Transporte > Estacionamento" em vez de "Transporte").
4. Se o estabelecimento for ambíguo (ex.: loja genérica, pessoa física via PIX sem contexto, sigla desconhecida), dê confidence < 0.80 e marque needs_review = true, ainda assim propondo a melhor category_id possível como sugestão.
5. Para créditos de terceiros via PIX (direction="credit"), decida se é "income" (renda), "refund" (reembolso/divisão de conta) ou "transfer" (movimentação neutra) e marque needs_review = true se houver dúvida.
6. Em suggested_rule_pattern, sugira um trecho curto e limpo do nome do estabelecimento (ex.: "KALUNGA", "GOSTO GAUCHO") caso faça sentido virar regra recorrente, ou null se for genérico.
7. Responda APENAS um objeto JSON válido com a chave "items": array de objetos:
{
  "items": [
    {
      "ref_id": number,
      "economic_effect": "expense" | "income" | "transfer" | "settlement" | "investment" | "refund" | "adjustment",
      "is_spending": boolean,
      "is_own_transfer": boolean,
      "category_id": number | null,
      "confidence": number (0.0 a 1.0),
      "rationale": "justificativa curta em português (máx 140 chars)",
      "needs_review": boolean,
      "suggested_rule_pattern": string | null
    }
  ]
}

CATEGORIAS DO TITULAR:
${categoriesText}`;

  for (let i = 0; i < items.length; i += AI_BATCH_SIZE) {
    const batch = items.slice(i, i + AI_BATCH_SIZE);
    const res = await fetchJson(OPENROUTER_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://notifyfin.local",
        "X-Title": "NotifyFin Pluggy Reconciler",
      },
      body: JSON.stringify({
        model,
        temperature: 0.1,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: JSON.stringify({ transactions: batch }),
          },
        ],
      }),
    });

    if (!res.ok) {
      throw new Error(
        `OPENROUTER_ERROR_${res.status}: ${JSON.stringify(res.data).slice(0, 250)}`
      );
    }

    const content = (res.data as {
      choices?: { message?: { content?: string } }[];
    })?.choices?.[0]?.message?.content;

    if (!content) continue;

    let parsed: { items?: AiItemOutput[] } | null = null;
    try {
      const cleaned = content
        .replace(/^```json\s*/i, "")
        .replace(/```$/i, "")
        .trim();
      parsed = JSON.parse(cleaned);
    } catch {
      continue;
    }

    for (const item of parsed?.items ?? []) {
      if (typeof item.ref_id === "number") {
        results.set(item.ref_id, item);
      }
    }
  }

  return results;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }
  if (req.method !== "POST") {
    return jsonResponse({ error: "METHOD_NOT_ALLOWED" }, 405);
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    if (!supabaseUrl) throw new Error("SUPABASE_URL_MISSING");

    const authHeader = req.headers.get("authorization");
    if (!authHeader?.toLowerCase().startsWith("bearer ")) {
      return jsonResponse({ error: "UNAUTHORIZED" }, 401);
    }

    // Resolve authenticated user strictly from Supabase Auth
    const userRes = await fetchJson(`${supabaseUrl}/auth/v1/user`, {
      method: "GET",
      headers: {
        Authorization: authHeader,
        apikey: getAnonKey(),
      },
    });
    const authUser = userRes.data as { id?: string } | null;
    if (!userRes.ok || !authUser?.id) {
      return jsonResponse({ error: "INVALID_USER_SESSION" }, 401);
    }

    const body = await req.json().catch(() => ({}));
    const mode = body?.mode === "apply" ? "apply" : "preview";
    const confidenceThreshold =
      typeof body?.confidenceThreshold === "number" &&
      body.confidenceThreshold >= 0.5 &&
      body.confidenceThreshold <= 0.99
        ? body.confidenceThreshold
        : DEFAULT_CONFIDENCE_THRESHOLD;

    const openRouterKey = Deno.env.get("OPENROUTER_API_KEY") ?? "";
    const model = Deno.env.get("OPENROUTER_MODEL") || DEFAULT_MODEL;

    const db = new DbClient(supabaseUrl, getAdminKey());

    // Resolve owner profile_id strictly from auth.uid()
    const profiles = await db.request<
      { id: number; display_name: string }[]
    >(
      `financial_profiles?select=id,display_name&auth_user_id=eq.${authUser.id}&limit=1`
    );
    const profile = profiles[0];
    if (!profile) {
      return jsonResponse({ error: "FINANCIAL_PROFILE_NOT_FOUND" }, 404);
    }
    const profileId = profile.id;

    // Fetch all required context in parallel
    const [
      unlinkedRefs,
      pluggyAccounts,
      localAccounts,
      categories,
      rules,
      pluggyCatMappings,
      existingPluggyReviews,
      previewRows,
      recentClassifiedTx,
    ] = await Promise.all([
      db.selectAll<PluggyRef>(
        `pluggy_transaction_refs?select=id,profile_id,transaction_id,external_transaction_id,external_account_id,occurred_on,amount,status,description,raw_payload&profile_id=eq.${profileId}&transaction_id=is.null&deleted_at=is.null&order=occurred_on.desc`
      ),
      db.selectAll<PluggyAccount>(
        `pluggy_accounts?select=external_account_id,account_type,account_subtype,label,local_account_id&profile_id=eq.${profileId}`
      ),
      db.selectAll<{ id: number; name: string }>(
        `accounts?select=id,name&profile_id=eq.${profileId}`
      ),
      db.selectAll<CategoryRow>(
        `categories?select=id,name,parent_id,active&profile_id=eq.${profileId}&active=eq.true`
      ),
      db.selectAll<ClassificationRule>(
        `classification_rules?select=id,priority,field_name,match_type,pattern,category_id,active&profile_id=eq.${profileId}&active=eq.true&order=priority.asc,id.asc`
      ),
      db.selectAll<PluggyCategoryMapping>(
        `pluggy_category_mappings?select=source_category,category_id,approved,active&profile_id=eq.${profileId}&active=eq.true`
      ),
      db.selectAll<{ id: number; pluggy_ref_id: number; status: string }>(
        `pluggy_reconciliation_reviews?select=id,pluggy_ref_id,status&profile_id=eq.${profileId}`
      ),
      db.selectAll<PreviewRow>(
        `pluggy_reconciliation_preview?select=pluggy_ref_id,local_account_id,match_status,candidate_ledger_id,exact_count,near_count&profile_id=eq.${profileId}`
      ),
      db.selectAll<{
        raw_description: string;
        transaction_allocations: { category_id: number; classification_source: string }[];
      }>(
        `financial_transactions?select=raw_description,transaction_allocations(category_id,classification_source)&profile_id=eq.${profileId}&is_spending=eq.true&classification_status=eq.classified&order=occurred_on.desc`
      ),
    ]);

    const pluggyAccByExtId = new Map(
      pluggyAccounts.map((pa) => [pa.external_account_id, pa])
    );
    const localAccById = new Map(localAccounts.map((a) => [a.id, a.name]));
    const categoryById = new Map(categories.map((c) => [c.id, c]));
    const categoryLabelById = new Map<number, string>();
    for (const c of categories) {
      const parent = c.parent_id ? categoryById.get(c.parent_id) : null;
      categoryLabelById.set(c.id, parent ? `${parent.name} > ${c.name}` : c.name);
    }

    const pluggyMapBySource = new Map(
      pluggyCatMappings.map((m) => [m.source_category.toLowerCase(), m])
    );
    const reviewByRefId = new Map(
      existingPluggyReviews.map((r) => [r.pluggy_ref_id, r])
    );
    const previewByRefId = new Map(
      previewRows.map((p) => [p.pluggy_ref_id, p])
    );

    // Build normalized description -> dominant historical category map
    const historyCounts = new Map<string, Map<number, number>>();
    for (const tx of recentClassifiedTx) {
      const allocs = tx.transaction_allocations ?? [];
      if (allocs.length !== 1) continue;
      const norm = normalizeDescription(tx.raw_description);
      if (norm.length < 4) continue;
      let catMap = historyCounts.get(norm);
      if (!catMap) {
        catMap = new Map();
        historyCounts.set(norm, catMap);
      }
      const cid = allocs[0].category_id;
      catMap.set(cid, (catMap.get(cid) ?? 0) + 1);
    }
    const historyMatch = new Map<string, { categoryId: number; count: number }>();
    for (const [norm, catMap] of historyCounts.entries()) {
      let total = 0;
      let bestCat = 0;
      let bestCount = 0;
      for (const [cid, cnt] of catMap.entries()) {
        total += cnt;
        if (cnt > bestCount) {
          bestCount = cnt;
          bestCat = cid;
        }
      }
      if (
        bestCat > 0 &&
        categoryById.has(bestCat) &&
        bestCount / total >= 0.85 &&
        bestCount >= 2
      ) {
        historyMatch.set(norm, { categoryId: bestCat, count: bestCount });
      }
    }

    // Separate PENDING vs POSTED
    const pendingRefs = unlinkedRefs.filter((r) => r.status !== "POSTED");
    const postedRefs = unlinkedRefs.filter((r) => r.status === "POSTED");

    let skippedAlreadyReviewed = 0;
    const items: ReconcilePreviewItem[] = [];
    const aiCandidates: {
      ref: PluggyRef;
      localAccountId: number;
      accountName: string;
      accountType: string;
      description: string;
      amount: number;
      direction: "debit" | "credit";
      pluggyCategory: string | null;
      preliminaryEffect: string;
    }[] = [];

    // Keep track of ready-to-apply operations
    const ops: {
      item: ReconcilePreviewItem;
      ref: PluggyRef;
      localAccountId: number | null;
      accountType: string;
      reviewReason?: string;
    }[] = [];

    for (const ref of postedRefs) {
      const existingRev = reviewByRefId.get(ref.id);
      if (
        existingRev &&
        (existingRev.status === "resolved" || existingRev.status === "dismissed")
      ) {
        skippedAlreadyReviewed += 1;
        continue;
      }

      const pa = pluggyAccByExtId.get(ref.external_account_id);
      const localAccountId = pa?.local_account_id ?? null;
      const accountType = pa?.account_type ?? "BANK";
      const accountName = localAccountId
        ? localAccById.get(localAccountId) ?? pa?.label ?? "Conta"
        : pa?.label ?? "Conta não mapeada";
      const description =
        (ref.description ??
          (typeof ref.raw_payload?.description === "string"
            ? ref.raw_payload.description
            : "") ??
          "Sem descrição").trim() || "Sem descrição";
      const pluggyCategory =
        typeof ref.raw_payload?.category === "string"
          ? ref.raw_payload.category
          : null;

      const { amount, direction } = parseAmountAndDirection(ref, accountType);
      const prev = previewByRefId.get(ref.id);

      // Unmapped account -> reconciliation review
      if (!localAccountId) {
        const item: ReconcilePreviewItem = {
          ref_id: ref.id,
          occurred_on: ref.occurred_on,
          account_name: accountName,
          description,
          amount,
          direction,
          action: "hold_reconciliation_review",
          economic_effect: "expense",
          is_spending: false,
          is_own_transfer: false,
          category_id: null,
          category_name: null,
          confidence: null,
          source: "reconciliation",
          rationale: "Conta Pluggy ainda sem vínculo com conta monitorada local",
          suggested_rule_pattern: null,
        };
        items.push(item);
        ops.push({ item, ref, localAccountId, accountType, reviewReason: "account_mapping" });
        continue;
      }

      // Layer 1: Reconciliation preview match
      if (prev?.match_status === "unique_exact_candidate" && prev.candidate_ledger_id) {
        const item: ReconcilePreviewItem = {
          ref_id: ref.id,
          occurred_on: ref.occurred_on,
          account_name: accountName,
          description,
          amount,
          direction,
          action: "link_existing",
          economic_effect: "matched",
          is_spending: false,
          is_own_transfer: false,
          category_id: null,
          category_name: null,
          confidence: 1,
          source: "exact_unique",
          rationale: `Correspondência exata com movimentação #${prev.candidate_ledger_id}`,
          suggested_rule_pattern: null,
          linked_transaction_id: prev.candidate_ledger_id,
        };
        items.push(item);
        ops.push({ item, ref, localAccountId, accountType });
        continue;
      }

      if (
        prev?.match_status === "ambiguous_exact" ||
        prev?.match_status === "near_date_review"
      ) {
        const item: ReconcilePreviewItem = {
          ref_id: ref.id,
          occurred_on: ref.occurred_on,
          account_name: accountName,
          description,
          amount,
          direction,
          action: "hold_reconciliation_review",
          economic_effect: "review",
          is_spending: false,
          is_own_transfer: false,
          category_id: null,
          category_name: null,
          confidence: null,
          source: prev.match_status,
          rationale:
            prev.match_status === "ambiguous_exact"
              ? `Possível duplicidade (${prev.exact_count} candidatos exatos no ledger)`
              : `Candidato em data próxima (±1 dia, ${prev.near_count} possível(is) par(es))`,
          suggested_rule_pattern: null,
        };
        items.push(item);
        ops.push({
          item,
          ref,
          localAccountId,
          accountType,
          reviewReason:
            prev.match_status === "ambiguous_exact"
              ? "ambiguous_match"
              : "date_mismatch",
        });
        continue;
      }

      // Layer 2: Deterministic economic effect
      const eff = detectDeterministicEffect(
        description,
        pluggyCategory,
        accountType,
        direction,
        profile.display_name
      );

      if (eff.decided && !eff.is_spending) {
        const item: ReconcilePreviewItem = {
          ref_id: ref.id,
          occurred_on: ref.occurred_on,
          account_name: accountName,
          description,
          amount,
          direction,
          action: "import_non_spending",
          economic_effect: eff.economic_effect,
          is_spending: false,
          is_own_transfer: eff.is_own_transfer,
          category_id: null,
          category_name: null,
          confidence: 1,
          source: "rule",
          rationale: eff.rationale,
          suggested_rule_pattern: null,
        };
        items.push(item);
        ops.push({ item, ref, localAccountId, accountType });
        continue;
      }

      // Layer 3: Deterministic category classification (only for expenses)
      if (eff.decided && eff.is_spending) {
        // 3a: classification_rules
        const matchedRule = matchClassificationRule(description, rules);
        if (matchedRule && categoryById.has(matchedRule.category_id)) {
          const item: ReconcilePreviewItem = {
            ref_id: ref.id,
            occurred_on: ref.occurred_on,
            account_name: accountName,
            description,
            amount,
            direction,
            action: "import_classified_rule",
            economic_effect: "expense",
            is_spending: true,
            is_own_transfer: false,
            category_id: matchedRule.category_id,
            category_name: categoryLabelById.get(matchedRule.category_id) ?? null,
            confidence: 1,
            source: "rule",
            rationale: `Regra #${matchedRule.id} (${matchedRule.pattern})`,
            suggested_rule_pattern: null,
          };
          items.push(item);
          ops.push({ item, ref, localAccountId, accountType });
          continue;
        }

        // 3b: Titular history
        const norm = normalizeDescription(description);
        const hist = historyMatch.get(norm);
        if (hist) {
          const item: ReconcilePreviewItem = {
            ref_id: ref.id,
            occurred_on: ref.occurred_on,
            account_name: accountName,
            description,
            amount,
            direction,
            action: "import_classified_history",
            economic_effect: "expense",
            is_spending: true,
            is_own_transfer: false,
            category_id: hist.categoryId,
            category_name: categoryLabelById.get(hist.categoryId) ?? null,
            confidence: 0.95,
            source: "rule",
            rationale: `Histórico consistente do Titular (${hist.count}x anteriores)`,
            suggested_rule_pattern: null,
          };
          items.push(item);
          ops.push({ item, ref, localAccountId, accountType });
          continue;
        }

        // 3c: Pluggy category mapping (non-generic categories only)
        if (
          pluggyCategory &&
          !GENERIC_PLUGGY_CATEGORIES.has(pluggyCategory.toLowerCase())
        ) {
          const mapped = pluggyMapBySource.get(pluggyCategory.toLowerCase());
          if (mapped && categoryById.has(mapped.category_id)) {
            const item: ReconcilePreviewItem = {
              ref_id: ref.id,
              occurred_on: ref.occurred_on,
              account_name: accountName,
              description,
              amount,
              direction,
              action: "import_classified_pluggy_map",
              economic_effect: "expense",
              is_spending: true,
              is_own_transfer: false,
              category_id: mapped.category_id,
              category_name: categoryLabelById.get(mapped.category_id) ?? null,
              confidence: mapped.approved ? 0.95 : 0.88,
              source: "bank",
              rationale: `Mapeamento Pluggy: "${pluggyCategory}"`,
              suggested_rule_pattern: null,
            };
            items.push(item);
            ops.push({ item, ref, localAccountId, accountType });
            continue;
          }
        }
      }

      // Layer 4: Queue for OpenRouter AI classification
      aiCandidates.push({
        ref,
        localAccountId,
        accountName,
        accountType,
        description,
        amount,
        direction,
        pluggyCategory,
        preliminaryEffect: eff.economic_effect,
      });
    }

    // Call OpenRouter ONLY for residual candidates
    let aiResults = new Map<number, AiItemOutput>();
    let aiWarning: string | null = null;
    if (aiCandidates.length > 0) {
      if (!openRouterKey) {
        aiWarning =
          "OPENROUTER_API_KEY não configurada — itens residuais enviados para revisão manual.";
      } else {
        const catOptions = Array.from(categoryLabelById.entries()).map(
          ([id, label]) => ({ id, label })
        );
        aiResults = await classifyWithOpenRouter(
          aiCandidates.map((c) => ({
            ref_id: c.ref.id,
            occurred_on: c.ref.occurred_on,
            amount: c.amount,
            direction: c.direction,
            account_name: c.accountName,
            account_type: c.accountType,
            description: c.description,
            pluggy_category: c.pluggyCategory,
            preliminary_effect: c.preliminaryEffect,
          })),
          catOptions,
          openRouterKey,
          model
        );
      }
    }

    for (const c of aiCandidates) {
      const ai = aiResults.get(c.ref.id);
      const validCatId =
        ai?.category_id && categoryById.has(ai.category_id)
          ? ai.category_id
          : null;
      const conf =
        typeof ai?.confidence === "number"
          ? Math.max(0, Math.min(1, ai.confidence))
          : 0;
      const effect = ai?.economic_effect ?? (c.direction === "debit" ? "expense" : "income");
      const isSpending = ai ? Boolean(ai.is_spending) : c.direction === "debit";
      const isOwnTransfer = Boolean(ai?.is_own_transfer);
      const rationale =
        ai?.rationale?.trim() ||
        aiWarning ||
        "Sem correspondência determinística — revisar categoria";
      const suggestedRule =
        ai?.suggested_rule_pattern?.trim() || extractRuleSuggestion(c.description);

      const highConfidenceAuto =
        Boolean(ai) &&
        !ai!.needs_review &&
        conf >= confidenceThreshold &&
        (!isSpending || validCatId !== null);

      const action: ReconcilePreviewItem["action"] = !isSpending && highConfidenceAuto
        ? "import_non_spending"
        : highConfidenceAuto
          ? "import_classified_ai"
          : "import_needs_classification_review";

      const item: ReconcilePreviewItem = {
        ref_id: c.ref.id,
        occurred_on: c.ref.occurred_on,
        account_name: c.accountName,
        description: c.description,
        amount: c.amount,
        direction: c.direction,
        action,
        economic_effect: effect,
        is_spending: isSpending,
        is_own_transfer: isOwnTransfer,
        category_id: validCatId,
        category_name: validCatId ? categoryLabelById.get(validCatId) ?? null : null,
        confidence: ai ? Number(conf.toFixed(2)) : null,
        source: "ai",
        rationale,
        suggested_rule_pattern: suggestedRule,
      };
      items.push(item);
      ops.push({ item, ref: c.ref, localAccountId: c.localAccountId, accountType: c.accountType });
    }

    // Build summary
    const summary = {
      total_unlinked_posted: postedRefs.length - skippedAlreadyReviewed,
      skipped_already_reviewed: skippedAlreadyReviewed,
      pending_held: pendingRefs.length,
      linked_existing: items.filter((i) => i.action === "link_existing").length,
      held_for_reconciliation_review: items.filter(
        (i) => i.action === "hold_reconciliation_review"
      ).length,
      imported_non_spending: items.filter(
        (i) => i.action === "import_non_spending"
      ).length,
      classified_by_rule: items.filter(
        (i) => i.action === "import_classified_rule"
      ).length,
      classified_by_history: items.filter(
        (i) => i.action === "import_classified_history"
      ).length,
      classified_by_pluggy_map: items.filter(
        (i) => i.action === "import_classified_pluggy_map"
      ).length,
      classified_by_ai: items.filter((i) => i.action === "import_classified_ai")
        .length,
      sent_to_classification_review: items.filter(
        (i) => i.action === "import_needs_classification_review"
      ).length,
      ai_items_evaluated: aiCandidates.length,
    };

    if (mode === "preview") {
      return jsonResponse({
        mode: "preview",
        run_id: null,
        model,
        confidence_threshold: confidenceThreshold,
        warning: aiWarning,
        summary,
        items,
      });
    }

    // MODE = APPLY -> persist everything safely & idempotently
    const ledgerCountBeforeRows = await db.selectAll<{ id: number }>(
      `financial_transactions?select=id&profile_id=eq.${profileId}`
    );
    const ledgerBefore = ledgerCountBeforeRows.length;

    const runRows = await db.request<{ id: number }[]>(
      "pluggy_reconciliation_runs",
      "POST",
      {
        profile_id: profileId,
        status: "running",
        ledger_before: ledgerBefore,
        pending_count: pendingRefs.length,
        notes: {
          triggered_by: "webapp_on_demand",
          model,
          confidence_threshold: confidenceThreshold,
        },
      },
      "return=representation"
    );
    const runId = runRows[0]?.id ?? null;

    let appliedLinked = 0;
    let appliedImported = 0;
    let appliedHeldRecon = 0;
    const nowIso = new Date().toISOString();

    for (const op of ops) {
      const { item, ref, localAccountId, accountType } = op;

      if (item.action === "link_existing" && item.linked_transaction_id) {
        await db.request(
          `pluggy_transaction_refs?id=eq.${ref.id}&profile_id=eq.${profileId}`,
          "PATCH",
          {
            transaction_id: item.linked_transaction_id,
            reconciliation_method: "exact_unique",
            reconciliation_confidence: 1,
            reconciled_at: nowIso,
          }
        );
        appliedLinked += 1;
        continue;
      }

      if (item.action === "hold_reconciliation_review") {
        await db.request(
          "pluggy_reconciliation_reviews?on_conflict=pluggy_ref_id",
          "POST",
          {
            profile_id: profileId,
            pluggy_ref_id: ref.id,
            reason: op.reviewReason ?? "ambiguous_match",
            status: "open",
            details: {
              description: item.description,
              amount: item.amount,
              occurred_on: item.occurred_on,
              account_name: item.account_name,
              rationale: item.rationale,
              run_id: runId,
            },
          },
          "resolution=ignore-duplicates"
        );
        appliedHeldRecon += 1;
        continue;
      }

      if (!localAccountId) continue;

      const sourceRecordKey = `pluggy:${ref.external_account_id}:${ref.external_transaction_id}`;
      const isPendingClassification =
        item.action === "import_needs_classification_review";
      const opTypeId = inferOperationTypeId(
        item.description,
        accountType,
        item.economic_effect,
        item.direction
      );

      // Check idempotency if already inserted
      const existingTx = await db.request<{ id: number }[]>(
        `financial_transactions?select=id&profile_id=eq.${profileId}&source_record_key=eq.${encodeURIComponent(sourceRecordKey)}&limit=1`
      );

      let txId = existingTx[0]?.id ?? null;

      if (!txId) {
        const inserted = await db.request<{ id: number }[]>(
          "financial_transactions",
          "POST",
          {
            profile_id: profileId,
            account_id: localAccountId,
            source_file_id: null,
            operation_type_id: opTypeId,
            source_record_key: sourceRecordKey,
            occurred_on: item.occurred_on,
            direction: item.direction,
            amount: item.amount,
            currency: "BRL",
            raw_description: item.description,
            economic_effect: item.economic_effect,
            is_spending: item.is_spending,
            is_own_transfer: item.is_own_transfer,
            reconciliation_status: "matched",
            classification_status: isPendingClassification ? "pending" : "classified",
            needs_review: isPendingClassification,
            raw_payload: ref.raw_payload ?? {},
          },
          "return=representation"
        );
        txId = inserted[0]?.id ?? null;
        if (txId) appliedImported += 1;
      }

      if (!txId) continue;

      // Link staging ref -> ledger transaction
      await db.request(
        `pluggy_transaction_refs?id=eq.${ref.id}&profile_id=eq.${profileId}`,
        "PATCH",
        {
          transaction_id: txId,
          reconciliation_method: "imported_new",
          reconciliation_confidence: item.confidence ?? 1,
          reconciled_at: nowIso,
        }
      );

      // Write allocation + history for classified spending
      if (item.is_spending && !isPendingClassification && item.category_id) {
        const allocSource =
          item.action === "import_classified_ai"
            ? "ai"
            : item.action === "import_classified_pluggy_map"
              ? "bank"
              : "rule";

        await db.request("transaction_allocations", "POST", {
          profile_id: profileId,
          transaction_id: txId,
          category_id: item.category_id,
          amount: item.amount,
          classification_source: allocSource,
          confidence: item.confidence ?? 1,
          note: item.rationale,
        });

        await db.request("classification_history", "POST", {
          profile_id: profileId,
          transaction_id: txId,
          category_id: item.category_id,
          previous_category_id: null,
          source: allocSource,
          confidence: item.confidence ?? 1,
          reason: item.rationale,
        });
      }

      // Create classification review item with AI suggestion ready for 1-click approval
      if (isPendingClassification) {
        await db.request("review_queue", "POST", {
          profile_id: profileId,
          transaction_id: txId,
          review_type: "classification",
          status: "open",
          priority: "normal",
          message: `Revisar categoria: ${item.description}`,
          details: {
            pluggy_ref_id: ref.id,
            run_id: runId,
            amount: item.amount,
            direction: item.direction,
            occurred_on: item.occurred_on,
            account_name: item.account_name,
            description: item.description,
            suggested_category_id: item.category_id,
            suggested_category_name: item.category_name,
            suggested_economic_effect: item.economic_effect,
            confidence: item.confidence,
            rationale: item.rationale,
            suggested_rule_pattern: item.suggested_rule_pattern,
            model,
          },
        });
      }
    }

    // Finalize run record + audit event
    if (runId) {
      await db.request(
        `pluggy_reconciliation_runs?id=eq.${runId}`,
        "PATCH",
        {
          status: "completed",
          completed_at: new Date().toISOString(),
          ledger_after: ledgerBefore + appliedImported,
          linked_existing: appliedLinked,
          imported_new: appliedImported,
          held_for_review: appliedHeldRecon,
          pending_count: pendingRefs.length,
          notes: {
            triggered_by: "webapp_on_demand",
            model,
            confidence_threshold: confidenceThreshold,
            summary,
          },
        }
      );

      await db.request("audit_events", "POST", {
        profile_id: profileId,
        entity_type: "pluggy_reconciliation_run",
        entity_id: runId,
        action: "reconcile_and_classify",
        actor_type: "application",
        details: summary,
      });
    }

    return jsonResponse({
      mode: "apply",
      run_id: runId,
      model,
      confidence_threshold: confidenceThreshold,
      warning: aiWarning,
      summary,
      items,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "UNKNOWN_ERROR";
    return jsonResponse({ error: message }, 500);
  }
});
