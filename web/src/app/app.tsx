'use client';
import React, { useEffect, useState } from 'react';
import NextTopLoader from 'nextjs-toploader';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { AppRouterCacheProvider } from '@mui/material-nextjs/v15-appRouter';
import { ThemeSettings } from '@/utils/theme/Theme';

export default function MyApp({ children }: { children: React.ReactNode }) {
  const theme = ThemeSettings();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <AppRouterCacheProvider options={{ enableCssLayer: true }}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {mounted ? <NextTopLoader color="#5D87FF" showSpinner={false} /> : null}
        {children}
      </ThemeProvider>
    </AppRouterCacheProvider>
  );
}
