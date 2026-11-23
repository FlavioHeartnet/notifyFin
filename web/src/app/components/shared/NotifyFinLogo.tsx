'use client';
import React from 'react';
import { Box, Stack, Typography } from '@mui/material';
import { IconBellDollar } from '@tabler/icons-react';

interface NotifyFinLogoProps {
  compact?: boolean;
}

export default function NotifyFinLogo({ compact = false }: NotifyFinLogoProps) {
  return (
    <Stack direction="row" spacing={1.25} alignItems="center">
      <Box
        sx={{
          width: 36,
          height: 36,
          borderRadius: '10px',
          background: 'linear-gradient(135deg, #5D87FF 0%, #49BEFF 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#FFFFFF',
          boxShadow: '0 6px 14px rgba(93, 135, 255, 0.35)',
          flexShrink: 0,
        }}
      >
        <IconBellDollar size={21} stroke={2} />
      </Box>
      {!compact && (
        <Box>
          <Typography
            variant="h5"
            sx={{
              fontWeight: 700,
              letterSpacing: '-0.02em',
              lineHeight: 1.1,
            }}
          >
            Notify<Box component="span" sx={{ color: 'primary.main' }}>Fin</Box>
          </Typography>
          <Typography
            variant="caption"
            color="textSecondary"
            sx={{ display: 'block', fontSize: '0.68rem', lineHeight: 1.2 }}
          >
            Finanças Pessoais
          </Typography>
        </Box>
      )}
    </Stack>
  );
}
