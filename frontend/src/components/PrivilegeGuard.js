import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import axios from 'axios';

const PrivilegeGuard = ({ children, requiredPrivilege }) => {
  const [hasAccess, setHasAccess] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAccess = async () => {
      const userData = sessionStorage.getItem('user');
      if (!userData) {
        setHasAccess(false);
        setLoading(false);
        return;
      }

      const user = JSON.parse(userData);
      
      // Global users have all access
      if (user.role === 'Global') {
        setHasAccess(true);
        setLoading(false);
        return;
      }

      // Admin users need to check privileges
      if (user.role === 'Admin') {
        try {
          const response = await axios.get(`http://localhost:5000/check_privilege/${user.user_id}/${requiredPrivilege}`);
          setHasAccess(response.data.has_privilege);
        } catch (error) {
          console.error('Error checking privilege:', error);
          setHasAccess(false);
        }
      } else {
        setHasAccess(false);
      }
      
      setLoading(false);
    };

    checkAccess();
  }, [requiredPrivilege]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!hasAccess) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};

export default PrivilegeGuard; 