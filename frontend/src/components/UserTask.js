import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Navbar from './Navbar';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faTasks, faSpinner, faCheck, faClock, faCalendarAlt
} from '@fortawesome/free-solid-svg-icons';

const UserTask = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is logged in
    const userData = sessionStorage.getItem('user');
    if (!userData) {
      navigate('/login');
      return;
    }

    // Fetch user tasks
    const fetchUserTasks = async () => {
      try {
        const user = JSON.parse(userData);
        const response = await axios.get(`http://localhost:5000/user_tasks/${user.user_id}`);
        setTasks(response.data.tasks || []);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching user tasks:', err);
        setError('Failed to load tasks. Please try again later.');
        setLoading(false);
      }
    };

    fetchUserTasks();
  }, [navigate]);

  if (loading) {
    return (
      <div className="task-container">
        <Navbar />
        <div className="task-content">
          <div className="loading">
            <FontAwesomeIcon icon={faSpinner} className="spinner" />
            <p>Loading your tasks...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="task-container">
        <Navbar />
        <div className="task-content">
          <div className="error-message">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="task-container">
      <Navbar />
      <div className="task-content">
        <h1><FontAwesomeIcon icon={faTasks} /> My Tasks</h1>
        <p>View and manage your assigned tasks</p>
        
        {tasks.length === 0 ? (
          <div className="no-tasks">
            <p>You have no tasks assigned at the moment.</p>
          </div>
        ) : (
          <div className="task-list">
            {tasks.map((task) => (
              <div key={task.task_id} className="task-card">
                <div className="task-header">
                  <h3>{task.task_name || 'Untitled Task'}</h3>
                  <span className={`task-status ${task.status?.toLowerCase() || 'pending'}`}>
                    {task.status || 'Pending'}
                  </span>
                </div>
                <div className="task-body">
                  <p>{task.description || 'No description provided'}</p>
                  <div className="task-meta">
                    <span className="task-date">
                      <FontAwesomeIcon icon={faCalendarAlt} />
                      Due: {task.due_date || 'Not specified'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default UserTask; 