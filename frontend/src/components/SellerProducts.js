import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../utils/axios';
import './SellerProducts.css';

const SellerProducts = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [imageLoadErrors, setImageLoadErrors] = useState({});

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      const user = JSON.parse(localStorage.getItem('user'));
      
      console.log('Current token:', token ? 'Present' : 'Missing');
      console.log('Current user:', user);

      if (!token || !user) {
        console.log('No auth data found');
        navigate('/login');
        return false;
      }

      if (user.role !== 'seller') {
        console.log('User is not a seller');
        navigate('/login');
        return false;
      }

      return true;
    };

    const fetchProducts = async () => {
      try {
        const isAuthenticated = await checkAuth();
        if (!isAuthenticated) return;

        console.log('Fetching products...');
        const response = await axios.get('/api/products/seller/my-products', {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        console.log('Products response:', response.data);
        setProducts(response.data.data.products);
        setLoading(false);
      } catch (err) {
        console.error('Full error:', err);
        console.error('Error response:', err.response);
        
        if (err.response?.status === 401) {
          console.log('Unauthorized - clearing auth data');
          localStorage.clear();
          navigate('/login');
        } else if (err.response?.status === 403) {
          console.log('Forbidden - not a seller');
          navigate('/login');
        } else {
          setError(err.response?.data?.message || 'Failed to fetch products');
        }
        setLoading(false);
      }
    };

    fetchProducts();
  }, [navigate]);

  const handleImageError = (productId) => {
    setImageLoadErrors(prev => ({
      ...prev,
      [productId]: true
    }));
  };

  const getProductImage = (product) => {
    if (imageLoadErrors[product._id] || !product.images || !product.images.length) {
      return '/placeholder.png';
    }
    return product.images[0]?.url || '/placeholder.png';
  };

  if (loading) {
    return (
      <div className="seller-products">
        <div className="loading">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="seller-products">
        <div className="error">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="seller-products">
      <div className="products-header">
        <button className="back-button" onClick={() => navigate('/seller')}>
          Back to Dashboard
        </button>
        <h2>My Products</h2>
        <button className="add-product-btn" onClick={() => navigate('/seller/products/new')}>
          Add New Product
        </button>
      </div>
      <div className="products-grid">
        {products.length === 0 ? (
          <div className="no-products">No products found</div>
        ) : (
          products.map(product => (
            <div key={product._id} className="product-card">
              <div className="product-image-container">
                <img 
                  src={getProductImage(product)}
                  alt={product.name} 
                  className="product-image"
                  onError={() => handleImageError(product._id)}
                />
              </div>
              <div className="product-info">
                <h3>{product.name}</h3>
                <p>${product.price}</p>
                <p>Status: {product.status}</p>
                <div className="product-actions">
                  <button onClick={() => navigate(`/seller/products/edit/${product._id}`)}>
                    Edit
                  </button>
                  <button onClick={() => navigate(`/seller/products/${product._id}`)}>
                    View
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default SellerProducts;