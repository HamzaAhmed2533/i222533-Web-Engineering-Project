import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; // We'll create this next

const PrivateRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  
  return isAuthenticated ? children : <Navigate to="/login" />;
};

export default PrivateRoute; 