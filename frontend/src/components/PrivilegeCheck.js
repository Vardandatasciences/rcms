import React from 'react';
import { usePrivileges } from './PrivilegeContext';

// Component to conditionally render elements based on privileges
const PrivilegeCheck = ({ privilege, fallback = null, children }) => {
  const { hasPrivilege, loading } = usePrivileges();
  
  if (loading) {
    return null; // Don't show anything while loading
  }
  
  // If the user has the required privilege, render the children
  if (hasPrivilege(privilege)) {
    return <>{children}</>;
  }
  
  // Otherwise, render the fallback or null
  return fallback;
};

export default PrivilegeCheck; 