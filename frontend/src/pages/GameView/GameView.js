import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef, useCallback } from 'react';
import styled from 'styled-components';
import WinScreen from '../../components/WinScreen/WinScreen';
import PlayerAvatar from '../../components/PlayerAvatar/PlayerAvatar';
import ThemeToggle from '../../components/ThemeToggle/ThemeToggle';
import { useTheme } from '../../context/ThemeContext';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

// Styled Components
const GameViewContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: ${props => props.theme.colors.background};
  color: ${props => props.theme.colors.text};
  font-family: ${props => props.theme.fonts.primary};
`;

const GameHeader = styled.div`
  background-color: ${props => props.theme.colors.cardBackground};
  padding: ${props => props.theme.spacing.lg} ${props => props.theme.spacing.xl};
  box-shadow: 0 4px 12px ${props => props.theme.colors.shadowMedium};
  border-bottom: 2px solid ${props => props.theme.colors.accent};
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: ${props => props.theme.spacing.lg};
`;

const GameTitle = styled.h1`
  margin: 0;
  font-size: 28px;
  font-weight: 700;
  color: ${props => props.theme.colors.text};
  font-family: ${props => props.theme.fonts.heading};
`;

const HeaderLeft = styled.div`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.lg};
`;

const HeaderRight = styled.div`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.lg};
`;

const RoomIdBadge = styled.div`
  font-size: 12px;
  color: ${props => props.theme.colors.textSecondary};
  background-color: ${props => props.theme.colors.backgroundSecondary};
  padding: ${props => props.theme.spacing.sm} ${props => props.theme.spacing.md};
  border-radius: ${props => props.theme.borderRadius.full};
  font-weight: 600;
`;

const BackButton = styled.button`
  background-color: ${props => props.theme.colors.accent};
  color: ${props => props.theme.colors.buttonText};
  border: none;
  padding: ${props => props.theme.spacing.md} ${props => props.theme.spacing.lg};
  border-radius: ${props => props.theme.borderRadius.md};
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  transition: all 0.3s ease;
  font-family: ${props => props.theme.fonts.primary};

  &:hover {
    background-color: ${props => props.theme.colors.accentDark};
    transform: translateY(-2px);
  }

  &:active {
    transform: translateY(0);
  }
`;

const GameContainer = styled.div`
  display: flex;
  flex: 1;
  gap: ${props => props.theme.spacing.lg};
  padding: ${props => props.theme.spacing.xl};
  overflow: hidden;

  @media (max-width: 1024px) {
    flex-direction: column;
    gap: ${props => props.theme.spacing.md};
    padding: ${props => props.theme.spacing.md};
  }
`;

const GameLeft = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 0 0 30%;
  background-color: ${props => props.theme.colors.cardBackground};
  border-radius: ${props => props.theme.borderRadius.lg};
  box-shadow: 0 8px 24px ${props => props.theme.colors.shadowMedium};
  padding: ${props => props.theme.spacing.xl};
  gap: ${props => props.theme.spacing.lg};

  @media (max-width: 1024px) {
    flex: 0 0 auto;
    max-height: 200px;
  }
`;

const ImagePlaceholder = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, ${props => props.theme.colors.backgroundSecondary} 0%, ${props => props.theme.colors.cardBackground} 100%);
  border-radius: ${props => props.theme.borderRadius.md};
  font-size: 18px;
  color: ${props => props.theme.colors.textSecondary};
  text-align: center;
  font-weight: 500;
`;

const GameRight = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  background-color: ${props => props.theme.colors.cardBackground};
  border-radius: ${props => props.theme.borderRadius.lg};
  box-shadow: 0 8px 24px ${props => props.theme.colors.shadowMedium};
  overflow: hidden;

  @media (max-width: 1024px) {
    flex: 1;
    min-height: 300px;
  }
`;

const ChatHeader = styled.div`
  padding: ${props => props.theme.spacing.md} ${props => props.theme.spacing.lg};
  background-color: ${props => props.theme.colors.accent};
  color: ${props => props.theme.colors.buttonText};
  font-weight: 600;
  font-size: 16px;
  border-bottom: 2px solid ${props => props.theme.colors.accentDark};
`;

const ChatMessages = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: ${props => props.theme.spacing.md};
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.spacing.md};

  &::-webkit-scrollbar {
    width: 8px;
  }

  &::-webkit-scrollbar-track {
    background: ${props => props.theme.colors.backgroundSecondary};
    border-radius: 10px;
  }

  &::-webkit-scrollbar-thumb {
    background: ${props => props.theme.colors.accent};
    border-radius: 10px;
  }

  &::-webkit-scrollbar-thumb:hover {
    background: ${props => props.theme.colors.accentDark};
  }
`;

const Message = styled.div`
  display: flex;
  margin-bottom: ${props => props.theme.spacing.sm};
  animation: slideIn 0.3s ease;
  justify-content: ${props => props.$isPlayer ? 'flex-end' : 'flex-start'};
  width: 100%;

  @keyframes slideIn {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;

const MessageBubble = styled.div`
  max-width: 70%;
  padding: ${props => props.theme.spacing.md} ${props => props.theme.spacing.lg};
  border-radius: ${props => props.theme.borderRadius.md};
  word-wrap: break-word;
  overflow-wrap: break-word;
  word-break: break-word;
  white-space: normal;
  font-size: 14px;
  line-height: 1.4;
  background-color: ${props => props.$isPlayer ? props.theme.colors.playerMessage : props.theme.colors.aiMessage};
  color: ${props => props.$isPlayer ? 'white' : props.theme.colors.aiMessageText};
  border: ${props => !props.$isPlayer ? `1px solid ${props.theme.colors.border}` : 'none'};
  border-bottom-right-radius: ${props => props.$isPlayer ? '4px' : props.theme.borderRadius.md};
  border-bottom-left-radius: ${props => props.$isPlayer ? props.theme.borderRadius.md : '4px'};
`;

const MessageLabel = styled.div`
  font-size: 12px;
  color: ${props => props.theme.colors.textSecondary};
  margin-bottom: ${props => props.theme.spacing.sm};
  font-weight: 600;
  align-items: ${props => props.$isPlayer ? 'flex-end' : 'flex-start'};
`;

const MessageContent = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  min-width: 0;
  align-items: ${props => props.$isPlayer ? 'flex-end' : 'flex-start'};
`;

const ChatInputArea = styled.form`
  display: flex;
  gap: ${props => props.theme.spacing.md};
  padding: ${props => props.theme.spacing.md};
  background-color: ${props => props.theme.colors.backgroundSecondary};
  border-top: 1px solid ${props => props.theme.colors.border};

  @media (max-width: 640px) {
    flex-wrap: wrap;
  }
`;

const QuestionInput = styled.input`
  flex: 1;
  padding: ${props => props.theme.spacing.md} ${props => props.theme.spacing.lg};
  border: 2px solid ${props => props.theme.colors.inputBorder};
  border-radius: ${props => props.theme.borderRadius.md};
  font-size: 14px;
  font-family: ${props => props.theme.fonts.primary};
  background-color: ${props => props.theme.colors.inputBackground};
  color: ${props => props.theme.colors.text};
  transition: border-color 0.3s ease;

  &:focus {
    outline: none;
    border-color: ${props => props.theme.colors.inputBorderFocus};
  }

  &::placeholder {
    color: ${props => props.theme.colors.textSecondary};
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  @media (max-width: 640px) {
    flex-basis: 100%;
  }
`;

const SendButton = styled.button`
  background-color: ${props => props.theme.colors.accent};
  color: ${props => props.theme.colors.buttonText};
  border: none;
  padding: ${props => props.theme.spacing.md} ${props => props.theme.spacing.lg};
  border-radius: ${props => props.theme.borderRadius.md};
  cursor: pointer;
  font-weight: 600;
  font-size: 14px;
  transition: all 0.3s ease;
  white-space: nowrap;
  font-family: ${props => props.theme.fonts.primary};

  &:hover {
    background-color: ${props => props.theme.colors.accentDark};
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

  @media (max-width: 640px) {
    flex-basis: 100%;
  }
`;

const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: ${props => props.theme.spacing.xl};
  color: ${props => props.theme.colors.accent};
  font-weight: 500;
  gap: ${props => props.theme.spacing.md};
`;

const Spinner = styled.div`
  border: 3px solid ${props => props.theme.colors.border};
  border-top: 3px solid ${props => props.theme.colors.accent};
  border-radius: 50%;
  width: 20px;
  height: 20px;
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

const ErrorMessage = styled.div`
  background-color: ${props => props.theme.colors.error};
  color: white;
  padding: ${props => props.theme.spacing.md} ${props => props.theme.spacing.lg};
  border-radius: ${props => props.theme.borderRadius.md};
  margin-bottom: ${props => props.theme.spacing.md};
  border-left: 4px solid ${props => props.theme.colors.accentDark};
`;

const ToggleWrapper = styled.div`
  display: flex;
  align-items: center;
`;

const GameView = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const [roomState, setRoomState] = useState(null);
  const [conversationHistory, setConversationHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [question, setQuestion] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [avatarIndex, setAvatarIndex] = useState(0);
  const messagesEndRef = useRef(null);
  const avatarThinkingStartTimeRef = useRef(null);

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

  // Poll room state every 3 seconds (but NOT when game is won)
  useEffect(() => {
    // Don't poll if game is already won
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
      // When submitting, start with random thinking avatar (3 or 4)
      const randomThinkingAvatar = Math.random() < 0.5 ? 3 : 4;
      setAvatarIndex(randomThinkingAvatar);
      // Record when thinking started
      avatarThinkingStartTimeRef.current = Date.now();
    } else if (avatarThinkingStartTimeRef.current !== null) {
      // When response comes back, ensure minimum 1 second thinking time
      const elapsedTime = Date.now() - avatarThinkingStartTimeRef.current;
      const remainingTime = Math.max(0, 1000 - elapsedTime);

      const timer = setTimeout(() => {
        // Change back to idle state (0 or 1)
        const randomIdleAvatar = Math.random() < 0.5 ? 0 : 1;
        setAvatarIndex(randomIdleAvatar);
        avatarThinkingStartTimeRef.current = null;
      }, remainingTime);

      return () => clearTimeout(timer);
    }
  }, [submitting]);

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
          player_id: 'p1', // TODO: Get from user context
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

  const handleGuess = async (e) => {
    e.preventDefault();

    const guessText = question.trim();
    if (!guessText) {
      setError('Próba odgadnięcia nie może być pusta');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      
      // Real POST to /guess endpoint
      const response = await fetch(`${API_URL}/rooms/${roomId}/guess`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          player_id: 'p1', // TODO: Get from user context
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

      if (responseData.correct) {
        // Correct guess - update room state with winner_id
        setRoomState(prevState => ({
          ...prevState,
          winner_id: responseData.winner_id
        }));
        setError(null);
      } else {
        // Incorrect guess - show message
        setError(responseData.message || 'To nie ta postać. Spróbuj jeszcze raz!');
      }

      setQuestion(''); // wyczyść pole po zgadnięciu
    } catch (err) {
      setError(err.message);
      console.error('Error submitting guess:', err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <GameViewContainer theme={theme}>
        <GameHeader theme={theme}>
          <HeaderLeft theme={theme}>
            <GameTitle theme={theme}>AI-kinator</GameTitle>
            <ToggleWrapper theme={theme}>
              <ThemeToggle />
            </ToggleWrapper>
          </HeaderLeft>
          <HeaderRight theme={theme}>
            <BackButton theme={theme} onClick={() => navigate('/')}>
              ← Powrót do menu
            </BackButton>
          </HeaderRight>
        </GameHeader>
        <LoadingContainer theme={theme}>
          <Spinner theme={theme} />
          Ładowanie pokoju gry...
        </LoadingContainer>
      </GameViewContainer>
    );
  }

  if (!roomState) {
    return (
      <GameViewContainer theme={theme}>
        <GameHeader theme={theme}>
          <HeaderLeft theme={theme}>
            <GameTitle theme={theme}>AI-kinator</GameTitle>
            <ToggleWrapper theme={theme}>
              <ThemeToggle />
            </ToggleWrapper>
          </HeaderLeft>
          <HeaderRight theme={theme}>
            <BackButton theme={theme} onClick={() => navigate('/')}>
              ← Powrót do menu
            </BackButton>
          </HeaderRight>
        </GameHeader>
        <LoadingContainer theme={theme}>
          <ErrorMessage theme={theme}>
            Nie udało się załadować stanu pokoju. Spróbuj ponownie.
          </ErrorMessage>
        </LoadingContainer>
      </GameViewContainer>
    );
  }

  // Show win screen if player won
  if (roomState.winner_id) {
    return <WinScreen roomState={roomState} conversationHistory={conversationHistory} />;
  }

  return (
    <GameViewContainer theme={theme}>
      {/* Header */}
      <GameHeader theme={theme}>
        <HeaderLeft theme={theme}>
          <GameTitle theme={theme}>AI-kinator</GameTitle>
          <ToggleWrapper theme={theme}>
            <ThemeToggle />
          </ToggleWrapper>
        </HeaderLeft>
        <HeaderRight theme={theme}>
          <RoomIdBadge theme={theme}>ID: {roomState.room_id}</RoomIdBadge>
          <BackButton theme={theme} onClick={() => navigate('/')}>
            ← Powrót do menu
          </BackButton>
        </HeaderRight>
      </GameHeader>

      {/* Main container */}
      <GameContainer theme={theme}>
        {/* Left side - Player Avatar */}
        <GameLeft theme={theme}>
          <PlayerAvatar avatarIndex={avatarIndex} size="150px" />
          <ImagePlaceholder theme={theme}>
            🎭 Zgadnij postać!
          </ImagePlaceholder>
        </GameLeft>

        {/* Right side - Chat */}
        <GameRight theme={theme}>
          <ChatHeader theme={theme}>Rozmowa ({conversationHistory?.length || 0} wiadomości)</ChatHeader>

          {/* Chat messages */}
          <ChatMessages theme={theme}>
            {error && <ErrorMessage theme={theme}>{error}</ErrorMessage>}

            {conversationHistory && conversationHistory.length > 0 ? (
              conversationHistory.map((entry, idx) => (
                <Message key={idx} $isPlayer={entry.role === 'player'} theme={theme}>
                  <MessageContent theme={theme} $isPlayer={entry.role === 'player'}>
                    <MessageLabel theme={theme} $isPlayer={entry.role === 'player'}>
                      {entry.role === 'player' ? '🧑 Ty' : '🤖 AI-kinator'}
                    </MessageLabel>
                    <MessageBubble $isPlayer={entry.role === 'player'} theme={theme}>
                      {entry.role === 'player' ? entry.question : entry.answer}
                    </MessageBubble>
                  </MessageContent>
                </Message>
              ))
            ) : (
              <LoadingContainer theme={theme}>
                <div>Brak pytań. Zacznij rozmawiać!</div>
              </LoadingContainer>
            )}
            <div ref={messagesEndRef} />
          </ChatMessages>

          {/* Input area */}
          <ChatInputArea onSubmit={(e) => e.preventDefault()} theme={theme}>
            <QuestionInput
              theme={theme}
              type="text"
              placeholder="Zadaj pytanie lub wpisz zgadywaną postać..."
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              disabled={submitting}
              maxLength={200}
            />
            <SendButton 
              theme={theme}
              type="submit"
              onClick={handleSubmitQuestion}
              disabled={submitting || !question.trim()}
            >
              {submitting ? '⏳' : '📤'} Pytam
            </SendButton>
            <SendButton 
              theme={theme}
              type="submit"
              onClick={handleGuess}
              disabled={submitting || !question.trim()}
            >
              {submitting ? '⏳' : '🤔'} Zgaduję
            </SendButton>
          </ChatInputArea>
        </GameRight>
      </GameContainer>
    </GameViewContainer>
  );
};

export default GameView;