import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './SellerDashboard.css';

const SellerLayout = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const getActiveMenu = () => {
    const path = location.pathname;
    if (path === '/seller') return 'dashboard';
    return path.split('/')[2] || 'dashboard';
  };

  const handleMenuClick = (menu) => {
    switch(menu) {
      case 'dashboard':
        navigate('/seller');
        break;
      case 'products':
        navigate('/seller/products');
        break;
      case 'analytics':
        navigate('/seller/analytics');
        break;
      case 'refunds':
        navigate('/seller/refunds');
        break;
      default:
        console.log('Unknown menu item:', menu);
    }
  };

  return (
    <div className="seller-dashboard">
      <div className="sidebar">
        <div className="menu-items">
          <button 
            className={getActiveMenu() === 'dashboard' ? 'active' : ''} 
            onClick={() => handleMenuClick('dashboard')}
          >
            Dashboard
          </button>
          <button 
            className={getActiveMenu() === 'products' ? 'active' : ''} 
            onClick={() => handleMenuClick('products')}
          >
            Products
          </button>
          <button 
            className={getActiveMenu() === 'analytics' ? 'active' : ''} 
            onClick={() => handleMenuClick('analytics')}
          >
            Analytics
          </button>
          <button 
            className={getActiveMenu() === 'refunds' ? 'active' : ''} 
            onClick={() => handleMenuClick('refunds')}
          >
            Refunds
          </button>
        </div>
      </div>
      <div className="main-content">
        {children}
      </div>
    </div>
  );
};

export default SellerLayout; 