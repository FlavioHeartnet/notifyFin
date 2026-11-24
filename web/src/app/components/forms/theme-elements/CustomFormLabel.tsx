'use client';
import React from 'react';
import { Typography, type TypographyProps } from '@mui/material';

interface CustomFormLabelProps extends TypographyProps<'label'> {
  htmlFor?: string;
}

const CustomFormLabel: React.FC<CustomFormLabelProps> = ({
  sx,
  children,
  ...props
}) => (
  <Typography
    component="label"
    variant="subtitle2"
    {...props}
    sx={[
      {
        display: 'block',
        fontWeight: 600,
        fontSize: '0.875rem',
        color: 'text.primary',
        mb: 0.75,
        letterSpacing: '-0.015em',
      },
      ...(Array.isArray(sx) ? sx : sx ? [sx] : []),
    ]}
  >
    {children}
  </Typography>
);

export default CustomFormLabel;
