import React, { useEffect, useState } from 'react';
import axios from '../utils/axios';
import './ProductAnalytics.css';

const ProductAnalytics = () => {
  const [analytics, setAnalytics] = useState({});

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const response = await axios.get('/api/admin/product-analytics');
        setAnalytics(response.data.data);
      } catch (error) {
        console.error('Error fetching product analytics:', error);
      }
    };
    fetchAnalytics();
  }, []);

  return (
    <div className="product-analytics">
      <h1>Product Analytics</h1>
      {/* Render analytics data here */}
      <pre>{JSON.stringify(analytics, null, 2)}</pre>
    </div>
  );
};

export default ProductAnalytics;