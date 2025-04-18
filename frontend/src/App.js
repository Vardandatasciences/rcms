import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import { PrivilegeProvider, ProtectedRoute } from './components/Privileges';

// Components
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Home from './pages/Home';

// Entity components
import Entities from './components/Entities';
import AddEntity from './components/AddEntity';
import EditEntity from './components/EditEntity';
import DeleteEntity from './components/DeleteEntity';

// User components
import Users from './components/Users';
import AddUser from './components/AddUser';
import EditUser from './components/EditUser';
import DeleteUser from './components/DeleteUser';

// Category components
import Categories from './components/Categories';
import AddCategory from './components/AddCategory';
import DeleteCategory from './components/DeleteCategory';

// Regulation components
import Regulations from './components/Regulations';
import AddRegulation from './components/AddRegulation';
import EditRegulation from './components/EditRegulation';
import DeleteRegulation from './components/DeleteRegulation';

// Activity components
import Activities from './components/Activities';
import AddActivity from './components/AddActivity';
import EditActivity from './components/EditActivity';
import AssignActivity from './components/AssignActivity';

// Holiday components
import Holidays from './components/Holidays';
import AddHoliday from './components/AddHoliday';

// Task components
import Tasks from './components/Tasks';
import ReassignTask from './components/ReassignTask';
import UserTask from './components/UserTask';

// Analysis component
import Analysis from './components/Analysis/Analysis';

// Main App Routes component - separating routes for easier management
const AppRoutes = React.memo(() => {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<Home />} />

      {/* Entity Routes */}
      <Route path="/entities" element={<Entities />} />
      <Route 
        path="/add-entity" 
        element={
          <ProtectedRoute 
            element={<AddEntity />}
            requiredPrivilege="entity_add"
            allowedRoles={['Global']}
          />
        }
      />
      <Route 
        path="/edit-entity/:entityId" 
        element={
          <ProtectedRoute 
            element={<EditEntity />}
            requiredPrivilege="entity_update"
            allowedRoles={['Global']}
          />
        }
      />
      <Route 
        path="/delete-entity/:entityId" 
        element={
          <ProtectedRoute 
            element={<DeleteEntity />}
            requiredPrivilege="entity_delete"
            allowedRoles={['Global']}
          />
        }
      />

      {/* User Routes */}
      <Route path="/users" element={<Users />} />
      <Route 
        path="/add-user" 
        element={
          <ProtectedRoute 
            element={<AddUser />}
            requiredPrivilege="user_add"
            allowedRoles={['Global', 'Admin']}
          />
        }
      />
      <Route 
        path="/edit-user/:userId" 
        element={
          <ProtectedRoute 
            element={<EditUser />}
            requiredPrivilege="user_update"
            allowedRoles={['Global', 'Admin']}
          />
        }
      />
      <Route 
        path="/delete-user/:userId" 
        element={
          <ProtectedRoute 
            element={<DeleteUser />}
            requiredPrivilege="user_delete"
            allowedRoles={['Global', 'Admin']}
          />
        }
      />

      {/* Category Routes */}
      <Route path="/categories" element={<Categories />} />
      <Route 
        path="/add-category" 
        element={
          <ProtectedRoute 
            element={<AddCategory />}
            requiredPrivilege="category_add"
            allowedRoles={['Global','Admin']}
          />
        }
      />
      <Route 
        path="/delete-category/:categoryId" 
        element={
          <ProtectedRoute 
            element={<DeleteCategory />}
            requiredPrivilege="category_delete"
            allowedRoles={['Global','Admin']}
          />
        }
      />

      {/* Regulation Routes */}
      <Route path="/regulations" element={<Regulations />} />
      <Route 
        path="/add-regulation" 
        element={
          <ProtectedRoute 
            element={<AddRegulation />}
            requiredPrivilege="regulation_add"
            allowedRoles={['Global','Admin']}
          />
        }
      />
      <Route 
        path="/edit-regulation/:regulationId" 
        element={
          <ProtectedRoute 
            element={<EditRegulation />}
            requiredPrivilege="regulation_update"
            allowedRoles={['Global','Admin']}
          />
        }
      />
      <Route 
        path="/delete-regulation/:regulationId" 
        element={
          <ProtectedRoute 
            element={<DeleteRegulation />}
            requiredPrivilege="regulation_delete"
            allowedRoles={['Global','Admin']}
          />
        }
      />

      {/* Activity Routes */}
      <Route path="/activities" element={<Activities />} />
      <Route 
        path="/add-activity" 
        element={
          <ProtectedRoute 
            element={<AddActivity />}
            requiredPrivilege="activity_add"
            allowedRoles={['Global','Admin']}
          />
        }
      />
      <Route 
        path="/edit-activity/:activityId" 
        element={
          <ProtectedRoute 
            element={<EditActivity />}
            requiredPrivilege="activity_update"
            allowedRoles={['Global','Admin']}
          />
        }
      />
      <Route 
        path="/assign-activity/:activityId" 
        element={
          <ProtectedRoute 
            element={<AssignActivity />}
            requiredPrivilege="activity_assign"
            allowedRoles={['Admin']}
          />
        }
      />

      {/* Task Routes */}
      <Route path="/tasks" element={<Tasks />} />
      <Route 
        path="/reassign-task/:taskId" 
        element={
          <ProtectedRoute 
            element={<ReassignTask />}
            requiredPrivilege="task_reassign"
            allowedRoles={['Admin']}
          />
        }
      />
      <Route path="/user-tasks" element={<UserTask />} />

      {/* Holiday Routes */}
      <Route 
        path="/holidays" 
        element={
          <ProtectedRoute 
            element={<Holidays />}
            requiredPrivilege="holiday_access"
            allowedRoles={['Global', 'Admin', 'User']}
          />
        }
      />
      <Route 
        path="/add-holiday" 
        element={
          <ProtectedRoute 
            element={<AddHoliday />}
            requiredPrivilege="holiday_add"
            allowedRoles={['Global', 'Admin']}
          />
        }
      />

      {/* Analysis Route */}
      <Route 
        path="/analysis" 
        element={
          <ProtectedRoute 
            element={<Analysis />}
            requiredPrivilege="analysis_access"
            allowedRoles={['Global', 'Admin', 'User']}
          />
        }
      />

      {/* Entity-specific routes */}
      <Route path="/entities/:entityId/users" element={<Users />} />
      <Route path="/entities/:entityId/regulations" element={<Regulations />} />

      {/* Catch-all route for 404 */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
});

// Add display name for better debugging
AppRoutes.displayName = 'AppRoutes';

function App() {
  return (
    <PrivilegeProvider>
      <Router>
        <Navbar />
        <div className="App">
          <AppRoutes />
        </div>
      </Router>
    </PrivilegeProvider>
  );
}

export default App;
