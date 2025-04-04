import React, { useState, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { usePrivileges } from './PrivilegeContext';

// Component for role and privilege-based access control
const PrivilegeGuard = ({ children, requiredRole, requiredPrivilege }) => {
  const { hasPrivilege, loading } = usePrivileges();
  const location = useLocation();
  const [hasAccess, setHasAccess] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // Check if user is logged in
    const userData = sessionStorage.getItem('user');
    if (!userData) {
      setHasAccess(false);
      setIsChecking(false);
      return;
    }

    const user = JSON.parse(userData);
    
    // Check role first if required
    if (requiredRole && user.role !== requiredRole) {
      setHasAccess(false);
      setIsChecking(false);
      return;
    }
    
    // Then check privilege if required
    if (requiredPrivilege && !loading) {
      const access = hasPrivilege(requiredPrivilege);
      setHasAccess(access);
      setIsChecking(false);
    } else if (!requiredPrivilege) {
      // If no privilege is required, grant access
      setHasAccess(true);
      setIsChecking(false);
    }
  }, [requiredRole, requiredPrivilege, loading, hasPrivilege]);

  if (isChecking || loading) {
    return (
      <div className="loading-container">
        <p>Checking permissions...</p>
      </div>
    );
  }

  if (!hasAccess) {
    // Redirect to homepage if access is denied
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  // If has access, render the children
  return children;
};

export default PrivilegeGuard; 