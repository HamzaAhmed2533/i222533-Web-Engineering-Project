import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from '../utils/axios';
import './ProductDetails.css';

const ProductDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const response = await axios.get(`/api/products/${id}`);
        setProduct(response.data.data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching product:', err);
        setError(err.response?.data?.message || 'Failed to fetch product');
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  if (loading) {
    return <div className="product-details loading">Loading...</div>;
  }

  if (error) {
    return <div className="product-details error">Error: {error}</div>;
  }

  if (!product) {
    return <div className="product-details not-found">Product not found</div>;
  }

  return (
    <div className="product-details">
      <button className="back-button" onClick={() => navigate('/seller/products')}>
        Back to Products
      </button>
      
      <div className="product-header">
        <h2>{product.name}</h2>
        <div className="product-actions">
          <button onClick={() => navigate(`/seller/products/edit/${product._id}`)}>
            Edit Product
          </button>
        </div>
      </div>

      <div className="product-content">
        <div className="product-images">
          {product.images && product.images.map((image, index) => (
            <img 
              key={index}
              src={image.url} 
              alt={`${product.name} - ${index + 1}`}
              className="product-image"
            />
          ))}
        </div>

        <div className="product-info">
          <div className="info-section">
            <h3>Basic Information</h3>
            <p><strong>Price:</strong> ${product.price}</p>
            <p><strong>Category:</strong> {product.category}</p>
            <p><strong>Type:</strong> {product.type}</p>
            <p><strong>Status:</strong> {product.status}</p>
            {product.type !== 'digital_game' && (
              <p><strong>Stock:</strong> {product.stock || 0}</p>
            )}
          </div>

          <div className="info-section">
            <h3>Description</h3>
            <p>{product.description}</p>
          </div>

          <div className="info-section">
            <h3>Specifications</h3>
            {(product.type === 'digital_game' || product.type === 'physical_game') ? (
              <>
                <p><strong>Platforms:</strong> {product.specifications?.platform?.join(', ') || 'N/A'}</p>
                <p><strong>Genres:</strong> {product.specifications?.genre?.join(', ') || 'N/A'}</p>
                <p><strong>Release Date:</strong> {product.specifications?.releaseDate ? 
                  new Date(product.specifications.releaseDate).toLocaleDateString() : 'N/A'}</p>
              </>
            ) : (
              <>
                <p><strong>Brand:</strong> {product.specifications?.brand || 'N/A'}</p>
                <p><strong>Model:</strong> {product.specifications?.model || 'N/A'}</p>
              </>
            )}
          </div>

          <div className="info-section">
            <h3>Sales Information</h3>
            <p><strong>Total Sales:</strong> {product.sales?.total || 0}</p>
            <p><strong>Last Month Sales:</strong> {product.sales?.lastMonth || 0}</p>
          </div>

          <div className="info-section">
            <h3>Rating</h3>
            <p><strong>Average Rating:</strong> {(product.rating?.average || 0).toFixed(1)}/5</p>
            <p><strong>Total Reviews:</strong> {product.rating?.count || 0}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetails; 