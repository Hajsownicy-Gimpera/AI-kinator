import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef, useCallback } from 'react';
import WinScreen from '../../components/WinScreen/WinScreen';
import WaitingScreen from '../../components/WaitingScreen/WaitingScreen';
import PlayersList from '../../components/PlayersList/PlayersList';
import PlayerAvatar from '../../components/PlayerAvatar/PlayerAvatar';
import './GameView.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const GameView = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const [roomState, setRoomState] = useState(null);
  const [conversationHistory, setConversationHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [question, setQuestion] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [avatarIndex, setAvatarIndex] = useState(0);
  const [currentPlayerId, setCurrentPlayerId] = useState(null);
  const messagesEndRef = useRef(null);
  const avatarThinkingStartTimeRef = useRef(null);
  const [copied, setCopied] = useState(false);
  const [hintText, setHintText] = useState('');
  const [hintLoading, setHintLoading] = useState(false);
  const [showHintModal, setShowHintModal] = useState(false);

  // Fetch room state callback (without conversation history)
  const fetchRoomState = useCallback(async () => {
    try {
      setError(null);
      const response = await fetch(`${API_URL}/rooms/${roomId}/state`);
      if (!response.ok) {
        throw new Error(`Failed to fetch room state: ${response.statusText}`);
      }
      const data = await response.json();
      setRoomState(data);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching room state:', err);
    }
  }, [roomId]);

  // Fetch full history on component mount
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoading(true);
        setError(null);

        const storedPlayerId = localStorage.getItem(`player_id_${roomId}`);
        if (storedPlayerId) {
          setCurrentPlayerId(storedPlayerId);
        }

        const response = await fetch(`${API_URL}/rooms/${roomId}/join`);
        if (!response.ok) {
          throw new Error(`Failed to fetch history: ${response.statusText}`);
        }
        const data = await response.json();
        const { conversation_history, ...stateWithoutHistory } = data;
        setRoomState(stateWithoutHistory);
        setConversationHistory(conversation_history || []);
      } catch (err) {
        setError(err.message);
        console.error('Error fetching history:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [roomId]);

  useEffect(() => {
    if (!currentPlayerId && roomState?.players?.length === 1) {
      const fallbackId = roomState.players[0].player_id;
      setCurrentPlayerId(fallbackId);
      localStorage.setItem(`player_id_${roomId}`, fallbackId);
    }
  }, [currentPlayerId, roomState, roomId]);

  // Poll room state every 3 seconds (but NOT when game is won)
  useEffect(() => {
    if (roomState?.winner_id) {
      return;
    }

    const pollingInterval = setInterval(() => {
      fetchRoomState();
    }, 3000);

    return () => clearInterval(pollingInterval);
  }, [fetchRoomState, roomState?.winner_id]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [conversationHistory]);

  // Handle avatar changes based on submission state
  useEffect(() => {
    if (submitting) {
      const randomThinkingAvatar = Math.random() < 0.5 ? 3 : 4;
      setAvatarIndex(randomThinkingAvatar);
      avatarThinkingStartTimeRef.current = Date.now();
    } else if (avatarThinkingStartTimeRef.current !== null) {
      const elapsedTime = Date.now() - avatarThinkingStartTimeRef.current;
      const remainingTime = Math.max(0, 1000 - elapsedTime);

      const timer = setTimeout(() => {
        const randomIdleAvatar = Math.random() < 0.5 ? 0 : 1;
        setAvatarIndex(randomIdleAvatar);
        avatarThinkingStartTimeRef.current = null;
      }, remainingTime);

      return () => clearTimeout(timer);
    }
  }, [submitting]);

  const isGameLocked = roomState?.phase === 'ended' || (roomState?.game_mode === 'duel' && roomState?.winner_id && roomState?.winner_id !== currentPlayerId);

  const handleSubmitQuestion = async (e) => {
    e.preventDefault();

    if (!question.trim()) {
      setError('Pytanie nie może być puste');
      return;
    }

    if (isGameLocked) {
      setError('Gra już się zakończyła lub inny gracz wygrał.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const response = await fetch(`${API_URL}/rooms/${roomId}/question`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          player_id: currentPlayerId,
          question: question.trim(),
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to submit question: ${response.statusText}`);
      }

      const responseData = await response.json();

      setConversationHistory(prevHistory => [
        ...prevHistory,
        { role: 'player', question: question.trim() },
        { role: 'ai', answer: responseData.answer },
      ]);

      setQuestion('');
    } catch (err) {
      setError(err.message);
      console.error('Error submitting question:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleGuess = async (e) => {
    e.preventDefault();

    const guessText = question.trim();
    if (!guessText) {
      setError('Próba odgadnięcia nie może być pusta');
      return;
    }

    if (isGameLocked) {
      setError('Gra już się zakończyła lub inny gracz wygrał.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      
      const response = await fetch(`${API_URL}/rooms/${roomId}/guess`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          player_id: currentPlayerId,
          guess: guessText,
        }),
      });

      if (response.status === 404) {
        setError('Endpoint /guess nie jest jeszcze dostępny');
        console.warn("Endpoint /guess not implemented yet (404)");
        return;
      }

      if (!response.ok) {
        throw new Error(`Błąd: ${response.statusText}`);
      }

      const responseData = await response.json();

      setConversationHistory(prevHistory => [
        ...prevHistory,
        { role: 'player', question: guessText },
        { role: 'ai', answer: responseData.message || (responseData.correct ? 'Tak' : 'Nie') },
      ]);

      if (responseData.correct) {
        setRoomState(prevState => ({
          ...prevState,
          winner_id: responseData.winner_id,
        }));
        setError(null);
      } else {
        setError(responseData.message || 'To nie ta postać. Spróbuj jeszcze raz!');
      }

      setQuestion('');
    } catch (err) {
      setError(err.message);
      console.error('Error submitting guess:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleStartGame = async () => {
    if (!roomState?.room_id) return;

    setIsStarting(true);
    setError(null);
    try {
      const response = await fetch(`${API_URL}/rooms/${roomId}/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.detail || response.statusText);
      }

      const updatedRoomState = await response.json();
      setRoomState(updatedRoomState);
    } catch (err) {
      setError(err.message);
      console.error('Error starting room:', err);
    } finally {
      setIsStarting(false);
    }
  };

  const handleCopyId = async () => {
  if (!roomState?.room_id) return;
  
  try {
    await navigator.clipboard.writeText(roomState.room_id);
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
    }, 2000);
  } catch (err) {
    console.error('Nie udało się skopiować tekstu: ', err);
  }
};

  const handleRequestHint = async () => {
    if (!currentPlayerId) {
      setError('Nie znaleziono ID gracza');
      return;
    }

    try {
      setHintLoading(true);
      setError(null);

      const response = await fetch(`${API_URL}/rooms/${roomId}/hint`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ player_id: currentPlayerId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Nie udało się pobrać podpowiedzi');
      }

      const data = await response.json();
      setHintText(data.hint_text);
      setShowHintModal(true);
    } catch (err) {
      setError(err.message);
      console.error('Error requesting hint:', err);
    } finally {
      setHintLoading(false);
    }
  };

  // EKRAN ŁADOWANIA
  if (loading) {
    return (
      <div className="layout-wrapper">
        <header className="top-bar">
          <div className="bar-group">
            <strong>AI-Kinator</strong>
          </div>
          <button className="btn-back" onClick={() => navigate('/')}>Powrót do menu</button>
        </header>
        <div className="loading">
          <div className="spinner"></div>
          Ładowanie pokoju gry...
        </div>
      </div>
    );
  }

  // EKRAN BŁĘDU POKOJU
  if (!roomState) {
    return (
      <div className="layout-wrapper">
        <header className="top-bar">
          <div className="bar-group">
            <strong>AI-Kinator</strong>
          </div>
          <button className="btn-back" onClick={() => navigate('/')}>Powrót do menu</button>
        </header>
        <div className="loading">
          <div className="error-message">Nie udało się załadować stanu pokoju. Spróbuj ponownie.</div>
        </div>
      </div>
    );
  }

  // WAITING SCREEN FOR MULTIPLAYER MODES
  if (roomState.phase === 'waiting' && roomState.max_players > 1) {
    return (
      <WaitingScreen
        roomState={roomState}
        currentPlayerId={currentPlayerId}
        onStartGame={handleStartGame}
        isStarting={isStarting}
      />
    );
  }

  // WIN SCREEN
  if (roomState.winner_id) {
    return <WinScreen roomState={roomState} conversationHistory={conversationHistory} currentPlayerId={currentPlayerId} />;
  }

  // GŁÓWNY WIDOK GRY
  return (
    <div className="layout-wrapper">
      <header className="top-bar">
        <div className="bar-group">
          <strong>AI-Kinator</strong>
        </div>
        <div className="bar-group">
          <span className="room-badge">
              {roomState.room_id}
              <button className="btn-copy-text" onClick={handleCopyId} disabled={copied}>
                {copied ? 'SKOPIOWANO' : 'SKOPIUJ ID'}
              </button>
          </span>
          <button className="btn-back" onClick={() => navigate('/')}>Powrót do menu</button>
        </div>
      </header>

      {/* MODAL PODPOWIEDZI */}
      {showHintModal && (
        <div className="hint-modal-overlay" onClick={() => setShowHintModal(false)}>
          <div className="hint-modal" onClick={(e) => e.stopPropagation()}>
            <div className="hint-modal-header">Podpowiedź</div>
            <div className="hint-modal-content">
              <p>{hintText}</p>
              {roomState?.game_mode !== 'solo' && (
                <div className="hint-modal-penalty">
                  ⏱️ <strong>+30 sekund kary</strong> w trybie multiplayer
                </div>
              )}
            </div>
            <button className="hint-modal-close" onClick={() => setShowHintModal(false)}>
              Zamknij
            </button>
          </div>
        </div>
      )}

      <main className="center-stage">
        
        {/* LEWY KONTENER */}
        <div className="left-panel">
          <PlayerAvatar avatarIndex={avatarIndex} size = "300px"/>
        </div>

        {/* (CZAT) */}
        <div className="chat-box">
          <div className="chat-header">
            Zadaj pytanie AI-Kinatorowi ({conversationHistory?.length || 0})
          </div>
          <div className="chat-messages">
            {isGameLocked && (
              <div className="chat-info">
                Gra została zakończona lub inny gracz wygrał. Możesz wrócić do menu.
              </div>
            )}
            {error && <div className="chat-error">{error}</div>}
            {conversationHistory.length === 0 ? (
              <div className="chat-empty">Zadaj pierwsze pytanie!</div>
            ) : (
              conversationHistory.map((msg, i) => (
                <div key={i} className={`msg-row ${msg.role === 'player' ? 'msg-right' : 'msg-left'}`}>
                  <div className="msg-bubble">
                    {msg.role === 'player' ? msg.question : msg.answer}
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>
          <form className="chat-input-area" onSubmit={(e) => e.preventDefault()}>
            <input
              type="text"
              placeholder="Wpisz pytanie lub zgadnij postać..."
              value={question}
              onChange={(e) => {
                setQuestion(e.target.value);
                setError(null);
              }}
              disabled={submitting}
            />
            <button className="btn-action" onClick={handleSubmitQuestion} disabled={submitting || !question.trim() || isGameLocked}>
              Pytam
            </button>
            <button className="btn-action" onClick={handleGuess} disabled={submitting || !question.trim() || isGameLocked}>
              Zgaduję
            </button>
            <button 
              className="btn-action btn-hint" 
              onClick={handleRequestHint} 
              disabled={submitting || hintLoading || (currentPlayerId && roomState?.players?.find(p => p.player_id === currentPlayerId)?.hint_used) || isGameLocked}
              title={currentPlayerId && roomState?.players?.find(p => p.player_id === currentPlayerId)?.hint_used ? 'Podpowiedź już użyta' : 'Użyj podpowiedzi (jednorazowo)'}
            >
              Podpowiedź
            </button>
          </form>
        </div>

        {/* PRAWY KONTENER */}
        <div className="right-panel">
          {roomState.max_players > 1 && (
            <>
              <PlayersList 
                players={roomState.players} 
                currentPlayerId={currentPlayerId} 
                gameMode={roomState.game_mode}
              />
              {roomState?.players?.find(p => p.player_id === currentPlayerId)?.penalty_seconds > 0 && (
                <div className="penalty-indicator">
                  ⏱️ Kara: {roomState.players.find(p => p.player_id === currentPlayerId).penalty_seconds}s
                </div>
              )}
            </>
          )}
        </div>

      </main>
    </div>
  );
};

export default GameView;