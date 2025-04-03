import React, { createContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';

// Create the context
export const PrivilegeContext = createContext();

export const PrivilegeProvider = ({ children }) => {
  const [privileges, setPrivileges] = useState([]);
  const [entityPrivileges, setEntityPrivileges] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch privileges on mount or when user changes
  const fetchPrivileges = useCallback(async () => {
    const userData = sessionStorage.getItem('user');
    if (!userData) {
      setLoading(false);
      setPrivileges([]);
      setEntityPrivileges({});
      return;
    }

    try {
      setLoading(true);
      const user = JSON.parse(userData);
      const response = await axios.get(`/api/privileges/${user.user_id}`);
      
      if (response.data.status === 'success') {
        setPrivileges(response.data.privileges);
        setEntityPrivileges(response.data.entityPrivileges);
        
        // Store privileges in session storage for quick access
        sessionStorage.setItem('userPrivileges', JSON.stringify(response.data.privileges));
        sessionStorage.setItem('entityPrivileges', JSON.stringify(response.data.entityPrivileges));
      }
      setLoading(false);
    } catch (err) {
      console.error('Error fetching privileges:', err);
      setError(err.message);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPrivileges();
    
    // Add event listener for when user logs in
    window.addEventListener('user-login', fetchPrivileges);
    
    return () => {
      window.removeEventListener('user-login', fetchPrivileges);
    };
  }, [fetchPrivileges]);

  // Check if user has a specific privilege globally or for a specific entity
  const hasPrivilege = (requiredPrivilege, entityId = null) => {
    // If privileges include 'All', user has all privileges
    if (privileges.includes('All')) {
      return true;
    }

    // Check if user has the global privilege
    if (privileges.includes(requiredPrivilege)) {
      return true;
    }

    // If entity ID is provided, check entity-specific privileges
    if (entityId && entityPrivileges[entityId]) {
      if (entityPrivileges[entityId].includes('All') || 
          entityPrivileges[entityId].includes(requiredPrivilege)) {
        return true;
      }
    }

    return false;
  };

  return (
    <PrivilegeContext.Provider value={{ 
      privileges, 
      entityPrivileges, 
      loading, 
      error, 
      hasPrivilege,
      refreshPrivileges: fetchPrivileges 
    }}>
      {children}
    </PrivilegeContext.Provider>
  );
}; 