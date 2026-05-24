import './PlayerAvatar.css';

/**
 * Avatar spritesheet positions:
 * 0: Top-left (arms crossed)
 * 1: Top-center (hands together)
 * 2: Top-right (thumbs up)
 * 3: Bottom-left (chin thinking)
 * 4: Bottom-center (laughing)
 * 5: Bottom-right (hands spread)
 */

export default function PlayerAvatar({ avatarIndex = 0, size = '120px', className = '' }) {
  // Determine the correct background position based on the index
  const getBackgroundPosition = (index) => {
    const positions = [
      '0% 0%',      // 0: top-left
      '48% 0%',     // 1: top-center
      '96% 0%',     // 2: top-right
      '0% 103%',    // 3: bottom-left
      '42% 103%',   // 4: bottom-center
      '96% 103%',   // 5: bottom-right
    ];
    return positions[index] || positions[0];
  };

  return (
    <div
      className={`avatar-container ${className}`.trim()}
      style={{
        width: size,
        height: size,
        backgroundImage: "url('/assets/Avatars_background_free.png')",
        backgroundPosition: getBackgroundPosition(avatarIndex),
      }}
    />
  );
}