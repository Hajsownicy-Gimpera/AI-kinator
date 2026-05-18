import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { useTheme } from '../../context/ThemeContext';
import PlayerAvatar from '../PlayerAvatar/PlayerAvatar';

const WinScreenContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background-color: ${props => props.theme.colors.background};
  padding: ${props => props.theme.spacing.xl};
`;

const WinContainer = styled.div`
  background-color: ${props => props.theme.colors.cardBackground};
  border-radius: ${props => props.theme.borderRadius.lg};
  padding: ${props => props.theme.spacing.xxl} ${props => props.theme.spacing.xl};
  text-align: center;
  box-shadow: 0 20px 60px ${props => props.theme.colors.shadowHeavy};
  max-width: 500px;
  animation: slideUp 0.5s ease-out;
  border: 2px solid ${props => props.theme.colors.accent};

  @keyframes slideUp {
    from {
      opacity: 0;
      transform: translateY(30px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;

const WinEmoji = styled.div`
  font-size: 80px;
  margin-bottom: ${props => props.theme.spacing.lg};
  animation: bounce 0.6s ease-in-out infinite;

  @keyframes bounce {
    0%, 100% {
      transform: translateY(0);
    }
    50% {
      transform: translateY(-20px);
    }
  }
`;

const WinTitle = styled.h1`
  font-size: 48px;
  color: ${props => props.theme.colors.text};
  margin: 0 0 ${props => props.theme.spacing.md} 0;
  font-weight: 700;
  font-family: ${props => props.theme.fonts.heading};
`;

const WinMessage = styled.p`
  font-size: 18px;
  color: ${props => props.theme.colors.textSecondary};
  margin: 0 0 ${props => props.theme.spacing.xl} 0;
`;

const WinDetails = styled.div`
  background-color: ${props => props.theme.colors.backgroundSecondary};
  border-radius: ${props => props.theme.borderRadius.md};
  padding: ${props => props.theme.spacing.xl} ${props => props.theme.spacing.lg};
  margin-bottom: ${props => props.theme.spacing.xl};
`;

const WinDetailItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${props => props.theme.spacing.md};
  font-size: 16px;

  &:last-child {
    margin-bottom: 0;
  }
`;

const DetailLabel = styled.span`
  color: ${props => props.theme.colors.textSecondary};
  font-weight: 600;
`;

const DetailValue = styled.span`
  color: ${props => props.theme.colors.accent};
  font-weight: 700;
  font-size: 18px;
`;

const WinButton = styled.button`
  background-color: ${props => props.theme.colors.accent};
  color: ${props => props.theme.colors.buttonText};
  border: none;
  padding: ${props => props.theme.spacing.lg} ${props => props.theme.spacing.xl};
  font-size: 16px;
  font-weight: 600;
  border-radius: ${props => props.theme.borderRadius.full};
  cursor: pointer;
  transition: all 0.3s ease;
  font-family: ${props => props.theme.fonts.primary};
  box-shadow: 0 4px 12px ${props => props.theme.colors.shadowMedium};

  &:hover {
    background-color: ${props => props.theme.colors.accentDark};
    transform: translateY(-2px);
    box-shadow: 0 8px 16px ${props => props.theme.colors.shadowHeavy};
  }

  &:active {
    transform: translateY(0);
  }
`;

const AvatarWrapper = styled.div`
  margin-bottom: ${props => props.theme.spacing.xl};
`;

const WinScreen = ({ roomState, conversationHistory }) => {
  const navigate = useNavigate();
  const { theme } = useTheme();

  const questionCount = conversationHistory.filter(entry => entry.role === 'player').length;

  return (
    <WinScreenContainer theme={theme}>
      <WinContainer theme={theme}>
        <AvatarWrapper theme={theme}>
          <PlayerAvatar avatarIndex={1} size="150px" />
        </AvatarWrapper>
        
        <WinEmoji theme={theme}>🎉</WinEmoji>
        <WinTitle theme={theme}>Gratulacje!</WinTitle>
        <WinMessage theme={theme}>Udało Ci się odgadnąć postać!</WinMessage>
        
        <WinDetails theme={theme}>
          <WinDetailItem theme={theme}>
            <DetailLabel theme={theme}>Zadanych pytań:</DetailLabel>
            <DetailValue theme={theme}>{questionCount}</DetailValue>
          </WinDetailItem>
        </WinDetails>

        <WinButton 
          theme={theme}
          onClick={() => navigate('/')}
        >
          ← Powrót do menu
        </WinButton>
      </WinContainer>
    </WinScreenContainer>
  );
};

export default WinScreen;
