import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import './Navbar.css';
import { 
  FaHome, FaBuilding, FaUsers, FaListAlt, FaFileAlt, 
  FaClipboardList, FaTasks, FaChartLine, FaCalendarAlt,
  FaUserCircle, FaSignOutAlt, FaBars, FaTimes, FaBell
} from 'react-icons/fa';

const Navbar = () => {
  const [user, setUser] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [notifications, setNotifications] = useState(3); // Example notification count
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Get user data from session storage
    const userData = sessionStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    } else {
      // Redirect to login if no user data
      navigate('/login');
    }

    // Close mobile menu when location changes
    setIsOpen(false);
  }, [navigate, location]);

  const handleLogout = () => {
    // Clear session storage
    sessionStorage.removeItem('user');
    // Redirect to login
    navigate('/login');
  };

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const toggleUserMenu = () => {
    setShowUserMenu(!showUserMenu);
  };

  // Check if a link is active
  const isActive = (path) => {
    return location.pathname.startsWith(path);
  };

  // If user data is not loaded yet, show nothing
  if (!user) return null;

  // Get user initials for avatar
  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-brand">
          <Link to="/dashboard" className="brand-link">
            <div className="logo-icon">RC</div>
            <span className="brand-text">RCMS</span>
          </Link>
          
          <button className="navbar-toggler" onClick={toggleMenu} aria-label="Toggle navigation">
            {isOpen ? <FaTimes className="toggle-icon" /> : <FaBars className="toggle-icon" />}
          </button>
        </div>

        <div className={`navbar-collapse ${isOpen ? 'show' : ''}`}>
          <ul className="navbar-nav">
            <li className="nav-item">
              <Link to="/dashboard" className={`nav-link ${isActive('/dashboard') ? 'active' : ''}`}>
                <FaHome className="nav-icon" />
                <span className="nav-text">Dashboard</span>
                {isActive('/dashboard') && <div className="nav-indicator"></div>}
              </Link>
            </li>

            {/* Entities - Only visible to Global role */}
            {user.role === 'Global' && (
              <li className="nav-item">
                <Link to="/entities" className={`nav-link ${isActive('/entities') ? 'active' : ''}`}>
                  <FaBuilding className="nav-icon" />
                  <span className="nav-text">Entities</span>
                  {isActive('/entities') && <div className="nav-indicator"></div>}
                </Link>
              </li>
            )}

            {/* Users - Not visible to Global role */}
            {user.role !== 'Global' && (
              <li className="nav-item">
                <Link to="/users" className={`nav-link ${isActive('/users') ? 'active' : ''}`}>
                  <FaUsers className="nav-icon" />
                  <span className="nav-text">Users</span>
                  {isActive('/users') && <div className="nav-indicator"></div>}
                </Link>
              </li>
            )}

            {/* Categories - Visible to Global and Admin */}
            {(user.role === 'Global' || user.role === 'Admin') && (
              <li className="nav-item">
                <Link to="/categories" className={`nav-link ${isActive('/categories') ? 'active' : ''}`}>
                  <FaListAlt className="nav-icon" />
                  <span className="nav-text">Categories</span>
                  {isActive('/categories') && <div className="nav-indicator"></div>}
                </Link>
              </li>
            )}

            {/* Regulations - Visible to Global and Admin */}
            {(user.role === 'Global' || user.role === 'Admin') && (
              <li className="nav-item">
                <Link to="/regulations" className={`nav-link ${isActive('/regulations') ? 'active' : ''}`}>
                  <FaFileAlt className="nav-icon" />
                  <span className="nav-text">Regulations</span>
                  {isActive('/regulations') && <div className="nav-indicator"></div>}
                </Link>
              </li>
            )}

            {/* Activities - Visible to Global and Admin */}
            {(user.role === 'Global' || user.role === 'Admin') && (
              <li className="nav-item">
                <Link to="/activities" className={`nav-link ${isActive('/activities') ? 'active' : ''}`}>
                  <FaClipboardList className="nav-icon" />
                  <span className="nav-text">Activities</span>
                  {isActive('/activities') && <div className="nav-indicator"></div>}
                </Link>
              </li>
            )}

            {/* Tasks - Visible to all roles */}
            <li className="nav-item">
              <Link to="/tasks" className={`nav-link ${isActive('/tasks') ? 'active' : ''}`}>
                <FaTasks className="nav-icon" />
                <span className="nav-text">Tasks</span>
                {isActive('/tasks') && <div className="nav-indicator"></div>}
              </Link>
            </li>

            {/* Analysis - Visible to all roles */}
            <li className="nav-item">
              <Link to="/analysis" className={`nav-link ${isActive('/analysis') ? 'active' : ''}`}>
                <FaChartLine className="nav-icon" />
                <span className="nav-text">Analysis</span>
                {isActive('/analysis') && <div className="nav-indicator"></div>}
              </Link>
            </li>

            {/* Holidays - Only visible to Admin role */}
            {user.role === 'Admin' && (
              <li className="nav-item">
                <Link to="/holidays" className={`nav-link ${isActive('/holidays') ? 'active' : ''}`}>
                  <FaCalendarAlt className="nav-icon" />
                  <span className="nav-text">Holidays</span>
                  {isActive('/holidays') && <div className="nav-indicator"></div>}
                </Link>
              </li>
            )}
          </ul>

          <div className="navbar-actions">
            <div className="notification-wrapper">
              <button className="notification-btn" aria-label="Notifications">
                <FaBell className="notification-icon" />
                {notifications > 0 && (
                  <span className="notification-badge">{notifications}</span>
                )}
              </button>
            </div>
            
            <div className="user-wrapper">
              <button className="user-btn" onClick={toggleUserMenu} aria-label="User menu">
                <div className="user-avatar">
                  {getInitials(user.userName)}
                </div>
                <div className="user-info">
                  <span className="user-name">{user.userName}</span>
                  <span className="user-role">{user.role}</span>
                </div>
              </button>
              
              {showUserMenu && (
                <div className="user-dropdown">
                  <div className="dropdown-header">
                    <div className="dropdown-user-info">
                      <span className="dropdown-user-name">{user.userName}</span>
                      <span className="dropdown-user-role">{user.role}</span>
                    </div>
                  </div>
                  <div className="dropdown-divider"></div>
                  <ul className="dropdown-menu">
                    <li className="dropdown-item">
                      <Link to="/profile" className="dropdown-link">
                        <FaUserCircle className="dropdown-icon" />
                        <span>My Profile</span>
                      </Link>
                    </li>
                    <li className="dropdown-item">
                      <button className="dropdown-link" onClick={handleLogout}>
                        <FaSignOutAlt className="dropdown-icon" />
                        <span>Logout</span>
                      </button>
                    </li>
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
