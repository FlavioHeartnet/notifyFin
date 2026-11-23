# NotifyFin Web

Webapp mobile-first de finanças pessoais construído com **Next.js (App Router)**, **TypeScript**, **MUI v7 (padrões do template Modernize)**, **ApexCharts** e **Supabase SSR (`@supabase/ssr`)** com Row-Level Security (RLS).

## Telas implementadas

- **Visão Geral (`/`)**: KPIs mensais (gastos categorizados, entradas observadas, fluxo líquido, recorrências), seletor mensal mobile-first, evolução de 10 meses, donut + ranking de categorias, últimas movimentações, faturas recentes e saúde do Open Finance.
- **Movimentações (`/movimentacoes`)**: busca e filtros por mês, conta monitorada, categoria hierárquica e efeito econômico; cards responsivos no mobile e tabela no desktop; drawer lateral/bottom sheet para **reclassificar categorias** (com histórico em `classification_history` e `audit_events`).
- **Contas & Faturas (`/contas`)**: visão consolidada das contas monitoradas, evolução e histórico de faturas de cartão (`pluggy_bills`) e compromissos parcelados (`installment_plans`).
- **Recorrências (`/recorrencias`)**: serviços recorrentes, regras ativas e fila de candidatos ambíguos (`v_recurring_review_candidates`) com ações **Confirmar** / **Ignorar** gravadas em `recurring_transaction_overrides`.
- **Fila de Revisão (`/revisoes`)**: itens de `review_queue` e `pluggy_reconciliation_reviews` com ações **Resolver**, **Dispensar** e **Reabrir**.
- **Documentos Fiscais (`/documentos`)**: notas fiscais com itens detalhados expansíveis (`fiscal_documents` + `fiscal_document_items`), lotes de importação (`import_batches`) e arquivos fonte (`source_files`).
- **Open Finance / Pluggy (`/sincronizacao`)**: conexões ativas, mapeamento de contas, histórico de sincronizações (`pluggy_sync_runs`), reconciliações e tradução de categorias.

## Como executar localmente

1. Copie `.env.example` para `.env.local` e preencha `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (já configurado localmente).
2. Instale e rode o servidor de desenvolvimento:

```bash
cd web
npm install
npm run dev
```

3. Acesse `http://localhost:3001` e entre com seu e-mail e senha do Supabase Auth.
