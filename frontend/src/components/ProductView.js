import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from '../utils/axios';
import './ProductView.css';
import { toast } from 'react-toastify';

const ProductView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [purchaseError, setPurchaseError] = useState(null);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const response = await axios.get(`/api/products/${id}`);
        if (response.data.success) {
          setProduct(response.data.data);
        }
        setLoading(false);
      } catch (err) {
        console.error('Error fetching product:', err);
        setError(err.response?.data?.message || 'Failed to fetch product');
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  const handleAddToCart = async () => {
    try {
      setIsAddingToCart(true);
      setPurchaseError(null);
      
      const response = await axios.post(`/api/cart/add/${id}`, {
        quantity: 1
      });

      if (response.data.success) {
        toast.success('Added to cart successfully!');
      }
    } catch (err) {
      console.error('Error adding to cart:', err);
      toast.error(err.response?.data?.message || 'Failed to add to cart');
      if (err.response?.status === 401) {
        navigate('/login');
      }
    } finally {
      setIsAddingToCart(false);
    }
  };

  const handleBuyNow = async () => {
    try {
      setIsAddingToCart(true);
      setPurchaseError(null);
      
      // First add to cart
      const cartResponse = await axios.post('/api/cart/add', {
        productId: id,
        quantity: 1
      });

      if (cartResponse.data.success) {
        // Create order directly
        const orderResponse = await axios.post('/api/orders/create', {
          items: [{
            product: id,
            quantity: 1
          }]
        });

        if (orderResponse.data.success) {
          navigate(`/checkout/${orderResponse.data.data._id}`);
        }
      }
    } catch (err) {
      console.error('Error processing purchase:', err);
      setPurchaseError(err.response?.data?.message || 'Failed to process purchase');
      if (err.response?.status === 401) {
        navigate('/login');
      }
    } finally {
      setIsAddingToCart(false);
    }
  };

  const handleGoBack = () => {
    navigate(-1); // This will go back to the previous page
  };

  if (loading) return <div className="loading">Loading product details...</div>;
  if (error) return <div className="error">{error}</div>;
  if (!product) return <div className="error">Product not found</div>;

  return (
    <div className="product-view-container">
      <button onClick={handleGoBack} className="back-button">
        ← Back
      </button>
      <div className="product-view-content">
        <div className="product-gallery">
          <div className="main-image">
            <img 
              src={product.images[selectedImage]} 
              alt={product.name}
              className="featured-image"
            />
          </div>
          <div className="image-thumbnails">
            {product.images.map((image, index) => (
              <img
                key={index}
                src={image}
                alt={`${product.name} thumbnail ${index + 1}`}
                className={`thumbnail ${selectedImage === index ? 'active' : ''}`}
                onClick={() => setSelectedImage(index)}
              />
            ))}
          </div>
        </div>

        <div className="product-info">
          <h1>{product.name}</h1>
          
          <div className="price-section">
            {product.onSale ? (
              <>
                <span className="original-price">${product.price}</span>
                <span className="sale-price">${product.salePrice}</span>
                <span className="discount">
                  {Math.round((1 - product.salePrice / product.price) * 100)}% OFF
                </span>
              </>
            ) : (
              <span className="price">${product.price}</span>
            )}
          </div>

          <div className="product-type">
            <span className="type-badge">{product.type.replace('_', ' ')}</span>
          </div>

          <div className="product-description">
            <h2>About This Game</h2>
            <p>{product.description}</p>
          </div>

          <div className="specifications">
            <h2>Specifications</h2>
            <div className="specs-grid">
              {Object.entries(product.specifications).map(([key, value]) => (
                <div key={key} className="spec-item">
                  <span className="spec-label">{key}:</span>
                  <span className="spec-value">{value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="purchase-actions">
            <button 
              className={`add-to-cart-btn ${isAddingToCart ? 'loading' : ''}`}
              onClick={handleAddToCart}
              disabled={isAddingToCart}
            >
              {isAddingToCart ? 'Adding...' : 'Add to Cart'}
            </button>
            <button 
              className={`buy-now-btn ${isAddingToCart ? 'loading' : ''}`}
              onClick={handleBuyNow}
              disabled={isAddingToCart}
            >
              {isAddingToCart ? 'Processing...' : 'Buy Now'}
            </button>
          </div>
        </div>
      </div>
      
      {purchaseError && (
        <div className="purchase-error">
          {purchaseError}
        </div>
      )}
    </div>
  );
};

export default ProductView; 