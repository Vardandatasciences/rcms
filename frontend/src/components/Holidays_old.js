import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import Navbar from "./Navbar";
import "./Holidays.css";
import { PrivilegedButton } from "./Privileges";
import { FaTrashAlt, FaEdit, FaPlus, FaSync } from "react-icons/fa";

// Sample fallback holiday data in case API fails
const FALLBACK_HOLIDAYS = [
  {
    holiday_date: "2023-12-25",
    description: "Christmas",
    entity_id: "KOTH001"
  },
  {
    holiday_date: "2024-01-01",
    description: "New Year's Day",
    entity_id: "KOTH001"
  },
  {
    holiday_date: "2024-01-26",
    description: "Republic Day",
    entity_id: "KOTH001"
  }
];

// Sample fallback entity data
const FALLBACK_ENTITIES = [
  {
    entity_id: "KOTH001",
    entity_name: "Default Entity" 
  }
];

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
  const [retrying, setRetrying] = useState(false);
  const [usesFallbackData, setUsesFallbackData] = useState(false);
  const [currentEntityId, setCurrentEntityId] = useState(null);
  const navigate = useNavigate();
  
  // Get entity_id from URL params if available
  const { entityId: urlEntityId } = useParams();

  useEffect(() => {
    // Check if user is logged in
    const userData = sessionStorage.getItem("user");
    if (!userData) {
      navigate("/login");
      return;
    }

    // Determine which entity_id to use for fetching holidays
    try {
      const parsedUserData = JSON.parse(userData);
      
      // If URL has entity_id, use that (for Global users viewing specific entity)
      if (urlEntityId) {
        setCurrentEntityId(urlEntityId);
        setNewHoliday(prev => ({ ...prev, entity_id: urlEntityId }));
      } 
      // Otherwise use the user's own entity_id (for Admin users)
      else if (parsedUserData.entity_id) {
        setCurrentEntityId(parsedUserData.entity_id);
        setNewHoliday(prev => ({ ...prev, entity_id: parsedUserData.entity_id }));
      }
    } catch (err) {
      console.error("Error parsing user data:", err);
    }

    loadData();
  }, [navigate, urlEntityId]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    setUsesFallbackData(false);
    
    try {
      // Fetch entities first
      try {
        await fetchEntities();
      } catch (err) {
        console.error("Error fetching entities:", err);
        // Continue with fallback entities
        setEntities(FALLBACK_ENTITIES);
      }
      
      // Then fetch holidays
      try {
        await fetchHolidays();
      } catch (err) {
        console.error("Error fetching holidays:", err);
        setError("Failed to fetch holidays. Please try again later.");
        
        // Use fallback holidays data
        setHolidays(FALLBACK_HOLIDAYS);
        setUsesFallbackData(true);
      }
    } catch (err) {
      console.error("Error in initial data loading:", err);
      // Use fallback data as a last resort
      setHolidays(FALLBACK_HOLIDAYS);
      setEntities(FALLBACK_ENTITIES);
      setUsesFallbackData(true);
    } finally {
      setLoading(false);
      setRetrying(false);
    }
  };

  const fetchHolidays = async () => {
    try {
      // Determine which endpoint to use based on whether we have a specific entity_id
      let url = "http://localhost:5000/holidays";
      
      // If we have a specific entity_id, use the entity-specific endpoint
      if (currentEntityId) {
        url = `http://localhost:5000/entity_holidays/${currentEntityId}`;
      }
      
      const response = await axios.get(url, {
        timeout: 8000, // 8 second timeout
      });
      
      if (response.data && Array.isArray(response.data.holidays)) {
        // Validate dates before setting state
        const validatedHolidays = response.data.holidays.map(holiday => {
          try {
            // Try to create a Date object to validate
            const date = new Date(holiday.holiday_date);
            if (isNaN(date.getTime())) {
              holiday.holiday_date = new Date().toISOString().split('T')[0];
            }
            return holiday;
          } catch (e) {
            console.error(`Error processing holiday date: ${holiday.holiday_date}`, e);
            holiday.holiday_date = new Date().toISOString().split('T')[0];
            return holiday;
          }
        });
        
        setHolidays(validatedHolidays);
        return validatedHolidays;
      } else {
        // If we can't extract holidays, use fallback
        console.warn("Could not find holidays in response, using fallback data");
        setHolidays(FALLBACK_HOLIDAYS);
        setUsesFallbackData(true);
        return FALLBACK_HOLIDAYS;
      }
    } catch (err) {
      console.error("Error fetching holidays:", err);
      throw err;
    }
  };

  const fetchEntities = async () => {
    try {
      const response = await axios.get("http://localhost:5000/entities", {
        timeout: 8000, // 8 second timeout
      });
      
      if (response.data && Array.isArray(response.data.entities)) {
        setEntities(response.data.entities);
      return response.data.entities;
      } else {
        // If we can't extract entities, use fallback
        setEntities(FALLBACK_ENTITIES);
        return FALLBACK_ENTITIES;
      }
    } catch (err) {
      console.error("Error fetching entities:", err);
      // Use fallback entities
      setEntities(FALLBACK_ENTITIES);
      return FALLBACK_ENTITIES;
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
    
    // Validate date format
    try {
      const date = new Date(newHoliday.holiday_date);
      if (isNaN(date.getTime())) {
        alert("Invalid date format. Please select a valid date.");
        return;
      }
    } catch (e) {
      alert("Invalid date format. Please select a valid date.");
      return;
    }

    try {
      if (usesFallbackData) {
        // In case we're using fallback data, just append to local state
        const newHolidayWithId = {
          ...newHoliday,
          id: Date.now().toString() // Generate a temporary ID
        };
        setHolidays(prevHolidays => [...prevHolidays, newHolidayWithId]);
        // Reset form
        setNewHoliday(prev => ({ 
          holiday_date: "", 
          description: "", 
          entity_id: currentEntityId || prev.entity_id 
        }));
        setIsAdding(false);
        return;
      }
      
      // Make sure we specify the format in the request to avoid backend date issues
      const formattedHoliday = {
        ...newHoliday,
        // Ensure the date is formatted as YYYY-MM-DD
        holiday_date: new Date(newHoliday.holiday_date).toISOString().split('T')[0]
      };
      
      await axios.post("http://localhost:5000/add_holiday", formattedHoliday);
      // Reset form and refresh holidays
      setNewHoliday(prev => ({ 
        holiday_date: "", 
        description: "", 
        entity_id: currentEntityId || prev.entity_id 
      }));
      setIsAdding(false);
      await fetchHolidays();
    } catch (err) {
      console.error("Error adding holiday:", err);
      setError("Failed to add holiday. Please try again later.");
    }
  };

  const handleDeleteHoliday = async (holidayDate, entityId) => {
    if (window.confirm("Are you sure you want to delete this holiday?")) {
      try {
        if (usesFallbackData) {
          // For fallback data, just filter from local state
          setHolidays(prevHolidays => 
            prevHolidays.filter(h => 
              h.holiday_date !== holidayDate || h.entity_id !== entityId
            )
          );
          return;
        }
        
        // Format date as YYYY-MM-DD for the backend to avoid date issues
        const formattedDate = new Date(holidayDate).toISOString().split('T')[0];
        await axios.delete(`http://localhost:5000/delete_holiday/${formattedDate}/${entityId}`);
        
        // Refresh the holidays list
        await fetchHolidays();
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
    
    try {
    const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return "Invalid Date";
      }
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
    } catch (e) {
      console.error(`Error formatting date: ${dateString}`, e);
      return "Date Error";
    }
  };

  const handleRetry = () => {
    setRetrying(true);
    loadData();
  };

  const formatDateForDisplay = (dateString) => {
    if (!dateString) return { month: "N/A", day: "N/A", year: "N/A" };
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return { month: "Inv", day: "??", year: "????" };
      }
      
      return {
        month: date.toLocaleDateString('en-US', { month: 'short' }).toUpperCase(),
        day: date.getDate(),
        year: date.getFullYear()
      };
    } catch (e) {
      console.error(`Error formatting date for display: ${dateString}`, e);
      return { month: "Err", day: "!", year: "!" };
    }
  };

  return (
    <div className="holidays-container">
      <Navbar />
      <div className="holidays-content">
        <div className="holidays-header">
        <h1>Holidays Management</h1>
          <p>
            {currentEntityId ? 
              `View and manage holidays for entity ${getEntityName(currentEntityId)}` : 
              "View and manage holidays for all entities"}
            {usesFallbackData && " (Using Demo Data)"}
          </p>
        </div>

        <div className="holidays-actions">
          <PrivilegedButton
            className="btn-add-holiday"
            onClick={() => setIsAdding(!isAdding)}
            requiredPrivilege="holiday_add"
            title="add a new holiday"
          >
            <FaPlus style={{ marginRight: '5px' }} />
            {isAdding ? "Cancel" : "Add New Holiday"}
          </PrivilegedButton>
          
          <button
            className="btn-retry"
            onClick={handleRetry}
            disabled={retrying}
            title="Retry loading holidays"
          >
            <FaSync className={retrying ? "fa-spin" : ""} style={{ marginRight: '5px' }} />
            {retrying ? "Retrying..." : "Retry"}
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
                  disabled={currentEntityId !== null}
                >
                  <option value="">Select Entity</option>
                  {entities.map((entity) => (
                    <option key={entity.entity_id} value={entity.entity_id}>
                      {entity.entity_name}
                    </option>
                  ))}
                </select>
                {currentEntityId && (
                  <p className="form-hint">Entity is fixed to your current entity</p>
                )}
              </div>
              <PrivilegedButton type="submit" className="btn-submit" requiredPrivilege="holiday_add" title="add this holiday">
                Add Holiday
              </PrivilegedButton>
            </form>
          </div>
        )}

        {loading ? (
          <div className="loading">
            <div className="loading-spinner"></div>
            <p>Loading holidays...</p>
          </div>
        ) : error && !holidays.length ? (
          <div className="error-message">
            <p>{error}</p>
            <button className="btn-retry-inline" onClick={handleRetry} disabled={retrying}>
              {retrying ? "Retrying..." : "Try Again"}
            </button>
          </div>
        ) : holidays.length === 0 ? (
          <div className="no-holidays">
            <h3>No holidays found</h3>
            <p>{currentEntityId ? 
                `There are currently no holidays for entity ${getEntityName(currentEntityId)}` : 
                "There are currently no holidays in the system."} 
              Add a new holiday to get started.</p>
          </div>
        ) : (
          <>
            {usesFallbackData && (
              <div className="fallback-data-notice">
                <p>Unable to connect to the server. Showing demo data for preview purposes.</p>
              </div>
            )}

            <div className="holidays-grid">
              {holidays.map((holiday, index) => {
                const dateInfo = formatDateForDisplay(holiday.holiday_date);
                
                return (
                <div 
                  className="holiday-card" 
                    key={`${holiday.holiday_date}-${holiday.entity_id}-${index}`}
                  style={{"--card-index": index}}
                >
                  <div className="holiday-card-header">
                    <div className="holiday-date">
                        <div className="date-month">{dateInfo.month}</div>
                        <div className="date-day">{dateInfo.day}</div>
                        <div className="date-year">{dateInfo.year}</div>
                    </div>
                    <div className="holiday-entity">
                      <span className="entity-badge">
                        {getEntityName(holiday.entity_id)}
                      </span>
                    </div>
                  </div>
                  
                  <div className="holiday-card-content">
                    <h3 className="holiday-title">{holiday.description}</h3>
                  </div>

                  <div className="holiday-card-footer">
                      <PrivilegedButton
                      className="btn-delete"
                      onClick={() => handleDeleteHoliday(holiday.holiday_date, holiday.entity_id)}
                        requiredPrivilege="holiday_delete"
                        title="delete this holiday"
                    >
                        <FaTrashAlt />
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




