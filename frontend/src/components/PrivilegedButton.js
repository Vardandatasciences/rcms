import React, { useContext } from 'react';
import { PrivilegeContext } from './PrivilegeContext';
import './PrivilegedButton.css';

const PrivilegedButton = ({ 
  requiredPrivilege, 
  entityId = null, 
  onClick, 
  className = '', 
  disabled = false, 
  children,
  ...props 
}) => {
  const { hasPrivilege, loading } = useContext(PrivilegeContext);
  
  // Check if user has the required privilege
  const hasAccess = !loading && hasPrivilege(requiredPrivilege, entityId);
  
  // Get current user role
  const userData = sessionStorage.getItem('user');
  const userRole = userData ? JSON.parse(userData).role : null;
  
  // If viewing privilege and user is admin, always allow access
  const isViewPrivilege = requiredPrivilege && requiredPrivilege.toLowerCase().includes('view');
  const isAdmin = userRole === 'Global Admin' || userRole === 'Entity Admin';
  const allowView = isViewPrivilege && isAdmin;
  
  const buttonDisabled = loading || disabled || (!hasAccess && !allowView);
  
  return (
    <div className="privileged-button-container">
      <button
        className={`privileged-button ${className} ${buttonDisabled ? 'disabled' : ''}`}
        onClick={buttonDisabled ? null : onClick}
        disabled={buttonDisabled}
        {...props}
      >
        {children}
      </button>
      {!hasAccess && !allowView && !loading && (
        <div className="access-denied-tooltip">
          Access Denied: You don't have the required privilege
        </div>
      )}
    </div>
  );
};

export default PrivilegedButton; 