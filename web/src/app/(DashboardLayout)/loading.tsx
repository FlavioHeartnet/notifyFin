import React from 'react';
import { Grid, Skeleton, Stack } from '@mui/material';

export default function DashboardLoading() {
  return (
    <Stack spacing={2.5}>
      <Skeleton variant="rounded" height={44} width="45%" />
      <Grid container spacing={2}>
        {[1, 2, 3, 4].map((i) => (
          <Grid key={i} size={{ xs: 6, lg: 3 }}>
            <Skeleton variant="rounded" height={124} sx={{ borderRadius: 2.5 }} />
          </Grid>
        ))}
      </Grid>
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, lg: 8 }}>
          <Skeleton variant="rounded" height={340} sx={{ borderRadius: 2.5 }} />
        </Grid>
        <Grid size={{ xs: 12, lg: 4 }}>
          <Skeleton variant="rounded" height={340} sx={{ borderRadius: 2.5 }} />
        </Grid>
      </Grid>
    </Stack>
  );
}
