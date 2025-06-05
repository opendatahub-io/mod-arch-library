import * as React from 'react';
import { ThemeContext } from '~/context/ThemeContext';
import { Theme } from '~/utilities/const';

type ThemeContextProps = {
  isMUITheme: boolean;
};

export const useThemeContext = (): ThemeContextProps => {
  const { theme } = React.useContext(ThemeContext);

  return {
    isMUITheme: theme === Theme.MUI,
  };
};
