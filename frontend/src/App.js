import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import Login from './components/Login';
import BuyerDashboard from './components/BuyerDashboard';
import Library from './components/Library';
import SellerDashboard from './components/SellerDashboard';
import AdminDashboard from './components/AdminDashboard';
import SellerProducts from './components/SellerProducts';
import SellerAnalytics from './components/SellerAnalytics';
import SellerRefunds from './components/SellerRefunds';
import ProductForm from './components/ProductForm';
import ProductDetails from './components/ProductDetails';
import ProductView from './components/ProductView';
import Cart from './components/Cart';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import CartButton from './components/CartButton';

const App = () => {
  // Protected route wrapper for seller
  const SellerRoute = ({ children }) => {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user'));
    
    if (!token || !user || user.role !== 'seller') {
      return <Navigate to="/login" />;
    }
    
    return children;
  };

  // Protected route wrapper for buyer
  const BuyerRoute = ({ children }) => {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user'));
    
    if (!token || !user || user.role !== 'buyer') {
      return <Navigate to="/login" />;
    }
    
    return children;
  };

  return (
    <Router>
      <ToastContainer position="top-right" autoClose={3000} />
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        
        {/* Buyer Routes */}
        <Route path="/buyer" element={
          <BuyerRoute>
            <BuyerDashboard />
          </BuyerRoute>
        } />
        <Route path="/buyer/library" element={
          <BuyerRoute>
            <Library />
          </BuyerRoute>
        } />
        
        {/* Seller Routes */}
        <Route path="/seller" element={
          <SellerRoute>
            <SellerDashboard />
          </SellerRoute>
        } />
        <Route path="/seller/products" element={
          <SellerRoute>
            <SellerProducts />
          </SellerRoute>
        } />
        <Route path="/seller/analytics" element={
          <SellerRoute>
            <SellerAnalytics />
          </SellerRoute>
        } />
        <Route path="/seller/refunds" element={
          <SellerRoute>
            <SellerRefunds />
          </SellerRoute>
        } />
        <Route path="/seller/products/new" element={
          <SellerRoute>
            <ProductForm />
          </SellerRoute>
        } />
        <Route path="/seller/products/edit/:id" element={
          <SellerRoute>
            <ProductForm />
          </SellerRoute>
        } />
        <Route path="/seller/products/:id" element={
          <SellerRoute>
            <ProductDetails />
          </SellerRoute>
        } />

        {/* Admin Routes */}
        <Route path="/admin" element={<AdminDashboard />} />

        {/* Product Routes */}
        <Route path="/product/:id" element={
          <BuyerRoute>
            <ProductView />
          </BuyerRoute>
        } />

        {/* Cart Routes */}
        <Route path="/cart" element={<Cart />} />

        {/* Default Routes */}
        <Route path="/" element={<Navigate to="/buyer" />} />
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
      {JSON.parse(localStorage.getItem('user'))?.role === 'buyer' && <CartButton />}
    </Router>
  );
};

export default App;