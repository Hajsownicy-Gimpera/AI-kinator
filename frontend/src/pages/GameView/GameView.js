import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

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

export default GameView;