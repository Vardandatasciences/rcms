import React, { useState, useEffect } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "./Navbar";
import "./EditActivity.css";
import { 
  FaSave, FaTimes, FaExclamationTriangle, FaCheckCircle, 
  FaCalendarAlt, FaClipboardList, FaExclamationCircle, 
  FaFileUpload, FaClock, FaBell, FaInfoCircle, FaArrowLeft,
  FaEdit
} from "react-icons/fa";

const EditActivity = () => {
  const { regulationId, activityId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [activityData, setActivityData] = useState({
    regulation_id: "",
    activity_id: "",
    activity: "",
    mandatory_optional: "M",
    documentupload_yes_no: "N",
    frequency: 12,
    frequency_timeline: "",
    criticality: "Medium",
    ews: 1,
    activity_description: "",
  });

  // Frequency Mapping (Numeric Value to Dropdown)
  const frequencyOptions = {
    0: "Only Once",
    1: "Annually",
    12: "Monthly",
    4: "Quarterly",
    3: "Every 4 Months",
    6: "Every 2 Months",
    2: "Half Yearly",
    52: "Weekly",
    26: "Fortnightly",
  };

  // Fetch Activity Data
  useEffect(() => {
    // Check if user is logged in
    const userData = sessionStorage.getItem("user");
    if (!userData) {
      navigate("/login");
      return;
    }

    if (!regulationId || !activityId) {
      setError("Invalid activity parameters");
      setLoading(false);
      return;
    }

    fetchActivityData();
  }, [navigate, regulationId, activityId]);

  const fetchActivityData = async () => {
    try {
      setLoading(true);
      
      // Fetch activities
      const response = await axios.get("http://localhost:5000/activities");
      
      if (!response.data || !response.data.activities) {
        throw new Error("Failed to fetch activities data");
      }
      
      // Find the specific activity
      const activity = response.data.activities.find(
        (act) => act.regulation_id === regulationId && act.activity_id === parseInt(activityId)
      );
      
      if (!activity) {
        throw new Error("Activity not found");
      }
      
      // Set activity data
      setActivityData({
        regulation_id: activity.regulation_id || "",
        activity_id: activity.activity_id || "",
        activity: activity.activity || "",
        mandatory_optional: activity.mandatory_optional || "M",
        documentupload_yes_no: activity.documentupload_yes_no || "N",
        frequency: activity.frequency || 12,
        frequency_timeline: activity.frequency_timeline ? activity.frequency_timeline.substring(0, 10) : "",
        criticality: activity.criticality || "Medium",
        ews: activity.ews || 1,
        activity_description: activity.activity_description || "",
      });
      
      setLoading(false);
    } catch (err) {
      console.error("Error fetching activity data:", err);
      setError(err.message || "Failed to fetch activity data. Please try again later.");
      setLoading(false);
    }
  };

  // Handle input changes in the form
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Special handling for frequency dropdown
    if (name === "frequency") {
      // Find the numeric value for the selected frequency option
      const numericValue = Object.entries(frequencyOptions).find(([key, label]) => label === value)?.[0] || 12;
      setActivityData({ ...activityData, [name]: parseInt(numericValue) });
    } else {
      setActivityData({ ...activityData, [name]: value });
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setSubmitting(true);
      setError(null);
      
      const requestData = {
        activity: activityData.activity.trim(),
        mandatory_optional: activityData.mandatory_optional,
        documentupload_yes_no: activityData.documentupload_yes_no,
        frequency: activityData.frequency,
        frequency_timeline: activityData.frequency_timeline,
        criticality: activityData.criticality,
        ews: activityData.ews,
        activity_description: activityData.activity_description.trim(),
      };
      
      await axios.post(
        `http://localhost:5000/update_activity/${regulationId}/${activityId}`,
        requestData
      );
      
      setSuccess("Activity updated successfully!");
      
      // Wait for 1.5 seconds to show the success message before redirecting
      setTimeout(() => {
        navigate("/activities");
      }, 1500);
      
    } catch (error) {
      console.error("Error updating activity:", error);
      setError(error.response?.data?.error || "Failed to update activity. Please try again.");
      setSubmitting(false);
    }
  };

  return (
    <div className="edit-activity-container">
      <Navbar />
      <div className="edit-activity-content">
        <div className="page-header">
          <div className="header-title">
            <h1>Edit Activity</h1>
            <p>Update activity details</p>
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
            <p>Loading activity data...</p>
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
                    <label htmlFor="regulation_id">Regulation ID</label>
                    <input
                      type="text"
                      id="regulation_id"
                      name="regulation_id"
                      value={activityData.regulation_id || ""}
                      readOnly
                      className="readonly-input"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="activity_id">Activity ID</label>
                    <input
                      type="text"
                      id="activity_id"
                      name="activity_id"
                      value={activityData.activity_id || ""}
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
                      value={activityData.activity || ""}
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
                        value={activityData.mandatory_optional || "M"}
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
                        value={activityData.documentupload_yes_no || "N"}
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
                    <label htmlFor="criticality">
                      <span>Criticality</span>
                      <span className="required-mark">*</span>
                    </label>
                    <div className="select-wrapper">
                      <select
                        id="criticality"
                        name="criticality"
                        required
                        value={activityData.criticality || "Medium"}
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
                        value={activityData.ews || 1}
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
                        value={frequencyOptions[activityData.frequency] || "Monthly"}
                        onChange={handleInputChange}
                      >
                        {Object.entries(frequencyOptions).map(([value, label]) => (
                          <option key={value} value={label}>
                            {label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="frequency_timeline">
                      <span>Start Date</span>
                      <span className="required-mark">*</span>
                    </label>
                    <div className="input-with-icon">
                      <FaCalendarAlt className="input-icon" />
                      <input
                        type="date"
                        id="frequency_timeline"
                        name="frequency_timeline"
                        required
                        value={activityData.frequency_timeline || ""}
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
                    <label htmlFor="activity_description">
                      <span>Activity Description</span>
                      <span className="required-mark">*</span>
                    </label>
                    <textarea
                      id="activity_description"
                      name="activity_description"
                      rows="4"
                      required
                      value={activityData.activity_description || ""}
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
                      <span>Updating...</span>
                    </>
                  ) : (
                    <>
                      <FaSave className="btn-icon" />
                      <span>Update Activity</span>
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

export default EditActivity;
