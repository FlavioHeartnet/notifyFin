'use client';
import React from 'react';
import { Box, Stack, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';

interface NotifyFinLogoProps {
  compact?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export default function NotifyFinLogo({
  compact = false,
  size = 'md',
}: NotifyFinLogoProps) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const scale = size === 'lg' ? 1.25 : size === 'sm' ? 0.85 : 1;
  const boxW = Math.round(40 * scale);
  const boxH = Math.round(32 * scale);
  const shapeSize = 28.14 * scale;
  const leftOffset = 1.33 * scale;
  const rightOffset = 11.1 * scale;
  const topOffset = 2 * scale;

  return (
    <Stack direction="row" spacing={size === 'lg' ? 1.5 : 1.15} alignItems="center">
      {/* Exact Modernize overlapping dual-petal mark extracted from Figma (node 3282:6969) */}
      <Box
        sx={{
          position: 'relative',
          width: boxW,
          height: boxH,
          flexShrink: 0,
        }}
      >
        <Box
          component="img"
          src="/images/brand/logo-left.svg"
          alt=""
          width={shapeSize}
          height={shapeSize}
          sx={{
            position: 'absolute',
            left: `${leftOffset}px`,
            top: `${topOffset}px`,
            width: `${shapeSize}px`,
            height: `${shapeSize}px`,
            display: 'block',
          }}
        />
        <Box
          component="img"
          src="/images/brand/logo-right.svg"
          alt=""
          width={shapeSize}
          height={shapeSize}
          sx={{
            position: 'absolute',
            left: `${rightOffset}px`,
            top: `${topOffset}px`,
            width: `${shapeSize}px`,
            height: `${shapeSize}px`,
            transform: 'scaleX(-1)',
            mixBlendMode: isDark ? 'screen' : 'multiply',
            opacity: isDark ? 0.92 : 1,
            display: 'block',
          }}
        />
      </Box>

      {!compact && (
        <Typography
          component="span"
          sx={{
            fontWeight: 700,
            fontSize:
              size === 'lg' ? '1.75rem' : size === 'sm' ? '1.05rem' : '1.25rem',
            letterSpacing: '-0.03em',
            lineHeight: 1.15,
            color: 'text.primary',
            whiteSpace: 'nowrap',
          }}
        >
          Notify
          <Box component="span" sx={{ color: 'primary.main' }}>
            Fin
          </Box>
        </Typography>
      )}
    </Stack>
  );
}
