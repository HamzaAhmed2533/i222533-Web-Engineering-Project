import React from 'react';
import { useNavigate } from 'react-router-dom';
import './SellerDashboard.css';

const SellerRefunds = () => {
  const navigate = useNavigate();

  return (
    <div className="seller-dashboard">
      <h2>Refunds</h2>
      {/* Add your refunds content here */}
    </div>
  );
};

export default SellerRefunds; 