import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useTheme } from '../../context/ThemeContext';

const AvatarContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: ${props => props.theme.spacing.md};
`;

const AvatarCircle = styled.div`
  width: 120px;
  height: 120px;
  border-radius: 50%;
  background: ${props => props.theme.colors.cardBackground};
  border: 3px solid ${props => props.theme.colors.accent};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 60px;
  box-shadow: 0 8px 24px ${props => props.theme.colors.shadowMedium};
  animation: ${props => props.$isThinking ? 'bob 1.5s ease-in-out infinite' : 'none'};
  
  @keyframes bob {
    0%, 100% {
      transform: translateY(0);
    }
    50% {
      transform: translateY(-10px);
    }
  }
`;

const AvatarStatus = styled.p`
  color: ${props => props.theme.colors.textSecondary};
  font-size: 14px;
  font-weight: 500;
  margin: 0;
  text-align: center;
  font-family: ${props => props.theme.fonts.primary};
`;

const AvatarEmoji = styled.div`
  font-size: 60px;
  line-height: 1;
`;

const AIAvatar = ({ isSubmitting, gamePhase, isWinner }) => {
  const { theme } = useTheme();
  const [emoji, setEmoji] = useState('🧞');
  const [status, setStatus] = useState('Cześć!');
  const [isThinking, setIsThinking] = useState(false);

  useEffect(() => {
    if (isSubmitting) {
      setEmoji('🤔');
      setStatus('Rozmyślam się...');
      setIsThinking(true);
    } else if (isWinner) {
      setEmoji('🎉');
      setStatus('Gratuluję!');
      setIsThinking(false);
    } else if (gamePhase === 'ended') {
      setEmoji('😊');
      setStatus('Gra skończona');
      setIsThinking(false);
    } else {
      setEmoji('🧞');
      setStatus('Czekam na pytanie...');
      setIsThinking(false);
    }
  }, [isSubmitting, gamePhase, isWinner]);

  return (
    <AvatarContainer>
      <AvatarCircle $isThinking={isThinking} theme={theme}>
        <AvatarEmoji>{emoji}</AvatarEmoji>
      </AvatarCircle>
      <AvatarStatus theme={theme}>{status}</AvatarStatus>
    </AvatarContainer>
  );
};

export default AIAvatar;
