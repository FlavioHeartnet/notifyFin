import _ from 'lodash';
import { createTheme } from '@mui/material/styles';
import { CustomizerContext } from '@/app/context/customizerContext';
import { useContext, useEffect, useMemo } from 'react';
import components from './Components';
import typography from './Typography';
import { shadows, darkshadows } from './Shadows';
import { DarkThemeColors } from './DarkThemeColors';
import { LightThemeColors } from './LightThemeColors';
import { baseDarkTheme, baselightTheme } from './DefaultColors';
import * as locales from '@mui/material/locale';

export const BuildTheme = (config: {
  direction?: string;
  theme?: string;
  activeMode: 'light' | 'dark';
  isBorderRadius: number;
}) => {
  const themeOptions = LightThemeColors.find((t) => t.name === config.theme);
  const darkthemeOptions = DarkThemeColors.find((t) => t.name === config.theme);
  const defaultTheme =
    config.activeMode === 'dark' ? baseDarkTheme : baselightTheme;
  const defaultShadow = config.activeMode === 'dark' ? darkshadows : shadows;
  const themeSelect =
    config.activeMode === 'dark' ? darkthemeOptions : themeOptions;

  const baseMode = {
    palette: {
      mode: config.activeMode,
    },
    shape: {
      borderRadius: config.isBorderRadius,
    },
    shadows: defaultShadow,
    typography,
  };

  const theme = createTheme(
    _.merge({}, baseMode, defaultTheme, locales, themeSelect, {
      direction: config.direction,
    })
  );
  theme.components = components(theme);

  return theme;
};

const ThemeSettings = () => {
  const { activeDir, activeTheme, activeMode, isBorderRadius } =
    useContext(CustomizerContext);

  const theme = useMemo(
    () =>
      BuildTheme({
        direction: activeDir,
        theme: activeTheme,
        activeMode,
        isBorderRadius,
      }),
    [activeDir, activeTheme, activeMode, isBorderRadius]
  );

  useEffect(() => {
    document.dir = activeDir;
  }, [activeDir]);

  return theme;
};

export { ThemeSettings };
