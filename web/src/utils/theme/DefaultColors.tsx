const baselightTheme = {
  direction: 'ltr',
  palette: {
    primary: {
      main: '#5D87FF',
      light: '#ECF2FF',
      dark: '#4570EA',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#49BEFF',
      light: '#E8F7FF',
      dark: '#23AFDB',
      contrastText: '#FFFFFF',
    },
    success: {
      main: '#13DEB9',
      light: '#E6FFFA',
      dark: '#0BB798',
      contrastText: '#FFFFFF',
    },
    info: {
      main: '#539BFF',
      light: '#EBF3FE',
      dark: '#1682D4',
      contrastText: '#FFFFFF',
    },
    error: {
      main: '#FA896B',
      light: '#FDEDE8',
      dark: '#F3704D',
      contrastText: '#FFFFFF',
    },
    warning: {
      main: '#FFAE1F',
      light: '#FEF5E5',
      dark: '#E59400',
      contrastText: '#FFFFFF',
    },
    purple: {
      A50: '#EBF3FE',
      A100: '#6610F2',
      A200: '#557FB9',
    },
    grey: {
      50: '#F8FAFC',
      100: '#F2F6FA',
      200: '#EAEFF4',
      300: '#DFE5EF',
      400: '#7C8FAC',
      500: '#5A6A85',
      600: '#2A3547',
    },
    text: {
      primary: '#2A3547',
      secondary: 'rgba(42, 53, 71, 0.6)',
      disabled: 'rgba(42, 53, 71, 0.38)',
    },
    action: {
      disabledBackground: 'rgba(42, 53, 71, 0.12)',
      hoverOpacity: 0.04,
      hover: 'rgba(93, 135, 255, 0.06)',
    },
    divider: 'rgba(42, 53, 71, 0.1)',
    background: {
      default: '#FFFFFF',
      paper: '#FFFFFF',
    },
  },
};

const baseDarkTheme = {
  direction: 'ltr',
  palette: {
    primary: {
      main: '#5D87FF',
      light: 'rgba(93, 135, 255, 0.15)',
      dark: '#4570EA',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#49BEFF',
      light: 'rgba(73, 190, 255, 0.15)',
      dark: '#23AFDB',
      contrastText: '#FFFFFF',
    },
    success: {
      main: '#13DEB9',
      light: 'rgba(19, 222, 185, 0.14)',
      dark: '#02B3A9',
      contrastText: '#FFFFFF',
    },
    info: {
      main: '#539BFF',
      light: 'rgba(83, 155, 255, 0.15)',
      dark: '#1682D4',
      contrastText: '#FFFFFF',
    },
    error: {
      main: '#FA896B',
      light: 'rgba(250, 137, 107, 0.15)',
      dark: '#F3704D',
      contrastText: '#FFFFFF',
    },
    warning: {
      main: '#FFAE1F',
      light: 'rgba(255, 174, 31, 0.15)',
      dark: '#E59400',
      contrastText: '#FFFFFF',
    },
    purple: {
      A50: '#253662',
      A100: '#8E62FF',
      A200: '#557FB9',
    },
    grey: {
      50: '#212B3B',
      100: '#333F55',
      200: '#465670',
      300: '#7C8FAC',
      400: '#DFE5EF',
      500: '#EAEFF4',
      600: '#F2F6FA',
    },
    text: {
      primary: '#FFFFFF',
      secondary: 'rgba(255, 255, 255, 0.62)',
      disabled: 'rgba(255, 255, 255, 0.38)',
    },
    action: {
      disabledBackground: 'rgba(255, 255, 255, 0.1)',
      hoverOpacity: 0.06,
      hover: 'rgba(255, 255, 255, 0.06)',
    },
    divider: 'rgba(255, 255, 255, 0.1)',
    background: {
      default: '#202938',
      dark: '#202938',
      paper: '#2A3547',
    },
  },
};

export { baseDarkTheme, baselightTheme };
