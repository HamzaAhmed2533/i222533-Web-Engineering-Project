import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from '../utils/axios';
import './ProductForm.css';

const ProductForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = !!id;

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    type: 'digital_game',
    category: 'game',
    stock: '',
    specifications: {
      platform: [],
      genre: [],
      releaseDate: '',
      brand: '',
      model: ''
    },
    images: []
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [imageFiles, setImageFiles] = useState([]);
  const [imagePreview, setImagePreview] = useState([]);

  useEffect(() => {
    if (isEditMode) {
      fetchProduct();
    }
  }, [id]);

  const fetchProduct = async () => {
    try {
      const response = await axios.get(`/api/products/${id}`);
      const product = response.data.data;
      
      // Remove seller field from the product data
      const { seller, ...productData } = product;
      
      setFormData({
        ...productData,
        specifications: {
          ...productData.specifications,
          platform: productData.specifications.platform || [],
          genre: productData.specifications.genre || [],
          releaseDate: productData.specifications.releaseDate 
            ? new Date(productData.specifications.releaseDate).toISOString().split('T')[0] 
            : ''
        }
      });
      setImagePreview(productData.images.map(img => img.url));
    } catch (error) {
      console.error('Error fetching product:', error);
      setError('Failed to fetch product details');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.includes('specifications.')) {
      const specField = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        specifications: {
          ...prev.specifications,
          [specField]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleArrayInput = (e, field) => {
    const values = e.target.value ? e.target.value.split(',').map(item => item.trim()) : [];
    setFormData(prev => ({
        ...prev,
        specifications: {
            ...prev.specifications,
            [field]: values
        }
    }));
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    setImageFiles(files);

    // Create preview URLs
    const previews = files.map(file => URL.createObjectURL(file));
    setImagePreview(previews);

    // Clean up old preview URLs
    return () => {
      previews.forEach(url => URL.revokeObjectURL(url));
    };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const submitFormData = new FormData();
      
      // Append all product data
      Object.keys(formData).forEach(key => {
        if (key === 'specifications') {
          // Format specifications based on product type
          const specifications = {
            platform: [],
            genre: [],
            releaseDate: '',
            brand: '',
            model: ''
          };

          if (formData.type === 'digital_game' || formData.type === 'physical_game') {
            specifications.platform = formData.specifications.platform;
            specifications.genre = formData.specifications.genre;
            specifications.releaseDate = formData.specifications.releaseDate;
          } else if (['console', 'pc', 'peripheral'].includes(formData.type)) {
            specifications.brand = formData.specifications.brand;
            specifications.model = formData.specifications.model;
          }

          submitFormData.append(key, JSON.stringify(specifications));
        } else if (key !== 'images') { // Skip the images array in formData
          submitFormData.append(key, formData[key]);
        }
      });

      // Add new images
      if (imageFiles && imageFiles.length > 0) {
        imageFiles.forEach(image => {
          submitFormData.append('images', image);
        });
      }

      // Log form data for debugging
      console.log('Submitting form data:');
      for (let [key, value] of submitFormData.entries()) {
        console.log(key, value);
      }

      if (isEditMode) {
        await axios.put(`/api/products/${id}`, submitFormData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
      } else {
        await axios.post('/api/products', submitFormData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
      }

      navigate('/seller/products');
    } catch (error) {
      console.error('Error saving product:', error);
      setError(error.response?.data?.message || 'Failed to save product');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="product-form-container">
      <h2>{isEditMode ? 'Edit Product' : 'Add New Product'}</h2>
      {error && <div className="error-message">{error}</div>}
      
      <form onSubmit={handleSubmit} className="product-form">
        <div className="form-group">
          <label>Name</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label>Description</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label>Price</label>
          <input
            type="number"
            name="price"
            value={formData.price}
            onChange={handleChange}
            min="0"
            step="0.01"
            required
          />
        </div>

        <div className="form-group">
          <label>Type</label>
          <select name="type" value={formData.type} onChange={handleChange} required>
            <option value="digital_game">Digital Game</option>
            <option value="physical_game">Physical Game</option>
            <option value="console">Console</option>
            <option value="pc">PC</option>
            <option value="peripheral">Peripheral</option>
          </select>
        </div>

        <div className="form-group">
          <label>Category</label>
          <select name="category" value={formData.category} onChange={handleChange} required>
            <option value="game">Game</option>
            <option value="hardware">Hardware</option>
          </select>
        </div>

        {formData.type !== 'digital_game' && (
          <div className="form-group">
            <label>Stock</label>
            <input
              type="number"
              name="stock"
              value={formData.stock}
              onChange={handleChange}
              min="0"
              required
            />
          </div>
        )}

        {(formData.type === 'digital_game' || formData.type === 'physical_game') && (
          <>
            <div className="form-group">
              <label>Platforms (comma-separated)</label>
              <input
                type="text"
                value={formData.specifications.platform.join(', ')}
                onChange={(e) => handleArrayInput(e, 'platform')}
                required
              />
            </div>

            <div className="form-group">
              <label>Genres (comma-separated)</label>
              <input
                type="text"
                value={formData.specifications.genre.join(', ')}
                onChange={(e) => handleArrayInput(e, 'genre')}
                required
              />
            </div>

            <div className="form-group">
              <label>Release Date</label>
              <input
                type="date"
                name="specifications.releaseDate"
                value={formData.specifications.releaseDate?.split('T')[0] || ''}
                onChange={handleChange}
                required
              />
            </div>
          </>
        )}

        {(formData.type === 'console' || formData.type === 'pc' || formData.type === 'peripheral') && (
          <>
            <div className="form-group">
              <label>Brand</label>
              <input
                type="text"
                name="specifications.brand"
                value={formData.specifications.brand}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Model</label>
              <input
                type="text"
                name="specifications.model"
                value={formData.specifications.model}
                onChange={handleChange}
                required
              />
            </div>
          </>
        )}

        <div className="form-group">
          <label>Images</label>
          <input
            type="file"
            onChange={handleImageChange}
            multiple
            accept="image/*"
          />
          <div className="image-preview">
            {imagePreview.map((url, index) => (
              <img key={index} src={url} alt={`Preview ${index + 1}`} />
            ))}
          </div>
        </div>

        <div className="form-actions">
          <button type="button" onClick={() => navigate('/seller/products')} className="cancel-btn">
            Cancel
          </button>
          <button type="submit" disabled={loading} className="submit-btn">
            {loading ? 'Saving...' : (isEditMode ? 'Update Product' : 'Add Product')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProductForm; 