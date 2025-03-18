import React, { useState } from "react";
import axios from "axios";
import "./AddEntity.css"; // Import CSS for styling

const AddEntity = ({ onEntityAdded }) => {
  const [newEntity, setNewEntity] = useState({
    entity_name: "",
    location: "",
    contact_phno: "",
    alternate_contact: "",
    description: "",
    country: "",
    contact_name: "",
    alternate_contact_name: "",
    state: "",
    pincode: "",
    admin_email: "",    // New field for admin email
    admin_password: ""  // New field for admin password
  });

  const [generatedEntityId, setGeneratedEntityId] = useState(""); // Store generated Entity ID
  const [successMessage, setSuccessMessage] = useState("");

  const handleChange = (e) => {
    setNewEntity({ ...newEntity, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    axios
      .post("http://localhost:5000/add_entity", newEntity)
      .then((response) => {
        setSuccessMessage(response.data.message);
        setGeneratedEntityId(response.data.entity_id); // Display generated entity_id
        onEntityAdded(); // Refresh entities list in Entities.js
      })
      .catch((error) => {
        console.error("Error adding entity:", error);
      });
  };

  return (
    <div className="add-entity-container">
      <h2>Add New Entity</h2>
      {successMessage && <p className="success-message">{successMessage}</p>}
      {generatedEntityId && (
        <p className="generated-id">Entity ID: <strong>{generatedEntityId}</strong></p>
      )}

      <form onSubmit={handleSubmit} className="entity-form">
        <div className="form-grid">
          <div className="form-group">
            <label>Entity Name:</label>
            <input
              type="text"
              name="entity_name"
              value={newEntity.entity_name}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className="form-group">
            <label>Location:</label>
            <input
              type="text"
              name="location"
              value={newEntity.location}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className="form-group">
            <label>Contact Name:</label>
            <input
              type="text"
              name="contact_name"
              value={newEntity.contact_name}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className="form-group">
            <label>Contact Phone:</label>
            <input
              type="text"
              name="contact_phno"
              value={newEntity.contact_phno}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className="form-group">
            <label>Alternate Contact Name:</label>
            <input
              type="text"
              name="alternate_contact_name"
              value={newEntity.alternate_contact_name}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className="form-group">
            <label>Alternate Contact:</label>
            <input
              type="text"
              name="alternate_contact"
              value={newEntity.alternate_contact}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className="form-group">
            <label>Country:</label>
            <input
              type="text"
              name="country"
              value={newEntity.country}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className="form-group">
            <label>State:</label>
            <input
              type="text"
              name="state"
              value={newEntity.state}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className="form-group">
            <label>Pincode:</label>
            <input
              type="text"
              name="pincode"
              value={newEntity.pincode}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className="form-group">
            <label>Admin Email:</label>
            <input
              type="email"
              name="admin_email"
              value={newEntity.admin_email}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className="form-group">
            <label>Admin Password:</label>
            <input
              type="password"
              name="admin_password"
              value={newEntity.admin_password}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className="form-group full-width">
            <label>Description:</label>
            <textarea
              name="description"
              value={newEntity.description}
              onChange={handleChange}
              required
            />
          </div>
        </div>
        
        <div className="buttons">
          <button type="submit" className="save-btn">Save</button>
        </div>
      </form>
    </div>
  );
};

export default AddEntity;
