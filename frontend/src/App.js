import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import axios from 'axios';
import styled from 'styled-components';
import GameView from './pages/GameView/GameView';
import ThemeToggle from './components/ThemeToggle/ThemeToggle';
import PlayerAvatar from './components/PlayerAvatar/PlayerAvatar';
import { useTheme } from './context/ThemeContext';

const AppContainer = styled.div`
  width: 100%;
  height: 100%;
`;

const HomeContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background-color: ${props => props.theme.colors.background};
  color: ${props => props.theme.colors.text};
  font-family: ${props => props.theme.fonts.primary};
  padding: ${props => props.theme.spacing.xl};
  gap: ${props => props.theme.spacing.xl};
`;

const HomeHeader = styled.div`
  text-align: center;
  width: 100%;
  max-width: 600px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${props => props.theme.spacing.lg};
`;

const HomeTitle = styled.h1`
  font-size: 3.5em;
  margin: 0 0 ${props => props.theme.spacing.lg} 0;
  color: ${props => props.theme.colors.text};
  font-family: ${props => props.theme.fonts.heading};
  font-weight: 700;
`;

const HomeSubtitle = styled.p`
  font-size: 1.2em;
  margin: 0;
  color: ${props => props.theme.colors.textSecondary};
  font-weight: 500;
`;

const ButtonContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.spacing.md};
  width: 100%;
  max-width: 300px;
`;

const ModeButton = styled.button`
  padding: ${props => props.theme.spacing.lg} ${props => props.theme.spacing.xl};
  font-size: 1.1em;
  font-weight: 600;
  border: none;
  border-radius: ${props => props.theme.borderRadius.md};
  background-color: ${props => props.theme.colors.accent};
  color: ${props => props.theme.colors.buttonText};
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px ${props => props.theme.colors.shadowMedium};
  font-family: ${props => props.theme.fonts.primary};

  &:hover {
    background-color: ${props => props.theme.colors.accentDark};
    box-shadow: 0 8px 16px ${props => props.theme.colors.shadowHeavy};
    transform: translateY(-2px);
  }

  &:active {
    transform: translateY(0);
  }

  &:disabled {
    background-color: ${props => props.theme.colors.textSecondary};
    cursor: not-allowed;
    opacity: 0.6;
  }
`;

const LoadingText = styled.p`
  font-size: 1em;
  color: ${props => props.theme.colors.accent};
  font-weight: 500;
  margin: ${props => props.theme.spacing.lg} 0 0 0;
`;

const ToggleContainer = styled.div`
  position: absolute;
  top: ${props => props.theme.spacing.xl};
  right: ${props => props.theme.spacing.xl};
`;

const Home = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { theme } = useTheme();

  const createRoom = async (mode) => {
    try {
      setLoading(true);

      const endpointMap = {
        'solo': '/games/solo',
        'duel': '/games/duel',
        'battle_royale': '/games/battle-royale'
      };

      const url = `http://localhost:8000${endpointMap[mode]}`;
      console.log("Sending request to:", url);

      const response = await axios.post(url);
      
      const { room_id } = response.data;
      navigate(`/game/${room_id}`);
    } catch (err) {
      console.error("Error:", err.response);
      alert("Error: " + (err.response?.data?.detail || err.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <HomeContainer theme={theme}>
      <ToggleContainer theme={theme}>
        <ThemeToggle />
      </ToggleContainer>
      <HomeHeader theme={theme}>
        <PlayerAvatar size="150px" avatarIndex={0} />
        <HomeTitle theme={theme}>AI-kinator</HomeTitle>
        <HomeSubtitle theme={theme}>Wybierz tryb gry</HomeSubtitle>
      </HomeHeader>
      <ButtonContainer theme={theme}>
        <ModeButton theme={theme} disabled={loading} onClick={() => createRoom('solo')}>
          Solo
        </ModeButton>
        <ModeButton theme={theme} disabled={loading} onClick={() => createRoom('battle_royale')}>
          Battle Royale
        </ModeButton>
        <ModeButton theme={theme} disabled={loading} onClick={() => createRoom('duel')}>
          Duel
        </ModeButton>
      </ButtonContainer>

      {loading && <LoadingText theme={theme}>Tworzenie pokoju...</LoadingText>}
    </HomeContainer>
  );
};


function App() {
  const { theme } = useTheme();

  return (
    <AppContainer theme={theme}>
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/game/:roomId" element={<GameView />} />
        </Routes>
      </Router>
    </AppContainer>
  );
}

export default App;