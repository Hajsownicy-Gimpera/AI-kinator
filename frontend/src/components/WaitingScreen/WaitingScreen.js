import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';

const WaitingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: linear-gradient(-45deg, #0f0c20, #2b1055, #591a75, #0f0c20);
  background-size: 400% 400%;
  animation: gradientShift 20s ease infinite;
  padding: 20px;
`;

const WaitingBox = styled.div`
  width: 100%;
  max-width: 620px;
  padding: 40px 32px;
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.08);
  border: 2px solid rgba(255, 255, 255, 0.12);
  box-shadow: 0 24px 80px rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(18px);
  color: #ffffff;
`;

const Title = styled.h1`
  font-size: 34px;
  color: #ffffff;
  margin: 0 0 20px 0;
  font-weight: 700;
`;

const ModeLabel = styled.p`
  font-size: 14px;
  color: #c5bfe6;
  margin: 0 0 10px 0;
  text-transform: uppercase;
  letter-spacing: 1.2px;
`;

const InviteCodeSection = styled.div`
  background: rgba(255, 255, 255, 0.1);
  border-radius: 18px;
  padding: 20px;
  margin-bottom: 30px;
  border: 1px solid rgba(255, 255, 255, 0.16);
`;

const CodeLabel = styled.p`
  font-size: 12px;
  color: #c5bfe6;
  margin: 0 0 8px 0;
  text-transform: uppercase;
`;

const CodeValue = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
`;

const Code = styled.span`
  font-size: 26px;
  font-weight: 700;
  color: #ffffff;
  font-family: 'Courier New', monospace;
  letter-spacing: 3px;
`;

const CopyButton = styled.button`
  background: #700ff7;
  color: white;
  border: none;
  padding: 10px 18px;
  border-radius: 14px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 700;
  transition: background 0.2s, transform 0.2s;

  &:hover {
    background: #9034f1;
    transform: translateY(-1px);
  }
`;

const PlayersSection = styled.div`
  margin-bottom: 30px;
`;

const PlayersLabel = styled.p`
  font-size: 14px;
  color: #c5bfe6;
  margin: 0 0 10px 0;
  font-weight: 600;
`;

const PlayersCount = styled.p`
  font-size: 18px;
  color: #ffffff;
  margin: 0 0 20px 0;
  font-weight: 700;
`;

const PlayerListGrid = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const PlayerItem = styled.div`
  background: rgba(255, 255, 255, 0.08);
  padding: 16px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-left: 4px solid rgba(255, 255, 255, 0.2);
`;

const PlayerName = styled.span`
  font-size: 16px;
  font-weight: 600;
  color: #ffffff;
`;

const YouBadge = styled.span`
  background: #700ff7;
  color: white;
  padding: 6px 14px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
`;

const ReadyBadge = styled.span`
  background: #4caf50;
  color: white;
  padding: 6px 14px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
`;

const WaitingSpinner = styled.div`
  margin-top: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
`;

const Spinner = styled.div`
  border: 4px solid rgba(255, 255, 255, 0.15);
  border-top: 4px solid #700ff7;
  border-radius: 50%;
  width: 44px;
  height: 44px;
  animation: spin 1s linear infinite;

  @keyframes spin {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }
`;

const WaitingText = styled.p`
  color: #d8ceff;
  font-size: 14px;
  margin: 0;
`;

const ActionButton = styled.button`
  width: 100%;
  background: #700ff7;
  color: white;
  border: none;
  padding: 14px 20px;
  border-radius: 16px;
  cursor: pointer;
  font-size: 15px;
  font-weight: 700;
  transition: all 0.2s ease;
  margin-top: 20px;

  &:hover {
    transform: translateY(-1px);
    background: #9034f1;
  }

  &:disabled {
    opacity: 0.55;
    cursor: not-allowed;
    transform: none;
  }
`;

const BackButton = styled.button`
  width: 100%;
  background: rgba(255, 255, 255, 0.08);
  color: #ffffff;
  border: 1px solid rgba(255, 255, 255, 0.16);
  padding: 14px 20px;
  border-radius: 16px;
  cursor: pointer;
  font-size: 15px;
  font-weight: 600;
  transition: all 0.2s ease;
  margin-top: 14px;

  &:hover {
    background: rgba(255, 255, 255, 0.12);
  }
`;

const InfoText = styled.p`
  margin: 20px 0 0 0;
  color: #d8ceff;
  font-size: 14px;
  line-height: 1.5;
`;

const WaitingScreen = ({ roomState, currentPlayerId, onStartGame, isStarting }) => {
  const navigate = useNavigate();
  const playersCount = roomState.players.length;
  const maxPlayers = roomState.max_players;
  const isReady = playersCount >= maxPlayers;

  const minPlayersToStart = roomState.game_mode === 'duel' ? 2 : roomState.game_mode === 'battle_royale' ? 3 : 1;
  const canStartEarly = playersCount >= minPlayersToStart;

  const getGameModeLabel = () => {
    if (roomState.game_mode === 'duel') return 'Pojedynek';
    if (roomState.game_mode === 'battle_royale') return 'Bitwa Royale';
    return 'Gra';
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(roomState.invite_code);
    alert('Kod zaproszenia skopiowany!');
  };

  return (
    <WaitingContainer>
      <WaitingBox>
        <ModeLabel>Tryb gry</ModeLabel>
        <Title>{getGameModeLabel()}</Title>

        <InviteCodeSection>
          <CodeLabel>Kod zaproszenia</CodeLabel>
          <CodeValue>
            <Code>{roomState.invite_code}</Code>
            <CopyButton onClick={handleCopyCode}>Kopiuj</CopyButton>
          </CodeValue>
        </InviteCodeSection>

        <PlayersSection>
          <PlayersLabel>Gracze w pokoju</PlayersLabel>
          <PlayersCount>
            {playersCount} / {maxPlayers}
          </PlayersCount>

          <PlayerListGrid>
            {roomState.players.map(player => (
              <PlayerItem key={player.player_id}>
                <PlayerName>{player.username}</PlayerName>
                <div>
                  {player.player_id === currentPlayerId && <YouBadge>Ty</YouBadge>}
                  {isReady && <ReadyBadge>Gotowy</ReadyBadge>}
                </div>
              </PlayerItem>
            ))}
          </PlayerListGrid>
        </PlayersSection>

        {!isReady && (
          <WaitingSpinner>
            <Spinner />
            <WaitingText>Oczekiwanie na kolejnych graczy...</WaitingText>
          </WaitingSpinner>
        )}

        {roomState.game_mode === 'battle_royale' && !canStartEarly && (
          <InfoText>Bitwa Royale wymaga co najmniej 3 graczy, aby rozpocząć grę.</InfoText>
        )}

        {roomState.game_mode === 'duel' && playersCount < 2 && (
          <InfoText>Aby rozpocząć pojedynek, potrzebujesz dwóch graczy.</InfoText>
        )}

        {canStartEarly && (
          <ActionButton onClick={onStartGame} disabled={isStarting}>
            {isStarting ? 'Uruchamianie gry...' : 'Rozpocznij grę'}
          </ActionButton>
        )}

        <BackButton onClick={() => navigate('/')}>Powrót do menu</BackButton>
      </WaitingBox>
    </WaitingContainer>
  );
};

export default WaitingScreen;
