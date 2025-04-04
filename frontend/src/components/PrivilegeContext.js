import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

// Create the context
const PrivilegeContext = createContext();

// Custom hook to use the privilege context
export const usePrivileges = () => useContext(PrivilegeContext);

// Provider component
export const PrivilegeProvider = ({ children }) => {
  const [privileges, setPrivileges] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPrivileges = async () => {
      try {
        const userData = sessionStorage.getItem('user');
        if (!userData) {
          setPrivileges([]);
          setLoading(false);
          return;
        }

        const user = JSON.parse(userData);
        
        try {
          // Fetch user privileges from the server
          const response = await axios.get(`http://localhost:5000/user_privileges/${user.user_id}`);
          
          if (response.data && response.data.success) {
            const fetchedPrivileges = response.data.privileges || [];
            // Store in session storage
            sessionStorage.setItem('userPrivileges', JSON.stringify(fetchedPrivileges));
            setPrivileges(fetchedPrivileges);
          } else {
            console.warn('Failed to fetch privileges or none found:', response.data);
            setPrivileges([]);
          }
        } catch (error) {
          console.error('Error fetching privileges from API:', error);
          setPrivileges([]);
        }
      } catch (error) {
        console.error('Error in privilege fetch process:', error);
        setPrivileges([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPrivileges();
  }, []);

  const refreshPrivileges = async () => {
    setLoading(true);
    const userData = sessionStorage.getItem('user');
    if (!userData) {
      setPrivileges([]);
      setLoading(false);
      return;
    }

    try {
      const user = JSON.parse(userData);
      const response = await axios.get(`http://localhost:5000/user_privileges/${user.user_id}`);
      
      if (response.data && response.data.success) {
        const fetchedPrivileges = response.data.privileges || [];
        // Update session storage
        sessionStorage.setItem('userPrivileges', JSON.stringify(fetchedPrivileges));
        setPrivileges(fetchedPrivileges);
      } else {
        console.warn('Failed to refresh privileges:', response.data);
        setPrivileges([]);
      }
    } catch (error) {
      console.error('Error refreshing privileges:', error);
      setPrivileges([]);
    } finally {
      setLoading(false);
    }
  };

  // Expose privileges and loading state
  const value = {
    privileges,
    loading,
    refreshPrivileges
  };

  return (
    <PrivilegeContext.Provider value={value}>
      {children}
    </PrivilegeContext.Provider>
  );
};

// Export the context for components that need direct access
export default PrivilegeContext; 