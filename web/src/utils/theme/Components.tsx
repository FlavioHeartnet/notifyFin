import './DefaultColors';
import { Theme } from '@mui/material/styles';

const components: any = (theme: Theme) => {
  const isDark = theme.palette.mode === 'dark';

  return {
    MuiCssBaseline: {
      styleOverrides: {
        html: {
          height: '100%',
          width: '100%',
          boxSizing: 'border-box',
        },
        '*, *::before, *::after': {
          boxSizing: 'inherit',
        },
        a: {
          textDecoration: 'none',
        },
        body: {
          height: '100%',
          margin: 0,
          padding: 0,
          backgroundColor: theme.palette.background.default,
          color: theme.palette.text.primary,
          WebkitFontSmoothing: 'antialiased',
          MozOsxFontSmoothing: 'grayscale',
        },
        '#root': {
          height: '100%',
        },
        hr: {
          height: '1px',
          border: 0,
          borderTop: `1px solid ${theme.palette.divider}`,
        },
        '.tabular-nums': {
          fontVariantNumeric: 'tabular-nums',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
        outlined: {
          borderColor: theme.palette.divider,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          width: '100%',
          padding: 0,
          borderRadius: 12,
          backgroundImage: 'none',
          border: isDark ? `1px solid ${theme.palette.divider}` : 'none',
        },
      },
    },
    MuiCardHeader: {
      styleOverrides: {
        root: {
          padding: '24px 30px 16px',
        },
        title: {
          fontSize: '1.125rem',
          fontWeight: 600,
          letterSpacing: '-0.02em',
        },
      },
    },
    MuiCardContent: {
      styleOverrides: {
        root: {
          padding: '28px',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          boxShadow: 'none',
          borderRadius: 8,
          fontWeight: 600,
          letterSpacing: '-0.01em',
          transition: 'all 0.16s ease',
          '&:hover': {
            boxShadow: 'none',
          },
        },
        sizeSmall: {
          padding: '6px 14px',
          fontSize: '0.8125rem',
        },
        sizeMedium: {
          padding: '9px 18px',
          fontSize: '0.875rem',
        },
        sizeLarge: {
          padding: '11px 22px',
          fontSize: '0.9375rem',
        },
        containedPrimary: {
          backgroundColor: theme.palette.primary.main,
          color: '#FFFFFF',
          '&:hover': {
            backgroundColor: theme.palette.primary.dark,
          },
        },
        text: {
          padding: '6px 14px',
          '&:hover': {
            backgroundColor: theme.palette.primary.light,
            color: theme.palette.primary.main,
          },
        },
        textPrimary: {
          backgroundColor: theme.palette.primary.light,
          color: theme.palette.primary.main,
          '&:hover': {
            backgroundColor: theme.palette.primary.main,
            color: '#FFFFFF',
          },
        },
        textSecondary: {
          backgroundColor: theme.palette.secondary.light,
          color: theme.palette.secondary.main,
          '&:hover': {
            backgroundColor: theme.palette.secondary.main,
            color: '#FFFFFF',
          },
        },
        textSuccess: {
          backgroundColor: theme.palette.success.light,
          color: theme.palette.success.main,
          '&:hover': {
            backgroundColor: theme.palette.success.main,
            color: '#FFFFFF',
          },
        },
        textError: {
          backgroundColor: theme.palette.error.light,
          color: theme.palette.error.main,
          '&:hover': {
            backgroundColor: theme.palette.error.main,
            color: '#FFFFFF',
          },
        },
        textWarning: {
          backgroundColor: theme.palette.warning.light,
          color: theme.palette.warning.main,
          '&:hover': {
            backgroundColor: theme.palette.warning.main,
            color: '#FFFFFF',
          },
        },
        outlined: {
          borderColor: isDark
            ? 'rgba(255, 255, 255, 0.2)'
            : 'rgba(42, 53, 71, 0.2)',
        },
        outlinedPrimary: {
          borderColor: theme.palette.primary.main,
          '&:hover': {
            backgroundColor: theme.palette.primary.main,
            color: '#FFFFFF',
          },
        },
        outlinedSecondary: {
          borderColor: theme.palette.secondary.main,
          '&:hover': {
            backgroundColor: theme.palette.secondary.main,
            color: '#FFFFFF',
          },
        },
        outlinedError: {
          borderColor: theme.palette.error.main,
          '&:hover': {
            backgroundColor: theme.palette.error.main,
            color: '#FFFFFF',
          },
        },
        outlinedSuccess: {
          borderColor: theme.palette.success.main,
          '&:hover': {
            backgroundColor: theme.palette.success.main,
            color: '#FFFFFF',
          },
        },
        outlinedWarning: {
          borderColor: theme.palette.warning.main,
          '&:hover': {
            backgroundColor: theme.palette.warning.main,
            color: '#FFFFFF',
          },
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          transition: 'all 0.16s ease',
          '&:hover': {
            backgroundColor: theme.palette.primary.light,
            color: theme.palette.primary.main,
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 600,
          fontSize: '0.75rem',
          borderRadius: 6,
          letterSpacing: '-0.01em',
        },
        sizeSmall: {
          height: 24,
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        root: {
          minHeight: 44,
        },
        indicator: {
          height: 2.5,
          borderRadius: '2px 2px 0 0',
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          fontSize: '0.875rem',
          minHeight: 44,
          padding: '10px 18px',
          color: theme.palette.text.secondary,
          '&.Mui-selected': {
            color: theme.palette.primary.main,
          },
        },
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          '& .MuiTableCell-head': {
            fontWeight: 600,
            fontSize: '0.875rem',
            color: theme.palette.text.primary,
            borderBottom: `1px solid ${theme.palette.divider}`,
            paddingTop: 14,
            paddingBottom: 14,
            backgroundColor: 'transparent',
            letterSpacing: '-0.015em',
          },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottom: `1px solid ${theme.palette.divider}`,
          padding: '14px 16px',
          fontSize: '0.875rem',
        },
        sizeSmall: {
          padding: '12px 16px',
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          transition: 'background-color 0.12s ease',
          '&.MuiTableRow-hover:hover': {
            backgroundColor: theme.palette.action.hover,
          },
          '&:last-child td': {
            borderBottom: 0,
          },
        },
      },
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: {
          height: 6,
          backgroundColor: isDark
            ? 'rgba(255, 255, 255, 0.1)'
            : 'rgba(93, 135, 255, 0.12)',
          borderRadius: 999,
        },
        bar: {
          borderRadius: 999,
        },
      },
    },
    MuiDivider: {
      styleOverrides: {
        root: {
          borderColor: theme.palette.divider,
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: 10,
        },
        filledSuccess: { color: '#FFFFFF' },
        filledInfo: { color: '#FFFFFF' },
        filledError: { color: '#FFFFFF' },
        filledWarning: { color: '#FFFFFF' },
        standardSuccess: {
          backgroundColor: theme.palette.success.light,
          color: isDark ? theme.palette.success.main : '#0A9A80',
        },
        standardError: {
          backgroundColor: theme.palette.error.light,
          color: theme.palette.error.main,
        },
        standardWarning: {
          backgroundColor: theme.palette.warning.light,
          color: isDark ? theme.palette.warning.main : '#C47F00',
        },
        standardInfo: {
          backgroundColor: theme.palette.info.light,
          color: theme.palette.info.main,
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          minHeight: 44,
          '&.MuiInputBase-sizeSmall': {
            minHeight: 40,
          },
          '&.MuiInputBase-multiline': {
            minHeight: 'auto',
          },
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: isDark
              ? 'rgba(255, 255, 255, 0.2)'
              : 'rgba(42, 53, 71, 0.2)',
          },
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: theme.palette.primary.main,
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: theme.palette.primary.main,
            borderWidth: 1.5,
          },
        },
        input: {
          boxSizing: 'content-box',
          padding: '10.5px 14px',
          '&.MuiInputBase-inputAdornedStart': {
            paddingLeft: 0,
          },
          '&.MuiInputBase-inputAdornedEnd': {
            paddingRight: 0,
          },
        },
        inputSizeSmall: {
          boxSizing: 'content-box',
          padding: '8.5px 14px',
          '&.MuiInputBase-inputAdornedStart': {
            paddingLeft: 0,
          },
          '&.MuiInputBase-inputAdornedEnd': {
            paddingRight: 0,
          },
        },
      },
    },
    MuiSelect: {
      styleOverrides: {
        select: {
          display: 'flex',
          alignItems: 'center',
          minHeight: '1.4375em',
        },
      },
    },
    MuiInputLabel: {
      styleOverrides: {
        outlined: {
          transform: 'translate(14px, 11px) scale(1)',
          '&.MuiInputLabel-sizeSmall': {
            transform: 'translate(14px, 9px) scale(1)',
          },
          '&.MuiInputLabel-shrink': {
            transform: 'translate(14px, -9px) scale(0.75)',
          },
        },
      },
    },
    MuiInputAdornment: {
      styleOverrides: {
        root: {
          color: theme.palette.text.secondary,
        },
      },
    },
    MuiCheckbox: {
      styleOverrides: {
        root: {
          color: isDark ? 'rgba(255,255,255,0.35)' : 'rgba(42,53,71,0.28)',
          '&.Mui-checked': {
            color: theme.palette.primary.main,
          },
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          borderColor: theme.palette.divider,
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 12,
          boxShadow: theme.shadows[12],
          border: isDark ? `1px solid ${theme.palette.divider}` : 'none',
        },
      },
    },
    MuiDialogTitle: {
      styleOverrides: {
        root: {
          fontSize: '1.125rem',
          fontWeight: 700,
          letterSpacing: '-0.02em',
        },
      },
    },
    MuiPopover: {
      styleOverrides: {
        paper: {
          borderRadius: 10,
          boxShadow: theme.shadows[12],
          border: `1px solid ${theme.palette.divider}`,
        },
      },
    },
    MuiMenu: {
      styleOverrides: {
        paper: {
          borderRadius: 10,
          boxShadow: theme.shadows[12],
          border: `1px solid ${theme.palette.divider}`,
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          borderRadius: 6,
          fontSize: '0.75rem',
          fontWeight: 500,
          color: isDark ? '#2A3547' : '#FFFFFF',
          backgroundColor: isDark ? '#FFFFFF' : '#2A3547',
        },
      },
    },
    MuiPaginationItem: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          fontWeight: 600,
        },
      },
    },
  };
};

export default components;
