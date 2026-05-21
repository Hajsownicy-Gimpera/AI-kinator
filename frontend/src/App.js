import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import axios from 'axios';
import GameView from './pages/GameView/GameView';
import ThemeToggle from './components/ThemeToggle/ThemeToggle';
import PlayerAvatar from './components/PlayerAvatar/PlayerAvatar';
import './App.css';

const Home = () => {
  const [loading, setLoading] = useState(false);
  const [nickname, setNickname] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const navigate = useNavigate();

  const randomNicknames = [
    'Shadow', 'Phoenix', 'Dragon', 'Tiger', 'Eagle', 'Wolf', 'Ninja', 'Knight',
    'Wizard', 'Sage', 'Hunter', 'Ranger', 'Paladin', 'Rogue', 'Mage', 'Bard',
    'Warrior', 'Archer', 'Scholar', 'Mystic'
  ];

  const generateRandomNickname = () => {
    const randomNick = randomNicknames[Math.floor(Math.random() * randomNicknames.length)];
    setNickname(randomNick);
  };

  const createRoom = async (mode) => {
    if (!nickname.trim()) {
      alert("Please enter or generate a nickname first!");
      return;
    }
    try {
      setLoading(true);
      const endpointMap = {
        'solo': '/games/solo',
        'duel': '/games/duel',
        'battle_royale': '/games/battle-royale'
      };

      const url = `http://localhost:8000${endpointMap[mode]}`;
      const response = await axios.post(url);
      const { room_id } = response.data;
      navigate(`/game/${room_id}`);
    } catch (err) {
      console.error("Error:", err.response);
      alert("Error: " + (err.response?.data?.detail || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleJoinGame = () => {
    if (!nickname.trim()) {
      alert("Please enter or generate a nickname first!");
      return;
    }
    if (!joinCode.trim()) {
      alert("Please enter a room code to join");
      return;
    }
    navigate(`/game/${joinCode}`);
  };

  return (
    <div className="main-content">
      {/* Top Header / Theme Toggle */}
      <header className="header-section">
        <div className="brand-title">AI-Kinator</div>
        {/*<ThemeToggle />*/}
      </header>

      {/* Profile & Unified Nickname Section */}
      <section className="profile-section">
        <PlayerAvatar size="80px" avatarIndex={5} />
        <div className="profile-inputs">
          <label className="input-label">Set Your Identity</label>
          <div className="input-row">
            <input
              className="base-input"
              type="text"
              placeholder="Enter your nickname..."
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              disabled={loading}
            />
            <button 
              className="dice-button" 
              onClick={generateRandomNickname} 
              disabled={loading} 
              title="Generate random nickname"
            >
              🎲
            </button>
          </div>
        </div>
      </section>

      {/* 3-Column Action Grid */}
      <div className="action-grid">
        
        {/* Box 1: Solo Game */}
        <div className="game-card">
          <h2 className="game-title">Solo Game</h2>
          <p className="game-description">
            Play face-to-face against the AI. Test your deduction skills to uncover the secret character.
          </p>
          
          {/* Wrap interactive elements here */}
          <div className="card-footer">
            <button 
              className="mode-button" 
              disabled={loading || !nickname.trim()} 
              onClick={() => createRoom('solo')}
            >
              Play Solo
            </button>
          </div>
        </div>

        {/* Box 2: Join Game */}
        <div className="game-card">
          <h2 className="game-title">Join Game</h2>
          <p className="game-description">
            Have an invite code from a friend? Punch it in below to jump straight into their room.
          </p>
          
          {/* Wrap interactive elements here */}
          <div className="card-footer">
            <input
              className="base-input"
              type="text"
              placeholder="Enter room code..."
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value)}
              disabled={loading}
            />
            <button
              className="mode-button"
              onClick={handleJoinGame}
              disabled={loading || !joinCode.trim() || !nickname.trim()}
            >
              Join Room
            </button>
          </div>
        </div>

        {/* Box 3: Host Game */}
        <div className="game-card">
          <h2 className="game-title">Host Game</h2>
          <p className="game-description">
            Host a new multiplayer session and invite others to challenge you in real-time.
          </p>
          
          {/* Wrap interactive elements here ⚔️ 👑 */}
          <div className="card-footer">
            <div className="button-stack">
              <button 
                className="mode-button" 
                disabled={loading || !nickname.trim()} 
                onClick={() => createRoom('duel')}
              >
                1v1 Duel
              </button>
              <button 
                className="mode-button" 
                disabled={loading || !nickname.trim()} 
                onClick={() => createRoom('battle_royale')}
              >
                Battle Royale
              </button>
            </div>
          </div>
        </div>

      </div>

      {loading && <p className="loading-text">Creating your room...</p>}
    </div>
  );
};

function App() {
  return (
    <div className="app-container">
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/game/:roomId" element={<GameView />} />
        </Routes>
      </Router>
    </div>
  );
}

export default App;