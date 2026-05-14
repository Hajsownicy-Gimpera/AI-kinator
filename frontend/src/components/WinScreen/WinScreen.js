import { useNavigate } from 'react-router-dom';
import './WinScreen.css';

const WinScreen = ({ roomState, conversationHistory }) => {
  const navigate = useNavigate();

  const questionCount = conversationHistory.filter(entry => entry.role === 'player').length;

  return (
    <div className="win-screen">
      <div className="win-container">
        <div className="win-emoji">🎉</div>
        <h1 className="win-title">Gratulacje!</h1>
        <p className="win-message">Udało Ci się odgadnąć postać!</p>
        
        <div className="win-details">
          <div className="win-detail-item">
            <span className="detail-label">Zadanych pytań:</span>
            <span className="detail-value">{questionCount}</span>
          </div>
        </div>

        <button 
          className="win-button" 
          onClick={() => navigate('/')}
        >
          ← Powrót do menu
        </button>
      </div>
    </div>
  );
};

export default WinScreen;
