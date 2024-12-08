import React, { useEffect, useState } from 'react';
import axios from '../utils/axios';
import './UserAnalytics.css';

const UserAnalytics = () => {
  const [analytics, setAnalytics] = useState({});

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const response = await axios.get('/api/admin/user-analytics');
        setAnalytics(response.data.data);
      } catch (error) {
        console.error('Error fetching user analytics:', error);
      }
    };
    fetchAnalytics();
  }, []);

  return (
    <div className="user-analytics">
      <h1>User Analytics</h1>
      {/* Render analytics data here */}
      <pre>{JSON.stringify(analytics, null, 2)}</pre>
    </div>
  );
};

export default UserAnalytics;