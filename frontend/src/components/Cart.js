import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import './Cart.css';

const Cart = () => {
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchCart();
  }, []);

  const fetchCart = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/cart', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      setCart(response.data.data);
    } catch (error) {
      console.error('Cart fetch error:', error);
      toast.error(error.response?.data?.message || 'Error fetching cart');
    } finally {
      setLoading(false);
    }
  };

  const handleQuantityChange = async (productId, newQuantity) => {
    try {
      setUpdating(true);
      await axios.put(`http://localhost:5000/api/cart/update/${productId}`, 
        { quantity: newQuantity },
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      await fetchCart();
      toast.success('Cart updated');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error updating quantity');
    } finally {
      setUpdating(false);
    }
  };

  const handleRemoveItem = async (productId) => {
    try {
      setUpdating(true);
      await axios.delete(`http://localhost:5000/api/cart/remove/${productId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      await fetchCart();
      toast.success('Item removed from cart');
    } catch (error) {
      toast.error('Error removing item');
    } finally {
      setUpdating(false);
    }
  };

  const handleClearCart = async () => {
    try {
      setUpdating(true);
      await axios.delete('http://localhost:5000/api/cart/clear', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      await fetchCart();
      toast.success('Cart cleared');
    } catch (error) {
      toast.error('Error clearing cart');
    } finally {
      setUpdating(false);
    }
  };

  const navigate = useNavigate();

  if (loading) {
    return <div className="cart-loading">Loading cart...</div>;
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="empty-cart">
        <h2>Your cart is empty</h2>
        <Link to="/products" className="continue-shopping">
          Continue Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="cart-container">
      <div className="cart-header">
        <button onClick={() => navigate(-1)} className="back-button">
          ← Back
        </button>
        <h1>Shopping Cart</h1>
      </div>
      <div className="cart-items">
        {cart.items.map((item) => (
          <div key={item.product._id} className="cart-item">
            <div className="item-image">
              <img src={item.product.images[0]?.url} alt={item.product.name} />
            </div>
            <div className="item-details">
              <Link to={`/product/${item.product._id}`}>
                <h3>{item.product.name}</h3>
              </Link>
              <p className="item-type">{item.product.type}</p>
              <p className="item-price">
                ${item.product.onSale ? item.product.salePrice : item.product.price}
              </p>
              {item.product.type !== 'digital_game' && (
                <div className="quantity-controls">
                  <button 
                    onClick={() => handleQuantityChange(item.product._id, item.quantity - 1)}
                    disabled={item.quantity <= 1 || updating}
                  >
                    -
                  </button>
                  <span>{item.quantity}</span>
                  <button 
                    onClick={() => handleQuantityChange(item.product._id, item.quantity + 1)}
                    disabled={item.quantity >= item.product.stock || updating}
                  >
                    +
                  </button>
                </div>
              )}
              <button 
                className="remove-item"
                onClick={() => handleRemoveItem(item.product._id)}
                disabled={updating}
              >
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>
      <div className="cart-summary">
        <h3>Cart Summary</h3>
        <div className="summary-details">
          <p>Total Items: {cart.items.reduce((acc, item) => acc + item.quantity, 0)}</p>
          <p>Total Amount: ${cart.totalAmount.toFixed(2)}</p>
        </div>
        <div className="cart-actions">
          <button 
            onClick={handleClearCart} 
            className="clear-cart-button"
            disabled={updating || cart.items.length === 0}
          >
            Clear Cart
          </button>
          <Link to="/checkout" className="checkout-button">
            Proceed to Checkout
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Cart; 