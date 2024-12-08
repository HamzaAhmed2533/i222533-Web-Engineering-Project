import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../utils/axios';
import './BuyerDashboard.css';

const BuyerDashboard = () => {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('featured');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchProducts();
  }, [activeSection]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      let endpoint = '/api/products';
      
      switch (activeSection) {
        case 'top-selling':
          endpoint = '/api/products/top-selling';
          break;
        case 'highest-rated':
          endpoint = '/api/products/highest-rated';
          break;
        case 'recommendations':
          endpoint = '/api/products/recommendations';
          break;
        case 'on-sale':
          endpoint = '/api/products/on-sale';
          break;
        default:
          endpoint = '/api/products';
      }

      const response = await axios.get(endpoint);
      // Ensure we're getting an array of products
      const productsData = response.data.data.products || response.data.data || [];
      console.log('Fetched products:', productsData);
      
      if (Array.isArray(productsData)) {
        setProducts(productsData);
      } else {
        console.error('Invalid products data:', productsData);
        setProducts([]);
      }
      setError(null);
    } catch (error) {
      console.error('Error fetching products:', error);
      setError('Failed to load products');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleProductClick = (productId) => {
    navigate(`/products/${productId}`);
  };

  return (
    <div className="dashboard-container">
      <aside className="sidebar">
        <div className="sidebar-header">
          <h2>Browse</h2>
        </div>
        <nav className="sidebar-nav">
          <button
            className={`nav-item ${activeSection === 'featured' ? 'active' : ''}`}
            onClick={() => setActiveSection('featured')}
          >
            Featured
          </button>
          <button
            className={`nav-item ${activeSection === 'top-selling' ? 'active' : ''}`}
            onClick={() => setActiveSection('top-selling')}
          >
            Top Selling
          </button>
          <button
            className={`nav-item ${activeSection === 'highest-rated' ? 'active' : ''}`}
            onClick={() => setActiveSection('highest-rated')}
          >
            Highest Rated
          </button>
          <button
            className={`nav-item ${activeSection === 'recommendations' ? 'active' : ''}`}
            onClick={() => setActiveSection('recommendations')}
          >
            Recommended
          </button>
          <button
            className={`nav-item ${activeSection === 'on-sale' ? 'active' : ''}`}
            onClick={() => setActiveSection('on-sale')}
          >
            On Sale
          </button>
        </nav>
      </aside>

      <main className="main-content">
        <section className="content-section">
          <h2>{activeSection.charAt(0).toUpperCase() + activeSection.slice(1)}</h2>
          {loading ? (
            <div className="loading">Loading...</div>
          ) : error ? (
            <div className="error">{error}</div>
          ) : Array.isArray(products) && products.length > 0 ? (
            <div className="product-grid">
              {products.map((product) => (
                <div
                  key={product._id}
                  className="product-card"
                  onClick={() => handleProductClick(product._id)}
                >
                  <div className="product-image-container">
                    <img
                      src={product.images?.[0]?.url || '/placeholder-image.jpg'}
                      alt={product.name}
                      className="product-image"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = '/placeholder-image.jpg';
                      }}
                    />
                  </div>
                  <div className="product-info">
                    <h3>{product.name}</h3>
                    <div className="price-container">
                      {product.onSale ? (
                        <>
                          <span className="original-price">${product.price}</span>
                          <span className="sale-price">${product.salePrice}</span>
                        </>
                      ) : (
                        <span className="price">${product.price}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="no-products">No products found</div>
          )}
        </section>
      </main>
    </div>
  );
};

export default BuyerDashboard;