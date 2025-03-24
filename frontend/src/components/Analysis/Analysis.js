import React, { useState, useEffect } from 'react';
import EntityDashboard from './EntityDashboard';
import { useNavigate } from 'react-router-dom';

const Analysis = () => {
    const [user, setUser] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const userData = sessionStorage.getItem('user');
        if (userData) {
            setUser(JSON.parse(userData));
        } else {
            navigate('/login');
        }
    }, [navigate]);

    if (!user) return null;

    return (
        <div className="analysis-container">
            {user.role === 'Admin' && <EntityDashboard />}
            {/* Add other analysis components here */}
        </div>
    );
};

export default Analysis; 