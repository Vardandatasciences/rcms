import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Navbar from "./Navbar";
import "./Tasks.css"; // Import styles
import { PrivilegedButton } from "./Privileges";
import { FaTrashAlt, FaEdit, FaRedo } from "react-icons/fa";

const Tasks = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  const [users, setUsers] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState("grid"); // "grid" or "list"
  const [showFilters, setShowFilters] = useState(false);
  const [activeFilters, setActiveFilters] = useState({
    status: [],
    criticality: []
  });
  const [showEntityColumn, setShowEntityColumn] = useState(false);
  const [entityFilters, setEntityFilters] = useState([]);
  const [entityFilterDropdownOpen, setEntityFilterDropdownOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is logged in
    const userData = sessionStorage.getItem("user");
    if (!userData) {
      navigate("/login");
      return;
    }

    const parsedUserData = JSON.parse(userData);
    
    // If a User role tries to access this component, redirect them
    if (parsedUserData.role === "User") {
      navigate("/user-tasks");
      return;
    }
    
    setUser(parsedUserData);

    // Determine if we should show the entity column (for Global users)
    setShowEntityColumn(parsedUserData.role === "Global");

    // For Global users, we don't need entityId as we'll fetch all tasks
    if (parsedUserData.role === "Global") {
      Promise.all([
        fetchAllTasks(),
        fetchUsers() // For Global users, we need to fetch users differently
      ]).catch(err => {
        console.error("Error in initial data loading:", err);
        setLoading(false);
      });
    } else {
      // For Admin users, continue with entity-specific fetching
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

      // Fetch tasks and users in parallel for Admin users
    Promise.all([
      fetchTasks(entityId),
      fetchUsers(entityId)
    ]).catch(err => {
      console.error("Error in initial data loading:", err);
      setLoading(false);
    });
    }
  }, [navigate]);

  const fetchAllTasks = async () => {
    try {
      console.log("Fetching all tasks across entities for Global user");
      const response = await axios.get(`http://localhost:5000/all_regulation_tasks`);
      console.log("All tasks response:", response.data);
      
      // Process tasks to ensure they have all required fields
      const processedTasks = (response.data.tasks || []).map(task => {
        // Ensure regulation_name is available
        if (!task.regulation_name) {
          const regId = task.regulation_id;
          task.regulation_name = regId || "Unknown Regulation";
        }
        
        // Ensure activity_name is available
        if (!task.activity) {
          task.activity_name = `Activity ${task.activity_id}`;
        } else {
          task.activity_name = task.activity;
        }
        
        // Ensure entity_name is available
        if (!task.entity_name) {
          task.entity_name = `Entity ${task.entity_id}`;
        }
        
        return task;
      });
      
      setTasks(processedTasks);
      return processedTasks;
    } catch (err) {
      console.error("Error fetching all tasks:", err);
      setError("Failed to fetch tasks. Please try again later.");
      throw err;
    }
  };

  const fetchUsers = async (entityId = null) => {
    try {
      let response;
      
      if (entityId) {
        console.log(`Fetching users for entity ID: ${entityId}`);
        response = await axios.get(`http://localhost:5000/entity_users/${entityId}`);
      } else {
        console.log("Fetching all users for Global user");
        response = await axios.get(`http://localhost:5000/all_users`);
      }
      
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

  // Add this function to calculate tasks filtered by everything except status/criticality
  const getTasksFilteredByEntityAndSearch = () => {
    return tasks.filter(task => {
      // Search term filter
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = 
        searchTerm === '' || 
        (task.regulation_name && task.regulation_name.toLowerCase().includes(searchLower)) ||
        (task.activity_name && task.activity_name.toLowerCase().includes(searchLower)) ||
        (task.status && task.status.toLowerCase().includes(searchLower));
      
      // Entity filter - only apply for Global users
      const matchesEntity = 
        entityFilters.length === 0 || 
        entityFilters.includes(task.entity_name);
      
      return matchesSearch && matchesEntity;
    });
  };

  // Now update the getStatusStats function to use this filtered set
  const getStatusStats = () => {
    // Use tasks filtered only by entity and search
    const tasksToCount = getTasksFilteredByEntityAndSearch();
    
    const stats = {
      completed: 0,
      inProgress: 0,
      yetToStart: 0,
    };
    
    tasksToCount.forEach(task => {
      const status = task.status ? task.status.toLowerCase() : '';
      
      if (status.includes('complete')) {
        stats.completed += 1;
      } else if (status.includes('progress') || status.includes('wip')) {
        stats.inProgress += 1;
      } else if (status.includes('pending') || status.includes('yet to start')) {
        stats.yetToStart += 1;
      } else {
        // Default to yet to start for unknown statuses
        stats.yetToStart += 1;
      }
    });
    
    return stats;
  };

  // Update the calculatePercentage function too
  const calculatePercentage = (count) => {
    const tasksToCount = getTasksFilteredByEntityAndSearch();
    if (tasksToCount.length === 0) return 0;
    return Math.round((count / tasksToCount.length) * 100);
  };

  // Helper function to determine CSS class based on status
  const getStatusClass = (status) => {
    if (!status) return "status-pending";
    
    const statusLower = status.toLowerCase();
    if (statusLower.includes('complete')) {
      return "status-completed";
    } else if (statusLower.includes('progress') || statusLower.includes('wip')) {
      return "status-in-progress";
    } else if (statusLower.includes('overdue') || statusLower.includes('delay')) {
      return "status-overdue";
    } else {
      return "status-pending";
    }
  };

  // Helper function to check if a task is delayed
  const isTaskDelayed = (task) => {
    if (!task.due_on) return false;
    
    // Check if task has "delayed" status flag
    if (task.status && task.status.toLowerCase().includes('delay')) return true;
    
    // Check if task is overdue based on date
    const dueDate = new Date(task.due_on);
    const today = new Date();
    
    if (dueDate < today && !task.status?.toLowerCase().includes('complete')) {
      return true;
    }
    
    return false;
  };

  // Filter tasks based on search term and active filters
  const filteredTasks = tasks.filter(task => {
    // Search term filter
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = 
      searchTerm === '' || 
      (task.regulation_name && task.regulation_name.toLowerCase().includes(searchLower)) ||
      (task.activity_name && task.activity_name.toLowerCase().includes(searchLower)) ||
      (task.status && task.status.toLowerCase().includes(searchLower));
    
    // Status filter
    const statusLower = task.status ? task.status.toLowerCase() : '';
    let taskStatusCategory = '';
    
    if (statusLower.includes('complete')) {
      taskStatusCategory = 'completed';
    } else if (statusLower.includes('progress') || statusLower.includes('wip')) {
      taskStatusCategory = 'in progress';
    } else {
      taskStatusCategory = 'yet to start';
    }
    
    const matchesStatus = 
      activeFilters.status.length === 0 || 
      activeFilters.status.includes(taskStatusCategory);
    
    // Criticality filter
    const matchesCriticality = 
      activeFilters.criticality.length === 0 || 
      activeFilters.criticality.includes(task.criticality ? task.criticality.toLowerCase() : 'medium');
    
    // Entity filter - only apply for Global users
    const matchesEntity = 
      entityFilters.length === 0 || 
      entityFilters.includes(task.entity_name);
    
    return matchesSearch && matchesStatus && matchesCriticality && matchesEntity;
  });

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

  // Toggle a filter
  const toggleFilter = (type, value) => {
    console.log(`Toggling filter: ${type} = ${value}`);
    setActiveFilters(prev => {
      const updatedFilters = { ...prev };
      if (updatedFilters[type].includes(value)) {
        updatedFilters[type] = updatedFilters[type].filter(v => v !== value);
      } else {
        updatedFilters[type] = [...updatedFilters[type], value];
      }
      return updatedFilters;
    });
    // Make sure filter menu stays open when clicking statistics cards
    if (!showFilters) {
      setShowFilters(true);
    }
  };

  // Toggle entity filter
  const toggleEntityFilter = (entityName) => {
    setEntityFilters(prev => {
      if (prev.includes(entityName)) {
        return prev.filter(name => name !== entityName);
      } else {
        return [...prev, entityName];
      }
    });
  };

  // Clear all filters
  const clearFilters = () => {
    setActiveFilters({
      status: [],
      criticality: []
    });
    setEntityFilters([]);
    setSearchTerm("");
  };

  // Add React useMemo to cache and update stats when filters change
  // Replace the current statusStats line with:
  const statusStats = React.useMemo(() => {
    return getStatusStats();
  }, [tasks, searchTerm, entityFilters]); // Re-calculate when these dependencies change

  // Modify the refresh handler to use the appropriate fetch method
  const handleRefresh = () => {
    if (!user) return;
    
    if (user.role === "Global") {
      fetchAllTasks();
    } else {
      fetchTasks(user.entity_id);
    }
  };

  // Add this function to get unique entity names from tasks
  const getUniqueEntities = () => {
    const entityNames = tasks.map(task => task.entity_name).filter(Boolean);
    return [...new Set(entityNames)].sort();
  };

  // Define the renderListView function
  const renderListView = () => (
    <div className="tasks-table-container">
      <table className="tasks-table">
        <thead>
          <tr>
            {showEntityColumn && <th>Entity</th>}
            <th>Regulation</th>
            <th>Activity</th>
            <th>Due Date</th>
            <th>Status</th>
            <th>Criticality</th>
            <th>Preparer</th>
            <th>Reviewer</th>
            <th>{user.role === "Global" ? "Entity" : "Actions"}</th>
          </tr>
        </thead>
        <tbody>
          {filteredTasks.map((task) => {
            const statusClass = getStatusClass(task.status);
            const isDelayed = isTaskDelayed(task);
            const criticality = task.criticality ? task.criticality.toLowerCase() : 'medium';
            
            return (
              <tr key={task.id} className={`${statusClass}-row`}>
                {showEntityColumn && <td>{task.entity_name}</td>}
                <td>{task.regulation_name || `Regulation ${task.regulation_id}`}</td>
                <td>{task.activity_name || task.activity || `Activity ${task.activity_id}`}</td>
                <td className={isDelayed ? 'delayed-text' : ''}>
                  {formatDate(task.due_on)}
                </td>
                <td>
                  <span className={`status-badge ${statusClass}`}>
                    {task.status || "Yet to Start"}
                  </span>
                </td>
                <td>
                  <span className={`criticality-badge criticality-${criticality}`}>
                    {task.criticality || "Medium"}
                  </span>
                </td>
                <td>{getUserName(task.preparation_responsibility)}</td>
                <td>{getUserName(task.review_responsibility)}</td>
                <td className="actions-cell">
                  {user.role === "Global" ? (
                    <span className="entity-badge">{task.entity_name}</span>
                  ) : (
                    <PrivilegedButton
                      className={`btn-reassign ${task.status === "Completed" ? "btn-disabled" : ""}`}
                      onClick={() => handleReassignTask(task)}
                      disabled={task.status === "Completed"}
                      title={task.status === "Completed" ? "Completed tasks cannot be reassigned" : "reassign this task"}
                      requiredPrivilege="task_reassign"
                    >
                      Reassign
                    </PrivilegedButton>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );

  // Define the renderGridView function
  const renderGridView = () => (
    <div className="tasks-grid">
      {filteredTasks.map((task) => {
        const statusClass = getStatusClass(task.status);
        const isDelayed = isTaskDelayed(task);
        const criticality = task.criticality ? task.criticality.toLowerCase() : 'medium';
        
        return (
          <div key={task.id} className={`task-card ${statusClass}-top`}>
            <div className="card-header">
              <div className="header-left">
                {showEntityColumn && <div className="entity-name">{task.entity_name}</div>}
                <div className="regulation-id">{task.regulation_id || task.regulation_name}</div>
                <div className="activity-id">{task.activity_id ? `#${task.activity_id}` : ''}</div>
              </div>
              <div className="header-right">
                {isDelayed && <span className="delayed-badge">DELAYED</span>}
                <span className={`criticality-badge criticality-${criticality}`}>
                  {task.criticality || "MEDIUM"}
                </span>
                {user.role !== "Global" && (
                  <PrivilegedButton
                    className={`btn-reassign-action-top ${task.status === "Completed" ? "btn-disabled" : ""}`}
                    onClick={() => handleReassignTask(task)}
                    disabled={task.status === "Completed"}
                    title="reassign this task"
                    requiredPrivilege="task_reassign"
                  >
                    Reassign
                  </PrivilegedButton>
                )}
                {user.role === "Global" && !showEntityColumn && (
                  <span className="entity-badge-grid">{task.entity_name}</span>
                )}
              </div>
            </div>
            
            <div className="card-body">
              <h3 className="task-title">{task.activity_name || task.activity || `Activity ${task.activity_id}`}</h3>
              
              <div className="task-details-container">
                <div className="detail-item">
                  <div className="detail-label">DUE DATE</div>
                  <div className="detail-content">
                    <div className="detail-icon">
                      <i className="fas fa-calendar-alt"></i>
                    </div>
                    <div className={`detail-value ${isDelayed ? 'delayed-text' : ''}`}>
                      {formatDate(task.due_on)}
                    </div>
                  </div>
                </div>
                
                <div className="detail-item">
                  <div className="detail-label">STATUS</div>
                  <div className={`detail-content status-container ${statusClass}`}>
                    <div className="detail-icon">
                      <i className={`fas fa-circle status-icon ${statusClass}`}></i>
                    </div>
                    <div className={`detail-value ${statusClass}`}>
                      {task.status || "Yet to Start"}
                    </div>
                  </div>
                </div>
                
                <div className="detail-item">
                  <div className="detail-label">PREPARER</div>
                  <div className="detail-content">
                    <div className="detail-icon">
                      <i className="fas fa-user-edit"></i>
                    </div>
                    <div className="detail-value preparer-value">
                      {getUserName(task.preparation_responsibility)}
                    </div>
                  </div>
                </div>
                
                <div className="detail-item">
                  <div className="detail-label">REVIEWER</div>
                  <div className="detail-content">
                    <div className="detail-icon">
                      <i className="fas fa-user-check"></i>
                    </div>
                    <div className="detail-value reviewer-value">
                      {getUserName(task.review_responsibility)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );

  // Define the renderRefreshButton function
  const renderRefreshButton = () => (
    <button className="btn-refresh" onClick={handleRefresh} aria-label="Refresh">
      <i className="fas fa-sync-alt"></i>
    </button>
  );

  if (!user) return null;

  return (
    <div className="tasks-container">
      <Navbar />
      <div className="tasks-content">
        {/* <div className="tasks-header">
          <div className="header-title">
            <h1>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 11l3 3L22 4"></path>
                <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"></path>
              </svg>
              My Tasks
            </h1>
            <p>View and manage your assigned regulatory compliance tasks</p>
          </div>
        </div> */}

        {/* Statistics Cards */}
        <div className="statistics-cards">
          <div className={`stat-card pending-card ${activeFilters.status.includes('yet to start') ? 'active' : ''}`} 
               onClick={() => toggleFilter('status', 'yet to start')} 
               style={{"--percentage": calculatePercentage(statusStats.yetToStart)}}>
            <div className="stat-icon-wrapper">
              <i className="fas fa-hourglass-start"></i>
            </div>
            <div className="stat-content">
              <div className="stat-count">{statusStats.yetToStart}</div>
              <div className="stat-title">Yet to Start</div>
            </div>
            <div className="stat-percentage">
              <div className="circular-progress">
                <div className="inner-circle">{calculatePercentage(statusStats.yetToStart)}%</div>
              </div>
            </div>
          </div>

          <div className={`stat-card progress-card ${activeFilters.status.includes('in progress') ? 'active' : ''}`}
               onClick={() => toggleFilter('status', 'in progress')}
               style={{"--percentage": calculatePercentage(statusStats.inProgress)}}>
            <div className="stat-icon-wrapper">
              <i className="fas fa-spinner fa-spin"></i>
            </div>
            <div className="stat-content">
              <div className="stat-count">{statusStats.inProgress}</div>
              <div className="stat-title">In Progress</div>
            </div>
            <div className="stat-percentage">
              <div className="circular-progress">
                <div className="inner-circle">{calculatePercentage(statusStats.inProgress)}%</div>
              </div>
            </div>
          </div>

          <div className={`stat-card completed-card ${activeFilters.status.includes('completed') ? 'active' : ''}`}
               onClick={() => toggleFilter('status', 'completed')}
               style={{"--percentage": calculatePercentage(statusStats.completed)}}>
            <div className="stat-icon-wrapper">
              <i className="fas fa-check-circle"></i>
            </div>
            <div className="stat-content">
              <div className="stat-count">{statusStats.completed}</div>
              <div className="stat-title">Completed</div>
            </div>
            <div className="stat-percentage">
              <div className="circular-progress">
                <div className="inner-circle">{calculatePercentage(statusStats.completed)}%</div>
              </div>
            </div>
          </div>
        </div>

        {/* Tools Section - Search, Filters, View Toggle */}
        <div className="tasks-tools">
          <div className="search-container">
            <i className="fas fa-search search-icon"></i>
            <input
              type="text"
              className="search-input"
              placeholder="Search by regulation, activity, or status..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button 
                className="search-clear" 
                onClick={() => setSearchTerm("")}
                aria-label="Clear search"
              >
                ×
              </button>
            )}
          </div>

          {user.role === "Global" && (
            <div className="filter-dropdown">
              <button 
                className={`filter-button ${entityFilterDropdownOpen ? 'active' : ''}`}
                onClick={() => setEntityFilterDropdownOpen(!entityFilterDropdownOpen)}
              >
                <i className="fas fa-building"></i>
                Entities
                {entityFilters.length > 0 && (
                  <span className="filter-count">
                    {entityFilters.length}
                  </span>
                )}
              </button>
              
              {entityFilterDropdownOpen && (
                <div className="filter-menu entity-filter-menu">
                  <div className="filter-section">
                    <div className="filter-menu-header">Entities</div>
                    {getUniqueEntities().map(entityName => (
                      <div 
                        key={entityName}
                        className={`filter-menu-item ${entityFilters.includes(entityName) ? 'active' : ''}`}
                        onClick={() => toggleEntityFilter(entityName)}
                      >
                        <i className="fas fa-building"></i> {entityName}
                      </div>
                    ))}
                  </div>
                  
                  <button className="clear-filters-btn" onClick={() => setEntityFilters([])}>
                    Clear Entity Filters
                  </button>
                </div>
              )}
            </div>
          )}

          <div className="filter-container">
            <div className="filter-dropdown">
              <button 
                className={`filter-button ${showFilters ? 'active' : ''}`}
                onClick={() => setShowFilters(!showFilters)}
              >
                <i className="fas fa-filter"></i>
                Filters
                {(activeFilters.status.length > 0 || activeFilters.criticality.length > 0) && (
                  <span className="filter-count">
                    {activeFilters.status.length + activeFilters.criticality.length}
                  </span>
                )}
              </button>
              
              {showFilters && (
                <div className="filter-menu">
                  <div className="filter-section">
                    <div className="filter-menu-header">Status</div>
                    <div 
                      className={`filter-menu-item ${activeFilters.status.includes('yet to start') ? 'active' : ''}`}
                      onClick={() => toggleFilter('status', 'yet to start')}
                    >
                      <i className="fas fa-hourglass-start"></i> Yet to Start
                    </div>
                    <div 
                      className={`filter-menu-item ${activeFilters.status.includes('in progress') ? 'active' : ''}`}
                      onClick={() => toggleFilter('status', 'in progress')}
                    >
                      <i className="fas fa-spinner"></i> In Progress
                    </div>
                    <div 
                      className={`filter-menu-item ${activeFilters.status.includes('completed') ? 'active' : ''}`}
                      onClick={() => toggleFilter('status', 'completed')}
                    >
                      <i className="fas fa-check-circle"></i> Completed
                    </div>
                  </div>
                  
                  <div className="filter-section">
                    <div className="filter-menu-header">Criticality</div>
                    <div 
                      className={`filter-menu-item ${activeFilters.criticality.includes('high') ? 'active' : ''}`}
                      onClick={() => toggleFilter('criticality', 'high')}
                    >
                      <i className="fas fa-exclamation-circle"></i> High
                    </div>
                    <div 
                      className={`filter-menu-item ${activeFilters.criticality.includes('medium') ? 'active' : ''}`}
                      onClick={() => toggleFilter('criticality', 'medium')}
                    >
                      <i className="fas fa-exclamation-triangle"></i> Medium
                    </div>
                    <div 
                      className={`filter-menu-item ${activeFilters.criticality.includes('low') ? 'active' : ''}`}
                      onClick={() => toggleFilter('criticality', 'low')}
                    >
                      <i className="fas fa-check"></i> Low
                    </div>
                  </div>
                  
                  <button className="clear-filters-btn" onClick={clearFilters}>
                    Clear All Filters
                  </button>
                </div>
              )}
            </div>
            
            <div className="view-toggle">
              <button 
                className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
                onClick={() => setViewMode('grid')}
                aria-label="Grid view"
              >
                <i className="fas fa-th"></i>
              </button>
              <button 
                className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
                onClick={() => setViewMode('list')}
                aria-label="List view"
              >
                <i className="fas fa-list"></i>
              </button>
            </div>
            
            {renderRefreshButton()}
          </div>
        </div>

        {loading ? (
          <div className="loading">Loading tasks...</div>
        ) : error ? (
          <div className="error-message">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="alert-icon">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            {error}
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="no-tasks">
            <i className="fas fa-clipboard-list no-data-icon"></i>
            <h3>No Tasks Found</h3>
            <p>No tasks match your current search or filter criteria.</p>
            {(searchTerm || activeFilters.status.length > 0 || activeFilters.criticality.length > 0) && (
              <button className="btn-text-action" onClick={clearFilters}>
                Clear Filters
              </button>
            )}
          </div>
        ) : viewMode === 'list' ? (
          renderListView()
        ) : (
          renderGridView()
        )}
      </div>
    </div>
  );
};

export default Tasks;
