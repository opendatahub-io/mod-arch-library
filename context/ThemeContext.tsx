import * as React from 'react';
import { createTheme } from '@mui/material';
import { ThemeProvider as MUIThemeProvider } from '@mui/material/styles';
import { Theme } from '~/utilities/const';
import '~/style/MUI-theme.scss';

type ThemeProviderProps = {
  theme?: Theme;
  children: React.ReactNode;
};

export const ThemeContext = React.createContext({
  theme: Theme.Patternfly,
});

export const ThemeProvider: React.FC<ThemeProviderProps> = ({
  theme = Theme.Patternfly,
  children,
}) => {
  const themeValue = React.useMemo(() => ({ theme }), [theme]);
  const createMUITheme = React.useMemo(() => createTheme({ cssVariables: true }), []);

  React.useEffect(() => {
    // Apply the theme based on the theme enum value
    if (theme === Theme.MUI) {
      document.documentElement.classList.add(Theme.MUI);
    } else {
      document.documentElement.classList.remove(Theme.MUI);
    }
  }, [theme]);

  return (
    <ThemeContext.Provider value={themeValue}>
      {theme === Theme.MUI ? (
        <MUIThemeProvider theme={createMUITheme}>{children}</MUIThemeProvider>
      ) : (
        children
      )}
    </ThemeContext.Provider>
  );
};
