import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { usePrivileges } from './PrivilegeContext';

// PrivilegedRoute component for privilege-based access control
const PrivilegedRoute = ({ element, requiredPrivilege, entityId }) => {
  const { hasPrivilege, loading } = usePrivileges();
  const [hasAccess, setHasAccess] = useState(true);
  const [isChecking, setIsChecking] = useState(true);
  
  useEffect(() => {
    // Check if user is logged in
    const userData = sessionStorage.getItem('user');
    if (!userData) {
      setHasAccess(false);
      setIsChecking(false);
      return;
    }
    
    // If there's a required privilege, check if the user has it
    if (requiredPrivilege && !loading) {
      const access = hasPrivilege(requiredPrivilege);
      setHasAccess(access);
      setIsChecking(false);
    } else if (!requiredPrivilege) {
      // If no privilege is required, grant access
      setHasAccess(true);
      setIsChecking(false);
    }
  }, [requiredPrivilege, loading, hasPrivilege, entityId]);
  
  if (isChecking || loading) {
    return <div className="loading-container">Checking permissions...</div>;
  }
  
  if (!hasAccess) {
    return <Navigate to="/" />;
  }
  
  // If the entityId is provided, pass it to the element
  if (entityId) {
    return React.cloneElement(element, { entityId });
  }
  
  return element;
};

export default PrivilegedRoute; 