import React from 'react';
import styled from 'styled-components';
import { useTheme } from '../../context/ThemeContext';

const ToggleContainer = styled.div`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.sm};
`;

const ToggleSwitch = styled.button`
  width: 56px;
  height: 32px;
  border-radius: ${props => props.theme.borderRadius.full};
  border: none;
  background-color: ${props => props.$isActive ? props.theme.colors.accent : props.theme.colors.border};
  cursor: pointer;
  padding: 0;
  position: relative;
  transition: background-color 0.3s ease;
  
  &:hover {
    background-color: ${props => props.$isActive ? props.theme.colors.accentDark : '#ccc'};
  }

  &:active {
    transform: scale(0.98);
  }
`;

const ToggleCircle = styled.div`
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background-color: white;
  position: absolute;
  top: 3px;
  left: ${props => props.$isActive ? '27px' : '3px'};
  transition: left 0.3s ease;
  box-shadow: 0 2px 4px ${props => props.theme.colors.shadowLight};
`;

const ToggleIcon = styled.span`
  font-size: 16px;
  margin: 0 ${props => props.theme.spacing.sm};
`;

const ThemeToggle = () => {
  const { themeMode, toggleTheme, theme } = useTheme();
  const isDark = themeMode === 'dark';

  return (
    <ToggleContainer theme={theme}>
      <ToggleIcon>☀️</ToggleIcon>
      <ToggleSwitch
        onClick={toggleTheme}
        $isActive={isDark}
        theme={theme}
        title={isDark ? 'Przełącz na tryb jasny' : 'Przełącz na tryb ciemny'}
      >
        <ToggleCircle $isActive={isDark} theme={theme} />
      </ToggleSwitch>
      <ToggleIcon>🌙</ToggleIcon>
    </ToggleContainer>
  );
};

export default ThemeToggle;
