import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import axios from '../utils/axios';
import './SellerAnalytics.css';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const SellerAnalytics = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [analyticsData, setAnalyticsData] = useState({
    monthlySales: [],
    productPerformance: [],
    categoryDistribution: [],
    revenueStats: {
      totalRevenue: 0,
      averageOrderValue: 0,
      monthlyGrowth: 0
    }
  });

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const response = await axios.get('/api/seller/analytics');
      console.log('Raw analytics data:', response.data.data);
      
      // Convert categoryDistribution object to array if needed
      const data = response.data.data;
      if (data.categoryDistribution && !Array.isArray(data.categoryDistribution)) {
        data.categoryDistribution = Object.entries(data.categoryDistribution).map(([category, value]) => ({
          category,
          value
        }));
      }
      
      setAnalyticsData(data);
      setLoading(false);
    } catch (err) {
      console.error('Analytics fetch error:', err);
      setError(err.response?.data?.message || 'Failed to fetch analytics');
      setLoading(false);
    }
  };

  // Revenue Chart Data
  const revenueChartData = {
    labels: analyticsData.monthlySales.map(item => item.month),
    datasets: [
      {
        label: 'Monthly Revenue',
        data: analyticsData.monthlySales.map(item => item.revenue),
        borderColor: 'rgb(75, 192, 192)',
        tension: 0.1,
        fill: false
      },
      {
        label: 'Monthly Units Sold',
        data: analyticsData.monthlySales.map(item => item.units),
        borderColor: 'rgb(255, 99, 132)',
        tension: 0.1,
        fill: false
      }
    ]
  };

  // Product Performance Chart Data
  const productChartData = {
    labels: analyticsData.productPerformance?.map(item => item.name) || [],
    datasets: [{
      label: 'Units Sold',
      data: analyticsData.productPerformance?.map(item => item.unitsSold) || [],
      backgroundColor: 'rgba(54, 162, 235, 0.8)',
      borderColor: 'rgba(54, 162, 235, 1)',
      borderWidth: 1
    }]
  };

  // For debugging, log the actual data
  console.log('Product Chart Data:', {
    labels: productChartData.labels,
    data: productChartData.datasets[0].data
  });

  // Category Distribution Chart Data
  const categoryChartData = {
    labels: analyticsData.categoryDistribution?.map(item => item.category) || [],
    datasets: [{
      data: analyticsData.categoryDistribution?.map(item => item.value) || [],
      backgroundColor: [
        'rgba(255, 99, 132, 0.8)',
        'rgba(54, 162, 235, 0.8)',
        'rgba(255, 206, 86, 0.8)',
        'rgba(75, 192, 192, 0.8)',
        'rgba(153, 102, 255, 0.8)',
      ],
      borderColor: [
        'rgba(255, 99, 132, 1)',
        'rgba(54, 162, 235, 1)',
        'rgba(255, 206, 86, 1)',
        'rgba(75, 192, 192, 1)',
        'rgba(153, 102, 255, 1)',
      ],
      borderWidth: 1
    }]
  };

  // For debugging, log the category data
  console.log('Category Chart Data:', {
    labels: categoryChartData.labels,
    data: categoryChartData.datasets[0].data
  });

  if (loading) return <div className="loading">Loading analytics...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="analytics-container">
      <h1>Seller Analytics</h1>

      {/* Revenue Stats Cards */}
      <div className="stats-cards">
        <div className="stat-card">
          <h3>Total Revenue</h3>
          <p>${analyticsData.revenueStats?.totalRevenue?.toFixed(2) || '0.00'}</p>
        </div>
        <div className="stat-card">
          <h3>Average Order Value</h3>
          <p>${analyticsData.revenueStats?.averageOrderValue?.toFixed(2) || '0.00'}</p>
        </div>
        <div className="stat-card">
          <h3>Monthly Growth</h3>
          <p>{analyticsData.revenueStats?.monthlyGrowth?.toFixed(1) || '0'}%</p>
        </div>
      </div>

      {/* Revenue Chart */}
      <div className="chart-container">
        <h2>Revenue Trends</h2>
        <Line 
          data={revenueChartData}
          options={{
            responsive: true,
            scales: {
              y: {
                beginAtZero: true
              }
            }
          }}
        />
      </div>

      {/* Product Performance Chart */}
      <div className="chart-container">
        <h2>Product Performance</h2>
        {analyticsData.productPerformance?.length > 0 ? (
          <div className="chart-wrapper">
            <Bar 
              data={productChartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                  y: {
                    beginAtZero: true,
                    grid: {
                      color: 'rgba(255, 255, 255, 0.1)'
                    },
                    ticks: {
                      color: '#fff'
                    }
                  },
                  x: {
                    grid: {
                      display: false
                    },
                    ticks: {
                      color: '#fff'
                    }
                  }
                },
                plugins: {
                  legend: {
                    display: false
                  }
                }
              }}
            />
          </div>
        ) : (
          <p className="no-data">No product performance data available</p>
        )}
      </div>

      {/* Category Distribution Chart */}
      <div className="chart-container">
        <h2>Category Distribution</h2>
        {analyticsData.categoryDistribution?.length > 0 ? (
          <div className="chart-wrapper">
            <Doughnut 
              data={categoryChartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'right',
                    labels: {
                      color: '#fff',
                      padding: 20
                    }
                  }
                }
              }}
            />
          </div>
        ) : (
          <p className="no-data">No category distribution data available</p>
        )}
      </div>
    </div>
  );
};

export default SellerAnalytics; 