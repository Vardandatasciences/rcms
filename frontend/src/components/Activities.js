import React, { useState, useEffect } from "react";
import axios from "axios";
import { 
  FaPlus, FaEdit, FaTrashAlt, FaUserCog, FaExclamationTriangle, 
  FaCheckCircle, FaSearch, FaFilter, FaSyncAlt, FaSort, FaSortUp, FaSortDown,
  FaThLarge, FaList, FaChartBar, FaExclamationCircle, FaInfoCircle, FaCheckSquare
} from "react-icons/fa";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "./Navbar";
import "./Activities.css";

const Activities = () => {
  const [activities, setActivities] = useState([]);
  const [filteredActivities, setFilteredActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: null, direction: null });
  const [filterCriticality, setFilterCriticality] = useState("all");
  const [viewMode, setViewMode] = useState("grid"); // grid or list
  const [stats, setStats] = useState({
    total: 0,
    high: 0,
    medium: 0,
    low: 0,
    mandatory: 0,
    optional: 0
  });
  const [activeStatFilter, setActiveStatFilter] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Get user data from session storage
    const userData = sessionStorage.getItem("user");
    if (userData) {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
      fetchActivities();
    } else {
      navigate("/login");
    }
  }, [navigate]);

  // Fetch activities from backend
  const fetchActivities = async () => {
    try {
      setLoading(true);
      const response = await axios.get("http://localhost:5000/activities");
      const activitiesData = response.data.activities || [];
      setActivities(activitiesData);
      setFilteredActivities(activitiesData);
      calculateStats(activitiesData);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching activities:", err);
      setError("Failed to fetch activities. Please try again later.");
      setLoading(false);
    }
  };

  // Calculate statistics
  const calculateStats = (activitiesData) => {
    const stats = {
      total: activitiesData.length,
      high: activitiesData.filter(a => a.criticality.toLowerCase() === 'high').length,
      medium: activitiesData.filter(a => a.criticality.toLowerCase() === 'medium').length,
      low: activitiesData.filter(a => a.criticality.toLowerCase() === 'low').length,
      mandatory: activitiesData.filter(a => a.mandatory_optional === 'M').length,
      optional: activitiesData.filter(a => a.mandatory_optional !== 'M').length
    };
    setStats(stats);
  };

  // Handle stat filter click
  const handleStatFilter = (statType) => {
    if (activeStatFilter === statType) {
      // If clicking the same filter, clear it
      setActiveStatFilter(null);
      setFilteredActivities(activities);
      setFilterCriticality("all");
    } else {
      setActiveStatFilter(statType);
      let filtered;
      
      switch(statType) {
        case 'high':
        case 'medium':
        case 'low':
          filtered = activities.filter(a => a.criticality.toLowerCase() === statType);
          setFilterCriticality(statType);
          break;
        case 'mandatory':
          filtered = activities.filter(a => a.mandatory_optional === 'M');
          break;
        case 'optional':
          filtered = activities.filter(a => a.mandatory_optional !== 'M');
          break;
        default:
          filtered = activities;
      }
      
      setFilteredActivities(filtered);
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

  const handleAssign = (regulationId, activityId) => {
    navigate(`/activities/assign/${regulationId}/${activityId}`);
  };

  // Handle search
  useEffect(() => {
    if (searchTerm === "") {
      if (activeStatFilter) {
        handleStatFilter(activeStatFilter);
      } else {
        setFilteredActivities(activities);
      }
    } else {
      const filtered = activities.filter(
        activity =>
          activity.activity.toLowerCase().includes(searchTerm.toLowerCase()) ||
          activity.regulation_id.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredActivities(filtered);
    }
  }, [searchTerm, activities]);

  // Handle filter
  useEffect(() => {
    if (activeStatFilter) return; // Skip if stat filter is active
    
    if (filterCriticality === "all") {
      setFilteredActivities(activities);
    } else {
      const filtered = activities.filter(
        activity => activity.criticality.toLowerCase() === filterCriticality.toLowerCase()
      );
      setFilteredActivities(filtered);
    }
  }, [filterCriticality, activities, activeStatFilter]);

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
        return <FaExclamationCircle className="criticality-icon high" />;
      case 'medium':
        return <FaInfoCircle className="criticality-icon medium" />;
      case 'low':
        return <FaCheckSquare className="criticality-icon low" />;
      default:
        return <FaInfoCircle className="criticality-icon medium" />;
    }
  };

  if (!user) return null;

  return (
    <div className="activities-container">
      <Navbar />
      <div className="activities-content">
        <div className="activities-header">
          <div className="header-title">
            <h1>Activities Management</h1>
            <p>View, add, edit, and delete activities</p>
          </div>
          <Link to="/activities/add" className="btn-add">
            <FaPlus className="btn-icon" />
            <span>Add New Activity</span>
          </Link>
        </div>

        {/* Statistics Dashboard */}
        <div className="statistics-dashboard">
          <div 
            className={`stat-card total ${activeStatFilter === null ? 'active' : ''}`}
            onClick={() => handleStatFilter(null)}
          >
            <div className="stat-icon">
              <FaChartBar />
            </div>
            <div className="stat-content">
              <h3>Total Activities</h3>
              <p className="stat-value">{stats.total}</p>
            </div>
          </div>
          
          <div 
            className={`stat-card high ${activeStatFilter === 'high' ? 'active' : ''}`}
            onClick={() => handleStatFilter('high')}
          >
            <div className="stat-icon">
              <FaExclamationCircle />
            </div>
            <div className="stat-content">
              <h3>High Criticality</h3>
              <p className="stat-value">{stats.high}</p>
            </div>
          </div>
          
          <div 
            className={`stat-card medium ${activeStatFilter === 'medium' ? 'active' : ''}`}
            onClick={() => handleStatFilter('medium')}
          >
            <div className="stat-icon">
              <FaInfoCircle />
            </div>
            <div className="stat-content">
              <h3>Medium Criticality</h3>
              <p className="stat-value">{stats.medium}</p>
            </div>
          </div>
          
          <div 
            className={`stat-card low ${activeStatFilter === 'low' ? 'active' : ''}`}
            onClick={() => handleStatFilter('low')}
          >
            <div className="stat-icon">
              <FaCheckSquare />
            </div>
            <div className="stat-content">
              <h3>Low Criticality</h3>
              <p className="stat-value">{stats.low}</p>
            </div>
          </div>
          
          <div 
            className={`stat-card mandatory ${activeStatFilter === 'mandatory' ? 'active' : ''}`}
            onClick={() => handleStatFilter('mandatory')}
          >
            <div className="stat-icon">
              <FaCheckCircle />
            </div>
            <div className="stat-content">
              <h3>Mandatory</h3>
              <p className="stat-value">{stats.mandatory}</p>
            </div>
          </div>
          
          <div 
            className={`stat-card optional ${activeStatFilter === 'optional' ? 'active' : ''}`}
            onClick={() => handleStatFilter('optional')}
          >
            <div className="stat-icon">
              <FaFilter />
            </div>
            <div className="stat-content">
              <h3>Optional</h3>
              <p className="stat-value">{stats.optional}</p>
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
              placeholder="Search activities..."
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
            <div className="filter-group">
              <label htmlFor="criticality-filter">
                <FaFilter className="filter-icon" />
                <span>Criticality:</span>
              </label>
              <select
                id="criticality-filter"
                value={filterCriticality}
                onChange={(e) => {
                  setFilterCriticality(e.target.value);
                  setActiveStatFilter(null);
                }}
                className="filter-select"
              >
                <option value="all">All</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
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
              onClick={fetchActivities}
              title="Refresh data"
            >
              <FaSyncAlt className="refresh-icon" />
            </button>
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
              <FaCheckCircle />
            </div>
            <h3>No activities found</h3>
            <p>
              {searchTerm || filterCriticality !== "all" || activeStatFilter
                ? "Try adjusting your search or filters" 
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
                <div className="card-header">
                  <div className="card-id">
                    <span className="regulation-id">{activity.regulation_id}</span>
                    <span className="activity-id">#{activity.activity_id}</span>
                  </div>
                  <div className="card-badges">
                    <div className={`criticality-badge ${getCriticalityClass(activity.criticality)}`}>
                      {getCriticalityIcon(activity.criticality)}
                      <span>{activity.criticality}</span>
                    </div>
                  </div>
                </div>
                
                <div className="card-body">
                  <h3 className="activity-title">{activity.activity}</h3>
                  <div className="activity-meta">
                    <div className="meta-item">
                      <span className="meta-label">Status:</span>
                      <span className={`meta-value status ${activity.mandatory_optional === "M" ? "mandatory" : "optional"}`}>
                        {activity.mandatory_optional === "M" ? "Mandatory" : "Optional"}
                      </span>
                    </div>
                    <div className="meta-item">
                      <span className="meta-label">Frequency:</span>
                      <span className="meta-value frequency">{activity.frequency || 'N/A'}</span>
                    </div>
                  </div>
                </div>
                
                <div className="card-actions">
                  <Link
                    to={`/activities/edit/${activity.regulation_id}/${activity.activity_id}`}
                    className="btn-icon-action btn-edit"
                    title="Edit activity"
                  >
                    <FaEdit />
                  </Link>
                  <button
                    className="btn-icon-action btn-delete"
                    onClick={() => deleteActivity(activity.regulation_id, activity.activity_id)}
                    title="Delete activity"
                  >
                    <FaTrashAlt />
                  </button>
                  <button
                    className="btn-icon-action btn-assign"
                    onClick={() => handleAssign(activity.regulation_id, activity.activity_id)}
                    title="Assign activity"
                  >
                    <FaUserCog />
                  </button>
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
              <div className="list-cell activity-cell" onClick={() => requestSort('activity')}>
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
              <div className="list-cell actions-cell">
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
                  <div className="list-cell activity-cell">
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
                    <span className="frequency-value">{activity.frequency || 'N/A'}</span>
                  </div>
                  <div className="list-cell actions-cell">
                    <div className="list-actions">
                      <Link
                        to={`/activities/edit/${activity.regulation_id}/${activity.activity_id}`}
                        className="btn-icon-action btn-edit"
                        title="Edit activity"
                      >
                        <FaEdit />
                      </Link>
                      <button
                        className="btn-icon-action btn-delete"
                        onClick={() => deleteActivity(activity.regulation_id, activity.activity_id)}
                        title="Delete activity"
                      >
                        <FaTrashAlt />
                      </button>
                      <button
                        className="btn-icon-action btn-assign"
                        onClick={() => handleAssign(activity.regulation_id, activity.activity_id)}
                        title="Assign activity"
                      >
                        <FaUserCog />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        <div className="activities-footer">
          <p>Showing {filteredActivities.length} of {activities.length} activities</p>
        </div>
      </div>
    </div>
  );
};

export default Activities;
