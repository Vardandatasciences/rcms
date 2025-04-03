import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { PrivilegeContext } from './PrivilegeContext';

const PrivilegedRoute = ({ element, requiredPrivilege, entityId = null }) => {
  const { hasPrivilege, loading } = useContext(PrivilegeContext);
  const userData = sessionStorage.getItem('user');
  
  // If user is not logged in, redirect to login
  if (!userData) {
    return <Navigate to="/login" />;
  }
  
  // If still loading privileges, show loading state
  if (loading) {
    return <div>Loading privileges...</div>;
  }
  
  // Get user role
  const userRole = JSON.parse(userData).role;
  
  // If requiredPrivilege is a view privilege and user is admin, allow it
  const isViewPrivilege = requiredPrivilege && requiredPrivilege.toLowerCase().includes('view');
  const isAdmin = userRole === 'Global Admin' || userRole === 'Entity Admin';
  const allowView = isViewPrivilege && isAdmin;
  
  // Check if the user has the required privilege or is allowed to view
  const hasAccess = hasPrivilege(requiredPrivilege, entityId) || allowView;
  
  if (!hasAccess) {
    return (
      <div className="access-denied-container">
        <h2>Access Denied</h2>
        <p>You do not have the required privilege to access this page.</p>
        <button onClick={() => window.history.back()}>Go Back</button>
      </div>
    );
  }
  
  return element;
};

export default PrivilegedRoute; 