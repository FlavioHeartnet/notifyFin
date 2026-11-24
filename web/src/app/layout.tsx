import React from 'react';
import type { Metadata, Viewport } from 'next';
import NextTopLoader from 'nextjs-toploader';
import { CustomizerContextProvider } from '@/app/context/customizerContext';
import { plus } from '@/utils/theme/Typography';
import MyApp from './app';
import './global.css';

export const metadata: Metadata = {
  title: 'NotifyFin — Finanças Pessoais',
  description:
    'Monitoramento financeiro pessoal, contas monitoradas, faturas, recorrências e conciliação Open Finance.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#5D87FF' },
    { media: '(prefers-color-scheme: dark)', color: '#202938' },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className={plus.className} suppressHydrationWarning>
      <body>
        <NextTopLoader color="#5D87FF" showSpinner={false} />
        <CustomizerContextProvider>
          <MyApp>{children}</MyApp>
        </CustomizerContextProvider>
      </body>
    </html>
  );
}
