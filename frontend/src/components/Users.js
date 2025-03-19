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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [entities, setEntities] = useState([]);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
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
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is logged in
    const userData = sessionStorage.getItem("user");
    if (!userData) {
      navigate("/login");
      return;
    }

    // Fetch users and entities in parallel
    Promise.all([fetchUsers(), fetchEntities()]).catch(err => {
      console.error("Error in initial data loading:", err);
      setLoading(false);
    });
  }, [navigate]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await axios.get("http://localhost:5000/users");
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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (showEditForm) {
      setCurrentUser({ ...currentUser, [name]: value });
    } else {
      setNewUser({ ...newUser, [name]: value });
    }
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const response = await axios.post("http://localhost:5000/add_user", newUser);
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
        fetchUsers();
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
    setCurrentUser(user);
    setShowEditForm(true);
    setShowAddForm(false);
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const response = await axios.put(`http://localhost:5000/update_user/${currentUser.user_id}`, currentUser);
      setSuccessMessage(response.data.message);
      
      // Close the form after a short delay
      setTimeout(() => {
        setShowEditForm(false);
        setCurrentUser(null);
        setSuccessMessage("");
        fetchUsers();
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
        fetchUsers();
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
  };

  const cancelEdit = () => {
    setShowEditForm(false);
    setCurrentUser(null);
    setErrorMessage("");
    setSuccessMessage("");
  };

  return (
    <div className="users-container">
      <Navbar />
      <div className="users-content">
        <h1>Users Management</h1>
        <p>View and manage system users</p>

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
                  >
                    <option value="">Select Entity</option>
                    {entities.map((entity) => (
                      <option key={entity.entity_id} value={entity.entity_id}>
                        {entity.entity_name} ({entity.entity_id})
                      </option>
                    ))}
                  </select>
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
                  >
                    {entities.map((entity) => (
                      <option key={entity.entity_id} value={entity.entity_id}>
                        {entity.entity_name} ({entity.entity_id})
                      </option>
                    ))}
                  </select>
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
            {loading ? (
              <div className="loading">
                <FontAwesomeIcon icon={faSpinner} className="spinner" />
                <p>Loading users...</p>
              </div>
            ) : error ? (
              <div className="error-message">{error}</div>
            ) : users.length === 0 ? (
              <div className="no-users">
                <p>No users found. Add a new user to get started.</p>
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
