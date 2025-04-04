import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useParams } from 'react-router-dom';
import './App.css';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Navbar from './components/Navbar';
import axios from 'axios';
import { PrivilegeProvider } from './components/PrivilegeContext';
import PrivilegedRoute from './components/PrivilegedRoute';
import PrivilegedButton from './components/PrivilegedButton';

// import home page
import Home from './pages/Home';

// Import Entity components
import Entities from './components/Entities';
import AddEntity from './components/AddEntity';
import EditEntity from './components/EditEntity';
import DeleteEntity from './components/DeleteEntity';

// Import User components
import Users from './components/Users';
import AddUser from './components/AddUser';
import EditUser from './components/EditUser';
import DeleteUser from './components/DeleteUser';

// Import Category components
import Categories from './components/Categories';
import AddCategory from './components/AddCategory';
import DeleteCategory from './components/DeleteCategory';

// Import Regulation components
import Regulations from './components/Regulations';
import AddRegulation from './components/AddRegulation';
import EditRegulation from './components/EditRegulation';
import DeleteRegulation from './components/DeleteRegulation';

// Import Activity components
import Activities from './components/Activities';
import AddActivity from './components/AddActivity';
import EditActivity from './components/EditActivity';
import AssignActivity from './components/AssignActivity';

// Import Holiday components
import Holidays from './components/Holidays';
import AddHoliday from './components/AddHoliday';

// Import Tasks component
import Tasks from './components/Tasks';
import ReassignTask from './components/ReassignTask';
import UserTask from './components/UserTask';

// Import the PrivilegeCheck and PrivilegeGuard
import PrivilegeCheck from './components/PrivilegeCheck';
import PrivilegeGuard from './components/PrivilegeGuard';

// Import Analysis component
import Analysis from './components/Analysis/Analysis';

// Protected Route component for role-based access control
const ProtectedRoute = ({ element, allowedRoles, requiredPrivilege }) => {
  const userData = sessionStorage.getItem('user');
  const [hasAccess, setHasAccess] = useState(true);
  const [loading, setLoading] = useState(!!requiredPrivilege);
  
  useEffect(() => {
    const checkAccess = async () => {
      if (!userData) return;
      
      const user = JSON.parse(userData);
      
      // Check role first
      if (allowedRoles && !allowedRoles.includes(user.role)) {
        setHasAccess(false);
        return;
      }
      
      // Then check privilege if required
      if (requiredPrivilege) {
        const userPrivileges = JSON.parse(sessionStorage.getItem('userPrivileges') || '[]');
        
        // If no privileges are set, grant access
        if (userPrivileges.length === 0) {
          setHasAccess(true);
        } else {
          setHasAccess(userPrivileges.includes('All') || userPrivileges.includes(requiredPrivilege));
        }
      }
      
      setLoading(false);
    };
    
    checkAccess();
  }, [userData, allowedRoles, requiredPrivilege]);
  
  if (!userData) {
    return <Navigate to="/login" />;
  }
  
  if (loading) {
    return <div>Loading...</div>;
  }
  
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // User doesn't have the required role, redirect to home
    return <Navigate to="/" />;
  }
  
  return element;
};

function App() {
  return (
    <PrivilegeProvider>
      <Router>
        <Navbar />
        <div className="App">
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<Home />} />

            {/* User Routes */}
            <Route path="/users" element={<Users />} />
            <Route 
              path="/add-user" 
              element={
                <PrivilegedRoute 
                  element={<AddUser />}
                  requiredPrivilege="user_add"
                />
              }
              allowedRoles={['Global', 'Admin']} 
            />
            <Route 
              path="/edit-user/:userId" 
              element={
                <PrivilegedRoute 
                  element={<EditUser />}
                  requiredPrivilege="user_update"
                />
              }
              allowedRoles={['Global', 'Admin']} 
            />
            <Route 
              path="/delete-user/:userId" 
              element={
                <PrivilegedRoute 
                  element={<DeleteUser />}
                  requiredPrivilege="user_delete"
                />
              }
              allowedRoles={['Global', 'Admin']} 
            />

            {/* Category Routes */}
            <Route path="/categories" element={<Categories />} />
            <Route 
              path="/add-category" 
              element={
                <PrivilegedRoute 
                  element={<AddCategory />}
                  requiredPrivilege="category_add"
                />
              }
              allowedRoles={['Global','Admin']} 
            />
            <Route 
              path="/delete-category/:categoryId" 
              element={
                <PrivilegedRoute 
                  element={<DeleteCategory />}
                  requiredPrivilege="category_delete"
                />
              }
              allowedRoles={['Global','Admin']} 
            />

            {/* Regulation Routes */}
            <Route path="/regulations" element={<Regulations />} />
            <Route 
              path="/add-regulation" 
              element={
                <PrivilegedRoute 
                  element={<AddRegulation />}
                  requiredPrivilege="regulation_add"
                />
              }
              allowedRoles={['Global','Admin']} 
            />
            <Route 
              path="/edit-regulation/:regulationId" 
              element={
                <PrivilegedRoute 
                  element={<EditRegulation />}
                  requiredPrivilege="regulation_update"
                />
              }
              allowedRoles={['Global','Admin']} 
            />
            <Route 
              path="/delete-regulation/:regulationId" 
              element={
                <PrivilegedRoute 
                  element={<DeleteRegulation />}
                  requiredPrivilege="regulation_delete"
                />
              }
              allowedRoles={['Global','Admin']} 
            />

            {/* Activity Routes */}
            <Route path="/activities" element={<Activities />} />
            <Route 
              path="/add-activity" 
              element={
                <PrivilegedRoute 
                  element={<AddActivity />}
                  requiredPrivilege="activity_add"
                />
              }
              allowedRoles={['Global','Admin']} 
            />
            <Route 
              path="/edit-activity/:activityId" 
              element={
                <PrivilegedRoute 
                  element={<EditActivity />}
                  requiredPrivilege="activity_update"
                />
              }
              allowedRoles={['Global','Admin']} 
            />
            <Route 
              path="/assign-activity/:activityId" 
              element={
                <PrivilegedRoute 
                  element={<AssignActivity />}
                  requiredPrivilege="activity_assign"
                />
              }
              allowedRoles={['Admin']} 
            />

            {/* Task Routes */}
            <Route path="/tasks" element={<Tasks />} />
            <Route 
              path="/reassign-task/:taskId" 
              element={
                <PrivilegedRoute 
                  element={<ReassignTask />}
                  requiredPrivilege="task_reassign"
                />
              }
              allowedRoles={['Admin']} 
            />
            <Route path="/user-tasks" element={<UserTask />} allowedRoles={['User']}  />

            {/* Holiday Routes */}
            <Route path="/holidays" element={<Holidays />} />
            <Route 
              path="/add-holiday" 
              element={
                <PrivilegedRoute 
                  element={<AddHoliday />}
                  requiredPrivilege="holiday_add"
                />
              }
              allowedRoles={['Global', 'Admin']} 
            />

            {/* Analysis Route */}
            <Route 
              path="/analysis" 
              element={
                <PrivilegedRoute 
                  element={<Analysis />}
                  requiredPrivilege="analysis_access"
                />
              }
              allowedRoles={['Global', 'Admin', 'User']} 
            />

            Entity-specific routes
            <Route 
              path="/entities/:entityId/users" 
              element={<Users />} 
              allowedRoles={['Global']} 
            />

            <Route 
              path="/entities/:entityId/regulations" 
              element={<Regulations />}
            />

            {/* Catch-all route for 404 */}
            <Route path="*" element={<Navigate to="/" />} allowedRoles={['Global', 'Admin', 'User']}  />
          </Routes>
        </div>
      </Router>
    </PrivilegeProvider>
  );
}

export default App;
