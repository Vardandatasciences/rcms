import React, { useState, useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import '../styles/dashboard.css';
import { FaTasks, FaCheckCircle, FaExclamationCircle, FaCalendarAlt, 
         FaBuilding, FaFileAlt, FaListAlt, FaUsersCog, FaCalendarCheck, 
         FaChartLine, FaClipboardList } from 'react-icons/fa';

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Get user data from session storage
    const userData = sessionStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
    setLoading(false);
    
    // Set page title
    document.title = 'RCMS - Dashboard';
  }, []);

  // If loading, show loading indicator
  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  // If no user data, redirect to login
  if (!user) {
    return <Navigate to="/login" />;
  }

  // Navigation handlers
  const handleNavigation = (path) => {
    navigate(path);
  };

  return (
    <div className="dashboard-container">
      <Navbar />
      
      <div className="dashboard-content">
        <div className="dashboard-header">
          <div className="welcome-section">
            <h1>Welcome, {user.userName}</h1>
            <p className="user-info">
              <span className="role-badge">{user.role}</span>
              {user.entityId && <span className="entity-badge">Entity ID: {user.entityId}</span>}
            </p>
          </div>
          <div className="header-actions">
            <button className="refresh-btn">
              <i className="fas fa-sync-alt"></i> Refresh
            </button>
          </div>
        </div>
        
        <div className="dashboard-stats">
          <div className="stat-card">
            <div className="stat-icon tasks-icon">
              <FaTasks />
            </div>
            <div className="stat-details">
              <h3>Pending Tasks</h3>
              <p className="stat-value">12</p>
              <div className="stat-progress">
                <div className="progress-bar" style={{ width: '40%' }}></div>
              </div>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon completed-icon">
              <FaCheckCircle />
            </div>
            <div className="stat-details">
              <h3>Completed</h3>
              <p className="stat-value">45</p>
              <div className="stat-progress">
                <div className="progress-bar" style={{ width: '75%' }}></div>
              </div>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon overdue-icon">
              <FaExclamationCircle />
            </div>
            <div className="stat-details">
              <h3>Overdue</h3>
              <p className="stat-value">3</p>
              <div className="stat-progress">
                <div className="progress-bar" style={{ width: '15%' }}></div>
              </div>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon upcoming-icon">
              <FaCalendarAlt />
            </div>
            <div className="stat-details">
              <h3>Upcoming</h3>
              <p className="stat-value">8</p>
              <div className="stat-progress">
                <div className="progress-bar" style={{ width: '25%' }}></div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Role-specific content */}
        {user.role === 'Global' && (
          <div className="role-specific-content">
            <h2>Global Administrator Dashboard</h2>
            <p>As a Global Administrator, you have access to manage entities, regulations, categories, and activities.</p>
            <div className="quick-actions">
              <button className="action-btn" onClick={() => handleNavigation('/entities')}>
                <FaBuilding className="btn-icon" />
                <span>Manage Entities</span>
              </button>
              <button className="action-btn" onClick={() => handleNavigation('/regulations')}>
                <FaFileAlt className="btn-icon" />
                <span>View Regulations</span>
              </button>
              <button className="action-btn" onClick={() => handleNavigation('/categories')}>
                <FaListAlt className="btn-icon" />
                <span>Manage Categories</span>
              </button>
              <button className="action-btn" onClick={() => handleNavigation('/activities')}>
                <FaClipboardList className="btn-icon" />
                <span>Manage Activities</span>
              </button>
            </div>
          </div>
        )}
        
        {user.role === 'Admin' && (
          <div className="role-specific-content">
            <h2>Administrator Dashboard</h2>
            <p>As an Administrator, you have access to manage users, holidays, regulations, categories, and activities.</p>
            <div className="quick-actions">
              <button className="action-btn" onClick={() => handleNavigation('/users')}>
                <FaUsersCog className="btn-icon" />
                <span>Manage Users</span>
              </button>
              <button className="action-btn" onClick={() => handleNavigation('/holidays')}>
                <FaCalendarCheck className="btn-icon" />
                <span>Configure Holidays</span>
              </button>
              <button className="action-btn" onClick={() => handleNavigation('/regulations')}>
                <FaFileAlt className="btn-icon" />
                <span>View Regulations</span>
              </button>
              <button className="action-btn" onClick={() => handleNavigation('/categories')}>
                <FaListAlt className="btn-icon" />
                <span>Manage Categories</span>
              </button>
            </div>
          </div>
        )}
        
        {user.role === 'User' && (
          <div className="role-specific-content">
            <h2>User Dashboard</h2>
            <p>As a User, you have access to manage tasks and view analysis.</p>
            <div className="quick-actions">
              <button className="action-btn" onClick={() => handleNavigation('/tasks')}>
                <FaTasks className="btn-icon" />
                <span>View Tasks</span>
              </button>
              <button className="action-btn" onClick={() => handleNavigation('/analysis')}>
                <FaChartLine className="btn-icon" />
                <span>View Analysis</span>
              </button>
            </div>
          </div>
        )}
        
        <div className="dashboard-grid">
          <div className="recent-activity">
            <div className="section-header">
              <h2>Recent Activity</h2>
              <button className="view-all-btn">View All</button>
            </div>
            <div className="activity-list">
              <div className="activity-item">
                <div className="activity-icon">
                  <FaCheckCircle />
                </div>
                <div className="activity-details">
                  <p className="activity-text">Completed task: Monthly Compliance Report</p>
                  <p className="activity-time">2 hours ago</p>
                </div>
              </div>
              
              <div className="activity-item">
                <div className="activity-icon">
                  <FaFileAlt />
                </div>
                <div className="activity-details">
                  <p className="activity-text">New regulation added: Data Protection Policy</p>
                  <p className="activity-time">Yesterday</p>
                </div>
              </div>
              
              <div className="activity-item">
                <div className="activity-icon">
                  <FaExclamationCircle />
                </div>
                <div className="activity-details">
                  <p className="activity-text">Reminder: Quarterly Audit due in 5 days</p>
                  <p className="activity-time">2 days ago</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="upcoming-deadlines">
            <div className="section-header">
              <h2>Upcoming Deadlines</h2>
              <button className="view-all-btn">View All</button>
            </div>
            <div className="deadlines-list">
              <div className="deadline-item">
                <div className="deadline-date">
                  <span className="day">15</span>
                  <span className="month">Jun</span>
                </div>
                <div className="deadline-details">
                  <h3>Quarterly Compliance Review</h3>
                  <p>Submit documentation for Q2 compliance review</p>
                  <div className="deadline-meta">
                    <span className="priority high">High Priority</span>
                    <span className="days-left">3 days left</span>
                  </div>
                </div>
              </div>
              
              <div className="deadline-item">
                <div className="deadline-date">
                  <span className="day">22</span>
                  <span className="month">Jun</span>
                </div>
                <div className="deadline-details">
                  <h3>Data Protection Audit</h3>
                  <p>Internal audit of data protection measures</p>
                  <div className="deadline-meta">
                    <span className="priority medium">Medium Priority</span>
                    <span className="days-left">10 days left</span>
                  </div>
                </div>
              </div>
              
              <div className="deadline-item">
                <div className="deadline-date">
                  <span className="day">30</span>
                  <span className="month">Jun</span>
                </div>
                <div className="deadline-details">
                  <h3>Monthly Status Report</h3>
                  <p>Submit monthly compliance status report</p>
                  <div className="deadline-meta">
                    <span className="priority low">Low Priority</span>
                    <span className="days-left">18 days left</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 