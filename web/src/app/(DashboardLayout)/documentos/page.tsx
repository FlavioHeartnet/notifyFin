import React from 'react';
import { createClient } from '@/lib/supabase/server';
import DocumentsClient, { type FiscalDocRow } from './DocumentsClient';

export const dynamic = 'force-dynamic';

export default async function DocumentosPage() {
  const supabase = await createClient();

  const [docsRes, batchesRes, filesRes] = await Promise.all([
    supabase
      .from('fiscal_documents')
      .select(
        'id, document_type, issuer_name, issuer_tax_id_masked, issued_at, total_amount, extraction_status, fiscal_document_items(id, line_number, description, quantity, unit_price, total_amount)'
      )
      .order('issued_at', { ascending: false })
      .limit(120),
    supabase
      .from('import_batches')
      .select(
        'id, requested_via, status, started_at, completed_at, files_discovered, files_imported, transactions_imported'
      )
      .order('started_at', { ascending: false }),
    supabase
      .from('source_files')
      .select('id, file_name, source_kind, provider, extraction_status, created_at')
      .order('created_at', { ascending: false })
      .limit(100),
  ]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const fiscalDocs: FiscalDocRow[] = ((docsRes.data as any[]) ?? []).map((d) => ({
    id: d.id,
    document_type: d.document_type,
    issuer_name: d.issuer_name,
    issuer_tax_id_masked: d.issuer_tax_id_masked,
    issued_at: d.issued_at,
    total_amount: d.total_amount !== null ? Number(d.total_amount) : null,
    extraction_status: d.extraction_status,
    items: (Array.isArray(d.fiscal_document_items) ? d.fiscal_document_items : [])
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map((i: any) => ({
        id: i.id,
        line_number: i.line_number,
        description: i.description,
        quantity: i.quantity !== null ? Number(i.quantity) : null,
        unit_price: i.unit_price !== null ? Number(i.unit_price) : null,
        total_amount: i.total_amount !== null ? Number(i.total_amount) : null,
      }))
      .sort(
        (a: { line_number: number | null }, b: { line_number: number | null }) =>
          (a.line_number ?? 0) - (b.line_number ?? 0)
      ),
  }));

  return (
    <DocumentsClient
      fiscalDocs={fiscalDocs}
      batches={batchesRes.data ?? []}
      sourceFiles={filesRes.data ?? []}
    />
  );
}
