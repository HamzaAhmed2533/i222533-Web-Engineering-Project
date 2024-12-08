import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../utils/axios';
import './BuyerDashboard.css';

const BuyerDashboard = () => {
  const navigate = useNavigate();
  const [activeMenu, setActiveMenu] = useState('dashboard');
  const [dashboardData, setDashboardData] = useState({
    recentPurchases: [],
    onSale: [],
    newReleases: [],
    bestSellers: [],
    featuredGames: [],
    popularHardware: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

// Update the fetchDashboardData function:

useEffect(() => {
  const fetchDashboardData = async () => {
    try {
      console.log('Starting dashboard data fetch...');
      const token = localStorage.getItem('token');
      console.log('Token exists:', !!token);

      const response = await axios.get('/api/buyer/dashboard');
      console.log('Raw response:', response);
      
      if (response.data.success) {
        console.log('Dashboard data received:', response.data);
        setDashboardData(response.data.data);
        console.log('State updated with:', response.data.data);
      } else {
        console.error('Response indicated failure:', response.data);
        setError('Failed to fetch dashboard data');
      }
      setLoading(false);
    } catch (err) {
      console.error('Dashboard fetch error:', err);
      console.error('Error response:', err.response);
      console.error('Error message:', err.message);
      setError(err.response?.data?.message || 'Failed to fetch dashboard data');
      setLoading(false);
      
      if (err.response?.status === 401) {
        navigate('/login');
      }
    }
  };

  fetchDashboardData();
}, [navigate]);

  const handleMenuClick = (menu) => {
    setActiveMenu(menu);
    switch(menu) {
      case 'dashboard':
        navigate('/buyer');
        break;
      case 'library':
        navigate('/buyer/library');
        break;
      case 'wishlist':
        navigate('/buyer/wishlist');
        break;
      case 'orders':
        navigate('/buyer/orders');
        break;
      default:
        console.log('Unknown menu item:', menu);
    }
  };

  const renderProductCard = (product) => (
    <div key={product._id} className="product-card" onClick={() => navigate(`/product/${product._id}`)}>
      <img src={product.images[0]?.url} alt={product.name} className="product-image" />
      <div className="product-info">
        <h3>{product.name}</h3>
        <p className="price">
          {product.onSale.isOnSale ? (
            <>
              <span className="original-price">${product.price}</span>
              <span className="sale-price">${product.onSale.salePrice}</span>
            </>
          ) : (
            <span>${product.price}</span>
          )}
        </p>
      </div>
    </div>
  );

  if (loading) return <div className="loading">Loading...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="dashboard-container">
      {/* Sidebar */}
      <div className="sidebar">
        <div className="sidebar-header">
          <h2>Game Store</h2>
        </div>
        <nav className="sidebar-nav">
          <button 
            className={`nav-item ${activeMenu === 'dashboard' ? 'active' : ''}`}
            onClick={() => handleMenuClick('dashboard')}
          >
            Dashboard
          </button>
          <button 
            className={`nav-item ${activeMenu === 'library' ? 'active' : ''}`}
            onClick={() => handleMenuClick('library')}
          >
            My Library
          </button>
          <button 
            className={`nav-item ${activeMenu === 'wishlist' ? 'active' : ''}`}
            onClick={() => handleMenuClick('wishlist')}
          >
            Wishlist
          </button>
          <button 
            className={`nav-item ${activeMenu === 'orders' ? 'active' : ''}`}
            onClick={() => handleMenuClick('orders')}
          >
            Orders
          </button>
        </nav>
      </div>

      {/* Main Content */}
      <div className="main-content">
        {/* Featured Games */}
        <section className="content-section">
          <h2>Featured Games</h2>
          <div className="product-grid">
            {dashboardData.featuredGames?.map(renderProductCard)}
          </div>
        </section>

        {/* On Sale */}
        <section className="content-section">
          <h2>Special Offers</h2>
          <div className="product-grid">
            {dashboardData.onSale?.map(renderProductCard)}
          </div>
        </section>

        {/* New Releases */}
        <section className="content-section">
          <h2>New Releases</h2>
          <div className="product-grid">
            {dashboardData.newReleases?.map(renderProductCard)}
          </div>
        </section>

        {/* Popular Hardware */}
        <section className="content-section">
          <h2>Gaming Hardware</h2>
          <div className="product-grid">
            {dashboardData.popularHardware?.map(renderProductCard)}
          </div>
        </section>

        {/* Best Sellers */}
        <section className="content-section">
          <h2>Best Sellers</h2>
          <div className="product-grid">
            {dashboardData.bestSellers?.map(renderProductCard)}
          </div>
        </section>

        {/* Recent Purchases - Only show if there are purchases */}
        {dashboardData.recentPurchases?.length > 0 && (
          <section className="content-section">
            <h2>Recent Purchases</h2>
            <div className="product-grid">
              {dashboardData.recentPurchases?.map(renderProductCard)}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default BuyerDashboard;