import React, { createContext, useState, useContext } from 'react';
import { ThemeProvider as StyledThemeProvider } from 'styled-components';

// Define light and dark themes
const lightTheme = {
  mode: 'light',
  colors: {
    background: '#ffffff',
    backgroundSecondary: '#f5f5f5',
    text: '#333333',
    textSecondary: '#666666',
    accent: '#e94560',
    accentDark: '#d63447',
    border: '#e0e0e0',
    cardBackground: '#ffffff',
    cardBorder: '#e0e0e0',
    shadowLight: 'rgba(0, 0, 0, 0.1)',
    shadowMedium: 'rgba(0, 0, 0, 0.15)',
    shadowHeavy: 'rgba(0, 0, 0, 0.2)',
    playerMessage: '#e94560',
    aiMessage: '#f0f0f0',
    aiMessageText: '#333333',
    inputBackground: '#ffffff',
    inputBorder: '#e0e0e0',
    inputBorderFocus: '#e94560',
    buttonText: '#ffffff',
    buttonHover: '#d63447',
    success: '#4caf50',
    error: '#f44336',
  },
  fonts: {
    primary: "'Poppins', 'Inter', sans-serif",
    heading: "'Poppins', sans-serif",
  },
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '12px',
    lg: '16px',
    xl: '24px',
    xxl: '32px',
  },
  borderRadius: {
    sm: '6px',
    md: '12px',
    lg: '16px',
    full: '50px',
  },
};

const darkTheme = {
  mode: 'dark',
  colors: {
    background: '#0f0f1e',
    backgroundSecondary: '#1a1a2e',
    text: '#ffffff',
    textSecondary: '#b0b0b0',
    accent: '#e94560',
    accentDark: '#d63447',
    border: '#2a2a3e',
    cardBackground: '#1a1a2e',
    cardBorder: '#2a2a3e',
    shadowLight: 'rgba(0, 0, 0, 0.3)',
    shadowMedium: 'rgba(0, 0, 0, 0.4)',
    shadowHeavy: 'rgba(0, 0, 0, 0.5)',
    playerMessage: '#e94560',
    aiMessage: '#2a2a3e',
    aiMessageText: '#ffffff',
    inputBackground: '#1a1a2e',
    inputBorder: '#2a2a3e',
    inputBorderFocus: '#e94560',
    buttonText: '#ffffff',
    buttonHover: '#d63447',
    success: '#66bb6a',
    error: '#ef5350',
  },
  fonts: {
    primary: "'Poppins', 'Inter', sans-serif",
    heading: "'Poppins', sans-serif",
  },
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '12px',
    lg: '16px',
    xl: '24px',
    xxl: '32px',
  },
  borderRadius: {
    sm: '6px',
    md: '12px',
    lg: '16px',
    full: '50px',
  },
};

// Create context
const ThemeContext = createContext();

// Theme Provider Component
export const ThemeProvider = ({ children }) => {
  // Get theme preference from localStorage or default to 'light'
  const [themeMode, setThemeMode] = useState(() => {
    const saved = localStorage.getItem('theme-mode');
    return saved || 'light';
  });

  const theme = themeMode === 'dark' ? darkTheme : lightTheme;

  const toggleTheme = () => {
    setThemeMode(prev => {
      const newMode = prev === 'dark' ? 'light' : 'dark';
      localStorage.setItem('theme-mode', newMode);
      return newMode;
    });
  };

  return (
    <ThemeContext.Provider value={{ theme, themeMode, toggleTheme }}>
      <StyledThemeProvider theme={theme}>
        {children}
      </StyledThemeProvider>
    </ThemeContext.Provider>
  );
};

// Custom hook to use theme
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};
