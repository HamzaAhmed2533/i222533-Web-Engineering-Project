import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../utils/axios';
import './Library.css';

const Library = () => {
  const navigate = useNavigate();
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchLibrary = async () => {
      try {
        const response = await axios.get('/api/buyer/library');
        if (response.data.success) {
          setGames(response.data.data);
        }
        setLoading(false);
      } catch (err) {
        console.error('Error fetching library:', err);
        setError(err.response?.data?.message || 'Failed to fetch library');
        setLoading(false);
        
        if (err.response?.status === 401) {
          navigate('/login');
        }
      }
    };

    fetchLibrary();
  }, [navigate]);

  const handlePlayGame = (gameId) => {
    // Add game launch logic here
    console.log('Launching game:', gameId);
  };

  const handleDownload = (gameId) => {
    // Add download logic here
    console.log('Downloading game:', gameId);
  };

  if (loading) return <div className="loading">Loading your library...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="library-container">
      <div className="library-header">
        <h1>My Library</h1>
      </div>

      {games.length === 0 ? (
        <div className="empty-library">
          <div className="empty-message">
            <h2>Your library is empty</h2>
            <p>Games you purchase will appear here</p>
            <button 
              className="browse-games-btn"
              onClick={() => navigate('/buyer')}
            >
              Browse Games
            </button>
          </div>
        </div>
      ) : (
        <div className="games-grid">
          {games.map(game => (
            <div key={game._id} className="game-card">
              <div className="game-image-container">
                <img 
                  src={game.images[0]} 
                  alt={game.name} 
                  className="game-image"
                  onError={(e) => {
                    e.target.src = '/placeholder-game.jpg';
                  }}
                />
              </div>
              <div className="game-info">
                <h3>{game.name}</h3>
                <div className="game-details">
                  <span className="game-type">{game.type}</span>
                  <span className="game-size">{game.specifications?.size || 'N/A'}</span>
                </div>
                <div className="game-actions">
                  {game.type === 'digital_game' && (
                    <>
                      <button 
                        className="download-btn"
                        onClick={() => handleDownload(game._id)}
                      >
                        Download
                      </button>
                      <button 
                        className="play-btn"
                        onClick={() => handlePlayGame(game._id)}
                      >
                        Play
                      </button>
                    </>
                  )}
                  {game.type === 'physical_game' && (
                    <div className="shipping-status">
                      Shipping Status: {game.shippingStatus || 'Processing'}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Library; 