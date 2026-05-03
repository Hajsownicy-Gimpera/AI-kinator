import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef, useCallback } from 'react';
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
  const messagesEndRef = useRef(null);

  // Fetch room state callback (without conversation history)
  const fetchRoomState = useCallback(async () => {
    try {
      setError(null);
      const response = await fetch(`${API_URL}/rooms/${roomId}/state`);
      if (!response.ok) {
        throw new Error(`Failed to fetch room state: ${response.statusText}`);
      }
      const data = await response.json();
      // Set room state - polling only updates game status, never conversation history
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
        const response = await fetch(`${API_URL}/rooms/${roomId}/join`);
        if (!response.ok) {
          throw new Error(`Failed to fetch history: ${response.statusText}`);
        }
        const data = await response.json();
        // Separate conversation history from room state
        const { conversation_history, ...stateWithoutHistory } = data;
        setRoomState(stateWithoutHistory);
        console.log("new conversation")
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

  // Poll room state every 3 seconds
  useEffect(() => {
    const pollingInterval = setInterval(() => {
      fetchRoomState();
    }, 3000);

    return () => clearInterval(pollingInterval);
  }, [fetchRoomState]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [conversationHistory]);

  const handleSubmitQuestion = async (e) => {
    e.preventDefault();

    if (!question.trim()) {
      setError('Pytanie nie może być puste');
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
          player_id: 'player_1', // TODO: Get from user context
          question: question.trim(),
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to submit question: ${response.statusText}`);
      }

      const responseData = await response.json();

      // Add the new question and answer to conversation history
      setConversationHistory(prevHistory => [
        ...prevHistory,
        { role: 'player', question: question.trim() },
        { role: 'ai', answer: responseData.answer },
      ]);

      // Clear input
      setQuestion('');
    } catch (err) {
      setError(err.message);
      console.error('Error submitting question:', err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="game-view">
        <div className="game-header">
          <h1>AI-kinator</h1>
          <button className="back-button" onClick={() => navigate('/')}>
            ← Powrót do menu
          </button>
        </div>
        <div className="loading">
          <div className="spinner"></div>
          Ładowanie pokoju gry...
        </div>
      </div>
    );
  }

  if (!roomState) {
    return (
      <div className="game-view">
        <div className="game-header">
          <h1>AI-kinator</h1>
          <button className="back-button" onClick={() => navigate('/')}>
            ← Powrót do menu
          </button>
        </div>
        <div className="error-message">
          Nie udało się załadować stanu pokoju. Spróbuj ponownie.
        </div>
      </div>
    );
  }

  return (
    <div className="game-view">
      {/* Header */}
      <div className="game-header">
        <h1>AI-kinator</h1>
        <div className="room-id">ID pokoju: {roomState.room_id}</div>
        <button className="back-button" onClick={() => navigate('/')}>
          ← Powrót do menu
        </button>
      </div>

      {/* Main container */}
      <div className="game-container">
        {/* Left side - Akinator image */}
        <div className="game-left">
          <div className="image-placeholder">
            🎭 Zgadnij postać!
          </div>
          {/* You can replace with actual image:
          <img 
            src="/akinator.png" 
            alt="Akinator" 
            className="akinator-image" 
          /> */}
        </div>

        {/* Right side - Chat */}
        <div className="game-right">
          <div className="chat-header">Rozmowa ({conversationHistory?.length || 0} wiadomości)</div>

          {/* Chat messages */}
          <div className="chat-messages">
            {error && <div className="error-message">{error}</div>}

            {conversationHistory && conversationHistory.length > 0 ? (
              conversationHistory.map((entry, idx) => (
                <div key={idx} className={`message ${entry.role}`}>
                  <div>
                    <div className="message-label">{entry.role === 'player' ? '🧑 Ty' : '🤖 AI-kinator'}</div>
                    <div className="message-bubble">
                      {entry.role === 'player' ? entry.question : entry.answer}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="loading">
                <div>Brak pytań. Zacznij rozmawiać!</div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input area */}
          <form onSubmit={handleSubmitQuestion} className="chat-input-area">
            <input
              type="text"
              className="question-input"
              placeholder="Zadaj pytanie tak/nie..."
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              disabled={submitting}
              maxLength={200}
            />
            <button
              type="submit"
              className="send-button"
              disabled={submitting || !question.trim()}
            >
              {submitting ? '⏳' : '📤'} Wyślij
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default GameView;