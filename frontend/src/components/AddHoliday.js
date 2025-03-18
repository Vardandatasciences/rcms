import React, { useState, useEffect } from "react";
import axios from "axios";
import "./AddHoliday.css"; // Import styles

const AddHoliday = ({ onClose, onHolidayAdded }) => {
  const [entities, setEntities] = useState([]);
  const [holidayData, setHolidayData] = useState({
    holiday_date: "",
    description: "",
    entity_id: "",
  });

  useEffect(() => {
    fetchEntities();
  }, []);

  // Fetch entities for the dropdown
  const fetchEntities = () => {
    axios
      .get("http://localhost:5000/entities") // Fetch from existing API
      .then((response) => setEntities(response.data.entities))
      .catch((error) => console.error("Error fetching entities:", error));
  };

  // Handle form input changes
  const handleChange = (e) => {
    setHolidayData({ ...holidayData, [e.target.name]: e.target.value });
  };

  // Submit the form to add a holiday
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!holidayData.entity_id) {
      alert("Please select an entity.");
      return;
    }

    axios
      .post("http://localhost:5000/add_holiday", holidayData, {
        headers: { "Content-Type": "application/json" },
      })
      .then(() => {
        onHolidayAdded(); // Refresh holiday list
        onClose(); // Close the modal
      })
      .catch((error) => console.error("Error adding holiday:", error));
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>Add Holiday</h2>
        <form onSubmit={handleSubmit}>
          <label>Date:</label>
          <input type="date" name="holiday_date" value={holidayData.holiday_date} onChange={handleChange} required />

          <label>Description:</label>
          <input type="text" name="description" value={holidayData.description} onChange={handleChange} required />

          <label>Entity:</label>
          <select name="entity_id" value={holidayData.entity_id} onChange={handleChange} required>
            <option value="">Select Entity</option>
            {entities.map((entity) => (
              <option key={entity.entity_id} value={entity.entity_id}>
                {entity.entity_name} ({entity.location})
              </option>
            ))}
          </select>

          <button type="submit" className="save-btn">Save</button>
          <button type="button" className="cancel-btn" onClick={onClose}>Cancel</button>
        </form>
      </div>
    </div>
  );
};

export default AddHoliday;
