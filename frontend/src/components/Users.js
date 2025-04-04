import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Navbar from "./Navbar";
import "./Users.css"; // Import CSS for styling
// Add FontAwesome for icons
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faUserPlus, faEdit, faTrash, faEnvelope, faIdCard,
  faBuilding, faUserTag, faUserEdit, faSave, faTimes,
  faSpinner, faShieldAlt, faCheck, faLock, faCog, faList,
  faFileAlt, faClipboardList, faTasks, faCalendarAlt,
  faChartLine, faUserCog, faTrashAlt, faExchangeAlt, faPlus,
  faFileUpload, faListAlt, faClipboardCheck, faTools, faRandom,
  faGlobe, faUniversalAccess, faInfo, faKey
} from '@fortawesome/free-solid-svg-icons';
import PrivilegedButton from "./PrivilegedButton"; // Import the PrivilegedButton component
 
const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [entities, setEntities] = useState([]);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentUserData, setCurrentUserData] = useState(null);
  // Added state for available privileges
  const [availablePrivileges, setAvailablePrivileges] = useState([
    // User privileges
    { id: "user_add", name: "Add Users", icon: faUserPlus },
    { id: "user_update", name: "Update/Modify Users", icon: faUserCog },
    { id: "user_delete", name: "Delete Users", icon: faTrashAlt },
    
    // Category privileges
    { id: "category_add", name: "Add Categories", icon: faPlus },
    { id: "category_delete", name: "Delete Categories", icon: faTrashAlt },
    
    // Regulation privileges
    { id: "regulation_add", name: "Add Regulations", icon: faFileUpload },
    { id: "regulation_manage", name: "Manage Regulations", icon: faFileAlt },
    { id: "regulation_update", name: "Update/Modify Regulations", icon: faEdit },
    { id: "regulation_delete", name: "Delete Regulations", icon: faTrashAlt },
    
    // Activity privileges
    { id: "activity_add", name: "Add Activities", icon: faPlus },
    { id: "activity_update", name: "Update/Modify Activities", icon: faEdit },
    { id: "activity_delete", name: "Delete Activities", icon: faTrashAlt },
    { id: "activity_assign", name: "Assign Activities", icon: faClipboardCheck },
    
    // Task privileges
    { id: "task_reassign", name: "Reassign Tasks", icon: faExchangeAlt },
    
    // Holiday privileges
    { id: "holiday_add", name: "Add Holidays", icon: faCalendarAlt },
    { id: "holiday_delete", name: "Delete Holidays", icon: faTrashAlt },
    
    // Analysis privilege
    { id: "analysis_access", name: "Access Analysis", icon: faChartLine },
  ]);
  const [userRole, setUserRole] = useState(null); // Added for role-based filtering
  const [userEntityId, setUserEntityId] = useState(null); // Added for entity-based filtering
  const [newUser, setNewUser] = useState({
    user_id: "",
    entity_id: "",
    user_name: "",
    address: "",
    mobile_no: "",
    email_id: "",
    password: "",
    role: "",
    privileges: []
  });
  const navigate = useNavigate();
 
  useEffect(() => {
    // Check if user is logged in
    const userData = sessionStorage.getItem("user");
    if (!userData) {
      navigate("/login");
      return;
    }
 
    try {
      // Parse user data
      const parsedUserData = JSON.parse(userData);
     
      // Get user role and entity ID
      const role = parsedUserData.role || "";
      setUserRole(role);
     
      // Get entity_id - check all possible locations in the user data structure
      let entityId = null;
     
      if (parsedUserData.entity_id) {
        entityId = parsedUserData.entity_id;
      } else if (parsedUserData.entityId) {
        entityId = parsedUserData.entityId;
      } else if (parsedUserData.entityid) {
        entityId = parsedUserData.entityid;
      } else if (parsedUserData.entId) {
        entityId = parsedUserData.entId;
      } else if (parsedUserData.entityID) {
        entityId = parsedUserData.entityID;
      }
     
      setUserEntityId(entityId);
     
      // Fetch data based on user role and entity ID
      Promise.all([fetchUsers(role, entityId), fetchEntities()]).catch(err => {
        console.error("Error in initial data loading:", err);
        setLoading(false);
      });
    } catch (err) {
      console.error("Error parsing user data:", err);
      setError("Invalid user session. Please log in again.");
      setLoading(false);
    }
  }, [navigate]);
 
  const fetchUsers = async (role, entityId) => {
    try {
      setLoading(true);
      let response;
 
      console.log("Fetching users for role: " + role + " and entityId: " + entityId);
     
      // For Admin users, fetch only users for their entity
      if (role === "Global") {
        console.log("Fetching all users for Global user");
        response = await axios.get("http://localhost:5000/users");
      } else {
        // For Global users, fetch all users
       
        console.log(`Fetching users for entity: ${entityId}`);
        response = await axios.get(`http://localhost:5000/entity_users_admin/${entityId}`);
      }
     
      setUsers(response.data.users || []);
      return response.data.users;
    } catch (err) {
      console.error("Error fetching users:", err);
      setError("Failed to fetch users. Please try again later.");
      throw err;
    } finally {
      setLoading(false);
    }
  };
 
  const fetchEntities = async () => {
    try {
      const response = await axios.get("http://localhost:5000/entities");
      setEntities(response.data.entities || []);
      setLoading(false);
      return response.data.entities;
    } catch (err) {
      console.error("Error fetching entities:", err);
      setLoading(false);
      throw err;
    }
  };
 
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (showEditForm) {
      setCurrentUser({ ...currentUser, [name]: value });
      
      // Reset privileges when changing from Admin to User role
      if (name === "role" && value !== "Admin") {
        setCurrentUser(prev => ({...prev, privileges: []}));
      }
    } else {
      setNewUser({ ...newUser, [name]: value });
      
      // Reset privileges when changing from Admin to User role
      if (name === "role" && value !== "Admin") {
        setNewUser(prev => ({...prev, privileges: []}));
      }
    }
  };

  // Add handler for privilege checkboxes
  const handlePrivilegeChange = (privilegeId) => {
    if (showEditForm) {
      // For edit form
      const updatedPrivileges = currentUser.privileges?.includes(privilegeId)
        ? currentUser.privileges.filter(id => id !== privilegeId)
        : [...(currentUser.privileges || []), privilegeId];
      
      setCurrentUser({
        ...currentUser,
        privileges: updatedPrivileges
      });
    } else {
      // For add form
      const updatedPrivileges = newUser.privileges?.includes(privilegeId)
        ? newUser.privileges.filter(id => id !== privilegeId)
        : [...(newUser.privileges || []), privilegeId];
      
      setNewUser({
        ...newUser,
        privileges: updatedPrivileges
      });
    }
  };

  const selectAllPrivileges = () => {
    const allPrivilegeIds = availablePrivileges.map(p => p.id);
    
    if (showEditForm) {
      setCurrentUser({
        ...currentUser,
        privileges: allPrivilegeIds
      });
    } else {
      setNewUser({
        ...newUser,
        privileges: allPrivilegeIds
      });
    }
  };

  const clearAllPrivileges = () => {
    if (showEditForm) {
      setCurrentUser({
        ...currentUser,
        privileges: []
      });
    } else {
      setNewUser({
        ...newUser,
        privileges: []
      });
    }
  };
 
  // Generate a unique user ID to avoid conflicts
  const generateUniqueId = () => {
    // Create a prefix based on the user's name (if available)
    const namePrefix = newUser.user_name 
      ? newUser.user_name.split(' ')[0].toLowerCase().substring(0, 3) 
      : 'usr';
    
    // Add current timestamp to ensure uniqueness
    const timestamp = new Date().getTime().toString().substring(9);
    
    // Combine for a reasonably unique ID
    const uniqueId = `${namePrefix}${timestamp}`;
    
    setNewUser({...newUser, user_id: uniqueId});
  };

  // Generate a random password
  const generateRandomPassword = () => {
    const length = 10;
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+";
    let password = "";
    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    setNewUser({...newUser, password: password});
  };

  // Function to strip quotes from JSON error messages
  const cleanErrorMessage = (message) => {
    if (!message) return '';
    return message.replace(/['"]+/g, '');
  };
 
  // Check if current user is a global admin
  const isGlobalAdmin = () => {
    return currentUserData && currentUserData.role === 'Global';
  };

  // Check if the user is entity admin
  const isEntityAdmin = () => {
    return currentUserData && currentUserData.role === 'Admin';
  };

  // Get the current user's entity
  const getCurrentUserEntity = () => {
    return currentUserData ? currentUserData.entity_id : null;
  };

  // Logic to determine if entity field should be disabled
  const shouldDisableEntityField = () => {
    // Disable for entity admins, enable for global admins
    return isEntityAdmin();
  };

  // Pre-set entity ID for entity admins
  useEffect(() => {
    if (isEntityAdmin() && getCurrentUserEntity() && showAddForm) {
      setNewUser(prev => ({
        ...prev,
        entity_id: getCurrentUserEntity()
      }));
    }
  }, [showAddForm, currentUserData]);
 
  const handleAddUser = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");
    setIsSubmitting(true);
 
    try {
      // For entity admins, enforce their entity_id
      if (isEntityAdmin()) {
        if (newUser.entity_id !== getCurrentUserEntity()) {
          setErrorMessage("Entity admins can only add users to their own entity");
          setIsSubmitting(false);
          return;
        }
      }

      // Validate mobile number (should be 10 digits)
      if (!/^\d{10}$/.test(newUser.mobile_no)) {
        setErrorMessage("Mobile number must be 10 digits");
        setIsSubmitting(false);
        return;
      }

      // Ensure user_id is not empty or 'new' (which causes conflicts)
      if (!newUser.user_id || newUser.user_id === 'new') {
        setErrorMessage("Please provide a unique User ID or generate one using the button");
        setIsSubmitting(false);
        return;
      }
      
      // Extract privileges from the user data
      const { privileges, ...userData } = newUser;
      
      console.log('Adding user with data:', userData);
      
      // Step 1: Add user without privileges
      const response = await axios.post("http://localhost:5000/add_user", userData);
      console.log('User added response:', response.data);
      
      // Step 2: If user is Admin and has privileges, add privileges separately
      if (userData.role === "Admin" && privileges.length > 0) {
        try {
          console.log('Adding privileges for user:', userData.user_id, privileges);
          const privResponse = await axios.post("http://localhost:5000/add_user_privileges", {
            user_id: userData.user_id,
            entity_id: userData.entity_id,
            privileges: privileges
          });
          console.log('Privileges added response:', privResponse.data);
        } catch (privilegeError) {
          console.error("Error adding privileges:", privilegeError);
          const errorMsg = privilegeError.response?.data?.message || privilegeError.message;
          console.error(`Detailed privilege error: ${errorMsg}`);
          
          // We don't want to fail the entire operation if just privileges fail
          setSuccessMessage("User added successfully, but there was an issue setting privileges.");
        }
      }
      
      setSuccessMessage(response.data.message || "User added successfully");
     
      // Reset form and refresh users list
      setNewUser({
        user_id: "",
        entity_id: "",
        user_name: "",
        address: "",
        mobile_no: "",
        email_id: "",
        password: "",
        role: "",
        privileges: []
      });
     
      // Close the form after a short delay
      setTimeout(() => {
        setShowAddForm(false);
        setSuccessMessage("");
        fetchUsers();
      }, 2000);
    } catch (error) {
      console.error("Full error object:", error);
      let errorMessage = "Error adding user. Please try again.";
      
      if (error.response) {
        console.error("Error response data:", error.response.data);
        if (error.response.status === 409) {
          errorMessage = "User ID already exists. Please enter a unique User ID or use the generate button.";
        } else if (error.response.data && error.response.data.message) {
          errorMessage = cleanErrorMessage(error.response.data.message);
        }
      }
      
      setErrorMessage(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };
 
  const handleEditUser = (user) => {
    // Load user privileges if they exist
    const fetchUserPrivileges = async () => {
      try {
        console.log(`Fetching privileges for user: ${user.user_id}`);
        // You may need to adjust this endpoint based on your API
        const response = await axios.get(`http://localhost:5000/user_privileges/${user.user_id}`);
        
        if (response.data && response.data.success) {
          const userWithPrivileges = {
            ...user,
            privileges: response.data.privileges || []
          };
          console.log('User privileges loaded:', response.data.privileges);
          setCurrentUser(userWithPrivileges);
        } else {
          console.warn('No privileges found or invalid response structure:', response.data);
          setCurrentUser({...user, privileges: []});
        }
      } catch (error) {
        console.error("Error fetching user privileges:", error);
        // Try to extract the error message from the response if available
        const errorMsg = error.response?.data?.message || error.message || 'Unknown error';
        console.error(`Detailed error: ${errorMsg}`);
        
        // If there's an error, still set the user but with empty privileges
        setCurrentUser({...user, privileges: []});
      }
    };
    
    // Set loading state while fetching privileges
    setLoading(true);
    
    fetchUserPrivileges()
      .finally(() => {
        setLoading(false);
    setShowEditForm(true);
    setShowAddForm(false);
      });
  };
 
  const handleUpdateUser = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");
    setIsSubmitting(true);
 
    try {
      // Entity admins can only modify users from their entity
      if (isEntityAdmin()) {
        if (currentUser.entity_id !== getCurrentUserEntity()) {
          setErrorMessage("Entity admins can only modify users from their own entity");
          setIsSubmitting(false);
          return;
        }
      }
      
      // Extract privileges from the user data to avoid sending it directly to the Users table
      const { privileges, ...userData } = currentUser;
      
      // Step 1: Update user without privileges
      const response = await axios.put(`http://localhost:5000/update_user/${userData.user_id}`, userData);
      
      // Step 2: If user is Admin, update privileges separately
      if (userData.role === "Admin") {
        try {
          await axios.post(`http://localhost:5000/update_user_privileges`, {
            user_id: userData.user_id,
            entity_id: userData.entity_id,
            privileges: privileges || []
          });
        } catch (privilegeError) {
          console.error("Error updating privileges:", privilegeError);
          // We don't want to fail the entire operation if just privileges fail
          setSuccessMessage("User updated successfully, but there was an issue updating privileges.");
        }
      }
      
      setSuccessMessage(response.data.message);
     
      // Close the form after a short delay
      setTimeout(() => {
        setShowEditForm(false);
        setCurrentUser(null);
        setSuccessMessage("");
        // Refresh users with the current role and entity ID
        fetchUsers(userRole, userEntityId);
      }, 2000);
    } catch (error) {
      setErrorMessage("Error updating user. Please try again.");
      console.error("Error updating user:", error);
    } finally {
      setIsSubmitting(false);
    }
  };
 
  const handleDeleteUser = async (userId) => {
    if (window.confirm("Are you sure you want to delete this user?")) {
      try {
        await axios.delete(`http://localhost:5000/delete_user/${userId}`);
        // Refresh the users list
        fetchUsers(userRole, userEntityId);
      } catch (err) {
        console.error("Error deleting user:", err);
        setError("Failed to delete user. Please try again later.");
      }
    }
  };
 
  const toggleAddForm = () => {
    setShowAddForm(!showAddForm);
    setShowEditForm(false);
    setErrorMessage("");
    setSuccessMessage("");
    // Reset the form when toggling
    setNewUser({
      user_id: "",
      entity_id: "",
      user_name: "",
      address: "",
      mobile_no: "",
      email_id: "",
      password: "",
      role: "",
      privileges: []
    });
   
    // If user is Admin, pre-select their entity in the add form
    if (userRole === "Admin" && userEntityId && !showAddForm) {
      setNewUser(prev => ({
        ...prev,
        entity_id: userEntityId
      }));
    }
  };
 
  const cancelEdit = () => {
    setShowEditForm(false);
    setCurrentUser(null);
    setErrorMessage("");
    setSuccessMessage("");
  };

  // Helper function to group privileges by category
  const groupPrivilegesByCategory = () => {
    const groups = {};
    availablePrivileges.forEach(privilege => {
      const category = privilege.id.split('_')[0];
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(privilege);
    });
    return groups;
  };
 
  return (
    <div className="users-container">
      <Navbar />
      <div className="users-content">
        {/* <h1>Users Management</h1>
        <p>
          {userRole === "Admin"
            ? "View and manage users for your entity"
            : "View and manage all system users"}
        </p> */}
        <div className="users-actions">
          <PrivilegedButton 
            requiredPrivilege="user_add" 
            className="btn-add-user" 
            onClick={toggleAddForm}
          >
            {showAddForm ? (
              <><FontAwesomeIcon icon={faTimes} /> Cancel</>
            ) : (
              <><FontAwesomeIcon icon={faUserPlus} /> Add New User</>
            )}
          </PrivilegedButton>
        </div>
 
        {successMessage && (
          <div className="success-message">{successMessage}</div>
        )}
 
        {errorMessage && (
          <div className="error-message">{errorMessage}</div>
        )}
 
        {showAddForm && (
          <div className="user-form-container">
            <h2><FontAwesomeIcon icon={faUserPlus} /> Add New User</h2>
            <form onSubmit={handleAddUser}>
              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="user_id">User ID*</label>
                  <div className="input-with-button">
                    <input
                      type="text"
                      id="user_id"
                      name="user_id"
                      value={newUser.user_id}
                      onChange={handleInputChange}
                      required
                      placeholder="Enter a unique ID or generate one"
                    />
                    <button 
                      type="button" 
                      onClick={generateUniqueId}
                      title="Generate a unique ID"
                      className="btn-generate"
                    >
                      <FontAwesomeIcon icon={faRandom} />
                    </button>
                  </div>
                </div>
 
                <div className="form-group">
                  <label htmlFor="entity_id">Entity*</label>
                  <select
                    id="entity_id"
                    name="entity_id"
                    value={newUser.entity_id}
                    onChange={handleInputChange}
                    required
                    disabled={isEntityAdmin()}
                    className={isEntityAdmin() ? "disabled-select" : ""}
                    disabled={userRole === "Admin"} // Disable for Admin users
                  >
                    <option value="">Select Entity</option>
                    {entities.map((entity) => (
                      <option key={entity.entity_id} value={entity.entity_id}>
                        {entity.entity_name} ({entity.entity_id})
                      </option>
                    ))}
                  </select>
                  {userRole === "Admin" && (
                    <small className="form-text text-muted">
                      Entity is auto-selected for Admin users.
                    </small>
                  )}
                </div>
 
                <div className="form-group">
                  <label htmlFor="user_name">User Name*</label>
                  <input
                    type="text"
                    id="user_name"
                    name="user_name"
                    value={newUser.user_name}
                    onChange={handleInputChange}
                    required
                  />
                </div>
 
                <div className="form-group">
                  <label htmlFor="address">Address</label>
                  <input
                    type="text"
                    id="address"
                    name="address"
                    value={newUser.address}
                    onChange={handleInputChange}
                  />
                </div>
 
                <div className="form-group">
                  <label htmlFor="mobile_no">Mobile No*</label>
                  <input
                    type="text"
                    id="mobile_no"
                    name="mobile_no"
                    value={newUser.mobile_no}
                    onChange={handleInputChange}
                    required
                  />
                </div>
 
                <div className="form-group">
                  <label htmlFor="email_id">Email ID*</label>
                  <input
                    type="email"
                    id="email_id"
                    name="email_id"
                    value={newUser.email_id}
                    onChange={handleInputChange}
                    required
                  />
                </div>
 
                <div className="form-group">
                  <label htmlFor="password">Password*</label>
                  <div className="input-with-button">
                    <input
                      type="password"
                      id="password"
                      name="password"
                      value={newUser.password}
                      onChange={handleInputChange}
                      required
                    />
                    <button 
                      type="button" 
                      onClick={generateRandomPassword}
                      title="Generate a random password"
                      className="btn-generate"
                    >
                      <FontAwesomeIcon icon={faKey} />
                    </button>
                  </div>
                </div>
 
                <div className="form-group">
                  <label htmlFor="role">Role*</label>
                  <select
                    id="role"
                    name="role"
                    value={newUser.role}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Select Role</option>
                    {isGlobalAdmin() && <option value="Global">Global Admin</option>}
                    <option value="Admin">Entity Admin</option>
                    <option value="User">User</option>
                  </select>
                </div>
              </div>

              {/* Privileges section - only show for Admin or Global roles */}
              {(newUser.role === "Admin" || newUser.role === "Global") && (
                <div className="privileges-section">
                  <div className="privileges-header">
                    <h3>
                      <FontAwesomeIcon icon={faShieldAlt} /> 
                      Assign Privileges
                    </h3>
                    <div className="privileges-actions">
                      <button 
                        type="button" 
                        className="btn-select-all" 
                        onClick={selectAllPrivileges}
                      >
                        Select All
                      </button>
                      <button 
                        type="button" 
                        className="btn-clear-all" 
                        onClick={clearAllPrivileges}
                      >
                        Clear All
                      </button>
                    </div>
                  </div>
                  
                  <div className="privileges-list">
                    {Object.entries(groupPrivilegesByCategory()).map(([category, privileges]) => (
                      <div key={category} className="privilege-category">
                        <h4 className="category-name">{category.charAt(0).toUpperCase() + category.slice(1)}</h4>
                        <div className="category-privileges">
                          {privileges.map(privilege => (
                            <div key={privilege.id} className="privilege-item">
                              <label className="privilege-label">
                                <input
                                  type="checkbox"
                                  name="privileges"
                                  value={privilege.id}
                                  checked={newUser.privileges.includes(privilege.id)}
                                  onChange={() => handlePrivilegeChange(privilege.id)}
                                />
                                <span className="privilege-checkbox"></span>
                                <FontAwesomeIcon icon={privilege.icon} className="privilege-icon" />
                                <span className="privilege-text">{privilege.name}</span>
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
 
              <div className="form-actions">
                <PrivilegedButton 
                  type="submit" 
                  className="btn-submit" 
                  disabled={isSubmitting}
                  requiredPrivilege="user_add"
                >
                  {isSubmitting ? (
                    <><FontAwesomeIcon icon={faSpinner} className="spinner" /> Saving...</>
                  ) : (
                    <><FontAwesomeIcon icon={faSave} /> Save User</>
                  )}
                </PrivilegedButton>
                <button type="button" className="btn-cancel" onClick={toggleAddForm}>
                  <FontAwesomeIcon icon={faTimes} /> Cancel
                </button>
              </div>
            </form>
          </div>
        )}
 
        {showEditForm && currentUser && (
          <div className="user-form-container">
            <h2><FontAwesomeIcon icon={faUserEdit} /> Edit User</h2>
            <form onSubmit={handleUpdateUser}>
              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="edit_user_id">User ID</label>
                  <input
                    type="text"
                    id="edit_user_id"
                    name="user_id"
                    value={currentUser.user_id}
                    readOnly
                  />
                </div>
 
                <div className="form-group">
                  <label htmlFor="edit_entity_id">Entity*</label>
                  <select
                    id="edit_entity_id"
                    name="entity_id"
                    value={currentUser.entity_id}
                    onChange={handleInputChange}
                    required
                    disabled={isEntityAdmin()}
                    className={isEntityAdmin() ? "disabled-select" : ""}
                    disabled={userRole === "Admin"} // Disable for Admin users
                  >
                    {entities.map((entity) => (
                      <option key={entity.entity_id} value={entity.entity_id}>
                        {entity.entity_name} ({entity.entity_id})
                      </option>
                    ))}
                  </select>
                  {userRole === "Admin" && (
                    <small className="form-text text-muted">
                      Entity cannot be changed by Admin users.
                    </small>
                  )}
                </div>
 
                <div className="form-group">
                  <label htmlFor="edit_user_name">User Name*</label>
                  <input
                    type="text"
                    id="edit_user_name"
                    name="user_name"
                    value={currentUser.user_name}
                    onChange={handleInputChange}
                    required
                  />
                </div>
 
                <div className="form-group">
                  <label htmlFor="edit_address">Address</label>
                  <input
                    type="text"
                    id="edit_address"
                    name="address"
                    value={currentUser.address || ""}
                    onChange={handleInputChange}
                  />
                </div>
 
                <div className="form-group">
                  <label htmlFor="edit_mobile_no">Mobile No*</label>
                  <input
                    type="text"
                    id="edit_mobile_no"
                    name="mobile_no"
                    value={currentUser.mobile_no}
                    onChange={handleInputChange}
                    required
                  />
                </div>
 
                <div className="form-group">
                  <label htmlFor="edit_email_id">Email ID*</label>
                  <input
                    type="email"
                    id="edit_email_id"
                    name="email_id"
                    value={currentUser.email_id}
                    onChange={handleInputChange}
                    required
                  />
                </div>
 
                <div className="form-group">
                  <label htmlFor="edit_role">Role*</label>
                  <select
                    id="edit_role"
                    name="role"
                    value={currentUser.role}
                    onChange={handleInputChange}
                    required
                  >
                    {isGlobalAdmin() && <option value="Global">Global Admin</option>}
                    <option value="Admin">Entity Admin</option>
                    <option value="User">User</option>
               
                  </select>
                </div>
              </div>

              {/* Privileges section for Edit form - only show for Admin or Global roles */}
              {(currentUser.role === "Admin" || currentUser.role === "Global") && (
                <div className="privileges-section">
                  <div className="privileges-header">
                    <h3>
                      <FontAwesomeIcon icon={faShieldAlt} /> 
                      Assign Privileges
                    </h3>
                    <div className="privileges-actions">
                      <button 
                        type="button" 
                        className="btn-select-all" 
                        onClick={selectAllPrivileges}
                      >
                        Select All
                      </button>
                      <button 
                        type="button" 
                        className="btn-clear-all" 
                        onClick={clearAllPrivileges}
                      >
                        Clear All
                      </button>
                    </div>
                  </div>
                  
                  <div className="privileges-list">
                    {Object.entries(groupPrivilegesByCategory()).map(([category, privileges]) => (
                      <div key={category} className="privilege-category">
                        <h4 className="category-name">{category.charAt(0).toUpperCase() + category.slice(1)}</h4>
                        <div className="category-privileges">
                          {privileges.map(privilege => (
                            <div key={privilege.id} className="privilege-item">
                              <label className="privilege-label">
                                <input
                                  type="checkbox"
                                  name="privileges"
                                  value={privilege.id}
                                  checked={currentUser.privileges?.includes(privilege.id)}
                                  onChange={() => handlePrivilegeChange(privilege.id)}
                                />
                                <span className="privilege-checkbox"></span>
                                <FontAwesomeIcon icon={privilege.icon} className="privilege-icon" />
                                <span className="privilege-text">{privilege.name}</span>
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
 
              <div className="form-actions">
                <PrivilegedButton 
                  type="submit" 
                  className="btn-submit"
                  disabled={isSubmitting}
                  requiredPrivilege="user_update"
                  entityId={currentUser?.entity_id}
                >
                  {isSubmitting ? (
                    <><FontAwesomeIcon icon={faSpinner} className="spinner" /> Updating...</>
                  ) : (
                    <><FontAwesomeIcon icon={faSave} /> Update User</>
                  )}
                </PrivilegedButton>
                <button type="button" className="btn-cancel" onClick={cancelEdit}>
                  <FontAwesomeIcon icon={faTimes} /> Cancel
                </button>
              </div>
            </form>
          </div>
        )}
 
        {!showAddForm && !showEditForm && (
          <>
            {loading ? (
              <div className="loading">
                <FontAwesomeIcon icon={faSpinner} className="spinner" />
                <p>Loading users...</p>
              </div>
            ) : error ? (
              <div className="error-message">{error}</div>
            ) : users.length === 0 ? (
              <div className="no-users">
                <p>
                  {userRole === "Admin"
                    ? "No users found for your entity. Add a new user to get started."
                    : "No users found. Add a new user to get started."}
                </p>
              </div>
            ) : (
              <div className="user-cards-container">
                {users.map((user, index) => (
                  <div
                    className="user-card"
                    key={user.user_id}
                    style={{"--index": index}}
                  >
                    <div className="user-card-header">
                      <div className="user-avatar">
                        {user.user_name.charAt(0).toUpperCase()}
                      </div>
                      <div className="user-name-role">
                        <h3>{user.user_name}</h3>
                        <span className={`user-role ${user.role.toLowerCase()}`}>
                          <FontAwesomeIcon icon={faUserTag} /> {user.role}
                        </span>
                      </div>
                    </div>
                   
                    <div className="user-card-body">
                      <div className="user-info">
                        <p>
                          <FontAwesomeIcon icon={faIdCard} />
                          <span className="info-label">ID:</span> {user.user_id}
                        </p>
                        <p>
                          <FontAwesomeIcon icon={faBuilding} />
                          <span className="info-label">Entity:</span> {user.entity_name}
                        </p>
                        <p>
                          <FontAwesomeIcon icon={faEnvelope} />
                          <span className="info-label">Email:</span> {user.email_id}
                        </p>
                      </div>
                    </div>
                   
                    <div className="user-card-actions">
                      <PrivilegedButton
                        className="btn-edit"
                        onClick={() => handleEditUser(user)}
                        title="Edit user"
                        requiredPrivilege="user_update"
                        entityId={user.entity_id}
                      >
                        <FontAwesomeIcon icon={faEdit} />
                      </PrivilegedButton>
                      <PrivilegedButton
                        className="btn-delete"
                        onClick={() => handleDeleteUser(user.user_id)}
                        title="Delete user"
                        requiredPrivilege="user_delete"
                        entityId={user.entity_id}
                      >
                        <FontAwesomeIcon icon={faTrash} />
                      </PrivilegedButton>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
 
export default Users;
