import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../utils/axios';
import './SellerDashboard.css';

const SellerDashboard = () => {
  const navigate = useNavigate();
  const [activeMenu, setActiveMenu] = useState('dashboard');
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalSales: 0,
    totalRevenue: 0,
    lastMonthSales: 0,
    lastMonthRevenue: 0,
    productTypes: {}
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem('token');
        const user = JSON.parse(localStorage.getItem('user'));
        console.log('Current token:', token);
        console.log('Current user:', user);

        if (!token || !user) {
          throw new Error('No authentication data');
        }

        const response = await axios.get('/api/seller/stats');
        console.log('Stats response:', response.data);
        setStats(response.data.data);
        setLoading(false);
      } catch (err) {
        console.error('Stats fetch error:', err);
        if (err.response?.status === 403) {
          alert('Access denied. Please ensure you have seller privileges.');
          navigate('/login');
        } else if (err.response?.status === 401) {
          navigate('/login');
        }
        setError(err.response?.data?.message || 'Failed to fetch stats');
        setLoading(false);
      }
    };

    fetchStats();
  }, [navigate]);

  const handleMenuClick = async (menu) => {
    try {
      const token = localStorage.getItem('token');
      const user = JSON.parse(localStorage.getItem('user'));
      console.log('Navigation attempt:', menu);
      console.log('Token present:', !!token);
      console.log('User role:', user?.role);

      if (!token || !user) {
        console.log('No auth data, redirecting to login');
        navigate('/login');
        return;
      }

      if (user.role !== 'seller') {
        console.log('Not a seller, access denied');
        alert('Access denied. Seller privileges required.');
        navigate('/login');
        return;
      }

      setActiveMenu(menu);
      if (menu !== 'dashboard') {
        navigate(`/seller/${menu}`);
      }
    } catch (error) {
      console.error('Menu click error:', error);
      navigate('/login');
    }
  };

  if (loading) return <div className="loading">Loading...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="dashboard-container">
      <div className="sidebar">
        <div className="sidebar-header">
          <h2>Seller Dashboard</h2>
        </div>
        <nav className="sidebar-nav">
          <div className="nav-items">
            <button 
              className={`nav-item ${activeMenu === 'dashboard' ? 'active' : ''}`}
              onClick={() => handleMenuClick('dashboard')}
            >
              Dashboard
            </button>
            <button 
              className={`nav-item ${activeMenu === 'products' ? 'active' : ''}`}
              onClick={() => handleMenuClick('products')}
            >
              Products
            </button>
            <button 
              className={`nav-item ${activeMenu === 'analytics' ? 'active' : ''}`}
              onClick={() => handleMenuClick('analytics')}
            >
              Analytics
            </button>
            <button 
              className={`nav-item ${activeMenu === 'refunds' ? 'active' : ''}`}
              onClick={() => handleMenuClick('refunds')}
            >
              Refund Requests
            </button>
          </div>
          
          <button 
            className="nav-item logout-button"
            onClick={() => {
              localStorage.removeItem('token');
              localStorage.removeItem('user');
              navigate('/login');
            }}
          >
            <i className="fas fa-sign-out-alt"></i> Logout
          </button>
        </nav>
      </div>

      <div className="main-content">
        <div className="stats-grid">
          <div className="stat-card">
            <h3>Total Products</h3>
            <p>{stats.totalProducts}</p>
          </div>
          <div className="stat-card">
            <h3>Total Sales</h3>
            <p>{stats.totalSales}</p>
          </div>
          <div className="stat-card">
            <h3>Total Revenue</h3>
            <p>${stats.totalRevenue}</p>
          </div>
          <div className="stat-card">
            <h3>Last Month Sales</h3>
            <p>${stats.lastMonthSales}</p>
          </div>
          <div className="stat-card">
            <h3>Last Month Revenue</h3>
            <p>${stats.lastMonthRevenue}</p>
          </div>
        </div>

        <div className="product-distribution">
          <h2>Product Distribution</h2>
          <div className="distribution-grid">
            {Object.entries(stats.productTypes).map(([type, count]) => (
              <div key={type} className="distribution-card">
                <h3>{type.replace('_', ' ').toUpperCase()}</h3>
                <p>{count}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SellerDashboard;