import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './EntityDashboard.css';

const EntityDashboard = () => {
    const [user, setUser] = useState(null);
    
    useEffect(() => {
        // Get user data from session storage
        const userData = sessionStorage.getItem('user');
        if (userData) {
            setUser(JSON.parse(userData));
        }
    }, []);

    // If no user data or not an Admin, don't render the dashboard
    if (!user || user.role !== 'Admin') {
        return <div>Access Denied: Only Admin users can view this dashboard</div>;
    }

    return (
        <div id="dashboard-container">
            {/* Your existing dashboard HTML/React code here */}
            {/* The content from entity_dashboard.html will be converted to React components */}
        </div>
    );
};

export default EntityDashboard; 