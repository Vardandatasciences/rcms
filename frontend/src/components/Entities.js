import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Navbar from "./Navbar";
import "./Entities.css"; // Import CSS for styling
import AddEntity from "./AddEntity"; // Import AddEntity component
import EditEntity from "./EditEntity"; // Import EditEntity component
import DeleteEntity from "./DeleteEntity"; // Import DeleteEntity component

const Entities = () => {
  const [entities, setEntities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [currentEntity, setCurrentEntity] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
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
    admin_email: "",
    admin_password: ""
  });
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is logged in
    const userData = sessionStorage.getItem("user");
    if (!userData) {
      navigate("/login");
      return;
    }

    fetchEntities();
  }, [navigate]);

  const fetchEntities = async () => {
    try {
      setLoading(true);
      const response = await axios.get("http://localhost:5000/entities");
      setEntities(response.data.entities || []);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching entities:", err);
      setError("Failed to fetch entities. Please try again later.");
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (showEditForm) {
      setCurrentEntity({ ...currentEntity, [name]: value });
    } else {
      setNewEntity({ ...newEntity, [name]: value });
    }
  };

  const handleAddEntity = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const response = await axios.post("http://localhost:5000/add_entity", newEntity);
      setSuccessMessage(response.data.message);
      
      // Reset form and refresh entities list
      setNewEntity({
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
        admin_email: "",
        admin_password: ""
      });
      
      // Close the form after a short delay
      setTimeout(() => {
        setShowAddForm(false);
        setSuccessMessage("");
        fetchEntities();
      }, 2000);
    } catch (error) {
      setErrorMessage("Error adding entity. Please try again.");
      console.error("Error adding entity:", error);
    }
  };

  const handleEditEntity = (entity) => {
    setCurrentEntity(entity);
    setShowEditForm(true);
    setShowAddForm(false);
  };

  const handleUpdateEntity = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const response = await axios.put(`http://localhost:5000/update_entity/${currentEntity.entity_id}`, currentEntity);
      setSuccessMessage(response.data.message);
      
      // Close the form after a short delay
      setTimeout(() => {
        setShowEditForm(false);
        setCurrentEntity(null);
        setSuccessMessage("");
        fetchEntities();
      }, 2000);
    } catch (error) {
      setErrorMessage("Error updating entity. Please try again.");
      console.error("Error updating entity:", error);
    }
  };

  const handleDeleteEntity = async (entityId) => {
    if (window.confirm("Are you sure you want to delete this entity?")) {
      try {
        await axios.delete(`http://localhost:5000/delete_entity/${entityId}`);
        // Refresh the entities list
        fetchEntities();
      } catch (err) {
        console.error("Error deleting entity:", err);
        setError("Failed to delete entity. Please try again later.");
      }
    }
  };

  const toggleAddForm = () => {
    setShowAddForm(!showAddForm);
    setShowEditForm(false);
    setErrorMessage("");
    setSuccessMessage("");
    // Reset the form when toggling
    setNewEntity({
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
      admin_email: "",
      admin_password: ""
    });
  };

  const cancelEdit = () => {
    setShowEditForm(false);
    setCurrentEntity(null);
    setErrorMessage("");
    setSuccessMessage("");
  };

  return (
    <div className="entities-container">
      <Navbar />
      <div className="entities-content">
        <h1>Entities Management</h1>
        <p>View and manage organization entities</p>

        <div className="entities-actions">
          <button className="btn-add-entity" onClick={toggleAddForm}>
            {showAddForm ? "Cancel" : "Add New Entity"}
          </button>
        </div>

        {successMessage && (
          <div className="success-message">{successMessage}</div>
        )}

        {errorMessage && (
          <div className="error-message">{errorMessage}</div>
        )}

        {showAddForm && (
          <div className="entity-form-container">
            <h2>Add New Entity</h2>
            <form onSubmit={handleAddEntity}>
              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="entity_name">Entity Name*</label>
                  <input
                    type="text"
                    id="entity_name"
                    name="entity_name"
                    value={newEntity.entity_name}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="location">Location*</label>
                  <input
                    type="text"
                    id="location"
                    name="location"
                    value={newEntity.location}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="contact_name">Contact Name*</label>
                  <input
                    type="text"
                    id="contact_name"
                    name="contact_name"
                    value={newEntity.contact_name}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="contact_phno">Contact Phone*</label>
                  <input
                    type="text"
                    id="contact_phno"
                    name="contact_phno"
                    value={newEntity.contact_phno}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="alternate_contact_name">Alternate Contact Name*</label>
                  <input
                    type="text"
                    id="alternate_contact_name"
                    name="alternate_contact_name"
                    value={newEntity.alternate_contact_name}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="alternate_contact">Alternate Contact Phone*</label>
                  <input
                    type="text"
                    id="alternate_contact"
                    name="alternate_contact"
                    value={newEntity.alternate_contact}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="country">Country*</label>
                  <input
                    type="text"
                    id="country"
                    name="country"
                    value={newEntity.country}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="state">State*</label>
                  <input
                    type="text"
                    id="state"
                    name="state"
                    value={newEntity.state}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="pincode">Pincode*</label>
                  <input
                    type="text"
                    id="pincode"
                    name="pincode"
                    value={newEntity.pincode}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="admin_email">Admin Email*</label>
                  <input
                    type="email"
                    id="admin_email"
                    name="admin_email"
                    value={newEntity.admin_email}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="admin_password">Admin Password*</label>
                  <input
                    type="password"
                    id="admin_password"
                    name="admin_password"
                    value={newEntity.admin_password}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="form-group full-width">
                  <label htmlFor="description">Description*</label>
                  <textarea
                    id="description"
                    name="description"
                    value={newEntity.description}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>

              <div className="form-actions">
                <button type="submit" className="btn-submit">
                  Save Entity
                </button>
                <button type="button" className="btn-cancel" onClick={toggleAddForm}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {showEditForm && currentEntity && (
          <div className="entity-form-container">
            <h2>Edit Entity</h2>
            <form onSubmit={handleUpdateEntity}>
              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="edit_entity_id">Entity ID</label>
                  <input
                    type="text"
                    id="edit_entity_id"
                    name="entity_id"
                    value={currentEntity.entity_id}
                    readOnly
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="edit_entity_name">Entity Name*</label>
                  <input
                    type="text"
                    id="edit_entity_name"
                    name="entity_name"
                    value={currentEntity.entity_name}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="edit_location">Location*</label>
                  <input
                    type="text"
                    id="edit_location"
                    name="location"
                    value={currentEntity.location}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="edit_contact_name">Contact Name*</label>
                  <input
                    type="text"
                    id="edit_contact_name"
                    name="contact_name"
                    value={currentEntity.contact_name}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="edit_contact_phno">Contact Phone*</label>
                  <input
                    type="text"
                    id="edit_contact_phno"
                    name="contact_phno"
                    value={currentEntity.contact_phno}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="edit_alternate_contact_name">Alternate Contact Name*</label>
                  <input
                    type="text"
                    id="edit_alternate_contact_name"
                    name="alternate_contact_name"
                    value={currentEntity.alternate_contact_name}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="edit_alternate_contact">Alternate Contact Phone*</label>
                  <input
                    type="text"
                    id="edit_alternate_contact"
                    name="alternate_contact"
                    value={currentEntity.alternate_contact}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="edit_country">Country*</label>
                  <input
                    type="text"
                    id="edit_country"
                    name="country"
                    value={currentEntity.country}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="edit_state">State*</label>
                  <input
                    type="text"
                    id="edit_state"
                    name="state"
                    value={currentEntity.state}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="edit_pincode">Pincode*</label>
                  <input
                    type="text"
                    id="edit_pincode"
                    name="pincode"
                    value={currentEntity.pincode}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="form-group full-width">
                  <label htmlFor="edit_description">Description*</label>
                  <textarea
                    id="edit_description"
                    name="description"
                    value={currentEntity.description}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>

              <div className="form-actions">
                <button type="submit" className="btn-submit">
                  Update Entity
                </button>
                <button type="button" className="btn-cancel" onClick={cancelEdit}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {!showAddForm && !showEditForm && (
          <>
            {loading ? (
              <div className="loading">Loading entities...</div>
            ) : error ? (
              <div className="error-message">{error}</div>
            ) : entities.length === 0 ? (
              <div className="no-entities">
                <p>No entities found. Add a new entity to get started.</p>
              </div>
            ) : (
              <div className="entities-table-container">
                <table className="entities-table">
                  <thead>
                    <tr>
                      <th>Entity ID</th>
                      <th>Name</th>
                      <th>Location</th>
                      <th>Contact Name</th>
                      <th>Contact Phone</th>
                      <th>Country</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {entities.map((entity) => (
                      <tr key={entity.entity_id}>
                        <td>{entity.entity_id}</td>
                        <td>{entity.entity_name}</td>
                        <td>{entity.location}</td>
                        <td>{entity.contact_name}</td>
                        <td>{entity.contact_phno}</td>
                        <td>{entity.country}</td>
                        <td className="actions-cell">
                          <button
                            className="btn-edit"
                            onClick={() => handleEditEntity(entity)}
                          >
                            Edit
                          </button>
                          <button
                            className="btn-delete"
                            onClick={() => handleDeleteEntity(entity.entity_id)}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Entities;
