'use client';
import React, { useContext } from 'react';
import { Box, IconButton, Stack, Tooltip, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { IconMoon, IconSun } from '@tabler/icons-react';
import NotifyFinLogo from './NotifyFinLogo';
import { CustomizerContext } from '@/app/context/customizerContext';

interface AuthSplitLayoutProps {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}

/**
 * Modernize Figma Split Authentication Screen (node 201:25797 — Desktop Sign in)
 * Left 60%: Soft cyan-tinted hero panel with top-left brand logo and centered Figma security illustration.
 * Right 40%: Clean surface with vertically centered form stack.
 */
export default function AuthSplitLayout({
  title,
  subtitle,
  children,
}: AuthSplitLayoutProps) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const { activeMode, toggleMode } = useContext(CustomizerContext);

  return (
    <Box
      sx={{
        minHeight: '100dvh',
        width: '100%',
        display: 'flex',
        flexDirection: { xs: 'column', lg: 'row' },
        bgcolor: 'background.paper',
        position: 'relative',
      }}
    >
      {/* Left Hero Illustration Panel (60% on lg+) */}
      <Box
        sx={{
          display: { xs: 'none', lg: 'flex' },
          flex: '0 0 60%',
          flexDirection: 'column',
          position: 'relative',
          bgcolor: isDark
            ? 'rgba(73, 190, 255, 0.06)'
            : 'rgba(73, 190, 255, 0.1)',
          p: 5,
          overflow: 'hidden',
        }}
      >
        <Box sx={{ zIndex: 1 }}>
          <NotifyFinLogo size="lg" />
        </Box>

        <Box
          sx={{
            flexGrow: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            px: 4,
          }}
        >
          <Box
            component="img"
            src="/images/auth/auth-illustration.svg"
            alt="NotifyFin acesso seguro"
            width={366}
            height={380}
            sx={{
              width: '100%',
              maxWidth: 420,
              height: 'auto',
              display: 'block',
            }}
          />
        </Box>

        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ textAlign: 'center', opacity: 0.75 }}
        >
          Monitoramento financeiro pessoal somente leitura • Protegido por RLS no Supabase
        </Typography>
      </Box>

      {/* Right Form Panel (40% on lg+, 100% on mobile) */}
      <Box
        sx={{
          flex: { xs: '1 1 auto', lg: '0 0 40%' },
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          px: { xs: 3, sm: 6, lg: 8 },
          py: { xs: 5, lg: 8 },
          position: 'relative',
          bgcolor: 'background.paper',
          borderLeft: {
            lg: isDark ? `1px solid ${theme.palette.divider}` : 'none',
          },
        }}
      >
        <Box sx={{ position: 'absolute', top: 20, right: 20 }}>
          <Tooltip title={activeMode === 'dark' ? 'Modo claro' : 'Modo escuro'}>
            <IconButton
              onClick={toggleMode}
              aria-label="Alternar modo claro/escuro"
              size="small"
            >
              {activeMode === 'dark' ? (
                <IconSun size={20} stroke={1.75} />
              ) : (
                <IconMoon size={20} stroke={1.75} />
              )}
            </IconButton>
          </Tooltip>
        </Box>

        <Box sx={{ width: '100%', maxWidth: 400 }}>
          <Stack spacing={3}>
            {/* Mobile-only Brand Header */}
            <Box sx={{ display: { xs: 'flex', lg: 'none' }, mb: 1 }}>
              <NotifyFinLogo size="md" />
            </Box>

            <Box>
              <Typography
                variant="h3"
                sx={{
                  fontWeight: 700,
                  fontSize: '1.5rem',
                  letterSpacing: '-0.02em',
                  color: 'text.primary',
                  mb: 0.75,
                }}
              >
                {title}
              </Typography>
              <Typography
                variant="body1"
                sx={{
                  color: 'text.secondary',
                  fontSize: '0.9375rem',
                }}
              >
                {subtitle}
              </Typography>
            </Box>

            {children}
          </Stack>
        </Box>
      </Box>
    </Box>
  );
}
