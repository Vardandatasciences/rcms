import React, { useState, useEffect } from "react";
import axios from "axios";
import "./EditUser.css"; // Import CSS for styling

const EditUser = ({ user, onClose, onUpdate }) => {
  const [updatedUser, setUpdatedUser] = useState({ ...user });
  const [entities, setEntities] = useState([]);
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    fetchEntities();
  }, []);

  const fetchEntities = () => {
    axios
      .get("http://localhost:5000/entities")
      .then((response) => {
        setEntities(response.data.entities);
      })
      .catch((error) => {
        console.error("Error fetching entities:", error);
      });
  };

  const handleChange = (e) => {
    setUpdatedUser({ ...updatedUser, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    axios
      .put(`http://localhost:5000/update_user/${user.user_id}`, updatedUser)
      .then((response) => {
        setSuccessMessage(response.data.message);
        setTimeout(() => {
          onClose(); // Close form after update
          onUpdate(); // Refresh users list
        }, 1000);
      })
      .catch((error) => {
        console.error("Error updating user:", error);
      });
  };

  return (
    <div className="edit-user-container">
      <h2>Edit User</h2>
      {successMessage && <p className="success-message">{successMessage}</p>}

      <form onSubmit={handleSubmit}>
        <label>User ID:</label>
        <input type="text" name="user_id" value={updatedUser.user_id} readOnly />

        <label>Entity:</label>
        <select name="entity_id" value={updatedUser.entity_id} onChange={handleChange} required>
          {entities.map((entity) => (
            <option key={entity.entity_id} value={entity.entity_id}>
              {entity.entity_name} ({entity.entity_id})
            </option>
          ))}
        </select>

        <label>User Name:</label>
        <input type="text" name="user_name" value={updatedUser.user_name} onChange={handleChange} required />

        <label>Address:</label>
        <input type="text" name="address" value={updatedUser.address || ""} onChange={handleChange} />

        <label>Mobile No:</label>
        <input type="text" name="mobile_no" value={updatedUser.mobile_no} onChange={handleChange} required />

        <label>Email ID:</label>
        <input type="email" name="email_id" value={updatedUser.email_id} onChange={handleChange} required />

        <label>Role:</label>
        <select name="role" value={updatedUser.role} onChange={handleChange} required>
          <option value="Admin">Admin</option>
          <option value="Employee">Employee</option>
        </select>

        <div className="buttons">
          <button type="submit" className="save-btn">Update</button>
          <button type="button" className="cancel-btn" onClick={onClose}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditUser;
