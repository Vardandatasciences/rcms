import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from "react";
import { Navigate } from 'react-router-dom';
import axios from "axios";
import './Privileges.css';

// Create a context for privileges
const PrivilegeContext = createContext();

// Define API base URL as a constant
const API_BASE_URL = "http://localhost:5000";

// Define list of all privileges as a constant - prevents recreation on each render
const ALL_PRIVILEGES = [
  "user_add", "user_update", "user_delete",
  "category_add", "category_delete",
  "regulation_add", "regulation_update", "regulation_delete", "regulation_manage",
  "activity_add", "activity_update", "activity_delete", "activity_assign",
  "task_reassign",
  "holiday_add", "holiday_update", "holiday_delete", "holiday_access",
  "entity_add", "entity_update", "entity_delete",
  "analysis_access"
];

/**
 * Provider component for user privileges
 * Fetches and manages user privilege data
 */
export const PrivilegeProvider = ({ children }) => {
  const [privileges, setPrivileges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userExistsInPrivilegesTable, setUserExistsInPrivilegesTable] = useState(true);
  const [userRole, setUserRole] = useState(null);
  
  const loadPrivileges = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Get user data from session storage
      const userData = sessionStorage.getItem("user");
      if (!userData) {
        setPrivileges([]);
        setUserRole(null);
        setLoading(false);
        return;
      }

      const parsedUserData = JSON.parse(userData);
      const userId = parsedUserData.user_id;
      const role = parsedUserData.role;
      
      // Store user role in state and session storage for easy access
      setUserRole(role);
      sessionStorage.setItem("userRole", role);
      
      // Global users have all privileges automatically
      if (role === "Global") {
        setPrivileges(ALL_PRIVILEGES);
        setUserExistsInPrivilegesTable(true); // Not relevant for Global users
        sessionStorage.setItem("privileges", JSON.stringify(ALL_PRIVILEGES));
        setLoading(false);
        return;
      }

      // Get entity_id from user data
      const entityId = parsedUserData.entity_id || parsedUserData.entityId || 
                       parsedUserData.entityid || parsedUserData.entId || 
                       parsedUserData.entityID;
      
      try {
        // Use the correct API endpoint with user_id
        const response = await axios.get(
          `${API_BASE_URL}/user_privileges/${userId}${entityId ? `?entity_id=${entityId}` : ''}`
        );
        
        if (response.data && response.data.success) {
          const userPrivileges = response.data.privileges || [];
          
          // If user is not found in privileges table (message says 'No privileges found'),
          // they should have access to all functionalities as per requirements
          if (response.data.message === 'No privileges found') {
            setUserExistsInPrivilegesTable(false);
            setPrivileges(ALL_PRIVILEGES);
            sessionStorage.setItem("privileges", JSON.stringify(ALL_PRIVILEGES));
          } else {
            // User exists in privileges table, apply their specific privileges
            setUserExistsInPrivilegesTable(true);
            setPrivileges(userPrivileges);
            sessionStorage.setItem("privileges", JSON.stringify(userPrivileges));
          }
        } else {
          // If API call fails, give access to all privileges (safer default)
          setUserExistsInPrivilegesTable(false);
          setPrivileges(ALL_PRIVILEGES);
          sessionStorage.setItem("privileges", JSON.stringify(ALL_PRIVILEGES));
        }
      } catch (error) {
        // If API call fails, default to all privileges
        setUserExistsInPrivilegesTable(false);
        setPrivileges(ALL_PRIVILEGES);
        sessionStorage.setItem("privileges", JSON.stringify(ALL_PRIVILEGES));
      }
    } catch (error) {
      setError(error.message);
      setPrivileges([]);
      setUserExistsInPrivilegesTable(true); // Default to requiring privileges
    } finally {
      setLoading(false);
    }
  }, []);

  // Fast-track privilege checking function
  const hasPrivilege = useCallback((privilege) => {
    // If no privilege is required, always return true
    if (!privilege) return true;
    
    // Get user role from state or session storage as backup
    const role = userRole || sessionStorage.getItem("userRole");
    
    // Global users have all privileges - fast path
    if (role === "Global") {
      return true;
    }
    
    // If user does not exist in privileges table, they have access to all functionalities
    if (!userExistsInPrivilegesTable) {
      return true;
    }
    
    // User exists in privileges table - check if they have the specific privilege
    return privileges.includes(privilege);
  }, [privileges, userExistsInPrivilegesTable, userRole]);

  // Load privileges on mount
  useEffect(() => {
    loadPrivileges();
  }, [loadPrivileges]);

  // Listen for storage events to sync privileges across tabs
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === "privileges" || e.key === "user") {
        loadPrivileges();
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [loadPrivileges]);

  // Memoize the context value to prevent unnecessary re-renders
  const value = useMemo(() => ({
    privileges,
    loading,
    error,
    userRole,
    hasPrivilege,
    userExistsInPrivilegesTable,
    refreshPrivileges: loadPrivileges,
  }), [privileges, loading, error, userRole, hasPrivilege, userExistsInPrivilegesTable, loadPrivileges]);

  return (
    <PrivilegeContext.Provider value={value}>
      {children}
    </PrivilegeContext.Provider>
  );
};

// Custom hook to use privileges
export const usePrivileges = () => {
  const context = useContext(PrivilegeContext);
  if (!context) {
    throw new Error("usePrivileges must be used within a PrivilegeProvider");
  }
  return context;
};

/**
 * Component to conditionally render elements based on privileges
 * @param {string} privilege - Required privilege
 * @param {React.ReactNode} fallback - Content to show if privilege check fails
 * @param {React.ReactNode} children - Content to show if privilege check passes
 */
export const PrivilegeCheck = ({ privilege, fallback = null, children }) => {
  const { hasPrivilege, loading, userRole } = usePrivileges();
  
  if (loading) {
    return null; // Don't show anything while loading
  }
  
  // Global role users always get access
  if (userRole === "Global") {
    return <>{children}</>;
  }
  
  // If no privilege is required or user has the privilege, render children
  if (!privilege || hasPrivilege(privilege)) {
    return <>{children}</>;
  }
  
  // Otherwise, render the fallback or null
  return fallback;
};

/**
 * A button component that is disabled when the user doesn't have the required privilege
 * 
 * @param {Object} props - Component props
 * @param {string} props.requiredPrivilege - The privilege required to enable the button
 * @param {string} props.className - CSS class name for the button
 * @param {function} props.onClick - Click handler function
 * @param {string} props.title - Button tooltip text
 * @param {React.ReactNode} props.children - Button content
 * @param {boolean} props.disabled - Additional disabled condition
 * @param {boolean} props.animation - Whether to apply pulse animation to disabled buttons
 */
export const PrivilegedButton = React.memo(({ 
  children, 
  requiredPrivilege,
  className = "", 
  onClick, 
  title = "", 
  type = "button",
  disabled = false,
  animation = false,
  ...props 
}) => {
  const { hasPrivilege, loading, userRole } = usePrivileges();
  
  // If privileges are still loading, disable the button
  if (loading) {
    return (
      <button
        type={type}
        className={`${className} disabled-button`}
        disabled={true}
        aria-label="Checking permissions..."
        {...props}
      >
        {children}
      </button>
    );
  }
  
  // Global users always have access - fast path
  if (userRole === "Global") {
    return (
      <button
        type={type}
        className={`${className} permitted-button`}
        onClick={onClick}
        disabled={disabled}
        title={title}
        {...props}
      >
        {children}
      </button>
    );
  }
  
  // If no privilege is required, render the button normally
  if (!requiredPrivilege) {
    return (
      <button
        type={type}
        className={`${className} permitted-button`}
        onClick={onClick}
        disabled={disabled}
        title={title}
        {...props}
      >
        {children}
      </button>
    );
  }
  
  // Check if user has the required privilege
  const hasAccess = hasPrivilege(requiredPrivilege);
  
  // Determine final disabled state and class name
  const isDisabled = disabled || !hasAccess;
  const buttonClassName = `${className} ${isDisabled ? 'disabled-button' : 'permitted-button'} ${animation && isDisabled ? 'with-animation' : ''}`;
  
  // Prepare button props
  const buttonProps = { ...props };
  
  if (isDisabled && !hasAccess) {
    buttonProps['aria-label'] = 'Access Denied';
  } else {
    buttonProps.title = title;
  }
  
  return (
    <button
      type={type}
      className={buttonClassName}
      onClick={isDisabled ? undefined : onClick}
      disabled={isDisabled}
      {...buttonProps}
    >
      {children}
    </button>
  );
});

PrivilegedButton.displayName = 'PrivilegedButton';

/**
 * Route component that only allows access if the user has the required privilege
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.element - Element to render if privilege check passes
 * @param {string} props.requiredPrivilege - Required privilege for access
 * @param {string} props.entityId - Optional entity ID to pass to the element
 */
export const PrivilegedRoute = ({ element, requiredPrivilege, entityId }) => {
  const { hasPrivilege, loading, userRole } = usePrivileges();
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
    
    // Global users always have access - fast path
    if (userRole === "Global") {
      setHasAccess(true);
      setIsChecking(false);
      return;
    }
    
    // If there's a required privilege, check if the user has it
    if (requiredPrivilege && !loading) {
      setHasAccess(hasPrivilege(requiredPrivilege));
      setIsChecking(false);
    } else if (!requiredPrivilege) {
      // If no privilege is required, grant access
      setHasAccess(true);
      setIsChecking(false);
    }
  }, [requiredPrivilege, loading, hasPrivilege, userRole]);
  
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

/**
 * ProtectedRoute component for role and privilege-based access control
 * This component is a more advanced version that can check both roles and privileges
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.element - Element to render if checks pass
 * @param {Array<string>} props.allowedRoles - Roles that are allowed to access the route
 * @param {string} props.requiredPrivilege - Required privilege for access
 */
export const ProtectedRoute = ({ element, allowedRoles, requiredPrivilege }) => {
  const { hasPrivilege, loading, userRole } = usePrivileges();
  const [hasAccess, setHasAccess] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const checkAccess = () => {
      setIsLoading(true);
      
      // Get user data from session storage
      const userData = sessionStorage.getItem('user');
      if (!userData) {
        setHasAccess(false);
        setIsLoading(false);
        return;
      }
      
      const user = JSON.parse(userData);
      
      // Check role first
      if (allowedRoles && !allowedRoles.includes(user.role)) {
        setHasAccess(false);
        setIsLoading(false);
        return;
      }
      
      // Global users have all privileges - fast path
      if (user.role === 'Global') {
        setHasAccess(true);
        setIsLoading(false);
        return;
      }
      
      // If no privilege is required, grant access
      if (!requiredPrivilege) {
        setHasAccess(true);
        setIsLoading(false);
        return;
      }
      
      // Wait for privileges to be loaded
      if (!loading) {
        // Check if user has the required privilege
        setHasAccess(hasPrivilege(requiredPrivilege));
        setIsLoading(false);
      }
    };
    
    checkAccess();
  }, [allowedRoles, requiredPrivilege, hasPrivilege, loading, userRole]);
  
  if (isLoading || loading) {
    return <div className="loading-privileges">Checking permissions...</div>;
  }
  
  if (!hasAccess) {
    return <Navigate to="/" />;
  }
  
  return element;
};

// Create named export object first, then use it as default export
const PrivilegesModule = {
  PrivilegeProvider,
  usePrivileges,
  PrivilegeCheck,
  PrivilegedButton,
  PrivilegedRoute,
  ProtectedRoute
}; 

export default PrivilegesModule; 