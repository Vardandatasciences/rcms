import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Navbar from "./Navbar";
import "./Tasks.css"; // Import styles

const Tasks = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  const [users, setUsers] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is logged in
    const userData = sessionStorage.getItem("user");
    if (!userData) {
      navigate("/login");
      return;
    }

    const parsedUserData = JSON.parse(userData);
    setUser(parsedUserData);

    // Get entity_id from userData with fallbacks for different property names
    let entityId = null;
    if (parsedUserData) {
      entityId = parsedUserData.entity_id || parsedUserData.entityId || parsedUserData.entityid || 
                parsedUserData.entId || parsedUserData.entityID;
    }

    if (!entityId) {
      setError("User entity information is missing. Please log in again.");
      setLoading(false);
      return;
    }

    // Fetch tasks and users in parallel
    Promise.all([
      fetchTasks(entityId),
      fetchUsers(entityId)
    ]).catch(err => {
      console.error("Error in initial data loading:", err);
      setLoading(false);
    });
  }, [navigate]);

  const fetchTasks = async (entityId) => {
    try {
      console.log(`Fetching tasks for entity ID: ${entityId}`);
      const response = await axios.get(`http://localhost:5000/entity_regulation_tasks/${entityId}`);
      console.log("Tasks response:", response.data);
      
      // Process tasks to ensure they have all required fields
      const processedTasks = (response.data.tasks || []).map(task => {
        // Ensure regulation_name is available
        if (!task.regulation_name) {
          // Try to extract from regulation_id if available
          const regId = task.regulation_id;
          task.regulation_name = regId || "Unknown Regulation";
        }
        
        // Ensure activity_name is available
        if (!task.activity) {
          task.activity_name = `Activity ${task.activity_id}`;
        } else {
          task.activity_name = task.activity;
        }
        
        return task;
      });
      
      setTasks(processedTasks);
      return processedTasks;
    } catch (err) {
      console.error("Error fetching tasks:", err);
      setError("Failed to fetch tasks. Please try again later.");
      throw err;
    }
  };

  const fetchUsers = async (entityId) => {
    try {
      console.log(`Fetching users for entity ID: ${entityId}`);
      const response = await axios.get(`http://localhost:5000/entity_users/${entityId}`);
      console.log("Users response:", response.data);
      
      // Create a map of user_id to user_name for easy lookup
      const usersMap = {};
      (response.data.users || []).forEach(user => {
        usersMap[user.user_id] = user.user_name;
      });
      
      setUsers(usersMap);
      setLoading(false);
      return usersMap;
    } catch (err) {
      console.error("Error fetching users:", err);
      setLoading(false);
      throw err;
    }
  };


  const handleReassignTask = (task) => {
    // Don't allow reassignment of completed tasks
    if (task.status === "Completed") {
      return;
    }
    
    // Ensure task has all required fields before navigating
    const taskToPass = {
      ...task,
      regulation_name: task.regulation_name || `Regulation ${task.regulation_id}`,
      activity_name: task.activity_name || task.activity || `Activity ${task.activity_id}`,
      preparation_responsibility_name: users[task.preparation_responsibility] || "Not Assigned",
      review_responsibility_name: users[task.review_responsibility] || "Not Assigned"
    };
    
    console.log("Navigating to reassign task with data:", taskToPass);
    navigate(`/reassign-task/${task.id}`, { state: { task: taskToPass } });
  };

  // Helper function to determine CSS class based on status
  const getStatusClass = (status) => {
    switch (status) {
      case "Completed":
        return "status-completed";
      case "In Progress":
      case "WIP":
        return "status-in-progress";
      case "Pending":
      case "Yet to Start":
        return "status-pending";
      case "Overdue":
        return "status-overdue";
      default:
        return "";
    }
  };

  // Helper function to format date
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Helper function to get user name from user ID
  const getUserName = (userId) => {
    if (!userId) return "Not Assigned";
    return users[userId] || userId;
  };

  if (!user) return null;

  return (
    <div className="tasks-container">
      <Navbar />
      <div className="tasks-content">
        <h1>My Tasks</h1>
        <p>View and manage your assigned regulatory compliance tasks</p>

        {loading ? (
          <div className="loading">Loading tasks...</div>
        ) : error ? (
          <div className="error-message">{error}</div>
        ) : tasks.length === 0 ? (
          <div className="no-tasks">
            <p>No tasks found. You don't have any assigned tasks at the moment.</p>
          </div>
        ) : (
          <div className="tasks-table-container">
            <table className="tasks-table">
              <thead>
                <tr>
                  <th>Regulation</th>
                  <th>Activity</th>
                  <th>Due Date</th>
                  <th>Status</th>
                  <th>Criticality</th>
                  <th>Preparer</th>
                  <th>Reviewer</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {tasks.map((task) => (
                  <tr key={task.id}>
                    <td>{task.regulation_name || `Regulation ${task.regulation_id}`}</td>
                    <td>{task.activity_name || task.activity || `Activity ${task.activity_id}`}</td>
                    <td>{formatDate(task.due_on)}</td>
                    <td>
                      <span className={`status-badge ${getStatusClass(task.status)}`}>
                        {task.status || "Unknown"}
                      </span>
                    </td>
                    <td>{task.criticality || "Medium"}</td>
                    <td>{getUserName(task.preparation_responsibility)}</td>
                    <td>{getUserName(task.review_responsibility)}</td>
                    <td className="actions-cell">
                      <button
                        className={`btn-reassign ${task.status === "Completed" ? "btn-disabled" : ""}`}
                        onClick={() => handleReassignTask(task)}
                        disabled={task.status === "Completed"}
                        title={task.status === "Completed" ? "Completed tasks cannot be reassigned" : "Reassign this task"}
                      >
                        Reassign
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Tasks;
