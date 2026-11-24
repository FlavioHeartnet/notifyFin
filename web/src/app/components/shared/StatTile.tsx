'use client';
import React from 'react';
import Link from 'next/link';
import { Box, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';

export type StatTone =
  | 'primary'
  | 'warning'
  | 'secondary'
  | 'error'
  | 'success'
  | 'info';

interface StatTileProps {
  label: string;
  value: string | number;
  sublabel?: string;
  tone?: StatTone;
  iconSrc?: string;
  icon?: React.ReactNode;
  href?: string;
}

const TONE_MAP: Record<
  StatTone,
  { bgLight: string; bgDark: string; textLight: string; textDark: string }
> = {
  primary: {
    bgLight: 'rgba(93, 135, 255, 0.1)',
    bgDark: 'rgba(93, 135, 255, 0.14)',
    textLight: '#5D87FF',
    textDark: '#7C9FFF',
  },
  warning: {
    bgLight: 'rgba(255, 174, 31, 0.1)',
    bgDark: 'rgba(255, 174, 31, 0.14)',
    textLight: '#E59400',
    textDark: '#FFAE1F',
  },
  secondary: {
    bgLight: 'rgba(73, 190, 255, 0.1)',
    bgDark: 'rgba(73, 190, 255, 0.14)',
    textLight: '#28A9F5',
    textDark: '#49BEFF',
  },
  error: {
    bgLight: 'rgba(250, 137, 107, 0.1)',
    bgDark: 'rgba(250, 137, 107, 0.14)',
    textLight: '#FA896B',
    textDark: '#FA896B',
  },
  success: {
    bgLight: 'rgba(19, 222, 185, 0.1)',
    bgDark: 'rgba(19, 222, 185, 0.14)',
    textLight: '#0BB798',
    textDark: '#13DEB9',
  },
  info: {
    bgLight: 'rgba(83, 155, 255, 0.1)',
    bgDark: 'rgba(83, 155, 255, 0.14)',
    textLight: '#539BFF',
    textDark: '#69A8FF',
  },
};

/**
 * Modernize Figma Pastel Stat Tile (node 201:20655 / 68:2299)
 * Centered vertical pastel card with 48x48 Figma duotone icon,
 * 14px SemiBold label, and 20px Bold value.
 */
export default function StatTile({
  label,
  value,
  sublabel,
  tone = 'primary',
  iconSrc,
  icon,
  href,
}: StatTileProps) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const palette = TONE_MAP[tone];
  const color = isDark ? palette.textDark : palette.textLight;

  const content = (
    <Box
      sx={{
        height: '100%',
        borderRadius: '8px',
        p: { xs: 2, sm: 2.75 },
        bgcolor: isDark ? palette.bgDark : palette.bgLight,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        gap: 1.25,
        transition: 'transform 0.16s ease, box-shadow 0.16s ease',
        ...(href
          ? {
              cursor: 'pointer',
              '&:hover': {
                transform: 'translateY(-2px)',
              },
            }
          : {}),
      }}
    >
      {iconSrc ? (
        <Box
          component="img"
          src={iconSrc}
          alt=""
          width={48}
          height={48}
          sx={{
            width: { xs: 40, sm: 48 },
            height: { xs: 40, sm: 48 },
            display: 'block',
            flexShrink: 0,
          }}
        />
      ) : icon ? (
        <Box
          sx={{
            width: 44,
            height: 44,
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color,
            bgcolor: isDark
              ? 'rgba(255,255,255,0.06)'
              : 'rgba(255,255,255,0.7)',
          }}
        >
          {icon}
        </Box>
      ) : null}

      <Box sx={{ minWidth: 0, width: '100%' }}>
        <Typography
          sx={{
            fontSize: { xs: '0.78rem', sm: '0.875rem' },
            fontWeight: 600,
            lineHeight: 1.35,
            letterSpacing: '-0.02em',
            color,
          }}
          noWrap
        >
          {label}
        </Typography>
        <Typography
          className="tabular-nums"
          sx={{
            mt: 0.35,
            fontSize: { xs: '1.05rem', sm: '1.25rem' },
            fontWeight: 700,
            lineHeight: 1.2,
            letterSpacing: '-0.02em',
            color,
          }}
          noWrap
        >
          {value}
        </Typography>
        {sublabel ? (
          <Typography
            variant="caption"
            sx={{
              display: 'block',
              mt: 0.35,
              color: 'text.secondary',
              fontSize: '0.7rem',
            }}
            noWrap
          >
            {sublabel}
          </Typography>
        ) : null}
      </Box>
    </Box>
  );

  if (href) {
    return (
      <Link
        href={href}
        style={{ textDecoration: 'none', color: 'inherit', display: 'block', height: '100%' }}
      >
        {content}
      </Link>
    );
  }

  return content;
}
