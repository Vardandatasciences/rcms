import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Navbar from "./Navbar";
import "./Entities.css"; // Import CSS for styling
import AddEntity from "./AddEntity"; // Import AddEntity component
import EditEntity from "./EditEntity"; // Import EditEntity component
import DeleteEntity from "./DeleteEntity"; // Import DeleteEntity component
import { FaSearch, FaFilter, FaEdit, FaTrashAlt, FaPencilAlt, FaTrash, FaUser, FaPhone, FaUserFriends, FaGlobe, FaMapMarkerAlt } from "react-icons/fa"; // Import icons

const Entities = () => {
  const [entities, setEntities] = useState([]);
  const [filteredEntities, setFilteredEntities] = useState([]);
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
    country: "India",
    contact_name: "",
    alternate_contact_name: "",
    state: "",
    pincode: "",
    admin_email: "",
    admin_password: "",
    selected_regulations: []
  });
  const [regulations, setRegulations] = useState([]);
  const [countries, setCountries] = useState([]);
  const [loadingRegulations, setLoadingRegulations] = useState(false);
  const [contactCountryCode, setContactCountryCode] = useState("+91");
  const [alternateContactCountryCode, setAlternateContactCountryCode] = useState("+91");
  const navigate = useNavigate();
  
  // Search and filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    country: "",
    state: ""
  });

  useEffect(() => {
    // Check if user is logged in
    const userData = sessionStorage.getItem("user");
    if (!userData) {
      navigate("/login");
      return;
    }

    fetchEntities();
  }, [navigate]);

  useEffect(() => {
    if (showAddForm) {
      fetchRegulations();
      fetchCountryCodes();
    }
  }, [showAddForm]);

  const fetchEntities = async () => {
    try {
      setLoading(true);
      const response = await axios.get("http://localhost:5000/entities");
      const entitiesData = response.data.entities || [];
      setEntities(entitiesData);
      setFilteredEntities(entitiesData);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching entities:", err);
      setError("Failed to fetch entities. Please try again later.");
      setLoading(false);
    }
  };

  // Apply search and filters
  useEffect(() => {
    let result = entities;
    
    // Apply search term
    if (searchTerm) {
      const lowercasedSearch = searchTerm.toLowerCase();
      result = result.filter(
        entity => 
          entity.entity_id.toLowerCase().includes(lowercasedSearch) ||
          entity.entity_name.toLowerCase().includes(lowercasedSearch) ||
          entity.location.toLowerCase().includes(lowercasedSearch) ||
          entity.contact_name.toLowerCase().includes(lowercasedSearch) ||
          (entity.description && entity.description.toLowerCase().includes(lowercasedSearch))
      );
    }
    
    // Apply country filter
    if (filters.country) {
      result = result.filter(entity => 
        entity.country === filters.country
      );
    }
    
    // Apply state filter
    if (filters.state) {
      result = result.filter(entity => 
        entity.state.toLowerCase().includes(filters.state.toLowerCase())
      );
    }
    
    setFilteredEntities(result);
  }, [searchTerm, filters, entities]);

  const fetchRegulations = async () => {
    try {
      setLoadingRegulations(true);
      const response = await axios.get("http://localhost:5000/regulations");
      setRegulations(response.data.regulations || []);
      setLoadingRegulations(false);
    } catch (err) {
      console.error("Error fetching regulations:", err);
      setErrorMessage("Failed to fetch regulations. Please try again later.");
      setLoadingRegulations(false);
    }
  };

  const fetchCountryCodes = async () => {
    try {
      const response = await axios.get("http://localhost:5000/country_codes");
      setCountries(response.data.countries || []);
      
      // If India is in the list, set it as default
      const india = response.data.countries.find(country => country.country === "India");
      if (india) {
        setContactCountryCode(india.country_code);
        setAlternateContactCountryCode(india.country_code);
      }
    } catch (err) {
      console.error("Error fetching country codes:", err);
      setErrorMessage("Failed to fetch country codes. Please try again later.");
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
      country: "",
      state: ""
    });
  };

  const handleRegulationChange = (e) => {
    const regulationId = e.target.value;
    const isChecked = e.target.checked;
    
    if (isChecked) {
      // Add regulation to selected list
      setNewEntity({
        ...newEntity,
        selected_regulations: [...newEntity.selected_regulations, regulationId]
      });
    } else {
      // Remove regulation from selected list
      setNewEntity({
        ...newEntity,
        selected_regulations: newEntity.selected_regulations.filter(id => id !== regulationId)
      });
    }
  };

  const handleCountryChange = (e) => {
    const selectedCountry = e.target.value;
    setNewEntity({ ...newEntity, country: selectedCountry });
    
    // Update country code if country changes
    const countryData = countries.find(country => country.country === selectedCountry);
    if (countryData) {
      setContactCountryCode(countryData.country_code);
      setAlternateContactCountryCode(countryData.country_code);
    }
  };

  const handleAddEntity = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    try {
      // Combine country code with phone numbers
      const formData = {
        ...newEntity,
        contact_phno: `${contactCountryCode} ${newEntity.contact_phno}`,
        alternate_contact: `${alternateContactCountryCode} ${newEntity.alternate_contact}`
      };
      
      const response = await axios.post("http://localhost:5000/add_entity", formData);
      setSuccessMessage(response.data.message);
      
      // Reset form and refresh entities list
      setNewEntity({
        entity_name: "",
        location: "",
        contact_phno: "",
        alternate_contact: "",
        description: "",
        country: "India",
        contact_name: "",
        alternate_contact_name: "",
        state: "",
        pincode: "",
        admin_email: "",
        admin_password: "",
        selected_regulations: []
      });
      
      // Reset country codes to default
      setContactCountryCode("+91");
      setAlternateContactCountryCode("+91");
      
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
      country: "India",
      contact_name: "",
      alternate_contact_name: "",
      state: "",
      pincode: "",
      admin_email: "",
      admin_password: "",
      selected_regulations: []
    });
    // Reset country codes to default
    setContactCountryCode("+91");
    setAlternateContactCountryCode("+91");
  };

  const cancelEdit = () => {
    setShowEditForm(false);
    setCurrentEntity(null);
    setErrorMessage("");
    setSuccessMessage("");
  };

  // Get unique countries and states for filters
  const getUniqueCountries = () => {
    const countriesSet = new Set();
    entities.forEach(entity => {
      if (entity.country) countriesSet.add(entity.country);
    });
    return Array.from(countriesSet).sort();
  };

  const getUniqueStates = () => {
    const statesSet = new Set();
    entities.forEach(entity => {
      if (entity.state) statesSet.add(entity.state);
    });
    return Array.from(statesSet).sort();
  };

  return (
    <div className="entities-container">
      <Navbar />
      <div className="entities-content">
        {/* <h1>Entities Management</h1>
        <p>View and manage organization entities</p> */}

        {/* <div className="entities-actions">
          <button className="btn-add-entity" onClick={toggleAddForm}>
            {showAddForm ? "Cancel" : "Add New Entity"}
          </button>
        </div> */}

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
                  <div className="phone-input-container">
                    <select 
                      className="country-code-select"
                      value={contactCountryCode}
                      onChange={(e) => setContactCountryCode(e.target.value)}
                    >
                      {countries.map(country => (
                        <option key={country.country} value={country.country_code}>
                          {country.country} ({country.country_code})
                        </option>
                      ))}
                    </select>
                    <input
                      type="text"
                      id="contact_phno"
                      name="contact_phno"
                      value={newEntity.contact_phno}
                      onChange={handleInputChange}
                      className="phone-input"
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="alternate_contact_name">Alternate Contact Name</label>
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
                  <label htmlFor="alternate_contact">Alternate Contact Phone</label>
                  <div className="phone-input-container">
                    <select 
                      className="country-code-select"
                      value={alternateContactCountryCode}
                      onChange={(e) => setAlternateContactCountryCode(e.target.value)}
                    >
                      {countries.map(country => (
                        <option key={`alt-${country.country}`} value={country.country_code}>
                          {country.country} ({country.country_code})
                        </option>
                      ))}
                    </select>
                    <input
                      type="text"
                      id="alternate_contact"
                      name="alternate_contact"
                      value={newEntity.alternate_contact}
                      onChange={handleInputChange}
                      className="phone-input"
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="country">Country*</label>
                  <select
                    id="country"
                    name="country"
                    value={newEntity.country}
                    onChange={handleCountryChange}
                    required
                  >
                    {countries.map(country => (
                      <option key={`country-${country.country}`} value={country.country}>
                        {country.country}
                      </option>
                    ))}
                  </select>
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
                  <label>Select Applicable Regulations:</label>
                  {loadingRegulations ? (
                    <p>Loading regulations...</p>
                  ) : (
                    <div className="regulations-container">
                      {regulations.length === 0 ? (
                        <p>No regulations available</p>
                      ) : (
                        regulations.map((regulation) => (
                          <div key={regulation.regulation_id} className="regulation-item">
                            <input
                              type="checkbox"
                              id={`reg-${regulation.regulation_id}`}
                              value={regulation.regulation_id}
                              checked={newEntity.selected_regulations.includes(regulation.regulation_id)}
                              onChange={handleRegulationChange}
                            />
                            <label htmlFor={`reg-${regulation.regulation_id}`}>
                              {regulation.regulation_name} ({regulation.regulation_id})
                            </label>
                          </div>
                        ))
                      )}
                    </div>
                  )}
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
                  <div className="phone-input-container">
                    <select 
                      className="country-code-select"
                      value={contactCountryCode}
                      onChange={(e) => setContactCountryCode(e.target.value)}
                    >
                      {countries.map(country => (
                        <option key={country.country} value={country.country_code}>
                          {country.country} ({country.country_code})
                        </option>
                      ))}
                    </select>
                    <input
                      type="text"
                      id="edit_contact_phno"
                      name="contact_phno"
                      value={currentEntity.contact_phno}
                      onChange={handleInputChange}
                      className="phone-input"
                      required
                    />
                  </div>
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
                  <div className="phone-input-container">
                    <select 
                      className="country-code-select"
                      value={alternateContactCountryCode}
                      onChange={(e) => setAlternateContactCountryCode(e.target.value)}
                    >
                      {countries.map(country => (
                        <option key={`alt-${country.country}`} value={country.country_code}>
                          {country.country} ({country.country_code})
                        </option>
                      ))}
                    </select>
                    <input
                      type="text"
                      id="edit_alternate_contact"
                      name="alternate_contact"
                      value={currentEntity.alternate_contact}
                      onChange={handleInputChange}
                      className="phone-input"
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="edit_country">Country*</label>
                  <select
                    id="edit_country"
                    name="country"
                    value={currentEntity.country}
                    onChange={handleInputChange}
                    required
                  >
                    {countries.map(country => (
                      <option key={`country-${country.country}`} value={country.country}>
                        {country.country}
                      </option>
                    ))}
                  </select>
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
            {/* Top Controls Section with all buttons in one row */}
            <div className="top-controls-container">
              <div className="search-filter-container">
                <div className="search-box">
                  <FaSearch className="search-icon" />
                  <input
                    type="text"
                    placeholder="Search entities..."
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
              
              <button className="btn-add-entity" onClick={toggleAddForm}>
                Add New Entity
              </button>
            </div>

            {showFilters && (
              <div className="filters-container">
                <div className="filter-group">
                  <label htmlFor="country">Country:</label>
                  <select
                    id="country"
                    name="country"
                    value={filters.country}
                    onChange={handleFilterChange}
                  >
                    <option value="">All Countries</option>
                    {getUniqueCountries().map(country => (
                      <option key={country} value={country}>
                        {country}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="filter-group">
                  <label htmlFor="state">State:</label>
                  <select
                    id="state"
                    name="state"
                    value={filters.state}
                    onChange={handleFilterChange}
                  >
                    <option value="">All States</option>
                    {getUniqueStates().map(state => (
                      <option key={state} value={state}>
                        {state}
                      </option>
                    ))}
                  </select>
                </div>
                
                <button className="reset-filters-btn" onClick={resetFilters}>
                  Reset Filters
                </button>
              </div>
            )}

            {loading ? (
              <div className="loading">
                <p>Loading entities...</p>
              </div>
            ) : error ? (
              <div className="error-message">{error}</div>
            ) : filteredEntities.length === 0 ? (
              <div className="no-entities">
                {entities.length === 0 ? 
                  "No entities found. Add a new entity to get started." : 
                  "No entities match your search criteria."}
              </div>
            ) : (
              <div className="entity-cards-container">
                {entities.map((entity, index) => (
                  <div 
                    key={entity.entity_id} 
                    className="entity-card" 
                    style={{"--index": index}}
                  >
                    <div className="entity-card-header">
                      <div className="entity-avatar">
                        {entity.entity_name.charAt(0)}
                      </div>
                      <div className="entity-name-location">
                        <h3>{entity.entity_name}</h3>
                        <div className="entity-location">
                          <FaMapMarkerAlt />
                          {entity.location}
                        </div>
                        {/* {entity.state && (
                          <div className="entity-badge">
                            {entity.state.substring(0, 3).toLowerCase()}
                          </div>
                        )} */}
                      </div>
                    </div>
                    
                    <div className="entity-card-body">
                      <div className="entity-info">
                        <p>
                          <FaUser />
                          <span><span className="info-label">Contact:</span> {entity.contact_name}</span>
                        </p>
                        <p>
                          <FaPhone />
                          <span><span className="info-label">Phone:</span> {entity.contact_phno}</span>
                        </p>
                        <p>
                          <FaUserFriends />
                          <span><span className="info-label">Alt Contact:</span> {entity.alternate_contact_name}</span>
                        </p>
                        <p>
                          <FaGlobe />
                          <span><span className="info-label">Country:</span> {entity.country}</span>
                        </p>
                      </div>
                    </div>
                    
                    <div className="entity-card-actions">
                      <button
                        className="btn-edit"
                        onClick={() => handleEditEntity(entity)}
                        title="Edit Entity"
                      >
                        <FaPencilAlt />
                      </button>
                      <button
                        className="btn-delete"
                        onClick={() => handleDeleteEntity(entity.entity_id)}
                        title="Delete Entity"
                      >
                        <FaTrash />
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

export default Entities;
