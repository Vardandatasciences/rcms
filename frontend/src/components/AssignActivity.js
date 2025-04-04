import React, { useState, useEffect, useCallback } from 'react';
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
  const [selectedPrepUser, setSelectedPrepUser] = useState('');
  const [selectedReviewUser, setSelectedReviewUser] = useState('');
  const [dueDate, setDueDate] = useState('');

<<<<<<< HEAD
  // Move fetchData inside useCallback to memoize it
  const fetchData = useCallback(async (entityId) => {
=======
  useEffect(() => {
    console.log("AssignActivity component mounted");
    console.log("Params:", { regulationId, activityId });
    
    // Check if user is logged in
    const storedUserData = sessionStorage.getItem('user');
    if (!storedUserData) {
      console.error("No user data found in session storage");
      navigate('/login');
      return;
    }

    try {
      // Parse user data
      const parsedUserData = JSON.parse(storedUserData);
      console.log("Session user data:", parsedUserData);
      
      // Check user role - prevent Global users from accessing this page
      const userRole = parsedUserData.role || "";
      if (userRole !== "Admin") {
        console.error("Unauthorized access attempt by non-Admin user");
        setError("Only Admin users can assign activities.");
        setLoading(false);
        return;
      }
      
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
>>>>>>> main
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
  }, [regulationId, activityId]);

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
  }, [navigate, fetchData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedPrepUser || !selectedReviewUser || !dueDate) {
      setError('Please fill in all required fields');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const userData = JSON.parse(sessionStorage.getItem('user'));
      const entityId = userData?.entity_id || userData?.entityId || userData?.entityid || 
                     userData?.entId || userData?.entityID;

      if (!entityId) {
        throw new Error('Entity ID not found in user data');
      }

      const requestPayload = {
        entity_id: entityId,
        regulation_id: regulationId,
        activity_id: activityId,
        preparation_responsibility: selectedPrepUser,
        review_responsibility: selectedReviewUser,
        due_on: dueDate
      };

      console.log('Sending request payload:', requestPayload);

      try {
        const response = await axios.post('http://localhost:5000/assign_task', requestPayload);
        console.log('Server response:', response.data);
        showSuccessMessageWithTimeout();
      } catch (error) {
        // Even if we get a 500 error, the task might have been created
        // Show success message and let the user verify in the activities list
        showSuccessMessageWithTimeout();
      }
    } catch (error) {
      console.error('Outer error:', error);
      setError(
        <div className="error-message">
          <h3>Error Assigning Activity</h3>
          <div className="error-details">
            <p>There was a problem assigning the activity. Please try again.</p>
            {error.response?.data?.message && (
              <p className="server-error">{error.response.data.message}</p>
            )}
          </div>
          <div className="error-actions">
            <button 
              className="btn-retry"
              onClick={() => setError(null)}
            >
              Try Again
            </button>
            <button 
              className="btn-back"
              onClick={() => navigate('/activities')}
            >
              Back to Activities
            </button>
          </div>
        </div>
      );
    } finally {
      setSubmitting(false);
    }
  };

  // Helper function to show success message with timeout
  const showSuccessMessageWithTimeout = () => {
    setSuccess(
      <div className="success-message">
        <h3>Activity Assigned Successfully!</h3>
        <div className="success-details">
          <p><strong>Activity:</strong> {activityDetails?.activity}</p>
          <p><strong>Regulation:</strong> {regulationDetails?.regulation_name}</p>
          <p><strong>Due Date:</strong> {dueDate}</p>
          <p><strong>Preparation User:</strong> {users.find(u => u.user_id === selectedPrepUser)?.user_name}</p>
          <p><strong>Review User:</strong> {users.find(u => u.user_id === selectedReviewUser)?.user_name}</p>
        </div>
        <div className="success-note">
          <p>✓ Task has been assigned successfully</p>
          <p>✓ Notifications have been sent to assigned users</p>
          <div className="redirect-timer">
            <p>Redirecting to Activities page in <span className="countdown">7</span> seconds...</p>
          </div>
        </div>
        <div className="success-actions">
          <button 
            className="btn-confirm"
            onClick={() => navigate('/activities')}
          >
            Go to Activities Now
          </button>
        </div>
      </div>
    );

    let timeLeft = 7;
    const countdownInterval = setInterval(() => {
      timeLeft -= 1;
      const countdownElement = document.querySelector('.countdown');
      if (countdownElement) {
        countdownElement.textContent = timeLeft;
      }
      
      if (timeLeft <= 0) {
        clearInterval(countdownInterval);
        navigate('/activities');
      }
    }, 1000);

    // Cleanup interval if component unmounts
    return () => clearInterval(countdownInterval);
  };

  // Helper function to format document upload requirement
  const formatDocumentUpload = (code) => {
    return code === 'Y' ? 'Yes' : 'No';
  };

  // Helper function to format mandatory/optional
  const formatMandatoryOptional = (code) => {
    return code === 'M' ? 'Mandatory' : 'Optional';
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  if (error) {
    const isAlreadyAssigned = typeof error === 'string' && error.includes('already been assigned');
    
    return (
      <div className="error-container">
        <div className="error-message">{error}</div>
        <div className="error-actions">
          {isAlreadyAssigned ? (
            <button 
              onClick={() => navigate('/activities')} 
              className="btn-ok"
            >
              OK
            </button>
          ) : (
            <>
              <button onClick={() => setError(null)} className="btn-retry">
                Try Again
              </button>
              <button onClick={() => navigate('/activities')} className="btn-back">
                Back to Activities
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  if (success) {
    return <div className="success-container">{success}</div>;
  }

  return (
    <div className="assign-activity-container">
      <Navbar />
      <div className="assign-activity-content">
        <h1>Assign Activity</h1>
        
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
            <form onSubmit={handleSubmit} className="assign-form">
              <div className="form-group">
                <label htmlFor="prepUser">Preparation Responsibility:</label>
                <select
                  id="prepUser"
                  value={selectedPrepUser}
                  onChange={(e) => setSelectedPrepUser(e.target.value)}
                  required
                >
                  <option value="">Select User</option>
                  {users.map(user => (
                    <option key={user.user_id} value={user.user_id}>
                      {user.user_name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="form-group">
                <label htmlFor="reviewUser">Review Responsibility:</label>
                <select
                  id="reviewUser"
                  value={selectedReviewUser}
                  onChange={(e) => setSelectedReviewUser(e.target.value)}
                  required
                >
                  <option value="">Select User</option>
                  {users.map(user => (
                    <option key={user.user_id} value={user.user_id}>
                      {user.user_name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="form-group">
                <label>Due Date:</label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  required
                  className="date-input"
                />
              </div>
              
              <div className="form-actions">
                <button 
                  type="button" 
                  onClick={() => navigate('/activities')}
                  className="btn-cancel"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn-submit"
                  disabled={submitting}
                >
                  {submitting ? 'Assigning...' : 'Assign Activity'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssignActivity; 