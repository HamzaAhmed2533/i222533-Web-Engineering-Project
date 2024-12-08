import React, { useEffect, useState } from 'react';
import axios from '../utils/axios';
import './RefundReports.css';

const RefundReports = () => {
  const [reports, setReports] = useState({});

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const response = await axios.get('/api/admin/refund-reports');
        setReports(response.data.data);
      } catch (error) {
        console.error('Error fetching refund reports:', error);
      }
    };
    fetchReports();
  }, []);

  return (
    <div className="refund-reports">
      <h1>Refund Reports</h1>
      {/* Render reports data here */}
      <pre>{JSON.stringify(reports, null, 2)}</pre>
    </div>
  );
};

export default RefundReports;