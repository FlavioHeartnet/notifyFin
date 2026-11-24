'use client';
import React, { useContext } from 'react';
import { useTheme } from '@mui/material/styles';
import { Card, CardContent, Typography, Stack, Box, type SxProps, type Theme } from '@mui/material';
import { CustomizerContext } from '@/app/context/customizerContext';

type Props = {
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
  footer?: React.ReactNode;
  cardheading?: React.ReactNode;
  headtitle?: React.ReactNode;
  headsubtitle?: React.ReactNode;
  children?: React.ReactNode;
  middlecontent?: React.ReactNode;
  noPadding?: boolean;
  sx?: SxProps<Theme>;
};

const DashboardCard = ({
  title,
  subtitle,
  children,
  action,
  footer,
  cardheading,
  headtitle,
  headsubtitle,
  middlecontent,
  noPadding,
  sx,
}: Props) => {
  const { isCardShadow } = useContext(CustomizerContext);
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  return (
    <Card
      sx={[
        {
          padding: 0,
          borderRadius: '12px',
          border:
            !isCardShadow || isDark
              ? `1px solid ${theme.palette.divider}`
              : 'none',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          bgcolor: 'background.paper',
          overflow: 'hidden',
        },
        ...(Array.isArray(sx) ? sx : sx ? [sx] : []),
      ]}
      elevation={isCardShadow ? 9 : 0}
      variant={!isCardShadow ? 'outlined' : undefined}
    >
      {cardheading ? (
        <CardContent sx={{ p: { xs: 2.5, sm: 3.5 } }}>
          <Typography variant="h5">{headtitle}</Typography>
          {headsubtitle ? (
            <Typography variant="body1" color="text.secondary" mt={0.5}>
              {headsubtitle}
            </Typography>
          ) : null}
        </CardContent>
      ) : (
        <CardContent
          sx={{
            p: noPadding ? 0 : { xs: 2.5, sm: 3.5 },
            flexGrow: 1,
            '&:last-child': { pb: noPadding ? 0 : { xs: 2.5, sm: 3.5 } },
          }}
        >
          {title ? (
            <Stack
              direction="row"
              spacing={1.5}
              justifyContent="space-between"
              alignItems="flex-start"
              mb={noPadding ? 2 : 3}
              px={noPadding ? { xs: 2.5, sm: 3.5 } : 0}
              pt={noPadding ? { xs: 2.5, sm: 3.5 } : 0}
            >
              <Box sx={{ minWidth: 0 }}>
                <Typography
                  variant="h5"
                  sx={{ fontWeight: 600, letterSpacing: '-0.02em' }}
                  noWrap
                >
                  {title}
                </Typography>
                {subtitle ? (
                  <Typography
                    variant="body1"
                    color="text.secondary"
                    sx={{ mt: 0.35, fontSize: '0.875rem' }}
                  >
                    {subtitle}
                  </Typography>
                ) : null}
              </Box>
              {action ? <Box sx={{ flexShrink: 0 }}>{action}</Box> : null}
            </Stack>
          ) : null}

          {children}
        </CardContent>
      )}

      {middlecontent}
      {footer}
    </Card>
  );
};

export default DashboardCard;
