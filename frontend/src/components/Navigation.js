import { Link } from 'react-router-dom';

function Navigation() {
  // Get user data to check role
  const userData = sessionStorage.getItem("user");
  const user = userData ? JSON.parse(userData) : null;
  
  return (
    <nav className="navbar">
      <div className="navbar-container">
        <ul className="nav-menu">
          {/* Only show Entities link if user has Global role */}
          {user && user.role === 'Global' && (
            <li className="nav-item">
              <Link to="/entities" className="nav-links">
                Entities
              </Link>
            </li>
          )}
          <li className="nav-item">
            <Link to="/holidays" className="nav-links">
              Holidays
            </Link>
          </li>
        </ul>
      </div>
    </nav>
  );
}

export default Navigation; 