import React from 'react';
import { Link } from 'react-router-dom';
import './AdminDashboard.css';

const AdminDashboard = () => {
  return (
    <div className="admin-dashboard">
      <h1>Admin Dashboard</h1>
      <ul>
        <li><Link to="/admin/users">Manage Users</Link></li>
        <li><Link to="/admin/refunds">Manage Refunds</Link></li>
        <li><Link to="/admin/user-analytics">View User Analytics</Link></li>
        <li><Link to="/admin/product-analytics">View Product Analytics</Link></li>
        <li><Link to="/admin/refund-reports">Generate Refund Reports</Link></li>
        <li><Link to="/admin/export-csv">Export Analytics to CSV</Link></li>
      </ul>
    </div>
  );
};

export default AdminDashboard;