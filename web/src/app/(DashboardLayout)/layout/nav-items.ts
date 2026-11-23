export interface NavItem {
  id: string;
  label: string;
  shortLabel: string;
  href: string;
  section: 'financas' | 'gestao';
  iconName:
    | 'dashboard'
    | 'transactions'
    | 'accounts'
    | 'recurring'
    | 'reviews'
    | 'documents'
    | 'sync';
  mobilePrimary?: boolean;
}

export const NAV_ITEMS: NavItem[] = [
  {
    id: 'overview',
    label: 'Visão Geral',
    shortLabel: 'Início',
    href: '/',
    section: 'financas',
    iconName: 'dashboard',
    mobilePrimary: true,
  },
  {
    id: 'transactions',
    label: 'Movimentações',
    shortLabel: 'Extrato',
    href: '/movimentacoes',
    section: 'financas',
    iconName: 'transactions',
    mobilePrimary: true,
  },
  {
    id: 'accounts',
    label: 'Contas & Faturas',
    shortLabel: 'Contas',
    href: '/contas',
    section: 'financas',
    iconName: 'accounts',
    mobilePrimary: true,
  },
  {
    id: 'recurring',
    label: 'Recorrências',
    shortLabel: 'Fixos',
    href: '/recorrencias',
    section: 'financas',
    iconName: 'recurring',
    mobilePrimary: true,
  },
  {
    id: 'reviews',
    label: 'Fila de Revisão',
    shortLabel: 'Revisões',
    href: '/revisoes',
    section: 'gestao',
    iconName: 'reviews',
    mobilePrimary: true,
  },
  {
    id: 'documents',
    label: 'Documentos Fiscais',
    shortLabel: 'Notas',
    href: '/documentos',
    section: 'gestao',
    iconName: 'documents',
  },
  {
    id: 'sync',
    label: 'Open Finance (Pluggy)',
    shortLabel: 'Pluggy',
    href: '/sincronizacao',
    section: 'gestao',
    iconName: 'sync',
  },
];
