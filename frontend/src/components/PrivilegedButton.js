import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './PrivilegedButton.css';

/**
 * A button component that is enabled or disabled based on user privileges in the database
 * @param {Object} props
 * @param {string} props.requiredPrivilege - The privilege required to enable this button
 * @param {string} props.entityId - The entity ID to check privileges against (optional)
 * @param {function} props.onClick - Button click handler
 * @param {string} props.className - Additional CSS classes
 * @param {React.ReactNode} props.children - Button content
 * @param {Object} props.buttonProps - Additional props to pass to the button element
 */
const PrivilegedButton = ({ 
  requiredPrivilege, 
  entityId, 
  onClick, 
  className = '', 
  children, 
  ...buttonProps 
}) => {
  const [hasAccess, setHasAccess] = useState(false);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const checkPrivilege = async () => {
      setLoading(true);
      try {
        // Get user from session storage
        const userData = sessionStorage.getItem('user');
        if (!userData) {
          setHasAccess(false);
          setLoading(false);
          return;
        }
        
        const user = JSON.parse(userData);
        
        // Always check privileges from the database
        try {
          const response = await axios.get(`http://localhost:5000/check_privilege`, {
            params: {
              userId: user.user_id,
              entityId: entityId || user.entity_id, // Use entity_id from props or fallback to user's entity
              privilege: requiredPrivilege
            }
          });
          
          setHasAccess(response.data.hasAccess);
        } catch (err) {
          console.error('Error checking privilege from API:', err);
          setHasAccess(false);
        }
      } catch (error) {
        console.error('Error checking privilege:', error);
        setHasAccess(false);
      } finally {
        setLoading(false);
      }
    };
    
    checkPrivilege();
  }, [requiredPrivilege, entityId]);
  
  return (
    <button
      onClick={hasAccess ? onClick : (e) => e.preventDefault()}
      className={`${className} privileged-button`}
      disabled={!hasAccess || loading}
      title={!hasAccess ? 'Access denied: Insufficient privileges' : ''}
      {...buttonProps}
    >
      {children}
      {loading && <span className="loading-indicator">•</span>}
    </button>
  );
};

export default PrivilegedButton; 