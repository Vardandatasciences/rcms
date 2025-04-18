import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Navbar from "./Navbar";
import "./UserTask.css"; // Import styles

const Tasks = () => {
  const [assignedTasks, setAssignedTasks] = useState([]);
  const [reviewTasks, setReviewTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [taskStatus, setTaskStatus] = useState("");
  const [taskRemarks, setTaskRemarks] = useState("");
  const [uploadFile, setUploadFile] = useState(null);
  const [regulations, setRegulations] = useState({});
  const [userData, setUserData] = useState(null);
  const [activeTab, setActiveTab] = useState("assigned"); // "assigned" or "review"
  // Add new state variables for status change container
  const [statusChangeTask, setStatusChangeTask] = useState(null);
  const [statusChangeRemarks, setStatusChangeRemarks] = useState("");
  const [statusChangeFile, setStatusChangeFile] = useState(null);
  const [newStatus, setNewStatus] = useState("");
  // Add new state variables after existing state declarations
  const [reviewStatusChangeTask, setReviewStatusChangeTask] = useState(null);
  const [reviewStatusChangeRemarks, setReviewStatusChangeRemarks] = useState("");
  const [reviewStatusChangeFile, setReviewStatusChangeFile] = useState(null);
  const [newReviewStatus, setNewReviewStatus] = useState("");
  // Add new state variable for success popup
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [successPopupData, setSuccessPopupData] = useState(null);
  // Add new state variable for user names
  const [userNames, setUserNames] = useState({});
  
  const navigate = useNavigate();

  // Get user data directly from sessionStorage
  const getUserData = () => {
    const userData = sessionStorage.getItem("user");
    if (!userData) {
      return null;
    }
    try {
      return JSON.parse(userData);
    } catch (e) {
      console.error("Error parsing user data:", e);
      return null;
    }
  };

  // Add function to fetch user names after the getUserData function
  const fetchUserNames = async (tasks) => {
    try {
      const uniqueUserIds = new Set();
      tasks.forEach(task => {
        if (task.preparation_responsibility) uniqueUserIds.add(task.preparation_responsibility);
        if (task.review_responsibility) uniqueUserIds.add(task.review_responsibility);
      });

      const userDetails = {};
      for (const userId of uniqueUserIds) {
        const response = await axios.get(`http://localhost:5000/user_details/${userId}`);
        if (response.data && response.data.user) {
          userDetails[userId] = response.data.user.user_name;
        }
      }
      setUserNames(userDetails);
    } catch (err) {
      console.error("Error fetching user names:", err);
    }
  };

  // Initial data load
  useEffect(() => {
    // Check if user is logged in
    const user = getUserData();
    if (!user) {
      navigate("/login");
      return;
    }
    
    // Redirect non-User roles to the Tasks component
    if (user.role !== "User") {
      navigate("/tasks");
      return;
    }
    
    // Set user data in state
    setUserData(user);
    console.log("User data loaded:", user);
    
    // Clear any previous task data
    setAssignedTasks([]);
    setReviewTasks([]);
    
    // For regular users, use user_id or userId
    const userId = user.user_id || user.userId;
    console.log("Regular user, using user ID:", userId);
    fetchUserTasks(userId);
  }, [navigate]);

  // Fetch all tasks for admin/global roles
  const fetchAllTasks = async (entityId) => {
    setLoading(true);
    setError(null);
    
    try {
      if (!entityId) {
        console.error("No entity ID provided for fetchAllTasks");
        setError("Missing entity ID. Please log in again.");
        setLoading(false);
        navigate("/login");
        return;
      }
      
      console.log("Fetching all tasks for entity:", entityId);
      
      const response = await axios.get(`http://localhost:5000/entity_regulation_tasks/${entityId}`);
      const tasksData = response.data.tasks || [];
      
      console.log("Received tasks:", tasksData);
      
      // No need to filter for admin/global - they see all tasks
      setAssignedTasks(tasksData);
      setReviewTasks([]); // Admin/Global users see all tasks in the assigned section
      
      // Fetch regulation details
      await fetchRegulationDetails(tasksData);
      
      // Fetch user names for all tasks
      await fetchUserNames(tasksData);
      
      setLoading(false);
    } catch (err) {
      console.error("Error fetching all tasks:", err);
      setError("Failed to fetch tasks. Please try again later.");
      setLoading(false);
    }
  };

  // Fetch tasks for regular users
  const fetchUserTasks = async (userId) => {
    setLoading(true);
    setError(null);
    
    try {
      if (!userId) {
        console.error("No user ID provided for fetchUserTasks");
        setError("Missing user ID. Please log in again.");
        setLoading(false);
        navigate("/login");
        return;
      }
      
      console.log("Fetching user tasks for user ID:", userId);
      
      // Get user data directly to ensure we have the latest
      const user = getUserData();
      if (!user) {
        console.error("User data missing");
        setError("User data is missing. Please log in again.");
        setLoading(false);
        navigate("/login");
        return;
      }
      
      // Use entity_id from user data (handle both camelCase and snake_case)
      const entityId = user.entity_id || user.entityId;
      console.log("Using entity ID for fetching tasks:", entityId);
      
      if (!entityId) {
        console.error("Entity ID is missing in user data:", user);
        setError("Entity ID is missing. Please log in again.");
        setLoading(false);
        navigate("/login");
        return;
      }
      
      const response = await axios.get(`http://localhost:5000/entity_regulation_tasks/${entityId}`);
      const tasksData = response.data.tasks || [];
      
      console.log("Received all entity tasks:", tasksData);
      
      // Filter tasks into assigned and review categories
      const assigned = tasksData.filter(task => 
        task.preparation_responsibility === userId
      );
      
      const review = tasksData.filter(task => 
        task.review_responsibility === userId
      );
      
      console.log("Assigned tasks:", assigned.length);
      console.log("Review tasks:", review.length);
      
      setAssignedTasks(assigned);
      setReviewTasks(review);
      
      // Fetch regulation details for all tasks
      await fetchRegulationDetails([...assigned, ...review]);
      
      // Fetch user names for all tasks
      await fetchUserNames([...assigned, ...review]);
      
      setLoading(false);
    } catch (err) {
      console.error("Error fetching user tasks:", err);
      setError("Failed to fetch your tasks. Please try again later.");
      setLoading(false);
    }
  };

  // Fetch regulation details for tasks
  const fetchRegulationDetails = async (tasksData) => {
    if (tasksData.length > 0) {
      const regulationIds = [...new Set(tasksData.map(task => task.regulation_id))];
      const regulationDetails = {};
      
      for (const regulationId of regulationIds) {
        try {
          const regResponse = await axios.get(`http://localhost:5000/regulation_details/${regulationId}`);
          if (regResponse.data && regResponse.data.regulation) {
            regulationDetails[regulationId] = regResponse.data.regulation;
          }
        } catch (err) {
          console.error(`Error fetching regulation ${regulationId}:`, err);
        }
      }
      
      setRegulations(regulationDetails);
    }
  };

  // Refresh tasks based on user role
  const refreshTasks = () => {
    if (!userData) return;
    
    if (userData.role === "Admin" || userData.role === "Global") {
      const entityId = userData.entity_id || userData.entityId;
      fetchAllTasks(entityId);
    } else {
      const userId = userData.user_id || userData.userId;
      fetchUserTasks(userId);
    }
  };

  const handleViewTask = (task) => {
    setSelectedTask(task);
    setViewModalOpen(true);
  };

  const handleEditTask = (task) => {
    setSelectedTask(task);
    setTaskStatus(task.status || "");
    setTaskRemarks(task.remarks || "");
    setEditModalOpen(true);
  };

  const handleUpdateTask = async (e) => {
    e.preventDefault();
    
    try {
      const formData = new FormData();
      formData.append("id", selectedTask.id);
      formData.append("status", taskStatus);
      formData.append("remarks", taskRemarks);
      
      if (uploadFile) {
        formData.append("upload", uploadFile);
      }
      
      // If status is "Completed", set the end_date to today
      if (taskStatus === "Completed") {
        formData.append("end_date", new Date().toISOString().split("T")[0]);
      }
      
      const response = await axios.post("http://localhost:5000/update_task", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      
      setEditModalOpen(false);
      refreshTasks();
      alert("Task updated successfully");
    } catch (err) {
      console.error("Error updating task:", err);
      alert(`Error updating task: ${err.message}`);
    }
  };

  const getStatusClass = (status) => {
    switch (status?.toLowerCase()) {
      case "completed":
        return "status-completed";
      case "WIP":
        return "status-in-progress";
      case "yet to start":
      case "pending":
        return "status-pending";
      case "delayed":
      case "overdue":
        return "status-overdue";
      default:
        return "";
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Add a new function to handle status change directly from the table
  const handleStatusChange = async (task, newStatusValue) => {
    try {
      // Don't allow changing status if it's already completed
      if (task.status === "Completed") {
        return;
      }
      
      // Normalize current status - treat null, undefined, or empty string as "Yet to Start"
      const currentStatus = task.status || "Yet to Start";
      
      // Only allow progression in one direction: Yet to Start → WIP → Completed
      if (currentStatus === "Yet to Start" && newStatusValue !== "WIP") {
        alert("Status can only be changed from 'Yet to Start' to 'WIP'");
        return;
      }
      
      if (currentStatus === "WIP" && newStatusValue !== "Completed") {
        alert("Status can only be changed from 'WIP' to 'Completed'");
        return;
      }
      
      // Prevent going backward from WIP to Yet to Start
      if (currentStatus === "WIP" && newStatusValue === "Yet to Start") {
        alert("Cannot change status backward from 'WIP' to 'Yet to Start'");
        return;
      }
      
      console.log(`Changing status for task ${task.id} from ${currentStatus} to ${newStatusValue}`);
      
      // Show the status change container instead of immediately updating
      setStatusChangeTask(task);
      setNewStatus(newStatusValue);
      setStatusChangeRemarks("");
      setStatusChangeFile(null);
      
    } catch (err) {
      console.error("Error preparing status change:", err);
      alert(`Error preparing status change: ${err.message}`);
    }
  };
  
  // New function to submit the status change with remarks and file
  const submitStatusChange = async () => {
    try {
      if (!statusChangeTask) return;
      
      // Check if document upload is mandatory
      const isDocumentMandatory = statusChangeTask.documentupload_yes_no === "Y";
      
      if (isDocumentMandatory && !statusChangeFile) {
        alert("Document upload is mandatory for this task. Please upload a document.");
        return;
      }
      
      const formData = new FormData();
      formData.append("id", statusChangeTask.id);
      formData.append("status", newStatus);
      
      if (statusChangeRemarks) {
        formData.append("remarks", statusChangeRemarks);
      }
      
      if (statusChangeFile) {
        formData.append("upload", statusChangeFile);
      }
      
      console.log("Sending form data:", {
        id: statusChangeTask.id,
        status: newStatus,
        remarks: statusChangeRemarks,
        file: statusChangeFile ? statusChangeFile.name : "No file"
      });
      
      const response = await axios.post("http://localhost:5000/update_task", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      
      console.log("Update response:", response.data);

      // Show success popup
      setSuccessPopupData({
        task: statusChangeTask.activity,
        status: newStatus,
        remarks: statusChangeRemarks,
        document: statusChangeFile?.name
      });
      setShowSuccessPopup(true);
      
      // Clear the status change container
      setStatusChangeTask(null);
      setStatusChangeRemarks("");
      setStatusChangeFile(null);
      setNewStatus("");
      
      // Refresh tasks after a short delay
      setTimeout(() => {
        refreshTasks();
      }, 500);
      
    } catch (err) {
      console.error("Error updating task status:", err);
      alert(`Error updating task status: ${err.message}`);
    }
  };
  
  // Function to cancel status change
  const cancelStatusChange = () => {
    setStatusChangeTask(null);
    setStatusChangeRemarks("");
    setStatusChangeFile(null);
    setNewStatus("");
  };

  // Add new function for handling review status change
  const handleReviewStatusChange = async (task, newStatusValue) => {
    try {
      // Don't allow changing status if it's already completed
      if (task.review_status === "Completed") {
        return;
      }
      
      console.log(`Changing review status for task ${task.id} to ${newStatusValue}`);
      
      // Show the review status change container
      setReviewStatusChangeTask(task);
      setNewReviewStatus(newStatusValue);
      setReviewStatusChangeRemarks("");
      setReviewStatusChangeFile(null);
      
    } catch (err) {
      console.error("Error preparing review status change:", err);
      alert(`Error preparing review status change: ${err.message}`);
    }
  };

  // Modify the submitReviewStatusChange function
  const submitReviewStatusChange = async () => {
    try {
      if (!reviewStatusChangeTask) return;
      
      // Require remarks for review completion
      if (newReviewStatus === "Completed" && !reviewStatusChangeRemarks.trim()) {
        alert("Review remarks are required when completing a review.");
        return;
      }
      
      const formData = new FormData();
      formData.append("id", reviewStatusChangeTask.id);
      formData.append("review_status", newReviewStatus);
      formData.append("review_remarks", reviewStatusChangeRemarks);
      
      if (reviewStatusChangeFile) {
        formData.append("review_upload", reviewStatusChangeFile);
      }
      
      console.log("Sending review status update:", {
        id: reviewStatusChangeTask.id,
        review_status: newReviewStatus,
        review_remarks: reviewStatusChangeRemarks,
        file: reviewStatusChangeFile?.name
      });
      
      const response = await axios.post("http://localhost:5000/update_task", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      
      console.log("Update response:", response.data);
      
      if (response.data.error) {
        throw new Error(response.data.error);
      }
      
      // Set success popup data
      setSuccessPopupData({
        task: reviewStatusChangeTask.activity,
        status: newReviewStatus,
        remarks: reviewStatusChangeRemarks,
        document: reviewStatusChangeFile?.name
      });
      setShowSuccessPopup(true);
      
      // Clear the review status change container
      setReviewStatusChangeTask(null);
      setReviewStatusChangeRemarks("");
      setReviewStatusChangeFile(null);
      setNewReviewStatus("");
      
      // Refresh tasks after a short delay
      setTimeout(() => {
        refreshTasks();
      }, 500);
      
    } catch (err) {
      console.error("Error updating review status:", err);
      alert(`Error updating review status: ${err.message}`);
    }
  };

  // Add function to cancel review status change
  const cancelReviewStatusChange = () => {
    setReviewStatusChangeTask(null);
    setReviewStatusChangeRemarks("");
    setReviewStatusChangeFile(null);
    setNewReviewStatus("");
  };

  // Add function to close success popup
  const closeSuccessPopup = () => {
    setShowSuccessPopup(false);
    setSuccessPopupData(null);
  };

  if (!userData) return null;

  const isAdminOrGlobal = userData.role === "Admin" || userData.role === "Global";
  const pageTitle = isAdminOrGlobal ? "Tasks Management" : "My Tasks";
  const pageDescription = isAdminOrGlobal 
    ? "View and manage all compliance tasks" 
    : "View and manage your assigned and review tasks";

  // Get the current tasks based on active tab
  const currentTasks = activeTab === "assigned" ? assignedTasks : reviewTasks;
  const userId = userData.user_id || userData.userId;

  return (
    <div className={`tasks-container ${statusChangeTask ? 'has-status-change' : ''}`}>
      <Navbar />
      <div className="tasks-content">
        <h1>{pageTitle}</h1>
        <p>{pageDescription}</p>

        <div className="refresh-button-container">
          <button className="btn-refresh" onClick={refreshTasks}>
            Refresh Tasks
          </button>
        </div>

        {/* Tabs for Assigned and Review Tasks - always show for non-admin users */}
        {!isAdminOrGlobal && (
          <div className="tasks-tabs">
            <button 
              className={`tab-button ${activeTab === "assigned" ? "active" : ""}`}
              onClick={() => setActiveTab("assigned")}
            >
              Assigned Tasks ({assignedTasks.length})
            </button>
            <button 
              className={`tab-button ${activeTab === "review" ? "active" : ""}`}
              onClick={() => setActiveTab("review")}
            >
              Review Tasks ({reviewTasks.length})
            </button>
          </div>
        )}

        {/* Status Change Container */}
        {statusChangeTask && (
          <div className="status-change-container">
            <div className="status-change-header">
              <h3>Update Task Status</h3>
              <button className="btn-close" onClick={cancelStatusChange}>&times;</button>
            </div>
            <div className="status-change-content">
              <div className="status-change-info">
                <p><strong>Task:</strong> {statusChangeTask.activity}</p>
                <p><strong>Current Status:</strong> {statusChangeTask.status}</p>
                <p><strong>New Status:</strong> {newStatus}</p>
              </div>
              <div className="status-change-form">
                <div className="form-group">
                  <label htmlFor="statusChangeRemarks">Remarks:</label>
                  <textarea
                    id="statusChangeRemarks"
                    className="form-control"
                    value={statusChangeRemarks}
                    onChange={(e) => setStatusChangeRemarks(e.target.value)}
                    placeholder="Add any remarks about this status change..."
                    rows="3"
                  ></textarea>
                </div>
                {/* Only show file upload when changing to Completed status */}
                {newStatus === "Completed" && (
                  <div className={`form-group ${statusChangeTask.documentupload_yes_no === "Y" ? "mandatory-upload" : ""}`}>
                    <label htmlFor="statusChangeFile">
                      Upload Document:
                      {statusChangeTask.documentupload_yes_no === "Y" && (
                        <span className="required-indicator"> * (Required)</span>
                      )}
                    </label>
                    <input
                      type="file"
                      id="statusChangeFile"
                      className="form-control"
                      onChange={(e) => setStatusChangeFile(e.target.files[0])}
                    />
                    <div className="form-text">
                      {statusChangeTask.documentupload_yes_no === "Y" 
                        ? "Document upload is mandatory for this task." 
                        : "Upload supporting documents if required."}
                    </div>
                  </div>
                )}
                <div className="status-change-actions">
                  <button className="btn-secondary" onClick={cancelStatusChange}>Cancel</button>
                  <button className="btn-primary" onClick={submitStatusChange}>Save Changes</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Add Review Status Change Modal */}
        {reviewStatusChangeTask && (
          <div className="status-change-container">
            <div className="status-change-header">
              <h3>Update Review Status</h3>
              <button className="btn-close" onClick={cancelReviewStatusChange}>&times;</button>
            </div>
            <div className="status-change-content">
              <div className="status-change-info">
                <p><strong>Task:</strong> {reviewStatusChangeTask.activity}</p>
                <p><strong>Current Review Status:</strong> {reviewStatusChangeTask.review_status || "Yet to Start"}</p>
                <p><strong>New Review Status:</strong> {newReviewStatus}</p>
              </div>
              <div className="status-change-form">
                <div className="form-group">
                  <label htmlFor="reviewStatusChangeRemarks">Review Remarks: {newReviewStatus === "Completed" && <span className="required-indicator">*</span>}</label>
                  <textarea
                    id="reviewStatusChangeRemarks"
                    className="form-control"
                    value={reviewStatusChangeRemarks}
                    onChange={(e) => setReviewStatusChangeRemarks(e.target.value)}
                    placeholder="Add your review remarks..."
                    rows="3"
                    required={newReviewStatus === "Completed"}
                  ></textarea>
                </div>
                <div className="form-group">
                  <label htmlFor="reviewStatusChangeFile">Upload Review Document:</label>
                  <input
                    type="file"
                    id="reviewStatusChangeFile"
                    className="form-control"
                    onChange={(e) => setReviewStatusChangeFile(e.target.files[0])}
                  />
                  <div className="form-text">
                    Upload supporting documents for your review if needed.
                  </div>
                </div>
                <div className="status-change-actions">
                  <button className="btn-secondary" onClick={cancelReviewStatusChange}>Cancel</button>
                  <button className="btn-primary" onClick={submitReviewStatusChange}>Save Changes</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="loading">Loading tasks...</div>
        ) : error ? (
          <div className="error">{error}</div>
        ) : currentTasks.length === 0 ? (
          <div className="no-tasks">
            {isAdminOrGlobal 
              ? "No tasks found for your entity." 
              : activeTab === "assigned" 
                ? "No tasks assigned to you for preparation." 
                : "No tasks assigned to you for review."}
          </div>
        ) : (
          <div className="tasks-table-container">
            <h3 className="section-title">
              {isAdminOrGlobal 
                ? "All Tasks" 
                : activeTab === "assigned" 
                  ? "Tasks Assigned for Preparation" 
                  : "Tasks Assigned for Review"}
            </h3>
            <table className="tasks-table">
              <thead>
                <tr>
                  <th>Regulation</th>
                  <th>Activity</th>
                  {isAdminOrGlobal && <th>Assigned To</th>}
                  <th>Due Date</th>
                  <th>Status</th>
                  {activeTab === "review" && <th>Review Status</th>}
                  <th>{activeTab === "review" ? "Assigner" : "Reviewer"}</th>
                  <th>Criticality</th>
                </tr>
              </thead>
              <tbody>
                {currentTasks.map((task) => (
                  <tr key={task.id} className={getRowClassName(task, activeTab === "review")}>
                    <td>
                      {regulations[task.regulation_id]?.regulation_name ||
                        task.regulation_id}
                    </td>
                    <td>{task.activity}</td>
                    {isAdminOrGlobal && <td>{userNames[task.preparation_responsibility] || task.preparation_responsibility}</td>}
                    <td>{formatDate(task.due_on)}</td>
                    <td>
                      {activeTab === "review" ? (
                        // For review tasks, show status as non-editable badge
                        <span className={`status-badge ${getStatusClass(task.status)}`}>
                          {task.status || "Yet to Start"}
                        </span>
                      ) : (
                        // For assigned tasks, show the existing status dropdown
                        task.status === "Completed" ? (
                          <span className={`status-badge ${getStatusClass(task.status)}`}>
                            {task.status}
                          </span>
                        ) : (
                          <div className="status-dropdown-container">
                            <select
                              className={`status-dropdown ${getStatusClass(task.status)}`}
                              value={task.status === "WIP" ? "WIP" : task.status || "Yet to Start"}
                              onChange={(e) => handleStatusChange(task, e.target.value)}
                            >
                              <option value="Yet to Start" disabled={task.status === "WIP"}>Yet to Start</option>
                              <option value="WIP" disabled={task.status !== "Yet to Start" && task.status !== ""}>WIP</option>
                              <option value="Completed" disabled={task.status !== "WIP"}>Completed</option>
                            </select>
                          </div>
                        )
                      )}
                    </td>
                    {activeTab === "review" && (
                      <td>
                        {task.review_status === "Completed" ? (
                          <span className={`status-badge ${getStatusClass(task.review_status)}`}>
                            {task.review_status}
                          </span>
                        ) : (
                          <div className="status-dropdown-container">
                            <select
                              className={`status-dropdown ${getStatusClass(task.review_status)} ${task.status !== "Completed" ? "disabled" : ""}`}
                              value={task.review_status || "WIP"}
                              onChange={(e) => handleReviewStatusChange(task, e.target.value)}
                              disabled={task.status !== "Completed"}
                              title={task.status !== "Completed" ? "Task must be completed before review" : ""}
                            >
                              <option value="WIP">WIP</option>
                              <option value="Completed">Completed</option>
                            </select>
                          </div>
                        )}
                      </td>
                    )}
                    <td>
                      {activeTab === "review" 
                        ? userNames[task.preparation_responsibility] || task.preparation_responsibility
                        : userNames[task.review_responsibility] || task.review_responsibility}
                    </td>
                    <td>{task.criticality || "Medium"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* View Task Modal */}
      {selectedTask && (
        <div
          className={`modal fade ${viewModalOpen ? "show" : ""}`}
          style={{ display: viewModalOpen ? "block" : "none" }}
          tabIndex="-1"
        >
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">{selectedTask.activity}</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setViewModalOpen(false)}
                >
                  &times;
                </button>
              </div>
              <div className="modal-body">
                <div className="task-detail-row">
                  <div className="task-detail-label">Regulation:</div>
                  <div className="task-detail-value">
                    {regulations[selectedTask.regulation_id]?.regulation_name ||
                      selectedTask.regulation_id}
                  </div>
                </div>
                <div className="task-detail-row">
                  <div className="task-detail-label">Due Date:</div>
                  <div className="task-detail-value">
                    {formatDate(selectedTask.due_on)}
                  </div>
                </div>
                <div className="task-detail-row">
                  <div className="task-detail-label">Preparation Responsibility:</div>
                  <div className="task-detail-value">
                    {selectedTask.preparation_responsibility}
                  </div>
                </div>
                <div className="task-detail-row">
                  <div className="task-detail-label">Review Responsibility:</div>
                  <div className="task-detail-value">
                    {selectedTask.review_responsibility}
                  </div>
                </div>
                <div className="task-detail-row">
                  <div className="task-detail-label">Status:</div>
                  <div className="task-detail-value">
                    {selectedTask.status === "WIP" ? "WIP" : selectedTask.status || "Yet to Start"}
                  </div>
                </div>
                <div className="task-detail-row">
                  <div className="task-detail-label">Criticality:</div>
                  <div className="task-detail-value">
                    {selectedTask.criticality || "Medium"}
                  </div>
                </div>
                <div className="task-detail-row">
                  <div className="task-detail-label">Remarks:</div>
                  <div className="task-detail-value">
                    {selectedTask.remarks || "No remarks"}
                  </div>
                </div>
                <div className="task-detail-row">
                  <div className="task-detail-label">Uploaded Document:</div>
                  <div className="task-detail-value">
                    {selectedTask.upload ? (
                      <a
                        href={selectedTask.upload}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-primary"
                      >
                        View Document
                      </a>
                    ) : (
                      "No document uploaded"
                    )}
                  </div>
                </div>
                {/* Review-specific fields */}
                {selectedTask.review_remarks && (
                  <div className="task-detail-row">
                    <div className="task-detail-label">Review Remarks:</div>
                    <div className="task-detail-value">
                      {selectedTask.review_remarks}
                    </div>
                  </div>
                )}
                {selectedTask.review_upload && (
                  <div className="task-detail-row">
                    <div className="task-detail-label">Review Document:</div>
                    <div className="task-detail-value">
                      <a
                        href={selectedTask.review_upload}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-primary"
                      >
                        View Review Document
                      </a>
                    </div>
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setViewModalOpen(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Task Modal */}
      {selectedTask && (
        <div
          className={`modal fade ${editModalOpen ? "show" : ""}`}
          style={{ display: editModalOpen ? "block" : "none" }}
          tabIndex="-1"
        >
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  {activeTab === "review" ? "Review Task" : "Update Task"}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setEditModalOpen(false)}
                >
                  &times;
                </button>
              </div>
              <div className="modal-body">
                <form onSubmit={handleUpdateTask}>
                  <div className="mb-3">
                    <label className="form-label">Activity:</label>
                    <div className="form-control-plaintext">
                      {selectedTask.activity}
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Due Date:</label>
                    <div className="form-control-plaintext">
                      {formatDate(selectedTask.due_on)}
                    </div>
                  </div>

                  <div className="mb-3">
                    <label htmlFor="editTaskStatus" className="form-label">
                      Status:
                    </label>
                    <select
                      className="form-select"
                      id="editTaskStatus"
                      value={taskStatus === "WIP" ? "WIP" : taskStatus}
                      onChange={(e) => {
                        // Prevent invalid status changes
                        const currentStatus = selectedTask.status || "Yet to Start";
                        const newStatus = e.target.value;
                        
                        // Only allow progression in one direction
                        if (currentStatus === "Yet to Start" && newStatus !== "WIP" && newStatus !== "Yet to Start") {
                          alert("Status can only be changed from 'Yet to Start' to 'WIP'");
                          return;
                        }
                        
                        if (currentStatus === "WIP" && newStatus !== "Completed" && newStatus !== "WIP") {
                          alert("Status can only be changed from 'WIP' to 'Completed'");
                          return;
                        }
                        
                        // Convert WIP to WIP when setting the state
                        const statusToSet = newStatus === "WIP" ? "WIP" : newStatus;
                        setTaskStatus(statusToSet);
                      }}
                      required
                    >
                      <option value="Yet to Start" disabled={selectedTask.status === "WIP" || selectedTask.status === "Completed"}>Yet to Start</option>
                      <option value="WIP" disabled={(selectedTask.status !== "Yet to Start" && selectedTask.status !== "") || selectedTask.status === "Completed"}>WIP</option>
                      <option value="Completed" disabled={selectedTask.status !== "WIP"}>Completed</option>
                    </select>
                  </div>

                  <div className="mb-3">
                    <label htmlFor="editTaskRemarks" className="form-label">
                      {activeTab === "review" ? "Review Remarks:" : "Remarks:"}
                    </label>
                    <textarea
                      className="form-control"
                      id="editTaskRemarks"
                      rows="3"
                      value={taskRemarks}
                      onChange={(e) => setTaskRemarks(e.target.value)}
                    ></textarea>
                  </div>

                  <div className="mb-3">
                    <label htmlFor="editTaskUpload" className="form-label">
                      {activeTab === "review" ? "Upload Review Document:" : "Upload Document:"}
                    </label>
                    <input
                      type="file"
                      className="form-control"
                      id="editTaskUpload"
                      onChange={(e) => setUploadFile(e.target.files[0])}
                    />
                    <div className="form-text">
                      Upload supporting documents if required.
                    </div>
                  </div>
                </form>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setEditModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn-primary"
                  onClick={handleUpdateTask}
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal backdrop */}
      {(viewModalOpen || editModalOpen) && (
        <div className="modal-backdrop fade show"></div>
      )}

      {/* Success Popup */}
      {showSuccessPopup && successPopupData && (
        <>
          <div className="success-popup-backdrop" onClick={closeSuccessPopup}></div>
          <div className="success-popup">
            <div className="success-popup-header">
              <h3>Review Status Updated Successfully</h3>
            </div>
            <div className="success-popup-content">
              <div className="success-popup-details">
                <p><strong>Task:</strong> {successPopupData.task}</p>
                <p><strong>New Status:</strong> {successPopupData.status}</p>
                {successPopupData.remarks && (
                  <p><strong>Remarks:</strong> {successPopupData.remarks}</p>
                )}
                {successPopupData.document && (
                  <p><strong>Document:</strong> {successPopupData.document}</p>
                )}
              </div>
              <div className="success-popup-actions">
                <button onClick={closeSuccessPopup}>Close</button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

// Helper function to determine row class based on task status and due date
const getRowClassName = (task, isReviewTab) => {
  if (isReviewTab) {
    if (task.status !== "Completed") {
      return 'disabled-review-task';
    }
    return 'enabled-review-task';
  }
  return '';
};

export default Tasks;

