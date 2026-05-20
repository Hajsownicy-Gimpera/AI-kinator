import styled from 'styled-components';

/**
 * Avatar spritesheet positions:
 * 0: Top-left (arms crossed)
 * 1: Top-center (hands together)
 * 2: Top-right (thumbs up)
 * 3: Bottom-left (chin thinking)
 * 4: Bottom-center (laughing)
 * 5: Bottom-right (hands spread)
 */

const AvatarContainer = styled.div`
  width: ${(props) => props.$size || '120px'};
  height: ${(props) => props.$size || '120px'};
  background-image: url('/assets/Avatars_background_free.png');
  background-size: 300% 200%; /* 3 columns, 2 rows */
  background-color: transparent;
  background-repeat: no-repeat;
  background-position: ${(props) => {
    const positions = [
      '0% 0%',      // 0: top-left
      '48% 0%',  // 1: top-center
      '96% 0%',  // 2: top-right
      '0% 103%',     // 3: bottom-left
      '42% 103%', // 4: bottom-center
      '96% 103%', // 5: bottom-right
    ];
    return positions[props.$avatarIndex || 0];
  }};
  border-radius: ${(props) => props.theme.borderRadius.lg};
  box-shadow: ${(props) => `0 4px 12px ${props.theme.colors.shadow}`};
  flex-shrink: 0;


`;

export default function PlayerAvatar({ avatarIndex = 0, size = '120px', className }) {
  return (
    <AvatarContainer
      $avatarIndex={avatarIndex}
      $size={size}
      className={className}
    />
  );
}
