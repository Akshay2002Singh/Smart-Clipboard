import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import { Provider as PaperProvider, MD3LightTheme, MD3DarkTheme } from 'react-native-paper';
import { lightColors, darkColors, ThemeColors } from './colors';

interface ThemeContextType {
  isDark: boolean;
  colors: ThemeColors;
  toggleTheme: () => void;
  setTheme: (isDark: boolean) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: React.ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [isDark, setIsDark] = useState(systemColorScheme === 'dark');

  useEffect(() => {
    // Sync with system theme
    setIsDark(systemColorScheme === 'dark');
  }, [systemColorScheme]);

  const toggleTheme = () => {
    setIsDark(prev => !prev);
  };

  const setTheme = (dark: boolean) => {
    setIsDark(dark);
  };

  const colors = isDark ? darkColors : lightColors;

  const baseTheme = isDark ? MD3DarkTheme : MD3LightTheme;
  const paperTheme = {
    ...baseTheme,
    colors: {
      ...baseTheme.colors,
      primary: colors.primary,
      secondary: colors.secondary,
      background: colors.background,
      surface: colors.surface,
      error: colors.error,
      onSurface: colors.text,
      onBackground: colors.text,
      text: colors.text,
      disabled: colors.disabled,
      placeholder: colors.placeholder,
      backdrop: colors.background,
    },
  };

  const value = {
    isDark,
    colors,
    toggleTheme,
    setTheme,
  };

  return (
    <ThemeContext.Provider value={value}>
      <PaperProvider theme={paperTheme}>
        {children}
      </PaperProvider>
    </ThemeContext.Provider>
  );
};

