import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Navbar from "./Navbar";
import "./Holidays.css";

const AddHoliday = () => {
  const [newHoliday, setNewHoliday] = useState({
    holiday_date: "",
    description: "",
    entity_id: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [currentEntity, setCurrentEntity] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is logged in
    const userData = sessionStorage.getItem("user");
    if (!userData) {
      navigate("/login");
      return;
    }

    // Set current entity from user data
    const user = JSON.parse(userData);
    setCurrentEntity(user.entity_id);
    setNewHoliday(prev => ({ ...prev, entity_id: user.entity_id }));
  }, [navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewHoliday({ ...newHoliday, [name]: value });
  };

  const handleAddHoliday = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    if (!newHoliday.holiday_date || !newHoliday.description) {
      setError("All fields are required");
      setLoading(false);
      return;
    }

    try {
      const response = await axios.post("http://localhost:5000/add_holiday", newHoliday);
      
      if (response.status === 201) {
        setSuccess(true);
        setNewHoliday({ 
          holiday_date: "", 
          description: "", 
          entity_id: currentEntity 
        });
        
        // Redirect to holidays list after successful addition
        setTimeout(() => {
          navigate("/holidays");
        }, 2000);
      }
    } catch (err) {
      console.error("Error adding holiday:", err);
      setError(err.response?.data?.error || "Failed to add holiday. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="holidays-container">
      <Navbar />
      <div className="holidays-content">
        <h1>Add New Holiday</h1>
        <p>Create a new holiday for your entity</p>

        {success && (
          <div className="success-message">
            Holiday added successfully! Redirecting to holidays list...
          </div>
        )}

        {error && (
          <div className="error-message">{error}</div>
        )}

        <div className="add-holiday-form">
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
                placeholder="Enter holiday description"
              />
            </div>
            <div className="form-actions">
              <button 
                type="button" 
                className="btn-cancel"
                onClick={() => navigate("/holidays")}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="btn-submit"
                disabled={loading}
              >
                {loading ? "Adding..." : "Add Holiday"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddHoliday;
