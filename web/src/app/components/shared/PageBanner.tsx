'use client';
import React from 'react';
import Link from 'next/link';
import { Box, Stack, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';

export interface BreadcrumbCrumb {
  label: string;
  href?: string;
}

interface PageBannerProps {
  title: string;
  subtitle?: string;
  breadcrumbs?: BreadcrumbCrumb[];
  action?: React.ReactNode;
  showGraphic?: boolean;
}

/**
 * Modernize Figma Breadcrumb Banner (node 304:22930)
 * Soft primary-tinted rounded banner with title, dot-separated breadcrumb trail,
 * optional actions, and the floating 3D star graphic on the right.
 */
export default function PageBanner({
  title,
  subtitle,
  breadcrumbs,
  action,
  showGraphic = true,
}: PageBannerProps) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const trail: BreadcrumbCrumb[] = breadcrumbs ?? [
    { label: 'Início', href: '/' },
    { label: title },
  ];

  return (
    <Box
      sx={{
        position: 'relative',
        overflow: 'hidden',
        borderRadius: '12px',
        px: { xs: 2.5, sm: 3 },
        py: { xs: 2, sm: 2.25 },
        bgcolor: isDark
          ? 'rgba(93, 135, 255, 0.14)'
          : 'rgba(93, 135, 255, 0.1)',
        display: 'flex',
        flexDirection: { xs: 'column', sm: 'row' },
        alignItems: { xs: 'flex-start', sm: 'center' },
        justifyContent: 'space-between',
        gap: 2,
      }}
    >
      <Box sx={{ minWidth: 0, zIndex: 1 }}>
        <Typography
          variant="h5"
          sx={{
            fontWeight: 700,
            fontSize: { xs: '1.125rem', sm: '1.25rem' },
            letterSpacing: '-0.02em',
            color: 'text.primary',
          }}
        >
          {title}
        </Typography>

        <Stack
          direction="row"
          spacing={1}
          alignItems="center"
          flexWrap="wrap"
          useFlexGap
          sx={{ mt: 0.5 }}
        >
          {trail.map((crumb, index) => {
            const isLast = index === trail.length - 1;
            return (
              <React.Fragment key={`${crumb.label}-${index}`}>
                {index > 0 && (
                  <Box
                    sx={{
                      width: 4,
                      height: 4,
                      borderRadius: '999px',
                      bgcolor: isDark
                        ? 'rgba(255,255,255,0.5)'
                        : 'rgba(42,53,71,0.45)',
                    }}
                  />
                )}
                {crumb.href && !isLast ? (
                  <Typography
                    component={Link}
                    href={crumb.href}
                    variant="body2"
                    sx={{
                      fontWeight: 600,
                      color: isDark
                        ? 'rgba(255,255,255,0.6)'
                        : 'rgba(42,53,71,0.55)',
                      '&:hover': { color: 'primary.main' },
                    }}
                  >
                    {crumb.label}
                  </Typography>
                ) : (
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: 600,
                      color: isDark
                        ? 'rgba(255,255,255,0.72)'
                        : 'rgba(42,53,71,0.55)',
                    }}
                  >
                    {crumb.label}
                  </Typography>
                )}
              </React.Fragment>
            );
          })}
          {subtitle && (
            <>
              <Box
                sx={{
                  width: 4,
                  height: 4,
                  borderRadius: '999px',
                  bgcolor: isDark
                    ? 'rgba(255,255,255,0.35)'
                    : 'rgba(42,53,71,0.3)',
                  display: { xs: 'none', md: 'block' },
                }}
              />
              <Typography
                variant="caption"
                sx={{
                  color: 'text.secondary',
                  display: { xs: 'none', md: 'inline' },
                }}
              >
                {subtitle}
              </Typography>
            </>
          )}
        </Stack>
      </Box>

      <Stack
        direction="row"
        spacing={1.5}
        alignItems="center"
        sx={{ zIndex: 1, flexShrink: 0 }}
      >
        {action}
        {showGraphic && !action && (
          <Box
            component="img"
            src="/images/banners/breadcrumb-star.png"
            alt=""
            width={72}
            height={72}
            sx={{
              width: 72,
              height: 72,
              objectFit: 'contain',
              display: { xs: 'none', sm: 'block' },
              pointerEvents: 'none',
              userSelect: 'none',
              my: -1,
            }}
          />
        )}
      </Stack>
    </Box>
  );
}
