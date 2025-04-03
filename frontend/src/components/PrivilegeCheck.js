import React, { useContext } from 'react';
import { PrivilegeContext } from './PrivilegeContext';

// This component is used to conditionally render elements based on privilege checks
const PrivilegeCheck = ({ 
  requiredPrivilege, 
  entityId = null, 
  fallback = null,
  children 
}) => {
  const { hasPrivilege, loading } = useContext(PrivilegeContext);
  
  // Get current user role
  const userData = sessionStorage.getItem('user');
  const userRole = userData ? JSON.parse(userData).role : null;
  
  // If viewing privilege and user is admin, always allow access
  const isViewPrivilege = requiredPrivilege && requiredPrivilege.toLowerCase().includes('view');
  const isAdmin = userRole === 'Global Admin' || userRole === 'Entity Admin';
  const allowView = isViewPrivilege && isAdmin;
  
  // Render nothing while loading
  if (loading) {
    return null;
  }
  
  // Render children if user has privilege, otherwise render fallback
  if (hasPrivilege(requiredPrivilege, entityId) || allowView) {
    return children;
  }
  
  return fallback;
};

export default PrivilegeCheck; 