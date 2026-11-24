'use client';
import React from 'react';
import { Chip, type ChipProps } from '@mui/material';
import { useTheme } from '@mui/material/styles';

export type SoftTone =
  | 'primary'
  | 'secondary'
  | 'success'
  | 'warning'
  | 'error'
  | 'info'
  | 'neutral';

interface StatusChipProps extends Omit<ChipProps, 'color' | 'variant'> {
  tone?: SoftTone;
}

const SOFT_STYLES: Record<
  SoftTone,
  { bgLight: string; fgLight: string; bgDark: string; fgDark: string }
> = {
  primary: {
    bgLight: 'rgba(93, 135, 255, 0.12)',
    fgLight: '#5D87FF',
    bgDark: 'rgba(93, 135, 255, 0.18)',
    fgDark: '#86A7FF',
  },
  secondary: {
    bgLight: 'rgba(73, 190, 255, 0.12)',
    fgLight: '#1E9CE6',
    bgDark: 'rgba(73, 190, 255, 0.18)',
    fgDark: '#49BEFF',
  },
  success: {
    bgLight: 'rgba(19, 222, 185, 0.14)',
    fgLight: '#0A9E82',
    bgDark: 'rgba(19, 222, 185, 0.18)',
    fgDark: '#13DEB9',
  },
  warning: {
    bgLight: 'rgba(255, 174, 31, 0.15)',
    fgLight: '#CC8400',
    bgDark: 'rgba(255, 174, 31, 0.18)',
    fgDark: '#FFAE1F',
  },
  error: {
    bgLight: 'rgba(250, 137, 107, 0.15)',
    fgLight: '#E86848',
    bgDark: 'rgba(250, 137, 107, 0.18)',
    fgDark: '#FA896B',
  },
  info: {
    bgLight: 'rgba(83, 155, 255, 0.14)',
    fgLight: '#3B82F6',
    bgDark: 'rgba(83, 155, 255, 0.18)',
    fgDark: '#69A8FF',
  },
  neutral: {
    bgLight: 'rgba(42, 53, 71, 0.07)',
    fgLight: 'rgba(42, 53, 71, 0.72)',
    bgDark: 'rgba(255, 255, 255, 0.1)',
    fgDark: 'rgba(255, 255, 255, 0.78)',
  },
};

/**
 * Modernize Figma soft-tinted badge/chip (node 325:5045 & 201:20677)
 */
export default function StatusChip({
  tone = 'primary',
  size = 'small',
  sx,
  ...rest
}: StatusChipProps) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const s = SOFT_STYLES[tone];

  return (
    <Chip
      size={size}
      {...rest}
      sx={[
        {
          bgcolor: isDark ? s.bgDark : s.bgLight,
          color: isDark ? s.fgDark : s.fgLight,
          borderRadius: '6px',
          fontWeight: 600,
          fontSize: '0.75rem',
          height: size === 'small' ? 24 : 28,
          border: 'none',
          '& .MuiChip-icon': {
            color: 'inherit',
          },
        },
        ...(Array.isArray(sx) ? sx : sx ? [sx] : []),
      ]}
    />
  );
}
