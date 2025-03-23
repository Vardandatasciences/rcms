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
  faSpinner 
} from '@fortawesome/free-solid-svg-icons';

const Users = () => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [entities, setEntities] = useState([]);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
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
    role: ""
  });
  const [countries, setCountries] = useState([]);
  const [mobileCountryCode, setMobileCountryCode] = useState("+91"); // Default to India
  const navigate = useNavigate();
  
  // Search and filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    entityId: "",
    role: ""
  });

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

  const fetchCountryCodes = async () => {
    try {
      const response = await axios.get("http://localhost:5000/country_codes");
      setCountries(response.data.countries || []);
      
      // If India is in the list, set it as default
      const india = response.data.countries.find(country => country.country === "India");
      if (india) {
        setMobileCountryCode(india.country_code);
      }
      return response.data.countries;
    } catch (err) {
      console.error("Error fetching country codes:", err);
      throw err;
    }
  };

  // Apply search and filters
  useEffect(() => {
    let result = users;
    
    // Apply search term
    if (searchTerm) {
      const lowercasedSearch = searchTerm.toLowerCase();
      result = result.filter(
        user => 
          user.user_id.toLowerCase().includes(lowercasedSearch) ||
          user.user_name.toLowerCase().includes(lowercasedSearch) ||
          user.email_id.toLowerCase().includes(lowercasedSearch) ||
          (user.address && user.address.toLowerCase().includes(lowercasedSearch))
      );
    }

    // Apply filters
    if (filters.entityId) {
      result = result.filter(user => user.entity_id === filters.entityId);
    }
    if (filters.role) {
      result = result.filter(user => user.role === filters.role);
    }

    setFilteredUsers(result);
  }, [users, searchTerm, filters]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (showEditForm) {
      setCurrentUser({ ...currentUser, [name]: value });
    } else {
      setNewUser({ ...newUser, [name]: value });
    }
  };

  const handleCountryChange = (e) => {
    const selectedCountry = e.target.value;
    
    // Update country code if country changes
    const countryData = countries.find(country => country.country === selectedCountry);
    if (countryData) {
      setMobileCountryCode(countryData.country_code);
    }
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    try {
      // Combine country code with mobile number
      const formData = {
        ...newUser,
        mobile_no: `${mobileCountryCode} ${newUser.mobile_no}`
      };
      
      const response = await axios.post("http://localhost:5000/add_user", formData);
      setSuccessMessage(response.data.message);
      
      // Reset form and refresh users list
      setNewUser({
        user_id: "",
        entity_id: "",
        user_name: "",
        address: "",
        mobile_no: "",
        email_id: "",
        password: "",
        role: ""
      });
      
      // Close the form after a short delay
      setTimeout(() => {
        setShowAddForm(false);
        setSuccessMessage("");
        // Refresh users with the current role and entity ID
        fetchUsers(userRole, userEntityId);
      }, 2000);
    } catch (error) {
      if (error.response && error.response.status === 409) {
        setErrorMessage("User ID already exists. Please enter a unique User ID.");
      } else {
        setErrorMessage("Error adding user. Please try again.");
        console.error("Error adding user:", error);
      }
    }
  };

  const handleEditUser = (user) => {
    // Extract country code from mobile number if it exists
    if (user.mobile_no && user.mobile_no.includes(" ")) {
      const parts = user.mobile_no.split(" ");
      setMobileCountryCode(parts[0]);
      user.mobile_no = parts[1]; // Set only the number part
    }
    
    setCurrentUser(user);
    setShowEditForm(true);
    setShowAddForm(false);
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    try {
      // Combine country code with mobile number
      const formData = {
        ...currentUser,
        mobile_no: `${mobileCountryCode} ${currentUser.mobile_no}`
      };
      
      const response = await axios.put(`http://localhost:5000/update_user/${currentUser.user_id}`, formData);
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
      role: ""
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

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters({
      ...filters,
      [name]: value
    });
  };

  const resetFilters = () => {
    setSearchTerm("");
    setFilters({
      entityId: "",
      role: ""
      });
  };

  return (
    <div className="users-container">
      <Navbar />
      <div className="users-content">
        <h1>Users Management</h1>
        <p>
          {userRole === "Admin" 
            ? "View and manage users for your entity" 
            : "View and manage all system users"}
        </p>

        <div className="users-actions">
          <button className="btn-add-user" onClick={toggleAddForm}>
            {showAddForm ? (
              <><FontAwesomeIcon icon={faTimes} /> Cancel</>
            ) : (
              <><FontAwesomeIcon icon={faUserPlus} /> Add New User</>
            )}
          </button>
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
                  <input
                    type="text"
                    id="user_id"
                    name="user_id"
                    value={newUser.user_id}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="entity_id">Entity*</label>
                  <select
                    id="entity_id"
                    name="entity_id"
                    value={newUser.entity_id}
                    onChange={handleInputChange}
                    required
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
                  <div className="phone-input-container">
                    <select 
                      className="country-code-select"
                      value={mobileCountryCode}
                      onChange={(e) => setMobileCountryCode(e.target.value)}
                    >
                      {countries.map(country => (
                        <option key={country.country} value={country.country_code}>
                          {country.country} ({country.country_code})
                        </option>
                      ))}
                    </select>
                    <input
                      type="text"
                      id="mobile_no"
                      name="mobile_no"
                      value={newUser.mobile_no}
                      onChange={handleInputChange}
                      className="phone-input"
                      required
                    />
                  </div>
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
                  <input
                    type="password"
                    id="password"
                    name="password"
                    value={newUser.password}
                    onChange={handleInputChange}
                    required
                  />
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
                    <option value="Admin">Admin</option>
                    <option value="User">User</option>
                  </select>
                </div>
              </div>

              <div className="form-actions">
                <button type="submit" className="btn-submit">
                  <FontAwesomeIcon icon={faSave} /> Save User
                </button>
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
                  <div className="phone-input-container">
                    <select 
                      className="country-code-select"
                      value={mobileCountryCode}
                      onChange={(e) => setMobileCountryCode(e.target.value)}
                    >
                      {countries.map(country => (
                        <option key={country.country} value={country.country_code}>
                          {country.country} ({country.country_code})
                        </option>
                      ))}
                    </select>
                    <input
                      type="text"
                      id="edit_mobile_no"
                      name="mobile_no"
                      value={currentUser.mobile_no}
                      onChange={handleInputChange}
                      className="phone-input"
                      required
                    />
                  </div>
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
                    <option value="Admin">Admin</option>
                    <option value="User">User</option>
                  </select>
                </div>
              </div>

              <div className="form-actions">
                <button type="submit" className="btn-submit">
                  <FontAwesomeIcon icon={faSave} /> Update User
                </button>
                <button type="button" className="btn-cancel" onClick={cancelEdit}>
                  <FontAwesomeIcon icon={faTimes} /> Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {!showAddForm && !showEditForm && (
          <>
            {/* Search and Filter Section */}
            <div className="search-filter-container">
              <div className="search-box">
                <FaSearch className="search-icon" />
                <input
                  type="text"
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={handleSearchChange}
                  className="search-input"
                />
              </div>
              
              <button 
                className="filter-toggle-btn"
                onClick={() => setShowFilters(!showFilters)}
              >
                <FaFilter /> {showFilters ? 'Hide Filters' : 'Show Filters'}
        </button>
      </div>

            {showFilters && (
              <div className="filters-container">
                <div className="filter-group">
                  <label htmlFor="entityId">Entity:</label>
                  <select
                    id="entityId"
                    name="entityId"
                    value={filters.entityId}
                    onChange={handleFilterChange}
                  >
                    <option value="">All Entities</option>
                    {entities.map((entity) => (
                      <option key={entity.entity_id} value={entity.entity_id}>
                        {entity.entity_name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="filter-group">
                  <label htmlFor="role">Role:</label>
                  <select
                    id="role"
                    name="role"
                    value={filters.role}
                    onChange={handleFilterChange}
                  >
                    <option value="">All Roles</option>
                    <option value="Admin">Admin</option>
                    <option value="User">User</option>
                  </select>
                </div>
                
                <button className="reset-filters-btn" onClick={resetFilters}>
                  Reset Filters
                </button>
              </div>
            )}

            {loading ? (
              <div className="loading">
                <FontAwesomeIcon icon={faSpinner} className="spinner" />
                <p>Loading users...</p>
              </div>
            ) : error ? (
              <div className="error-message">{error}</div>
            ) : filteredUsers.length === 0 ? (
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
                      <button
                        className="btn-edit"
                        onClick={() => handleEditUser(user)}
                        title="Edit user"
                      >
                        <FontAwesomeIcon icon={faEdit} />
                      </button>
                      <button
                        className="btn-delete"
                        onClick={() => handleDeleteUser(user.user_id)}
                        title="Delete user"
                      >
                        <FontAwesomeIcon icon={faTrash} />
                      </button>
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
