import styled from 'styled-components';

const Container = styled.div`
  background: rgba(255, 255, 255, 0.08);
  border-radius: 18px;
  padding: 20px;
  height: 100%;
  overflow-y: auto;
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(112, 15, 247, 0.2);
  color: #ffffff;

  @media (max-width: 1024px) {
    display: none;
  }
`;

const Title = styled.h3`
  margin: 0 0 15px 0;
  font-size: 14px;
  color: #dcd8ff;
  text-transform: uppercase;
  letter-spacing: 1px;
  font-weight: 700;
`;

const PlayersList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const PlayerCard = styled.div`
  background: ${props => (props.isCurrentUser ? 'rgba(112, 15, 247, 0.24)' : 'rgba(255, 255, 255, 0.06)')};
  padding: 14px 16px;
  border-radius: 14px;
  border-left: 3px solid ${props => (props.isCurrentUser ? '#9034f1' : 'rgba(112, 15, 247, 0.2)')};
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const PlayerInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
  font-family: 'Inter', sans-serif;
`;

const PlayerName = styled.span`
  font-size: 15px;
  font-weight: 700;
  color: #ffffff;
`;

const PlayerStats = styled.span`
  font-size: 12px;
  color: #c5bfe6;
`;

const BadgesContainer = styled.div`
  display: flex;
  gap: 6px;
  align-items: center;
`;

const Badge = styled.span`
  font-size: 11px;
  padding: 4px 8px;
  border-radius: 4px;
  font-weight: 600;
  white-space: nowrap;
  background: ${props => {
    if (props.type === 'current') return '#667eea';
    if (props.type === 'guessed') return '#4caf50';
    if (props.type === 'winner') return '#ff9800';
    return '#e0e0e0';
  }};
  color: ${props => (props.type === 'current' || props.type === 'guessed' || props.type === 'winner' ? 'white' : '#666')};
`;

const ComponentPlayersList = ({ players, currentPlayerId, gameMode }) => {
  const sortedPlayers = [...players].sort((a, b) => {
    // Current user first
    if (a.player_id === currentPlayerId) return -1;
    if (b.player_id === currentPlayerId) return 1;
    // Then by guess count descending
    return b.guess_count - a.guess_count;
  });

  return (
    <Container>
      <Title>
        Gracze ({players.length})
      </Title>
      <PlayersList>
        {sortedPlayers.map(player => (
          <PlayerCard key={player.player_id} isCurrentUser={player.player_id === currentPlayerId}>
            <PlayerInfo>
              <PlayerName>
                {player.username}
                {player.player_id === currentPlayerId && ' (Ty)'}
              </PlayerName>
              <PlayerStats>Pytania: {player.guess_count}</PlayerStats>
            </PlayerInfo>
            <BadgesContainer>
              {player.has_guessed && (
                <Badge type="guessed">Zgadł</Badge>
              )}
              {player.player_id === currentPlayerId && (
                <Badge type="current">Ty</Badge>
              )}
            </BadgesContainer>
          </PlayerCard>
        ))}
      </PlayersList>
    </Container>
  );
};

export default ComponentPlayersList;
