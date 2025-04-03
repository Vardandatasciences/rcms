import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Navbar from './components/Navbar';
import axios from 'axios';
import { PrivilegeProvider } from './components/PrivilegeContext';
import PrivilegedRoute from './components/PrivilegedRoute';

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

// Import the PrivilegeGuard
import PrivilegeGuard from './components/PrivilegeGuard';

// Import the PrivilegeCheck
import PrivilegeCheck from './components/PrivilegeCheck';

// Removed Analysis import that was causing an error

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

            {/* Dashboard */}
            <Route path="/dashboard" element={
              <PrivilegedRoute element={<Dashboard />} requiredPrivilege="dashboard_view" />
            } />

            {/* Entity routes */}
            <Route path="/entities" element={
              <PrivilegedRoute element={<Entities />} requiredPrivilege="entity_view" />
            } />
            <Route path="/entities/add" element={
              <PrivilegedRoute element={<AddEntity />} requiredPrivilege="entity_add" />
            } />
            <Route path="/entities/edit/:id" element={
              <PrivilegedRoute element={<EditEntity />} requiredPrivilege="entity_update" />
            } />
            <Route path="/entities/delete/:id" element={
              <PrivilegedRoute element={<DeleteEntity />} requiredPrivilege="entity_delete" />
            } />

            {/* User routes */}
            <Route path="/users" element={
              <PrivilegedRoute element={<Users />} requiredPrivilege="user_view" />
            } />
            <Route path="/users/add" element={
              <PrivilegedRoute element={<AddUser />} requiredPrivilege="user_add" />
            } />
            <Route path="/users/edit/:id" element={
              <PrivilegedRoute element={<EditUser />} requiredPrivilege="user_update" />
            } />
            <Route path="/users/delete/:id" element={
              <PrivilegedRoute element={<DeleteUser />} requiredPrivilege="user_delete" />
            } />

            {/* Category routes */}
            <Route path="/categories" element={
              <PrivilegedRoute element={<Categories />} requiredPrivilege="category_view" />
            } />
            <Route path="/categories/add" element={
              <PrivilegedRoute element={<AddCategory />} requiredPrivilege="category_add" />
            } />
            <Route path="/categories/delete/:id" element={
              <PrivilegedRoute element={<DeleteCategory />} requiredPrivilege="category_delete" />
            } />

            {/* Regulation routes */}
            <Route path="/regulations" element={
              <PrivilegedRoute element={<Regulations />} requiredPrivilege="regulation_view" />
            } />
            <Route path="/regulations/add" element={
              <PrivilegedRoute element={<AddRegulation />} requiredPrivilege="regulation_add" />
            } />
            <Route path="/regulations/edit/:id" element={
              <PrivilegedRoute element={<EditRegulation />} requiredPrivilege="regulation_update" />
            } />
            <Route path="/regulations/delete/:id" element={
              <PrivilegedRoute element={<DeleteRegulation />} requiredPrivilege="regulation_delete" />
            } />

            {/* Activity routes */}
            <Route path="/activities" element={
              <PrivilegedRoute element={<Activities />} requiredPrivilege="activity_view" />
            } />
            <Route path="/activities/add" element={
              <PrivilegedRoute element={<AddActivity />} requiredPrivilege="activity_add" />
            } />
            <Route path="/activities/edit/:id" element={
              <PrivilegedRoute element={<EditActivity />} requiredPrivilege="activity_update" />
            } />
            <Route path="/activities/assign" element={
              <PrivilegedRoute element={<AssignActivity />} requiredPrivilege="activity_assign" />
            } />

            {/* Holiday routes */}
            <Route path="/holidays" element={
              <PrivilegedRoute element={<Holidays />} requiredPrivilege="holiday_view" />
            } />
            <Route path="/holidays/add" element={
              <PrivilegedRoute element={<AddHoliday />} requiredPrivilege="holiday_add" />
            } />

            {/* Task routes */}
            <Route path="/tasks" element={
              <PrivilegedRoute element={<Tasks />} requiredPrivilege="task_view" />
            } />
            <Route path="/tasks/reassign/:id" element={
              <PrivilegedRoute element={<ReassignTask />} requiredPrivilege="task_reassign" />
            } />
            <Route path="/tasks/user" element={
              <PrivilegedRoute element={<UserTask />} requiredPrivilege="task_user_view" />
            } />

            {/* Catch-all route for 404 */}
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </div>
      </Router>
    </PrivilegeProvider>
  );
}

export default App;
