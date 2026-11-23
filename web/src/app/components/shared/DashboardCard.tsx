'use client';
import React, { useContext } from 'react';
import { useTheme } from '@mui/material/styles';
import { Card, CardContent, Typography, Stack, Box } from '@mui/material';
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
}: Props) => {
  const { isCardShadow } = useContext(CustomizerContext);
  const theme = useTheme();
  const borderColor = theme.palette.divider;

  return (
    <Card
      sx={{
        padding: 0,
        border: !isCardShadow ? `1px solid ${borderColor}` : 'none',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
      elevation={isCardShadow ? 9 : 0}
      variant={!isCardShadow ? 'outlined' : undefined}
    >
      {cardheading ? (
        <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
          <Typography variant="h5">{headtitle}</Typography>
          <Typography variant="subtitle2" color="textSecondary">
            {headsubtitle}
          </Typography>
        </CardContent>
      ) : (
        <CardContent
          sx={{
            p: noPadding ? 0 : { xs: 2, sm: 3 },
            flexGrow: 1,
            '&:last-child': { pb: noPadding ? 0 : { xs: 2, sm: 3 } },
          }}
        >
          {title ? (
            <Stack
              direction="row"
              spacing={1.5}
              justifyContent="space-between"
              alignItems="flex-start"
              mb={2.5}
              px={noPadding ? { xs: 2, sm: 3 } : 0}
              pt={noPadding ? { xs: 2, sm: 3 } : 0}
            >
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="h5" noWrap>
                  {title}
                </Typography>
                {subtitle ? (
                  <Typography variant="subtitle2" color="textSecondary" mt={0.25}>
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
