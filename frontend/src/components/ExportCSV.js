import React from 'react';
import axios from '../utils/axios';
import './ExportCSV.css';

const ExportCSV = () => {
  const handleExport = async () => {
    try {
      const response = await axios.get('/api/admin/export-csv', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'analytics.csv');
      document.body.appendChild(link);
      link.click();
    } catch (error) {
      console.error('Error exporting CSV:', error);
    }
  };

  return (
    <div className="export-csv">
      <h1>Export Analytics to CSV</h1>
      <button onClick={handleExport}>Export CSV</button>
    </div>
  );
};

export default ExportCSV;