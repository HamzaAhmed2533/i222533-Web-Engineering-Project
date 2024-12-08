import React, { useEffect, useState } from 'react';
import axios from '../utils/axios';
import './ManageRefunds.css';

const ManageRefunds = () => {
  const [refunds, setRefunds] = useState([]);

  useEffect(() => {
    const fetchRefunds = async () => {
      try {
        const response = await axios.get('/api/admin/refunds');
        setRefunds(response.data.data);
      } catch (error) {
        console.error('Error fetching refunds:', error);
      }
    };
    fetchRefunds();
  }, []);

  const handleApprove = async (id) => {
    try {
      await axios.post(`/api/admin/refunds/${id}/approve`);
      setRefunds(refunds.filter(refund => refund._id !== id));
    } catch (error) {
      console.error('Error approving refund:', error);
    }
  };

  const handleReject = async (id) => {
    try {
      await axios.post(`/api/admin/refunds/${id}/reject`);
      setRefunds(refunds.filter(refund => refund._id !== id));
    } catch (error) {
      console.error('Error rejecting refund:', error);
    }
  };

  return (
    <div className="manage-refunds">
      <h1>Manage Refunds</h1>
      <ul>
        {refunds.map(refund => (
          <li key={refund._id}>
            {refund.reason}
            <button onClick={() => handleApprove(refund._id)}>Approve</button>
            <button onClick={() => handleReject(refund._id)}>Reject</button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ManageRefunds;