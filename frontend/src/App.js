import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Navbar from './components/Navbar';

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

// Protected Route component for role-based access control
const ProtectedRoute = ({ element, allowedRoles }) => {
  const userData = sessionStorage.getItem('user');
  
  if (!userData) {
    // Not logged in, redirect to login
    return <Navigate to="/login" />;
  }
  
  const user = JSON.parse(userData);
  
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // User doesn't have the required role, redirect to home instead of dashboard
    return <Navigate to="/" />;
  }
  
  // User is authenticated and has the required role, render the component
  return element;
};

// Update the Analysis component to be a simple placeholder
const Analysis = () => {
  return (
    <div>
      <h1>Analysis Page</h1>
      <p>Analysis dashboard will be integrated here.</p>
    </div>
  );
};

function App() {
  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Navbar />
      <div className="App">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/activities" element={<Activities />} />
          <Route path="/assign-activity/:regulationId/:activityId" element={<AssignActivity />} />
          
          {/* Public routes */}
          <Route path="/" element={<Home />} />
          
          {/* Protected routes */}
          <Route path="/dashboard/:role" element={<ProtectedRoute element={<Dashboard />} />} />
          
          {/* Entity routes - Only for Global role */}
          <Route 
            path="/entities" 
            element={<ProtectedRoute element={<Entities />} allowedRoles={['Global']} />} 
          />
          <Route 
            path="/entities/add" 
            element={<ProtectedRoute element={<AddEntity />} allowedRoles={['Global']} />} 
          />
          <Route 
            path="/entities/edit/:entityId" 
            element={<ProtectedRoute element={<EditEntity />} allowedRoles={['Global']} />} 
          />
          <Route 
            path="/entities/delete/:entityId" 
            element={<ProtectedRoute element={<DeleteEntity />} allowedRoles={['Global']} />} 
          />
          
          {/* User routes - For Admin and User roles */}
          <Route 
            path="/users" 
            element={<ProtectedRoute element={<Users />} allowedRoles={['Admin', 'User']} />} 
          />
          <Route 
            path="/users/add" 
            element={<ProtectedRoute element={<AddUser />} allowedRoles={['Admin']} />} 
          />
          <Route 
            path="/users/edit/:userId" 
            element={<ProtectedRoute element={<EditUser />} allowedRoles={['Admin']} />} 
          />
          <Route 
            path="/users/delete/:userId" 
            element={<ProtectedRoute element={<DeleteUser />} allowedRoles={['Admin']} />} 
          />
          
          {/* Category routes - For Global and Admin roles */}
          <Route 
            path="/categories" 
            element={<ProtectedRoute element={<Categories />} allowedRoles={['Global', 'Admin']} />} 
          />
          <Route 
            path="/categories/add" 
            element={<ProtectedRoute element={<AddCategory />} allowedRoles={['Global', 'Admin']} />} 
          />
          <Route 
            path="/categories/delete/:categoryId" 
            element={<ProtectedRoute element={<DeleteCategory />} allowedRoles={['Global', 'Admin']} />} 
          />
          
          {/* Regulation routes - For Global and Admin roles */}
          <Route 
            path="/regulations" 
            element={<ProtectedRoute element={<Regulations />} allowedRoles={['Global', 'Admin']} />} 
          />
          <Route 
            path="/regulations/add" 
            element={<ProtectedRoute element={<AddRegulation />} allowedRoles={['Global', 'Admin']} />} 
          />
          <Route 
            path="/regulations/edit/:regulationId" 
            element={<ProtectedRoute element={<EditRegulation />} allowedRoles={['Global', 'Admin']} />} 
          />
          <Route 
            path="/regulations/delete/:regulationId" 
            element={<ProtectedRoute element={<DeleteRegulation />} allowedRoles={['Global', 'Admin']} />} 
          />
          
          {/* Activity routes - For Global and Admin roles */}
          <Route 
            path="/activities" 
            element={<ProtectedRoute element={<Activities />} allowedRoles={['Global', 'Admin']} />} 
          />
          <Route 
            path="/activities/add" 
            element={<ProtectedRoute element={<AddActivity />} allowedRoles={['Global', 'Admin']} />} 
          />
          <Route 
            path="/activities/edit/:regulationId/:activityId" 
            element={<ProtectedRoute element={<EditActivity />} allowedRoles={['Global', 'Admin']} />} 
          />
          <Route 
            path="/activities/assign/:regulationId/:activityId" 
            element={<ProtectedRoute element={<AssignActivity />} allowedRoles={['Global', 'Admin']} />} 
          />
          
          {/* Holiday routes - Only for Admin role */}
          <Route 
            path="/holidays" 
            element={<ProtectedRoute element={<Holidays />} allowedRoles={['Admin']} />} 
          />
          <Route 
            path="/holidays/add" 
            element={<ProtectedRoute element={<AddHoliday />} allowedRoles={['Admin']} />} 
          />
          
          {/* Tasks route - For all roles */}
          <Route 
            path="/tasks" 
            element={<ProtectedRoute element={<Tasks />} allowedRoles={['Global', 'Admin', 'User']} />} 
          />
          
          {/* Analysis route - Only for Admin role */}
          <Route 
            path="/analysis" 
            element={<ProtectedRoute element={<Analysis />} allowedRoles={['Admin']} />} 
          />
          
          {/* Reassign Task route - For Global and Admin roles */}
          <Route 
            path="/reassign-task/:taskId" 
            element={<ProtectedRoute element={<ReassignTask />} allowedRoles={['Global', 'Admin']} />} 
          />
          
          {/* Catch all route - redirect to home instead of dashboard */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
