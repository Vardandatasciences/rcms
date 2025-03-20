import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Navbar from "./Navbar";
import "./Holidays.css";

const Holidays = () => {
  const [holidays, setHolidays] = useState([]);
  const [entities, setEntities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newHoliday, setNewHoliday] = useState({
    holiday_date: "",
    description: "",
    entity_id: "",
  });
  const [isAdding, setIsAdding] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is logged in
    const userData = sessionStorage.getItem("user");
    if (!userData) {
      navigate("/login");
      return;
    }

    // Fetch holidays and entities in parallel
    Promise.all([fetchHolidays(), fetchEntities()]).catch((err) => {
      console.error("Error in initial data loading:", err);
      setLoading(false);
    });
  }, [navigate]);

  const fetchHolidays = async () => {
    try {
      const response = await axios.get("http://localhost:5000/holidays");
      setHolidays(response.data.holidays || []);
      return response.data.holidays;
    } catch (err) {
      console.error("Error fetching holidays:", err);
      setError("Failed to fetch holidays. Please try again later.");
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
    setNewHoliday({ ...newHoliday, [name]: value });
  };

  const handleAddHoliday = async (e) => {
    e.preventDefault();
    if (!newHoliday.holiday_date || !newHoliday.description || !newHoliday.entity_id) {
      alert("All fields are required");
      return;
    }

    try {
      await axios.post("http://localhost:5000/add_holiday", newHoliday);
      // Reset form and refresh holidays
      setNewHoliday({ holiday_date: "", description: "", entity_id: "" });
      setIsAdding(false);
      fetchHolidays();
    } catch (err) {
      console.error("Error adding holiday:", err);
      setError("Failed to add holiday. Please try again later.");
    }
  };

  const handleDeleteHoliday = async (holidayDate, entityId) => {
    if (window.confirm("Are you sure you want to delete this holiday?")) {
      try {
        await axios.delete(`http://localhost:5000/delete_holiday/${holidayDate}/${entityId}`);
        // Refresh the holidays list
        fetchHolidays();
      } catch (err) {
        console.error("Error deleting holiday:", err);
        setError("Failed to delete holiday. Please try again later.");
      }
    }
  };

  // Helper function to get entity name from entity ID
  const getEntityName = (entityId) => {
    const entity = entities.find((e) => e.entity_id === entityId);
    return entity ? entity.entity_name : entityId;
  };

  // Helper function to format date
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="holidays-container">
      <Navbar />
      <div className="holidays-content">
        <h1>Holidays Management</h1>
        <p>View and manage holidays for entities</p>

        <div className="holidays-actions">
          <button
            className="btn-add-holiday"
            onClick={() => setIsAdding(!isAdding)}
          >
            {isAdding ? "Cancel" : "Add New Holiday"}
          </button>
        </div>

        {isAdding && (
          <div className="add-holiday-form">
            <h2>Add New Holiday</h2>
            <form onSubmit={handleAddHoliday}>
              <div className="form-group">
                <label htmlFor="holiday_date">Holiday Date*</label>
                <input
                  type="date"
                  id="holiday_date"
                  name="holiday_date"
                  value={newHoliday.holiday_date}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="description">Description*</label>
                <input
                  type="text"
                  id="description"
                  name="description"
                  value={newHoliday.description}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="entity_id">Entity*</label>
                <select
                  id="entity_id"
                  name="entity_id"
                  value={newHoliday.entity_id}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Select Entity</option>
                  {entities.map((entity) => (
                    <option key={entity.entity_id} value={entity.entity_id}>
                      {entity.entity_name}
                    </option>
                  ))}
                </select>
              </div>
              <button type="submit" className="btn-submit">
                Add Holiday
              </button>
            </form>
          </div>
        )}

        {loading ? (
          <div className="loading">Loading holidays...</div>
        ) : error ? (
          <div className="error-message">{error}</div>
        ) : holidays.length === 0 ? (
          <div className="no-holidays">
            <p>No holidays found. Add a new holiday to get started.</p>
          </div>
        ) : (
          <>
            <div className="holidays-filters">
              <div className="search-box">
                <span className="search-icon">🔍</span>
                <input 
                  type="text" 
                  placeholder="Search holidays..."
                  className="search-input"
                />
              </div>
              <div className="view-options">
                <button className="view-btn active">
                  <span>📅</span> Calendar
                </button>
                <button className="view-btn">
                  <span>📋</span> List
                </button>
              </div>
            </div>

            <div className="holidays-grid">
              {holidays.map((holiday, index) => (
                <div 
                  className="holiday-card" 
                  key={`${holiday.holiday_date}-${holiday.entity_id}`}
                  style={{"--card-index": index}}
                >
                  <div className="holiday-card-header">
                    <div className="holiday-date">
                      <div className="date-month">
                        {new Date(holiday.holiday_date).toLocaleDateString('en-US', { month: 'short' })}
                      </div>
                      <div className="date-day">
                        {new Date(holiday.holiday_date).getDate()}
                      </div>
                      <div className="date-year">
                        {new Date(holiday.holiday_date).getFullYear()}
                      </div>
                    </div>
                    <div className="holiday-entity">
                      <span className="entity-badge">
                        {getEntityName(holiday.entity_id)}
                      </span>
                    </div>
                  </div>
                  
                  <div className="holiday-card-content">
                    <h3 className="holiday-title">{holiday.description}</h3>
                    <div className="holiday-details">
                      <span className="detail-item">
                        <span className="icon">📍</span>
                        {getEntityName(holiday.entity_id)}
                      </span>
                      <span className="detail-item">
                        <span className="icon">📅</span>
                        {formatDate(holiday.holiday_date)}
                      </span>
                    </div>
                  </div>

                  <div className="holiday-card-footer">
                    <button 
                      className="btn-edit"
                      onClick={() => {/* Add edit functionality */}}
                    >
                      Edit
                    </button>
                    <button
                      className="btn-delete"
                      onClick={() => handleDeleteHoliday(holiday.holiday_date, holiday.entity_id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Holidays;




