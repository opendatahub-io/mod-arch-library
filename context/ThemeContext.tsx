import * as React from 'react';
import { Theme } from '~/utilities/const';

// MUI integration flag - will be set to true when MUI is properly installed
declare const MUI_AVAILABLE: boolean;

// Conditional MUI components - these will be undefined if MUI is not available
let MUIThemeProvider: React.ComponentType<any> | undefined;
let createTheme: ((options?: any) => any) | undefined;

// Check if MUI is available and load it conditionally
const isMUIAvailable = (): boolean => {
  if (typeof MUI_AVAILABLE !== 'undefined') {
    return MUI_AVAILABLE;
  }
  
  // In a real environment, this would check if MUI packages are installed
  // For now, we'll assume MUI is not available unless explicitly set
  return false;
};

// Load MUI theme SCSS conditionally
const loadMUIThemeStyles = (): void => {
  if (typeof window !== 'undefined' && isMUIAvailable()) {
    try {
      // This will be handled by the bundler to conditionally include the styles
      const styles = document.createElement('style');
      styles.textContent = `
        /* MUI theme styles will be loaded here when MUI is available */
      `;
      document.head.appendChild(styles);
    } catch (error) {
      console.debug('Could not load MUI theme styles');
    }
  }
};

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
  const [muiTheme, setMuiTheme] = React.useState<any>(null);
  
  React.useEffect(() => {
    // Load MUI theme styles when needed
    if (theme === Theme.MUI) {
      loadMUIThemeStyles();
    }
  }, [theme]);
  
  React.useEffect(() => {
    // Create MUI theme if available
    if (isMUIAvailable() && createTheme) {
      setMuiTheme(createTheme({ cssVariables: true }));
    }
  }, []);

  React.useEffect(() => {
    // Apply the theme based on the theme enum value
    if (theme === Theme.MUI) {
      if (!isMUIAvailable()) {
        console.warn('MUI theme requested but MUI is not installed. Install @mui/material and @emotion/react to use MUI theme.');
        // Fall back to PatternFly if MUI is not available
        document.documentElement.classList.remove(Theme.MUI);
        return;
      }
      document.documentElement.classList.add(Theme.MUI);
    } else {
      document.documentElement.classList.remove(Theme.MUI);
    }
  }, [theme]);

  return (
    <ThemeContext.Provider value={themeValue}>
      {theme === Theme.MUI && muiTheme && isMUIAvailable() && MUIThemeProvider ? (
        <MUIThemeProvider theme={muiTheme}>
          {children}
        </MUIThemeProvider>
      ) : (
        children
      )}
    </ThemeContext.Provider>
  );
};
