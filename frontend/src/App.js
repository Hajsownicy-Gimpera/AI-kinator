import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './App.css';
import { useParams } from 'react-router-dom';

const Home = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

const createRoom = async (mode) => {
  try {
    setLoading(true);

    const endpointMap = {
      'solo': '/games/solo',
      'duel': '/games/duel',
      'battle_royale': '/games/battle-royale'
    };

    const url = `http://localhost:8000${endpointMap[mode]}`;
    console.log("Wysyłam żądanie do:", url);

    const response = await axios.post(url);
    
    const { room_id } = response.data;
    navigate(`/game/${room_id}`);
  } catch (err) {
    console.error("Błąd szczegóły:", err.response);
    alert("Błąd: " + (err.response?.data?.detail || err.message));
  } finally {
    setLoading(false);
  }
};
  return (
    <div className="App-header">
      <h1>🎮 AI-kinator</h1>
      <p>Wybierz tryb gry:</p>
      <div style={{ display: 'flex', gap: '10px' }}>
        <button disabled={loading} onClick={() => createRoom('solo')}>Solo</button>
        <button disabled={loading} onClick={() => createRoom('duel')}>Duel</button>
        <button disabled={loading} onClick={() => createRoom('battle_royale')}>Battle Royale</button>
      </div>
      {loading && <p>Tworzenie pokoju...</p>}
    </div>
  );
};

const GameView = () => {
  const { roomId } = useParams();

  return (
    <div className="App-header">
      <h2>Widok Gry</h2>
      <div className="success">
        <p>Jesteś w pokoju: <strong>{roomId}</strong></p>
      </div>
      <button onClick={() => window.location.href = '/'}>Powrót do menu</button>
    </div>
  );
};

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/game/:roomId" element={<GameView />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;