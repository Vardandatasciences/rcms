import React from 'react';
import { Navigate } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import EntityDashboard from '../../components/EntityDashboard/EntityDashboard';
import ErrorBoundary from '../../components/ErrorBoundary';
import './EntityAnalysis.css';

const EntityAnalysis = () => {
    const user = JSON.parse(sessionStorage.getItem('user'));
    
    if (!user) {
        return <Navigate to="/login" />;
    }

    if (user.role !== 'Admin') {
        return <Navigate to="/" />;
    }

    return (
        <div>
            <Navbar />
            <div className="analysis-page">
                <h1 className="page-title">Entity Analysis Dashboard</h1>
                <ErrorBoundary>
                    <EntityDashboard />
                </ErrorBoundary>
            </div>
        </div>
    );
};

export default EntityAnalysis; 