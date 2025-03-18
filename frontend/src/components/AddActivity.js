import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Navbar from "./Navbar";
import "./AddActivity.css";
import { 
  FaSave, FaTimes, FaExclamationTriangle, FaCheckCircle, 
  FaCalendarAlt, FaClipboardList, FaExclamationCircle, 
  FaFileUpload, FaClock, FaBell, FaInfoCircle, FaArrowLeft
} from "react-icons/fa";

const AddActivity = () => {
  const navigate = useNavigate();
  const [regulations, setRegulations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [selectedRegulationId, setSelectedRegulationId] = useState(""); // Stores Regulation ID
  const [activity, setActivity] = useState({
    activity: "",
    mandatory_optional: "M",
    documentupload_yes_no: "N",
    frequency: "12",
    frequencyTimeline: new Date().toISOString().split('T')[0],
    criticalNonCritical: "Medium",
    ews: "1",
    activityDescription: "",
  });

  // Frequency Mapping (Dropdown to Numeric Value)
  const frequencyOptions = {
    "Only Once": 0,
    "Annually": 1,
    "Monthly": 12,
    "Quarterly": 4,
    "Every 4 Months": 3,
    "Every 2 Months": 6,
    "Half Yearly": 2,
    "Weekly": 52,
    "Fortnightly": 26,
  };

  // Fetch Regulations
  useEffect(() => {
    // Check if user is logged in
    const userData = sessionStorage.getItem("user");
    if (!userData) {
      navigate("/login");
      return;
    }

    fetchRegulations();
  }, [navigate]);

  const fetchRegulations = async () => {
    try {
      setLoading(true);
      const response = await axios.get("http://localhost:5000/regulations");
      setRegulations(response.data.regulations || []);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching regulations:", err);
      setError("Failed to fetch regulations. Please try again later.");
      setLoading(false);
    }
  };

  // Handle input changes in the form
  const handleInputChange = (e) => {
    const { name, value } = e.target;

    // Convert frequency dropdown to numeric value
    if (name === "frequency") {
      setActivity({ ...activity, [name]: frequencyOptions[value] });
    } else {
      setActivity({ ...activity, [name]: value });
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedRegulationId) {
      setError("Please select a Regulation Name.");
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const requestData = {
        regulation_id: selectedRegulationId,
        activity: activity.activity.trim() || "No Activity Name",
        mandatory_optional: activity.mandatory_optional || "M",
        documentupload_yes_no: activity.documentupload_yes_no || "N",
        frequency: activity.frequency !== undefined ? activity.frequency : 12, // Default: Monthly
        frequency_timeline: activity.frequencyTimeline || "2025-01-01", // Default date
        criticality: activity.criticalNonCritical || "Medium",
        ews: activity.ews !== undefined ? activity.ews : 1, // Default 1
        activity_description: activity.activityDescription.trim() || "No Description",
      };

      await axios.post("http://localhost:5000/add_activity", requestData);
      
      setSuccess("Activity added successfully!");
      
      // Wait for 1.5 seconds to show the success message before redirecting
      setTimeout(() => {
        navigate("/activities");
      }, 1500);
      
    } catch (error) {
      console.error("Error adding activity:", error);
      setError(error.response?.data?.error || "Failed to add activity. Please try again.");
      setSubmitting(false);
    }
  };

  return (
    <div className="add-activity-container">
      <Navbar />
      <div className="add-activity-content">
        <div className="page-header">
          <div className="header-title">
            <h1>Add New Activity</h1>
            <p>Create a new compliance activity</p>
          </div>
          <button 
            className="btn-back" 
            onClick={() => navigate("/activities")}
            title="Back to activities"
          >
            <FaArrowLeft className="btn-icon" />
            <span>Back to Activities</span>
          </button>
        </div>
        
        {error && (
          <div className="alert-error">
            <FaExclamationTriangle className="alert-icon" />
            <span>{error}</span>
            <button className="btn-close" onClick={() => setError(null)}>×</button>
          </div>
        )}
        
        {success && (
          <div className="alert-success">
            <FaCheckCircle className="alert-icon" />
            <span>{success}</span>
          </div>
        )}
        
        {loading ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading regulations...</p>
          </div>
        ) : (
          <div className="form-container">
            <form onSubmit={handleSubmit} className="activity-form">
              <div className="form-section">
                <h2 className="section-title">
                  <FaClipboardList className="section-icon" />
                  <span>Regulation Information</span>
                </h2>
                
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="regulationName">
                      <span>Regulation Name</span>
                      <span className="required-mark">*</span>
                    </label>
                    <div className="select-wrapper">
                      <select
                        id="regulationName"
                        name="regulationName"
                        required
                        onChange={(e) => {
                          const selectedRegulation = regulations.find(
                            (reg) => reg.regulation_name === e.target.value
                          );
                          setSelectedRegulationId(selectedRegulation ? selectedRegulation.regulation_id : "");
                        }}
                      >
                        <option value="">Select Regulation Name</option>
                        {regulations.map((reg) => (
                          <option key={reg.regulation_id} value={reg.regulation_name}>
                            {reg.regulation_name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="regulationID">Regulation ID</label>
                    <input 
                      type="text" 
                      id="regulationID" 
                      name="regulationID" 
                      value={selectedRegulationId} 
                      readOnly 
                      className="readonly-input"
                    />
                  </div>
                </div>
              </div>
              
              <div className="form-section">
                <h2 className="section-title">
                  <FaInfoCircle className="section-icon" />
                  <span>Activity Details</span>
                </h2>
                
                <div className="form-row">
                  <div className="form-group full-width">
                    <label htmlFor="activity">
                      <span>Activity Name</span>
                      <span className="required-mark">*</span>
                    </label>
                    <input 
                      type="text" 
                      id="activity" 
                      name="activity" 
                      required 
                      value={activity.activity} 
                      onChange={handleInputChange} 
                      placeholder="Enter activity name"
                    />
                  </div>
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="mandatory_optional">
                      <span>Mandatory/Optional</span>
                      <span className="required-mark">*</span>
                    </label>
                    <div className="select-wrapper">
                      <select
                        id="mandatory_optional"
                        name="mandatory_optional"
                        required
                        value={activity.mandatory_optional}
                        onChange={handleInputChange}
                      >
                        <option value="M">Mandatory</option>
                        <option value="O">Optional</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="documentupload_yes_no">
                      <span>Document Upload Required</span>
                    </label>
                    <div className="select-wrapper">
                      <select
                        id="documentupload_yes_no"
                        name="documentupload_yes_no"
                        value={activity.documentupload_yes_no}
                        onChange={handleInputChange}
                      >
                        <option value="N">No</option>
                        <option value="Y">Yes</option>
                      </select>
                    </div>
                  </div>
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="criticalNonCritical">
                      <span>Criticality</span>
                      <span className="required-mark">*</span>
                    </label>
                    <div className="select-wrapper">
                      <select
                        id="criticalNonCritical"
                        name="criticalNonCritical"
                        required
                        value={activity.criticalNonCritical}
                        onChange={handleInputChange}
                      >
                        <option value="High">High</option>
                        <option value="Medium">Medium</option>
                        <option value="Low">Low</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="ews">
                      <span>Early Warning Days</span>
                      <span className="required-mark">*</span>
                    </label>
                    <div className="input-with-icon">
                      <FaBell className="input-icon" />
                      <input
                        type="number"
                        id="ews"
                        name="ews"
                        min="1"
                        required
                        value={activity.ews}
                        onChange={handleInputChange}
                        placeholder="Days before due date"
                      />
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="form-section">
                <h2 className="section-title">
                  <FaClock className="section-icon" />
                  <span>Frequency Settings</span>
                </h2>
                
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="frequency">
                      <span>Frequency</span>
                      <span className="required-mark">*</span>
                    </label>
                    <div className="select-wrapper">
                      <select
                        id="frequency"
                        name="frequency"
                        required
                        onChange={handleInputChange}
                      >
                        {Object.entries(frequencyOptions).map(([label, value]) => (
                          <option 
                            key={value} 
                            value={label} 
                            selected={parseInt(activity.frequency) === value}
                          >
                            {label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="frequencyTimeline">
                      <span>Start Date</span>
                      <span className="required-mark">*</span>
                    </label>
                    <div className="input-with-icon">
                      <FaCalendarAlt className="input-icon" />
                      <input
                        type="date"
                        id="frequencyTimeline"
                        name="frequencyTimeline"
                        required
                        value={activity.frequencyTimeline}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="form-section">
                <h2 className="section-title">
                  <FaFileUpload className="section-icon" />
                  <span>Additional Information</span>
                </h2>
                
                <div className="form-row">
                  <div className="form-group full-width">
                    <label htmlFor="activityDescription">
                      <span>Activity Description</span>
                      <span className="required-mark">*</span>
                    </label>
                    <textarea
                      id="activityDescription"
                      name="activityDescription"
                      rows="4"
                      required
                      value={activity.activityDescription}
                      onChange={handleInputChange}
                      placeholder="Provide a detailed description of the activity"
                    ></textarea>
                  </div>
                </div>
              </div>
              
              <div className="form-actions">
                <button 
                  type="button" 
                  className="btn-cancel" 
                  onClick={() => navigate("/activities")}
                  disabled={submitting}
                >
                  <FaTimes className="btn-icon" />
                  <span>Cancel</span>
                </button>
                <button 
                  type="submit" 
                  className="btn-save" 
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <div className="btn-spinner"></div>
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <FaSave className="btn-icon" />
                      <span>Save Activity</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default AddActivity;
