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
      let entityId = null;
      if (parsedUserData) {
        entityId = parsedUserData.entity_id || parsedUserData.entityId || parsedUserData.entityid || 
                  parsedUserData.entId || parsedUserData.entityID || parsedUserData.entityId;
      }
      
      if (!entityId) {
        setError("User entity information is missing. Please log in again.");
        setLoading(false);
        return;
      }
      
      // If task data was passed via location state, use it
      if (taskData) {
        console.log("Using task data from location state:", taskData);
        setTaskDetails(taskData);
        setFormData({
          preparation_responsibility: taskData.preparation_responsibility || "",
          review_responsibility: taskData.review_responsibility || "",
        });
        // Fetch users for the entity
        fetchUsers(entityId);
      } else {
        // Otherwise fetch task details
        fetchTaskDetails(taskId, entityId);
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
    
    if (!formData.preparation_responsibility || !formData.review_responsibility) {
      setError("Please select both preparation and review responsibilities.");
      return;
    }
    
    try {
      setSubmitting(true);
      setError(null);
      
      // Get entity_id from userData with fallbacks for different property names
      let entityId = null;
      if (userData) {
        entityId = userData.entity_id || userData.entityId || userData.entityid || 
                  userData.entId || userData.entityID || userData.entityId;
      }
      
      if (!taskDetails || !taskDetails.regulation_id || !taskDetails.activity_id) {
        throw new Error("Task details are incomplete. Please refresh the page and try again.");
      }
      
      const requestData = {
        task_id: taskId,
        entity_id: entityId,
        regulation_id: taskDetails.regulation_id,
        activity_id: taskDetails.activity_id,
        preparation_responsibility: formData.preparation_responsibility,
        review_responsibility: formData.review_responsibility,
        due_on: taskDetails.due_on,
      };
      
      console.log("Submitting reassignment data:", requestData);
      
      const response = await axios.post("http://localhost:5000/reassign_task", requestData);
      console.log("Reassignment response:", response.data);
      
      setSuccess("Task reassigned successfully!");
      
      // Wait for 1.5 seconds to show the success message before redirecting
      setTimeout(() => {
        navigate("/tasks");
      }, 1500);
      
    } catch (error) {
      console.error("Error reassigning task:", error);
      setError(error.response?.data?.error || "Failed to reassign task. Please try again.");
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