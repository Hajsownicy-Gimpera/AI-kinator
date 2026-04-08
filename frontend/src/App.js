import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const [healthStatus, setHealthStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchHealthStatus();
  }, []);

  const fetchHealthStatus = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:8000/health');
      setHealthStatus(response.data);
      setError(null);
    } catch (err) {
      setError(`Failed to connect to backend: ${err.message}`);
      setHealthStatus(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>🎮 AI-kinator Prototype</h1>
        <h2>Backend Health Status</h2>
        
        {loading && <p>Loading...</p>}
        
        {error && (
          <div className="error">
            <p>❌ {error}</p>
            <button onClick={fetchHealthStatus}>Retry</button>
          </div>
        )}
        
        {healthStatus && (
          <div className="success">
            <p>✅ Backend connected!</p>
            <pre>{JSON.stringify(healthStatus, null, 2)}</pre>
          </div>
        )}
      </header>
    </div>
  );
}

export default App;
