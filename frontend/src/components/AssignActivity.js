import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from './Navbar';
import './AssignActivity.css';

const AssignActivity = () => {
  const { regulationId, activityId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [activityDetails, setActivityDetails] = useState(null);
  const [regulationDetails, setRegulationDetails] = useState(null);
  const [users, setUsers] = useState([]);
  const [userData, setUserData] = useState(null);
  const [dueDate, setDueDate] = useState("");
  const [formData, setFormData] = useState({
    preparation_responsibility: '',
    review_responsibility: '',
  });

  useEffect(() => {
    // Check if user is logged in
    const storedUserData = sessionStorage.getItem('user');
    if (!storedUserData) {
      navigate('/login');
      return;
    }

    try {
      // Parse user data
      const parsedUserData = JSON.parse(storedUserData);
      console.log("Session user data:", parsedUserData);
      setUserData(parsedUserData);
      
      // Get entity_id - check all possible locations in the user data structure
      let entityId = null;
      
      // Check for different possible property names for entity_id
      if (parsedUserData.entity_id) {
        entityId = parsedUserData.entity_id;
      } else if (parsedUserData.entityId) {
        entityId = parsedUserData.entityId;
      } else if (parsedUserData.entityid) {
        entityId = parsedUserData.entityid;
      } else if (parsedUserData.entId) {
        entityId = parsedUserData.entId;
      } else if (parsedUserData.entityID) {
        entityId = parsedUserData.entityID;
      } else if (parsedUserData.entityId) {
        entityId = parsedUserData.entityId;
      }
      
      if (!entityId) {
        // Log the entire user data to see its structure
        console.error("Could not find entity_id in user data. User data structure:", parsedUserData);
        setError("User entity information is missing. Please log in again.");
        setLoading(false);
        return;
      }
      
      console.log("Using entity_id:", entityId);
      
      // Fetch data with the validated entity_id
      fetchData(entityId);
    } catch (err) {
      console.error("Error parsing user data:", err);
      setError("Invalid user session. Please log in again.");
      setLoading(false);
    }
  }, [navigate, regulationId, activityId]);

  const fetchData = async (entityId) => {
    try {
      setLoading(true);
      
      if (!entityId) {
        throw new Error("Entity ID is required to fetch data");
      }
      
      console.log("Fetching data for entity:", entityId);
      
      // Fetch activity details and regulation details first
      const [activityResponse, regulationResponse] = await Promise.all([
        axios.get(`http://localhost:5000/activity_details/${regulationId}/${activityId}`),
        axios.get(`http://localhost:5000/regulation_details/${regulationId}`)
      ]);
      
      // Set activity and regulation details
      setActivityDetails(activityResponse.data.activity);
      setRegulationDetails(regulationResponse.data.regulation);
      
      // Now fetch users separately to ensure we can debug any issues
      console.log("Fetching users for entity:", entityId);
      const usersResponse = await axios.get(`http://localhost:5000/entity_users/${entityId}`);
      console.log("Users response:", usersResponse.data);
      setUsers(usersResponse.data.users || []);
      
      // Fetch due date
      const dueDateResponse = await axios.get(`http://localhost:5000/calculate_due_date/${regulationId}/${activityId}`);
      setDueDate(dueDateResponse.data.due_on);
      
      // Check if task already exists
      const taskExistsResponse = await axios.get(
        `http://localhost:5000/check_task_exists/${entityId}/${regulationId}/${activityId}`
      );
      
      if (taskExistsResponse.data.exists) {
        setError('This activity has already been assigned for your entity.');
        setLoading(false);
        return;
      }
      
      setLoading(false);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(`Failed to fetch data: ${err.message}. Please try again later.`);
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.preparation_responsibility || !formData.review_responsibility) {
      setError('Please select both preparation and review responsibilities.');
      return;
    }
    
    // Get entity_id from userData with fallbacks for different property names
    let entityId = null;
    if (userData) {
      entityId = userData.entity_id || userData.entityId || userData.entityid || 
                userData.entId || userData.entityID || userData.entityId;
    }
    
    if (!entityId) {
      setError('User entity information is missing. Please log in again.');
      return;
    }
    
    try {
      setSubmitting(true);
      setError(null);
      
      const requestData = {
        entity_id: entityId,
        regulation_id: regulationId,
        activity_id: activityId,
        preparation_responsibility: formData.preparation_responsibility,
        review_responsibility: formData.review_responsibility,
        due_on: dueDate,
      };
      
      console.log("Submitting assignment data:", requestData);
      
      const response = await axios.post('http://localhost:5000/assign_task', requestData);
      
      setSuccess('Activity assigned successfully!');
      
      // Wait for 1.5 seconds to show the success message before redirecting
      setTimeout(() => {
        navigate('/activities');
      }, 1500);
      
    } catch (error) {
      console.error('Error assigning activity:', error);
      setError(error.response?.data?.error || 'Failed to assign activity. Please try again.');
      setSubmitting(false);
    }
  };

  // Helper function to format document upload requirement
  const formatDocumentUpload = (code) => {
    return code === 'Y' ? 'Yes' : 'No';
  };

  // Helper function to format mandatory/optional
  const formatMandatoryOptional = (code) => {
    return code === 'M' ? 'Mandatory' : 'Optional';
  };

  // Debug function to help users troubleshoot
  const handleDebugClick = () => {
    try {
      const storedUserData = sessionStorage.getItem('user');
      if (!storedUserData) {
        alert("No user data found in session storage. Please log in again.");
        navigate('/login');
        return;
      }
      
      const parsedUserData = JSON.parse(storedUserData);
      alert(`User data found: ${JSON.stringify(parsedUserData, null, 2)}`);
      
      // Force a refresh of the component
      window.location.reload();
    } catch (err) {
      alert(`Error debugging: ${err.message}`);
    }
  };

  return (
    <div className="assign-activity-container">
      <Navbar />
      <div className="assign-activity-content">
        <h1>Assign Activity</h1>
        
        {loading ? (
          <div className="loading">Loading activity details...</div>
        ) : error ? (
          <div className="error-message">
            {error}
            <div className="mt-3">
              <button 
                className="btn-back" 
                onClick={() => navigate('/activities')}
              >
                Back to Activities
              </button>
              <button 
                className="btn-debug" 
                onClick={handleDebugClick}
              >
                Debug Session
              </button>
            </div>
          </div>
        ) : success ? (
          <div className="success-message">{success}</div>
        ) : (
          <div className="assign-activity-grid">
            <div className="activity-details-card">
              <h2>Activity Details</h2>
              
              <div className="detail-item">
                <span className="detail-label">Regulation ID:</span>
                <span className="detail-value">{regulationId}</span>
              </div>
              
              <div className="detail-item">
                <span className="detail-label">Regulation Name:</span>
                <span className="detail-value">{regulationDetails?.regulation_name}</span>
              </div>
              
              <div className="detail-item">
                <span className="detail-label">Activity ID:</span>
                <span className="detail-value">{activityId}</span>
              </div>
              
              <div className="detail-item">
                <span className="detail-label">Activity Name:</span>
                <span className="detail-value">{activityDetails?.activity}</span>
              </div>
              
              <div className="detail-item">
                <span className="detail-label">Criticality:</span>
                <span className="detail-value">{activityDetails?.criticality}</span>
              </div>
              
              <div className="detail-item">
                <span className="detail-label">Mandatory/Optional:</span>
                <span className="detail-value">
                  {activityDetails ? formatMandatoryOptional(activityDetails.mandatory_optional) : ''}
                </span>
              </div>
              
              <div className="detail-item">
                <span className="detail-label">Document Upload Required:</span>
                <span className="detail-value">
                  {activityDetails ? formatDocumentUpload(activityDetails.documentupload_yes_no) : ''}
                </span>
              </div>
              
              <div className="detail-item">
                <span className="detail-label">Frequency:</span>
                <span className="detail-value">{activityDetails?.frequency}</span>
              </div>
              
              <div className="detail-item">
                <span className="detail-label">Early Warning Days:</span>
                <span className="detail-value">{activityDetails?.ews}</span>
              </div>
            </div>
            
            <div className="assignment-form-card">
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label htmlFor="preparation_responsibility">Assign To (Preparation Responsibility):</label>
                  <select
                    id="preparation_responsibility"
                    name="preparation_responsibility"
                    value={formData.preparation_responsibility}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Select User</option>
                    {users && users.length > 0 ? (
                      users.map((user) => (
                        <option key={user.user_id} value={user.user_id}>
                          {user.user_name}
                        </option>
                      ))
                    ) : (
                      <option value="" disabled>No users available</option>
                    )}
                  </select>
                  {users && users.length === 0 && (
                    <p className="help-text error-text">
                      No users found for this entity. Please ensure users are added to your entity.
                    </p>
                  )}
                </div>
                
                <div className="form-group">
                  <label htmlFor="review_responsibility">Reviewer (Review Responsibility):</label>
                  <select
                    id="review_responsibility"
                    name="review_responsibility"
                    value={formData.review_responsibility}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Select User</option>
                    {users && users.length > 0 ? (
                      users.map((user) => (
                        <option key={user.user_id} value={user.user_id}>
                          {user.user_name}
                        </option>
                      ))
                    ) : (
                      <option value="" disabled>No users available</option>
                    )}
                  </select>
                </div>
                
                <div className="form-group">
                  <label htmlFor="due_date">Due Date (Calculated Automatically):</label>
                  <input
                    type="text"
                    id="due_date"
                    value={dueDate}
                    readOnly
                    className="readonly-input"
                  />
                  <p className="help-text">
                    Due date is calculated automatically based on frequency and adjusted for
                    holidays and weekends.
                  </p>
                </div>
                
                <div className="form-actions">
                  <button 
                    type="submit" 
                    className="btn-save" 
                    disabled={submitting || users.length === 0}
                  >
                    {submitting ? 'Assigning...' : 'Assign Activity'}
                  </button>
                  <button
                    type="button"
                    className="btn-cancel"
                    onClick={() => navigate('/activities')}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AssignActivity; 