import React, { useState, useEffect } from "react";
import axios from "axios";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import Navbar from "./Navbar";
import "./ReassignTask.css";

const ReassignTask = () => {
  const { taskId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const taskData = location.state?.task;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [users, setUsers] = useState([]);
  const [userData, setUserData] = useState(null);
  const [taskDetails, setTaskDetails] = useState(null);
  const [entityId, setEntityId] = useState(null);
  
  const [formData, setFormData] = useState({
    preparation_responsibility: "",
    review_responsibility: "",
  });

  useEffect(() => {
    // Check if user is logged in
    const storedUserData = sessionStorage.getItem("user");
    if (!storedUserData) {
      navigate("/login");
      return;
    }

    try {
      // Parse user data
      const parsedUserData = JSON.parse(storedUserData);
      setUserData(parsedUserData);
      
      // Get entity_id from userData with fallbacks for different property names
      let foundEntityId = null;
      if (parsedUserData) {
        foundEntityId = parsedUserData.entity_id || parsedUserData.entityId || parsedUserData.entityid || 
                  parsedUserData.entId || parsedUserData.entityID || parsedUserData.entityId;
      }
      
      if (!foundEntityId) {
        setError("User entity information is missing. Please log in again.");
        setLoading(false);
        return;
      }
      
      setEntityId(foundEntityId);
      
      // If task data was passed via location state, use it
      if (taskData) {
        console.log("Using task data from location state:", taskData);
        setTaskDetails(taskData);
        setFormData({
          preparation_responsibility: taskData.preparation_responsibility || "",
          review_responsibility: taskData.review_responsibility || "",
        });
        // Fetch users for the entity
        fetchUsers(foundEntityId);
      } else {
        // Otherwise fetch task details
        fetchTaskDetails(taskId, foundEntityId);
      }
    } catch (err) {
      console.error("Error parsing user data:", err);
      setError("Invalid user session. Please log in again.");
      setLoading(false);
    }
  }, [navigate, taskId, taskData]);

  const fetchTaskDetails = async (id, entityId) => {
    try {
      console.log(`Fetching task details for task ID: ${id}`);
      const response = await axios.get(`http://localhost:5000/task/${id}`);
      console.log("Task details response:", response.data);
      
      if (response.data && response.data.task) {
        setTaskDetails(response.data.task);
        setFormData({
          preparation_responsibility: response.data.task.preparation_responsibility || "",
          review_responsibility: response.data.task.review_responsibility || "",
        });
        
        // Now fetch users for the entity
        fetchUsers(entityId);
      } else {
        throw new Error("Invalid response format from server");
      }
    } catch (err) {
      console.error("Error fetching task details:", err);
      setError(`Failed to fetch task details: ${err.message}. Please try again later.`);
      setLoading(false);
    }
  };

  const fetchUsers = async (entityId) => {
    try {
      console.log(`Fetching users for entity ID: ${entityId}`);
      const response = await axios.get(`http://localhost:5000/entity_users/${entityId}`);
      console.log("Users response:", response.data);
      
      if (response.data && Array.isArray(response.data.users)) {
        setUsers(response.data.users);
      } else {
        console.warn("Users response does not contain an array of users:", response.data);
        setUsers([]);
      }
      setLoading(false);
    } catch (err) {
      console.error("Error fetching users:", err);
      setError(`Failed to fetch users: ${err.message}. Please try again later.`);
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
    setSubmitting(true);
    setError(null);

    try {
        if (!entityId) {
            throw new Error("Entity ID is missing. Please log in again.");
        }

        const requestData = {
            task_id: taskId,
            entity_id: entityId,
            regulation_id: taskDetails.regulation_id,
            activity_id: taskDetails.activity_id,
            preparation_responsibility: formData.preparation_responsibility,
            review_responsibility: formData.review_responsibility
        };

        console.log('Sending reassignment request:', requestData);

        const response = await axios.post('http://localhost:5000/reassign_task', requestData);
        console.log('Reassignment response:', response.data);

        // Show success message with notification status
        const notificationStatus = response.data.notifications_sent || {};
        const notificationErrors = response.data.notification_errors || [];
        
        setSuccess(
            <div className="success-message">
                <h3>Task Reassigned Successfully!</h3>
                <div className="success-details">
                    <p><strong>Activity:</strong> {taskDetails.activity_name}</p>
                    <p><strong>Regulation:</strong> {taskDetails.regulation_name}</p>
                    <p><strong>Due Date:</strong> {taskDetails.due_on}</p>
                    <p><strong>New Assignee:</strong> {users.find(u => u.user_id === formData.preparation_responsibility)?.user_name}</p>
                    <p><strong>New Reviewer:</strong> {users.find(u => u.user_id === formData.review_responsibility)?.user_name}</p>
                </div>
                <div className="success-note">
                    <p>✓ Task has been reassigned successfully</p>
                    {(notificationStatus.assignee || notificationStatus.reviewer) && (
                        <p>✓ Email notifications sent to:</p>
                    )}
                    {notificationStatus.assignee && (
                        <p style={{marginLeft: '20px'}}>• Assignee</p>
                    )}
                    {notificationStatus.reviewer && (
                        <p style={{marginLeft: '20px'}}>• Reviewer</p>
                    )}
                    {notificationErrors.length > 0 && (
                        <div className="note-warning">
                            <p>Some notifications could not be sent:</p>
                            {notificationErrors.map((error, index) => (
                                <p key={index} style={{marginLeft: '20px'}}>• {error}</p>
                            ))}
                        </div>
                    )}
                    <div className="redirect-timer">
                        <p>Redirecting to Tasks page in <span className="countdown">7</span> seconds...</p>
                    </div>
                </div>
                <div className="success-actions">
                    <button 
                        className="btn-confirm"
                        onClick={() => navigate('/tasks')}
                    >
                        Go to Tasks Now
                    </button>
                </div>
            </div>
        );

        // Start countdown timer
        let timeLeft = 7;
        const countdownInterval = setInterval(() => {
            timeLeft -= 1;
            const countdownElement = document.querySelector('.countdown');
            if (countdownElement) {
                countdownElement.textContent = timeLeft;
            }
            
            if (timeLeft <= 0) {
                clearInterval(countdownInterval);
                navigate('/tasks');
            }
        }, 1000);

    } catch (error) {
        console.error('Error reassigning task:', error);
        setError(
            <div className="error-message">
                <h3>Error Reassigning Task</h3>
                <div className="error-details">
                    <p className="error-main">There was a problem reassigning the task.</p>
                    <p className="error-detail">The task may have been reassigned, but there was an issue with notifications.</p>
                    <p className="error-detail">Please check the tasks list to verify the reassignment.</p>
                </div>
                {error.response?.data?.error && (
                    <div className="error-technical">
                        <p>Technical Details:</p>
                        <p>{error.response.data.error}</p>
                    </div>
                )}
                <div className="error-actions">
                    <button 
                        className="btn-check"
                        onClick={() => navigate('/tasks')}
                    >
                        Check Tasks List
                    </button>
                    <button 
                        className="btn-retry"
                        onClick={() => setError(null)}
                    >
                        Try Again
                    </button>
                </div>
            </div>
        );
    } finally {
        setSubmitting(false);
    }
  };

  // Format date for display
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
    <div className="reassign-task-container">
      <Navbar />
      <div className="reassign-task-content">
        <h1>Reassign Task</h1>
        
        {loading ? (
          <div className="loading">Loading task details...</div>
        ) : error ? (
          <div className="error-message">
            {error}
            <div className="mt-3">
              <button 
                className="btn-back" 
                onClick={() => navigate("/tasks")}
              >
                Back to Tasks
              </button>
            </div>
          </div>
        ) : success ? (
          <div className="success-message">{success}</div>
        ) : (
          <div className="reassign-task-grid">
            <div className="task-details-card">
              <h2>Task Details</h2>
              
              <div className="detail-item">
                <span className="detail-label">Regulation:</span>
                <span className="detail-value">{taskDetails?.regulation_name || "N/A"}</span>
              </div>
              
              <div className="detail-item">
                <span className="detail-label">Activity:</span>
                <span className="detail-value">{taskDetails?.activity_name || "N/A"}</span>
              </div>
              
              <div className="detail-item">
                <span className="detail-label">Due Date:</span>
                <span className="detail-value">{formatDate(taskDetails?.due_on)}</span>
              </div>
              
              <div className="detail-item">
                <span className="detail-label">Status:</span>
                <span className="detail-value">{taskDetails?.status || "N/A"}</span>
              </div>
              
              <div className="detail-item">
                <span className="detail-label">Criticality:</span>
                <span className="detail-value">{taskDetails?.criticality || "N/A"}</span>
              </div>
              
              <div className="detail-item">
                <span className="detail-label">Current Assignee:</span>
                <span className="detail-value">{taskDetails?.preparation_responsibility_name || "None"}</span>
              </div>
              
              <div className="detail-item">
                <span className="detail-label">Current Reviewer:</span>
                <span className="detail-value">{taskDetails?.review_responsibility_name || "None"}</span>
              </div>
            </div>
            
            <div className="reassignment-form-card">
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label htmlFor="preparation_responsibility">Reassign To (Preparation Responsibility):</label>
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
                  <label htmlFor="review_responsibility">Reassign Reviewer (Review Responsibility):</label>
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
                
                <div className="form-actions">
                  <button 
                    type="submit" 
                    className="btn-save" 
                    disabled={submitting || users.length === 0}
                  >
                    {submitting ? "Reassigning..." : "Reassign Task"}
                  </button>
                  <button
                    type="button"
                    className="btn-cancel"
                    onClick={() => navigate("/tasks")}
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

export default ReassignTask; 