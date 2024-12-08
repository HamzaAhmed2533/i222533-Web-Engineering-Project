import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import axios from '../utils/axios';
import './Login.css';

const Login = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('buyer');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isLogin) {
        // Handle Login
        const response = await axios.post('http://localhost:5000/api/auth/login', { email, password });
        console.log('Login success:', response.data);
        
        // Store token and user data
        if (response.data.token) {
          localStorage.setItem('token', response.data.token);
          localStorage.setItem('user', JSON.stringify(response.data.user));
        }
        
        const userRole = response.data.user.role;
        navigateBasedOnRole(userRole);
      } else {
        // Handle Sign Up
        const response = await axios.post('http://localhost:5000/api/auth/register', { 
          name, 
          email, 
          password, 
          role 
        });
        console.log('Sign up success:', response.data);
        
        // Store token and user data
        if (response.data.token) {
          localStorage.setItem('token', response.data.token);
          localStorage.setItem('user', JSON.stringify(response.data.user));
        }
        
        navigateBasedOnRole(role);
      }
    } catch (error) {
      console.error(isLogin ? 'Login failed:' : 'Sign up failed:', error);
      alert(error.response?.data?.message || 'Authentication failed');
    }
  };

  const handleGoogleLoginSuccess = async (credentialResponse) => {
    try {
      const { credential } = credentialResponse;
      const response = await axios.post('http://localhost:5000/api/auth/google-login', { 
        idToken: credential 
      });
      console.log('Google login success:', response.data);
      
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      
      const userRole = response.data.user.role;
      navigateBasedOnRole(userRole);
    } catch (error) {
      console.error('Google login failed:', error);
      alert(error.response?.data?.message || 'Google authentication failed');
    }
  };

  const navigateBasedOnRole = (role) => {
    switch(role) {
      case 'buyer':
        navigate('/buyer');
        break;
      case 'seller':
        navigate('/seller');
        break;
      case 'admin':
        navigate('/admin');
        break;
      default:
        navigate('/');
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setName('');
    setEmail('');
    setPassword('');
    setRole('buyer');
  };

  return (
    <div className="login-container">
      <div className="login-form">
        <h2>{isLogin ? 'Sign In to Game E-commerce' : 'Sign Up to Game E-commerce'}</h2>
        <form onSubmit={handleSubmit}>
          {!isLogin && (
            <div className="input-group">
              <label>Name</label>
              <input 
                type="text" 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                placeholder="Your Name" 
                required={!isLogin} 
              />
            </div>
          )}
          <div className="input-group">
            <label>Email</label>
            <input 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              placeholder="example@email.com" 
              required 
            />
          </div>
          <div className="input-group">
            <label>Password</label>
            <input 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              placeholder="********" 
              required 
            />
          </div>
          {!isLogin && (
            <div className="input-group">
              <label>Role</label>
              <select value={role} onChange={(e) => setRole(e.target.value)} required={!isLogin}>
                <option value="buyer">Buyer</option>
                <option value="seller">Seller</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          )}
          <button type="submit" className="btn">
            {isLogin ? 'Sign In' : 'Sign Up'}
          </button>
        </form>
        <div className="social-login">
          <p>or {isLogin ? 'sign in' : 'sign up'} with</p>
          <div className="social-icons">
            <GoogleLogin
              onSuccess={handleGoogleLoginSuccess}
              onError={() => {
                console.error('Google Login Failed');
              }}
              useOneTap={false}
              cookiePolicy={'single_host_origin'}
            />
          </div>
        </div>
        <p className="signin-link">
          {isLogin ? 
            "Don't have an account? " : 
            "Have an account? "}
          <a href="#" onClick={(e) => {
            e.preventDefault();
            toggleMode();
          }}>
            {isLogin ? 'Sign up' : 'Sign in'}
          </a>
        </p>
      </div>
    </div>
  );
};

export default Login;