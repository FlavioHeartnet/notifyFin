import React from 'react';
import { Grid, Skeleton, Stack } from '@mui/material';

export default function DashboardLoading() {
  return (
    <Stack spacing={3}>
      <Skeleton variant="rounded" height={84} sx={{ borderRadius: '12px' }} />
      <Grid container spacing={2.5}>
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Grid key={i} size={{ xs: 6, sm: 4, lg: 2 }}>
            <Skeleton variant="rounded" height={148} sx={{ borderRadius: '8px' }} />
          </Grid>
        ))}
      </Grid>
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, lg: 8 }}>
          <Skeleton variant="rounded" height={380} sx={{ borderRadius: '12px' }} />
        </Grid>
        <Grid size={{ xs: 12, lg: 4 }}>
          <Stack spacing={3}>
            <Skeleton variant="rounded" height={178} sx={{ borderRadius: '12px' }} />
            <Skeleton variant="rounded" height={178} sx={{ borderRadius: '12px' }} />
          </Stack>
        </Grid>
      </Grid>
    </Stack>
  );
}
