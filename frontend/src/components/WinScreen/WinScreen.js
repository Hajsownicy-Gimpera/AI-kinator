import { useNavigate } from 'react-router-dom';
import PlayerAvatar from '../PlayerAvatar/PlayerAvatar';
import './WinScreen.css';

const WinScreen = ({ roomState, conversationHistory, currentPlayerId }) => {
  const navigate = useNavigate();

  const questionCount = roomState.players.find(p => p.player_id === currentPlayerId).guess_count;
  const isWinner = currentPlayerId === roomState.winner_id;
  const gameMode = roomState.game_mode;

  // Get opponent in duel
  const opponent = gameMode === 'duel' 
    ? roomState.players.find(p => p.player_id !== currentPlayerId)
    : null;

  // Get ranking for battle royale
  const getRanking = () => {
    return [...roomState.players].sort((a, b) => {
      if (a.player_id === roomState.winner_id) return -1;
      if (b.player_id === roomState.winner_id) return 1;
      return b.guess_count - a.guess_count;
    });
  };

  // SOLO MODE
  if (gameMode === 'solo') {
    return (
      <div className="win-screen">
        <div className="win-container">
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
            <PlayerAvatar avatarIndex={1} size="150px" />
          </div>
          <h1 className="win-title">Gratulacje!</h1>
          <p className="win-message">Udało Ci się odgadnąć postać!</p>
          <div className="win-details">
            <div className="win-detail-item">
              <span className="detail-label">Zadanych pytań:</span>
              <span className="detail-value">{questionCount}</span>
            </div>
          </div>
          <button className="win-button" onClick={() => navigate('/')}>
            Powrót do menu
          </button>
        </div>
      </div>
    );
  }

  // DUEL MODE
  if (gameMode === 'duel') {
    return (
      <div className="win-screen">
        <div className="win-container">
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
            <PlayerAvatar avatarIndex={isWinner ? 2 : 0} size="150px" />
          </div>
          <h1 className="win-title">{isWinner ? 'Wygrałeś!' : 'Przegrałeś!'}</h1>
          {isWinner && <p className="win-message">Pierwsza osoba, która odgadła postać.</p>}
          {!isWinner && <p className="win-message">{roomState.players.find(p => p.player_id === roomState.winner_id)?.username} odgadł postać.</p>}
          <div className="win-details">
            <div className="win-detail-item">
              <span className="detail-label">Twoje pytania:</span>
              <span className="detail-value">{questionCount}</span>
            </div>
            {opponent && (
              <div className="win-detail-item">
                <span className="detail-label">Pytania przeciwnika:</span>
                <span className="detail-value">{opponent.guess_count}</span>
              </div>
            )}
          </div>
          <button className="win-button" onClick={() => navigate('/')}>
            Powrót do menu
          </button>
        </div>
      </div>
    );
  }

  // BATTLE ROYALE MODE
  if (gameMode === 'battle_royale') {
    const ranking = getRanking();
    return (
      <div className="win-screen">
        <div className="win-container">
          <h1 className="win-title">Koniec gry</h1>
          <p className="win-message">
            {isWinner ? 'Wygrałeś Bitwę Royale!' : 'Gra się skończyła!'}
          </p>

          <div className="ranking-table">
            <div className="ranking-header">
              <span className="rank-col">Pozycja</span>
              <span className="rank-col">Gracz</span>
              <span className="rank-col">Pytania</span>
            </div>
            {ranking.map((player, idx) => (
              <div key={player.player_id} className={`ranking-row ${player.player_id === roomState.winner_id ? 'winner' : ''} ${player.player_id === currentPlayerId ? 'current' : ''}`}>
                <span className="rank-col">{idx + 1}</span>
                <span className="rank-col">
                  {player.username}
                  {player.player_id === currentPlayerId && ' (Ty)'}
                  {player.player_id === roomState.winner_id && ' - ZWYCIĘZCA'}
                </span>
                <span className="rank-col">{player.guess_count}</span>
              </div>
            ))}
          </div>

          <button className="win-button" onClick={() => navigate('/')}>
            Powrót do menu
          </button>
        </div>
      </div>
    );
  }

  return null;
};

export default WinScreen;