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
  flex-direction: row;
  gap: ${props => props.theme.spacing.xl};
  min-height: 100vh;
  background-color: ${props => props.theme.colors.background};
  color: ${props => props.theme.colors.text};
  font-family: ${props => props.theme.fonts.primary};
  padding: ${props => props.theme.spacing.xl};
  position: relative;
  align-items: center;
  justify-content: center;
`;

const ToggleContainer = styled.div`
  position: absolute;
  top: ${props => props.theme.spacing.xl};
  right: ${props => props.theme.spacing.xl};
`;

const ColumnSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.spacing.lg};
  flex: 0 0 auto;
`;

const RowContainer = styled.div`
  display: flex;
  flex-direction: row;
  gap: ${props => props.theme.spacing.lg};
`;

const GameModeCard = styled.div`
  background-color: ${props => props.theme.colors.cardBackground};
  padding: ${props => props.theme.spacing.lg} ${props => props.theme.spacing.xl};
  border-radius: ${props => props.theme.borderRadius.lg};
  box-shadow: 0 4px 12px ${props => props.theme.colors.shadowMedium};
  border: 2px solid ${props => props.theme.colors.accent};
  width: 300px;
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.spacing.md};
`;

const JoinGameCard = styled(GameModeCard)`
  width: calc(2 * 300px + ${props => props.theme.spacing.lg});
  border: 2px solid ${props => props.theme.colors.accent};
  box-shadow: 0 2px 8px ${props => props.theme.colors.shadowMedium};
`;

const InputRow = styled.div`
  display: flex;
  gap: ${props => props.theme.spacing.md};
  width: 100%;
`;

const DiceButton = styled.button`
  padding: ${props => props.theme.spacing.md} ${props => props.theme.spacing.lg};
  font-size: 1.2em;
  border: 2px solid ${props => props.theme.colors.accent};
  border-radius: ${props => props.theme.borderRadius.md};
  background-color: ${props => props.theme.colors.cardBackground};
  color: ${props => props.theme.colors.accent};
  cursor: pointer;
  transition: all 0.3s ease;
  flex-shrink: 0;
  box-shadow: 0 2px 4px ${props => props.theme.colors.shadowLight};

  &:hover {
    background-color: ${props => props.theme.colors.accent};
    color: ${props => props.theme.colors.buttonText};
    border-color: ${props => props.theme.colors.accent};
    box-shadow: 0 4px 8px ${props => props.theme.colors.shadowMedium};
  }

  &:active {
    transform: scale(0.95);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const FlexGrow = styled.div`
  flex-grow: 1;
`;

const GameModeTitle = styled.h2`
  margin: 0 0 ${props => props.theme.spacing.sm} 0;
  font-size: 1.5em;
  color: ${props => props.theme.colors.text};
  font-family: ${props => props.theme.fonts.heading};
  font-weight: 700;
`;

const GameModeDescription = styled.p`
  margin: 0 0 ${props => props.theme.spacing.md} 0;
  font-size: 0.95em;
  color: ${props => props.theme.colors.textSecondary};
  line-height: 1.5;
`;

const NicknameInput = styled.input`
  padding: ${props => props.theme.spacing.md} ${props => props.theme.spacing.lg};
  border: 2px solid ${props => props.theme.colors.accent};
  border-radius: ${props => props.theme.borderRadius.md};
  font-size: 0.95em;
  font-family: ${props => props.theme.fonts.primary};
  background-color: ${props => props.theme.colors.inputBackground};
  color: ${props => props.theme.colors.text};
  box-shadow: 0 2px 4px ${props => props.theme.colors.shadowLight};

  &:focus {
    outline: none;
    border-color: ${props => props.theme.colors.inputBorderFocus};
    box-shadow: 0 4px 8px ${props => props.theme.colors.shadowMedium};
  }

  &::placeholder {
    color: ${props => props.theme.colors.textSecondary};
  }
`;

const JoinGameInput = styled.input`
  padding: ${props => props.theme.spacing.md} ${props => props.theme.spacing.lg};
  border: 2px solid ${props => props.theme.colors.accent};
  border-radius: ${props => props.theme.borderRadius.md};
  font-size: 0.95em;
  font-family: ${props => props.theme.fonts.primary};
  background-color: ${props => props.theme.colors.inputBackground};
  color: ${props => props.theme.colors.text};
  width: 100%;
  box-sizing: border-box;
  box-shadow: 0 2px 4px ${props => props.theme.colors.shadowLight};

  &:focus {
    outline: none;
    border-color: ${props => props.theme.colors.inputBorderFocus};
    box-shadow: 0 4px 8px ${props => props.theme.colors.shadowMedium};
  }

  &::placeholder {
    color: ${props => props.theme.colors.textSecondary};
  }
`;

const ModeButton = styled.button`
  padding: ${props => props.theme.spacing.md} ${props => props.theme.spacing.lg};
  font-size: 1em;
  font-weight: 600;
  border: 2px solid ${props => props.theme.colors.accent};
  border-radius: ${props => props.theme.borderRadius.md};
  background-color: ${props => props.theme.colors.accent};
  color: ${props => props.theme.colors.buttonText};
  cursor: pointer;
  transition: all 0.3s ease;
  font-family: ${props => props.theme.fonts.primary};
  box-shadow: 0 2px 8px ${props => props.theme.colors.shadowMedium};

  &:hover {
    background-color: ${props => props.theme.colors.cardBackground};
    color: ${props => props.theme.colors.accent};
    border-color: ${props => props.theme.colors.accent};
    transform: translateY(-2px);
    box-shadow: 0 4px 12px ${props => props.theme.colors.shadowMedium};
  }

  &:active {
    transform: translateY(0);
  }

  &:disabled {
    background-color: ${props => props.theme.colors.textSecondary};
    border-color: ${props => props.theme.colors.textSecondary};
    cursor: not-allowed;
    opacity: 0.6;
  }
`;

const AvatarContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
`;

const LoadingText = styled.p`
  font-size: 1em;
  color: ${props => props.theme.colors.accent};
  font-weight: 500;
  text-align: center;
  position: absolute;
  bottom: ${props => props.theme.spacing.xl};
`;

const Home = () => {
  const [loading, setLoading] = useState(false);
  const [nickname, setNickname] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [joinNickname, setJoinNickname] = useState('');
  const navigate = useNavigate();
  const { theme } = useTheme();

  const randomNicknames = [
    'Shadow', 'Phoenix', 'Dragon', 'Tiger', 'Eagle', 'Wolf', 'Ninja', 'Knight',
    'Wizard', 'Sage', 'Hunter', 'Ranger', 'Paladin', 'Rogue', 'Mage', 'Bard',
    'Warrior', 'Archer', 'Scholar', 'Mystic'
  ];

  const generateRandomNickname = () => {
    const randomNick = randomNicknames[Math.floor(Math.random() * randomNicknames.length)];
    setJoinNickname(randomNick);
  };

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

  const handleJoinGame = () => {
    if (!joinCode.trim()) {
      alert("Please enter a room code");
      return;
    }
    if (!joinNickname.trim()) {
      alert("Please enter a nickname");
      return;
    }
    navigate(`/game/${joinCode}`);
  };

  const handlePlaySolo = () => {
    if (nickname.trim()) {
      createRoom('solo');
    } else {
      alert("Please enter a nickname");
    }
  };

  return (
    <HomeContainer theme={theme}>
      <ToggleContainer theme={theme}>
        <ThemeToggle />
      </ToggleContainer>

      {/* Left Column - Solo Game */}
      <ColumnSection theme={theme}>
        <GameModeCard theme={theme}>
          <GameModeTitle theme={theme}>Solo</GameModeTitle>
          <GameModeDescription theme={theme}>
            Play against the AI in a solo game. Challenge yourself to guess the secret character with your questions.
          </GameModeDescription>
          <NicknameInput
            theme={theme}
            type="text"
            placeholder="Enter your nickname..."
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            disabled={loading}
          />
          <ModeButton
            theme={theme}
            disabled={loading}
            onClick={handlePlaySolo}
          >
            Play Solo
          </ModeButton>
        </GameModeCard>
      </ColumnSection>

      {/* Center - Avatar */}
      <AvatarContainer theme={theme}>
        <PlayerAvatar size="400px" avatarIndex={5} />
      </AvatarContainer>

      {/* Right Column - Join Game and Multiplayer Modes */}
      <ColumnSection theme={theme}>
        {/* Join Game Card */}
        <JoinGameCard theme={theme}>
          <GameModeTitle theme={theme}>Join Game</GameModeTitle>
          <JoinGameInput
            theme={theme}
            type="text"
            placeholder="Enter room code..."
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value)}
            disabled={loading}
          />
          <InputRow theme={theme}>
            <NicknameInput
              theme={theme}
              type="text"
              placeholder="Enter your nickname..."
              value={joinNickname}
              onChange={(e) => setJoinNickname(e.target.value)}
              disabled={loading}
              style={{ flex: 1 }}
            />
            <DiceButton
              theme={theme}
              onClick={generateRandomNickname}
              disabled={loading}
              title="Generate random nickname"
            >
              🎲
            </DiceButton>
          </InputRow>
          <ModeButton
            theme={theme}
            onClick={handleJoinGame}
            disabled={loading || !joinCode.trim() || !joinNickname.trim()}
          >
            Join
          </ModeButton>
        </JoinGameCard>

        {/* Battle Royale and Duel Row */}
        <RowContainer theme={theme}>
          {/* Duel Card */}
          <GameModeCard theme={theme}>
            <GameModeTitle theme={theme}>Duel</GameModeTitle>
            <GameModeDescription theme={theme}>
              Challenge a friend to a head-to-head match. Who will guess first?
            </GameModeDescription>
            <FlexGrow theme={theme} />
            <ModeButton
              theme={theme}
              disabled={loading}
              onClick={() => createRoom('duel')}
            >
              Create Duel
            </ModeButton>
          </GameModeCard>

          {/* Battle Royale Card */}
          <GameModeCard theme={theme}>
            <GameModeTitle theme={theme}>Battle Royale</GameModeTitle>
            <GameModeDescription theme={theme}>
              Compete against multiple players. The first to guess wins!
            </GameModeDescription>
            <FlexGrow theme={theme} />
            <ModeButton
              theme={theme}
              disabled={loading}
              onClick={() => createRoom('battle_royale')}
            >
              Create Battle Royale
            </ModeButton>
          </GameModeCard>
        </RowContainer>
      </ColumnSection>

      {loading && <LoadingText theme={theme}>Creating room...</LoadingText>}
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