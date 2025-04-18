import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Navbar from "./Navbar";
import { usePrivileges, PrivilegedButton } from "./Privileges";
import "./Holidays.css";

const Holidays = () => {
  const [holidays, setHolidays] = useState([]);
  const [entities, setEntities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentEntity, setCurrentEntity] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const navigate = useNavigate();
  const { hasPrivilege } = usePrivileges();

  useEffect(() => {
    // Check if user is logged in
    const userData = sessionStorage.getItem("user");
    if (!userData) {
      navigate("/login");
      return;
    }

    // Set current entity and role from user data
    const user = JSON.parse(userData);
    setCurrentEntity(user.entity_id);
    setUserRole(user.role);

    const loadData = async () => {
      try {
        // Fetch holidays
        await fetchHolidays(user.entity_id);
        // Fetch entities
        await fetchEntities();
      } catch (err) {
        console.error("Error in initial data loading:", err);
        setError("Failed to load data. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [navigate]);

  const fetchHolidays = async (entityId) => {
    try {
      if (!entityId) {
        console.error("Entity ID is missing or invalid");
        setError("Invalid entity ID. Please log in again.");
        return [];
      }

      // Get auth token
      const user = JSON.parse(sessionStorage.getItem("user"));
      const token = user ? user.token : null;
      
      if (!token) {
        throw new Error("Authentication token missing. Please log in again.");
      }

      const response = await axios.get(
        `http://localhost:5000/holidays/${entityId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      console.log("Holidays response:", response.data); // Debug log
      const holidayData = response.data.holidays || [];
      setHolidays(holidayData);
      setError(null); // Clear any previous errors
      return holidayData;
    } catch (err) {
      console.error("Error fetching holidays:", err);
      setError("Failed to fetch holidays. Please try again later.");
      return [];
    }
  };

  const fetchEntities = async () => {
    try {
      const response = await axios.get("http://localhost:5000/entities");
      const entityData = response.data.entities || [];
      setEntities(entityData);
      return entityData;
    } catch (err) {
      console.error("Error fetching entities:", err);
      setError(error => error || "Failed to fetch entities. Some functionality may be limited.");
      return [];
    }
  };

  const handleDeleteHoliday = async (holidayDate, entityId) => {
    if (window.confirm("Are you sure you want to delete this holiday?")) {
      try {
        if (!holidayDate || !entityId) {
          console.error("Invalid holiday data for deletion");
          setError("Cannot delete this holiday: missing information");
          return;
        }
        
        setLoading(true);
        
        // Ensure we're using the correct date format for the backend (YYYY-MM-DD)
        let formattedDate = holidayDate;
        
        // If it's not already in YYYY-MM-DD format, attempt to format it
        if (holidayDate && !holidayDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
          try {
            const date = new Date(holidayDate);
            if (!isNaN(date.getTime())) {
              formattedDate = date.toISOString().split('T')[0]; // Get YYYY-MM-DD part
              console.log(`Reformatted date from ${holidayDate} to ${formattedDate}`);
            }
          } catch (err) {
            console.error("Error formatting date for deletion:", err);
          }
        }
        
        console.log(`Sending delete request: date=${formattedDate}, entity=${entityId}`);
        
        // Get the user token from session storage
        const user = JSON.parse(sessionStorage.getItem("user"));
        const token = user ? user.token : null;
        
        if (!token) {
          throw new Error("Authentication token missing. Please log in again.");
        }
        
        // Make the DELETE request with the properly formatted date and auth header
        const response = await axios.delete(
          `http://localhost:5000/delete_holiday/${formattedDate}/${entityId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );
        
        if (response.status === 200) {
          console.log("Holiday deleted successfully");
          // Success - refresh the holidays list
          await fetchHolidays(currentEntity);
          setError(null); // Clear any previous errors
        } else {
          throw new Error(`Unexpected response status: ${response.status}`);
        }
      } catch (err) {
        console.error("Error deleting holiday:", err);
        const errorMessage = err.response?.data?.error || err.message || "Unknown error";
        setError(`Failed to delete holiday: ${errorMessage}`);
        
        // If the error is a 404 (holiday not found), refresh the list anyway
        if (err.response?.status === 404) {
          await fetchHolidays(currentEntity);
        }
      } finally {
        setLoading(false);
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
    
    try {
      const date = new Date(dateString);
      // Check if date is valid
      if (isNaN(date.getTime())) return dateString;
      
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch (err) {
      console.error("Error formatting date:", err);
      return dateString;
    }
  };

  // Helper function to extract date parts safely
  const getDateParts = (dateString) => {
    if (!dateString) return { month: 'N/A', day: '--', year: '----' };
    
    try {
      const date = new Date(dateString);
      // Check if date is valid
      if (isNaN(date.getTime())) {
        return { month: 'N/A', day: '--', year: '----' };
      }
      
      return {
        month: date.toLocaleDateString('en-US', { month: 'short' }),
        day: date.getDate(),
        year: date.getFullYear()
      };
    } catch (err) {
      console.error("Error getting date parts:", err);
      return { month: 'N/A', day: '--', year: '----' };
    }
  };

  return (
    <div className="holidays-container">
      <Navbar />
      <div className="holidays-content">
        <h1>Holidays Management</h1>
        <p>View and manage holidays for {entities.find(e => e.entity_id === currentEntity)?.entity_name || 'your entity'}</p>

        <div className="holidays-actions">
          <PrivilegedButton
            className="btn-add-holiday"
            onClick={() => navigate("/add-holiday")}
            requiredPrivilege="holiday_add"
            disabled={userRole !== 'Global' && userRole !== 'Admin'}
          >
            Add New Holiday
          </PrivilegedButton>
        </div>

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
                  <span>📅</span> 
                </button>
                <button className="view-btn">
                  <span>📋</span> List
                </button>
              </div>
            </div>

            <div className="holidays-grid">
              {holidays.map((holiday, index) => {
                const dateParts = getDateParts(holiday.holiday_date);
                
                return (
                  <div 
                    className="holiday-card" 
                    key={`${holiday.holiday_date}-${holiday.entity_id}`}
                    style={{"--card-index": index}}
                  >
                    <div className="holiday-card-header">
                      <div className="holiday-date">
                        <div className="date-month">
                          {dateParts.month}
                        </div>
                        <div className="date-day">
                          {dateParts.day}
                        </div>
                        <div className="date-year">
                          {dateParts.year}
                        </div>
                      </div>
                      <div className="holiday-entity">                     
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
                      <PrivilegedButton 
                        requiredPrivilege="holiday_update"
                        className="btn-edit"
                        onClick={() => {/* Add edit functionality */}}
                        disabled={userRole !== 'Global' && userRole !== 'Admin'}
                      >
                        Edit
                      </PrivilegedButton>
                      <PrivilegedButton
                        requiredPrivilege="holiday_delete"
                        className="btn-delete"
                        onClick={() => handleDeleteHoliday(holiday.holiday_date, holiday.entity_id)}
                        disabled={userRole !== 'Global' && userRole !== 'Admin'}
                      >
                        Delete
                      </PrivilegedButton>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Holidays;




