import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { 
  FaPlus, FaEdit, FaTrashAlt, FaUserCog, FaExclamationTriangle, 
  FaSearch, FaFilter, FaSyncAlt, FaSort, FaSortUp, FaSortDown,
  FaThLarge, FaList, FaExclamationCircle, FaInfoCircle, 
  FaCheckCircle, FaClipboardList, FaBuilding, FaUsers
} from "react-icons/fa";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "./Navbar";
import "./Activities.css";
import { PrivilegedButton, usePrivileges } from "./Privileges";

const Activities = () => {
  const [activities, setActivities] = useState([]);
  const [filteredActivities, setFilteredActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [userEntityId, setUserEntityId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: null, direction: null });
  const [filterCategories, setFilterCategories] = useState({
    criticality: "all",
    status: "all"
  });
  const [viewMode, setViewMode] = useState("grid"); // grid or list
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [stats, setStats] = useState({
    high: { count: 0, percentage: 0 },
    medium: { count: 0, percentage: 0 },
    low: { count: 0, percentage: 0 },
  });
  const [assignedActivities, setAssignedActivities] = useState(new Set());
  const filterRef = useRef(null);
  const navigate = useNavigate();
  const { userPrivileges, userRole: contextUserRole } = usePrivileges();

  useEffect(() => {
    // Get user data from session storage
    const userData = sessionStorage.getItem("user");
    if (userData) {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
      
      // Set user role and entity ID
      const role = parsedUser.role || "";
      setUserRole(role);
      
      // Get entity_id from user data
      let entityId = null;
      if (parsedUser.entity_id) {
        entityId = parsedUser.entity_id;
      } else if (parsedUser.entityId) {
        entityId = parsedUser.entityId;
      } else if (parsedUser.entityid) {
        entityId = parsedUser.entityid;
      } else if (parsedUser.entId) {
        entityId = parsedUser.entId;
      } else if (parsedUser.entityID) {
        entityId = parsedUser.entityID;
      }
      setUserEntityId(entityId);
      
      // Fetch activities with the role and entityId
      fetchActivities(role, entityId);
      fetchAssignedActivities();
    } else {
      navigate("/login");
    }
  }, [navigate]);

  // Improved click outside handler for filter dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (filterRef.current && !filterRef.current.contains(event.target)) {
        setIsFilterOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Calculate statistics
  const calculateStats = (activitiesData) => {
    const totalCount = activitiesData.length;
    const highCount = activitiesData.filter(a => a.criticality.toLowerCase() === 'high').length;
    const mediumCount = activitiesData.filter(a => a.criticality.toLowerCase() === 'medium').length;
    const lowCount = activitiesData.filter(a => a.criticality.toLowerCase() === 'low').length;

    setStats({
      high: { 
        count: highCount, 
        percentage: totalCount ? Math.round((highCount / totalCount) * 100) : 0 
      },
      medium: { 
        count: mediumCount, 
        percentage: totalCount ? Math.round((mediumCount / totalCount) * 100) : 0 
      },
      low: { 
        count: lowCount, 
        percentage: totalCount ? Math.round((lowCount / totalCount) * 100) : 0 
      }
    });
  };

  // Fetch activities from backend based on user role
  const fetchActivities = async (role, entityId) => {
    try {
      setLoading(true);
      
      let response;
      
      // If admin, fetch entity-specific activities
      if (role === "Admin" && entityId) {
        response = await axios.get(`http://localhost:5000/activities/entity/${entityId}`);
      } else {
        // For global users, fetch all activities
        response = await axios.get("http://localhost:5000/activities");
      }
      
      const activitiesData = response.data.activities || [];
      setActivities(activitiesData);
      setFilteredActivities(activitiesData);
      calculateStats(activitiesData);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching activities:", err);
      setError(`Failed to fetch activities. ${err.message || "Please try again later."}`);
      setLoading(false);
    }
  };

  // Fetch assigned activities
  const fetchAssignedActivities = async () => {
    try {
      const userData = JSON.parse(sessionStorage.getItem('user'));
      if (!userData) {
        console.warn('No user data found in session storage');
        return;
      }

      const entityId = userData.entity_id || userData.entityId || userData.entityid || 
                      userData.entId || userData.entityID || userData.id || userData.username;

      if (!entityId) {
        console.warn('No valid ID found in user data');
        return;
      }

      try {
        const response = await axios.get(`http://localhost:5000/entity_tasks/${entityId}`, {
          // Add timeout and error handling options
          timeout: 5000,
          validateStatus: function (status) {
            return status >= 200 && status < 300; // Accept only success status codes
          }
        });
        
        if (response.data && Array.isArray(response.data.tasks)) {
          const assignedSet = new Set(
            response.data.tasks.map(task => `${task.regulation_id}-${task.activity_id}`)
          );
          setAssignedActivities(assignedSet);
        } else if (response.data && Array.isArray(response.data)) {
          // Handle case where tasks are returned directly as an array
          const assignedSet = new Set(
            response.data.map(task => `${task.regulation_id}-${task.activity_id}`)
          );
          setAssignedActivities(assignedSet);
        } else {
          console.warn('Invalid response format:', response.data);
          // For development/testing - set some activities as assigned
          const mockAssignedActivities = new Set([
            // Add some activity IDs that should be shown as assigned
            // Format: "regulationId-activityId"
            "EPF-1",
            "EPF-2",
            "GOODS-1"
          ]);
          setAssignedActivities(mockAssignedActivities);
        }
      } catch (apiError) {
        console.error('API Error Details:', {
          status: apiError.response?.status,
          statusText: apiError.response?.statusText,
          data: apiError.response?.data,
          message: apiError.message
        });
        
        // For development/testing - set some activities as assigned
        const mockAssignedActivities = new Set([
          "EPF-1",
          "EPF-2",
          "GOODS-1"
        ]);
        setAssignedActivities(mockAssignedActivities);
      }
    } catch (error) {
      console.error('Error in fetchAssignedActivities:', error);
      // For development/testing - set some activities as assigned
      const mockAssignedActivities = new Set([
        "EPF-1",
        "EPF-2",
        "GOODS-1"
      ]);
      setAssignedActivities(mockAssignedActivities);
    }
  };

  // Delete activity function
  const deleteActivity = async (regulationId, activityId) => {
    if (window.confirm("Are you sure you want to delete this activity?")) {
      try {
        await axios.delete(`http://localhost:5000/delete_activity/${regulationId}/${activityId}`);
        // Show success message
        const updatedActivities = activities.filter(
          activity => !(activity.regulation_id === regulationId && activity.activity_id === parseInt(activityId))
        );
        setActivities(updatedActivities);
        setFilteredActivities(
          filteredActivities.filter(
            activity => !(activity.regulation_id === regulationId && activity.activity_id === parseInt(activityId))
          )
        );
        calculateStats(updatedActivities);
      } catch (err) {
        console.error("Error deleting activity:", err);
        setError("Failed to delete activity. Please try again later.");
      }
    }
  };

  // Refresh activities data
  const refreshActivities = () => {
    fetchActivities(userRole, userEntityId);
  };

  // Handle assign button click
  const handleAssign = (regulationId, activityId) => {
    console.log("Navigating to assign activity page:", regulationId, activityId);
    
    // Make sure activityId is treated as a string in the URL
    if (typeof activityId === 'number') {
      activityId = activityId.toString();
    }
    
    // Check userRole again to prevent non-admin users from accessing
    if (userRole !== "Admin") {
      setError("Only Admin users can assign activities.");
      return;
    }
    
    // Navigate to the correct path based on the route definition in App.js
    navigate(`/assign-activity/${regulationId}-${activityId}`);
  };

  // Enhanced filter function to handle multiple filter categories
  useEffect(() => {
    let filtered = [...activities];
    
    // Filter by criticality
    if (filterCategories.criticality !== "all") {
      filtered = filtered.filter(
        activity => activity.criticality.toLowerCase() === filterCategories.criticality.toLowerCase()
      );
    }
    
    // Filter by status (mandatory/optional)
    if (filterCategories.status !== "all") {
      const statusValue = filterCategories.status === "mandatory" ? "M" : "O";
      filtered = filtered.filter(
        activity => activity.mandatory_optional === statusValue
      );
    }
    
    // Apply search term if exists
    if (searchTerm) {
      filtered = filtered.filter(
        activity =>
          activity.activity.toLowerCase().includes(searchTerm.toLowerCase()) ||
          activity.regulation_id.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    setFilteredActivities(filtered);
  }, [searchTerm, activities, filterCategories]);

  // Handle sort
  const requestSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
    
    const sortedActivities = [...filteredActivities].sort((a, b) => {
      if (a[key] < b[key]) {
        return direction === 'ascending' ? -1 : 1;
      }
      if (a[key] > b[key]) {
        return direction === 'ascending' ? 1 : -1;
      }
      return 0;
    });
    
    setFilteredActivities(sortedActivities);
  };

  // Get sort icon
  const getSortIcon = (columnName) => {
    if (sortConfig.key !== columnName) {
      return <FaSort className="sort-icon" />;
    }
    return sortConfig.direction === 'ascending' ? 
      <FaSortUp className="sort-icon active" /> : 
      <FaSortDown className="sort-icon active" />;
  };

  // Get criticality badge class
  const getCriticalityClass = (criticality) => {
    switch (criticality.toLowerCase()) {
      case 'high':
        return 'criticality-high';
      case 'medium':
        return 'criticality-medium';
      case 'low':
        return 'criticality-low';
      default:
        return 'criticality-medium';
    }
  };

  // Get criticality icon
  const getCriticalityIcon = (criticality) => {
    switch (criticality.toLowerCase()) {
      case 'high':
        return <FaExclamationCircle />;
      case 'medium':
        return <FaInfoCircle />;
      case 'low':
        return <FaCheckCircle />;
      default:
        return <FaInfoCircle />;
    }
  };

  // Toggle filter dropdown visibility
  const toggleFilter = () => {
    setIsFilterOpen(!isFilterOpen);
  };

  // Apply filter by category and value
  const applyFilter = (category, value) => {
    setFilterCategories(prev => ({
      ...prev,
      [category]: value
    }));
  };

  // Filter activities by criticality from stat cards
  const filterByCriticality = (criticality) => {
    setFilterCategories(prev => ({
      ...prev,
      criticality: criticality
    }));
  };

  // Clear all filters
  const clearFilters = () => {
    setFilterCategories({
      criticality: "all",
      status: "all"
    });
  };

  // Check if any filter is active
  const isFilterActive = () => {
    return filterCategories.criticality !== "all" || filterCategories.status !== "all";
  };

  // Handle edit button click
  const handleEdit = (regulationId, activityId) => {
    navigate(`/edit-activity/${regulationId}/${activityId}`);
  };

  if (!user) return null;

  return (
    <div className="activities-container">
      <Navbar />
      <div className="activities-content">
        {/* <h1>Activities Management</h1> */}
        <p>
          {userRole === "Admin" 
            ? `Viewing activities for your entity` 
            : "Viewing all activities in the system"}
        </p>
        
        {/* Statistics Cards with enhanced animations */}
        <div className="statistics-cards">
          <div 
            className={`stat-card high-card ${filterCategories.criticality === 'high' ? 'active' : ''}`} 
            onClick={() => filterByCriticality('high')}
          >
            <div className="stat-icon-wrapper">
              <FaExclamationCircle />
            </div>
            <div className="stat-content">
              <div className="stat-count">{stats.high.count}</div>
              <div className="stat-title">High Criticality</div>
            </div>
            <div className="stat-percentage">
              <div className="circular-progress" style={{'--percentage': `${stats.high.percentage}`}}>
                <div className="inner-circle">
                  <span>{stats.high.percentage}%</span>
                </div>
              </div>
            </div>
          </div>
          
          <div 
            className={`stat-card medium-card ${filterCategories.criticality === 'medium' ? 'active' : ''}`} 
            onClick={() => filterByCriticality('medium')}
          >
            <div className="stat-icon-wrapper">
              <FaInfoCircle />
            </div>
            <div className="stat-content">
              <div className="stat-count">{stats.medium.count}</div>
              <div className="stat-title">Medium Criticality</div>
            </div>
            <div className="stat-percentage">
              <div className="circular-progress" style={{'--percentage': `${stats.medium.percentage}`}}>
                <div className="inner-circle">
                  <span>{stats.medium.percentage}%</span>
                </div>
              </div>
            </div>
          </div>
          
          <div 
            className={`stat-card low-card ${filterCategories.criticality === 'low' ? 'active' : ''}`} 
            onClick={() => filterByCriticality('low')}
          >
            <div className="stat-icon-wrapper">
              <FaCheckCircle />
            </div>
            <div className="stat-content">
              <div className="stat-count">{stats.low.count}</div>
              <div className="stat-title">Low Criticality</div>
            </div>
            <div className="stat-percentage">
              <div className="circular-progress" style={{'--percentage': `${stats.low.percentage}`}}>
                <div className="inner-circle">
                  <span>{stats.low.percentage}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="alert-error">
            <FaExclamationTriangle className="alert-icon" />
            <span>{error}</span>
            <button className="btn-close" onClick={() => setError(null)}>×</button>
          </div>
        )}

        <div className="activities-tools">
          <div className="search-container">
            <FaSearch className="search-icon" />
            <input
              type="text"
              placeholder="Search by activity name or regulation ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
            {searchTerm && (
              <button 
                className="search-clear" 
                onClick={() => setSearchTerm("")}
              >
                ×
              </button>
            )}
          </div>
          
          <div className="filter-container">
            <div className="filter-dropdown" ref={filterRef}>
              <button 
                className={`filter-button ${isFilterActive() ? 'active' : ''}`}
                onClick={toggleFilter}
              >
                <FaFilter />
                <span>Filters</span>
                {isFilterActive() && (
                  <span className="filter-count">{
                    Object.values(filterCategories).filter(value => value !== "all").length
                  }</span>
                )}
              </button>
              
              {isFilterOpen && (
                <div className="filter-menu">
                  {/* Criticality filter section */}
                  <div className="filter-section">
                    <div className="filter-menu-header">Criticality</div>
                    <div 
                      className={`filter-menu-item ${filterCategories.criticality === 'all' ? 'active' : ''}`}
                      onClick={() => applyFilter('criticality', 'all')}
                    >
                      <FaFilter />
                      <span>All</span>
                    </div>
                    <div 
                      className={`filter-menu-item ${filterCategories.criticality === 'high' ? 'active' : ''}`}
                      onClick={() => applyFilter('criticality', 'high')}
                    >
                      <FaExclamationCircle style={{ color: 'var(--danger-color)' }} />
                      <span>High</span>
                    </div>
                    <div 
                      className={`filter-menu-item ${filterCategories.criticality === 'medium' ? 'active' : ''}`}
                      onClick={() => applyFilter('criticality', 'medium')}
                    >
                      <FaInfoCircle style={{ color: 'var(--warning-color)' }} />
                      <span>Medium</span>
                    </div>
                    <div 
                      className={`filter-menu-item ${filterCategories.criticality === 'low' ? 'active' : ''}`}
                      onClick={() => applyFilter('criticality', 'low')}
                    >
                      <FaCheckCircle style={{ color: 'var(--success-color)' }} />
                      <span>Low</span>
                    </div>
                  </div>
                  
                  {/* Status filter section */}
                  <div className="filter-section">
                    <div className="filter-menu-header">Status</div>
                    <div 
                      className={`filter-menu-item ${filterCategories.status === 'all' ? 'active' : ''}`}
                      onClick={() => applyFilter('status', 'all')}
                    >
                      <FaFilter />
                      <span>All</span>
                    </div>
                    <div 
                      className={`filter-menu-item ${filterCategories.status === 'mandatory' ? 'active' : ''}`}
                      onClick={() => applyFilter('status', 'mandatory')}
                    >
                      <FaCheckCircle style={{ color: 'var(--primary-color)' }} />
                      <span>Mandatory</span>
                    </div>
                    <div 
                      className={`filter-menu-item ${filterCategories.status === 'optional' ? 'active' : ''}`}
                      onClick={() => applyFilter('status', 'optional')}
                    >
                      <FaCheckCircle style={{ color: 'var(--gray-500)' }} />
                      <span>Optional</span>
                    </div>
                  </div>
                  
                  {/* Clear filters button */}
                  {isFilterActive() && (
                    <button className="clear-filters-btn" onClick={clearFilters}>
                      Clear All Filters
                    </button>
                  )}
                </div>
              )}
            </div>
            
            <div className="view-toggle">
              <button 
                className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
                onClick={() => setViewMode('grid')}
                title="Grid view"
              >
                <FaThLarge />
              </button>
              <button 
                className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
                onClick={() => setViewMode('list')}
                title="List view"
              >
                <FaList />
              </button>
            </div>
            
            <button 
              className="btn-refresh" 
              onClick={refreshActivities}
              title="Refresh activities"
            >
              <FaSyncAlt />
            </button>

            <div className="btn-refresh-2">
              <PrivilegedButton 
                className="btn-add" 
                onClick={() => navigate('/add-activity')}
                requiredPrivilege="activity_add"
                title="add new activity"
              >
                Add Activity
              </PrivilegedButton>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading activities...</p>
          </div>
        ) : filteredActivities.length === 0 ? (
          <div className="no-activities">
            <div className="no-data-icon">
              <FaClipboardList />
            </div>
            <h3>No activities found</h3>
            <p>
              {searchTerm || isFilterActive()
                ? "Try adjusting your search or filters" 
                : userRole === "Admin"
                  ? "No activities are associated with your entity's regulations"
                  : "Click the 'Add New Activity' button to create one"}
            </p>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="activities-grid">
            {filteredActivities.map((activity) => (
              <div 
                key={`${activity.regulation_id}-${activity.activity_id}`} 
                className={`activity-card ${getCriticalityClass(activity.criticality)}`}
              >
                <div className="card-header custom-header">
                  <div className="card-id">
                    <span className="regulation-id">{activity.regulation_id}</span>
                    <span className="activity-id">#{activity.activity_id}</span>
                  </div>
                  <div className="criticality-badge gray-badge">
                    {getCriticalityIcon(activity.criticality)}
                    {activity.criticality}
                  </div>
                </div>
                
                <div className="card-body">
                  <h3 className="activity-title">{activity.activity}</h3>
                  <div className="activity-meta">
                    <div className="meta-item">
                      <span className="meta-label">Status</span>
                      <span className={`meta-value status ${activity.mandatory_optional === "M" ? "mandatory" : "optional"}`}>
                        {activity.mandatory_optional === "M" ? "Mandatory" : "Optional"}
                      </span>
                    </div>
                    <div className="meta-item">
                      <span className="meta-label">Frequency</span>
                      <span className="meta-value frequency">{activity.frequency || 'N/A'}</span>
                    </div>
                  </div>
                </div>
                
                <div className="card-actions">
                  <PrivilegedButton
                    className="btn-action btn-edit"
                    onClick={() => handleEdit(activity.regulation_id, activity.activity_id)}
                    requiredPrivilege="activity_update"
                    title="edit this activity"
                  >
                    <FaEdit />
                  </PrivilegedButton>
                  
                  <PrivilegedButton
                    className="btn-action btn-delete"
                    onClick={() => deleteActivity(activity.regulation_id, activity.activity_id)}
                    requiredPrivilege="activity_delete"
                    title="delete this activity"
                  >
                    <FaTrashAlt />
                  </PrivilegedButton>
                  
                  {/* Show Assign button for Admin users with proper privilege */}
                  {userRole === "Admin" && (
                    <PrivilegedButton
                      className="btn-text-action"
                      onClick={() => handleAssign(activity.regulation_id, activity.activity_id)}
                      requiredPrivilege="activity_assign"
                      title="assign this activity"
                    >
                      <FaUserCog style={{ marginRight: '5px' }} />
                      Assign
                    </PrivilegedButton>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="activities-list">
            <div className="list-header">
              <div className="list-cell" onClick={() => requestSort('regulation_id')}>
                <span>Regulation ID</span>
                {getSortIcon('regulation_id')}
              </div>
              <div className="list-cell" onClick={() => requestSort('activity_id')}>
                <span>ID</span>
                {getSortIcon('activity_id')}
              </div>
              <div className="list-cell" onClick={() => requestSort('activity')}>
                <span>Activity</span>
                {getSortIcon('activity')}
              </div>
              <div className="list-cell" onClick={() => requestSort('criticality')}>
                <span>Criticality</span>
                {getSortIcon('criticality')}
              </div>
              <div className="list-cell" onClick={() => requestSort('mandatory_optional')}>
                <span>Status</span>
                {getSortIcon('mandatory_optional')}
              </div>
              <div className="list-cell" onClick={() => requestSort('frequency')}>
                <span>Frequency</span>
                {getSortIcon('frequency')}
              </div>
              <div className="list-cell">
                <span>Actions</span>
              </div>
            </div>
            
            <div className="list-body">
              {filteredActivities.map((activity) => (
                <div 
                  key={`${activity.regulation_id}-${activity.activity_id}`}
                  className={`list-row ${getCriticalityClass(activity.criticality)}`}
                >
                  <div className="list-cell">
                    <span className="regulation-id">{activity.regulation_id}</span>
                  </div>
                  <div className="list-cell">
                    <span className="activity-id">#{activity.activity_id}</span>
                  </div>
                  <div className="list-cell">
                    <span className="activity-title">{activity.activity}</span>
                  </div>
                  <div className="list-cell">
                    <div className={`criticality-badge ${getCriticalityClass(activity.criticality)}`}>
                      {getCriticalityIcon(activity.criticality)}
                      <span>{activity.criticality}</span>
                    </div>
                  </div>
                  <div className="list-cell">
                    <span className={`status-badge ${activity.mandatory_optional === "M" ? "mandatory" : "optional"}`}>
                      {activity.mandatory_optional === "M" ? "Mandatory" : "Optional"}
                    </span>
                  </div>
                  <div className="list-cell">
                    <span className="meta-value frequency">{activity.frequency || 'N/A'}</span>
                  </div>
                  <div className="list-cell">
                    <div className="list-actions">
                      <PrivilegedButton
                        className="btn-action btn-edit"
                        onClick={() => handleEdit(activity.regulation_id, activity.activity_id)}
                        requiredPrivilege="activity_update"
                        title="edit this activity"
                      >
                        <FaEdit size={16} />
                      </PrivilegedButton>
                      
                      <PrivilegedButton
                        className="btn-action btn-delete"
                        onClick={() => deleteActivity(activity.regulation_id, activity.activity_id)}
                        requiredPrivilege="activity_delete"
                        title="delete this activity"
                      >
                        <FaTrashAlt size={16} />
                      </PrivilegedButton>
                      
                      {/* Only show Assign button for Admin users */}
                      {userRole === "Admin" && (
                        <PrivilegedButton
                          className="btn-text-action list-btn-text"
                          onClick={() => handleAssign(activity.regulation_id, activity.activity_id)}
                          requiredPrivilege="activity_assign"
                          title="assign this activity"
                        >
                          <FaUserCog style={{ marginRight: '5px' }} />
                          Assign
                        </PrivilegedButton>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        <div className="activities-footer">
          <div className="footer-info">
            <p>Showing {filteredActivities.length} of {activities.length} activities</p>
            {userRole === "Admin" && (
              <span className="entity-indicator">
                <FaBuilding style={{ marginRight: '5px' }} />
                Viewing activities for your entity
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Activities;
