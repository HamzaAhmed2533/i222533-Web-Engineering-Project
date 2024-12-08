import React from 'react';
import { useNavigate } from 'react-router-dom';
import './CartButton.css';

const CartButton = () => {
  const navigate = useNavigate();

  return (
    <button 
      className="floating-cart-button"
      onClick={() => navigate('/cart')}
      aria-label="View Cart"
    >
      <i className="fas fa-shopping-cart"></i>
    </button>
  );
};

export default CartButton;