import React, { useState, useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';
import api from '../../api/config';
import './EntityDashboard.css';

function TaskDashboard() {
    const [entityId, setEntityId] = useState(null);
    const [selectedTimePeriod, setSelectedTimePeriod] = useState('All');
    const [summary, setSummary] = useState(null);
    const [selectedUser, setSelectedUser] = useState(null);
    const [users, setUsers] = useState([]);
    const [selectedStatus, setSelectedStatus] = useState(null);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [selectedCriticality, setSelectedCriticality] = useState(null);
    const [detailedData, setDetailedData] = useState([]);
    const [error, setError] = useState(null);
    
    const pieChartRef = useRef(null);
    const barChartRef = useRef(null);
    const criticalityChartRef = useRef(null);
    const pieChartInstance = useRef(null);
    const barChartInstance = useRef(null);
    const criticalityChartInstance = useRef(null);

    useEffect(() => {
        const initializeDashboard = async () => {
            try {
                const userData = sessionStorage.getItem('user');
                if (userData) {
                    const parsedUser = JSON.parse(userData);
                    if (parsedUser.entityId) {
                        setEntityId(parsedUser.entityId);
                        await fetchData(parsedUser.entityId);
                        await fetchUsers();
                    } else {
                        setError('No entity ID found in session');
                    }
                } else {
                    setError('No user data found in session');
                }
            } catch (error) {
                console.error('Dashboard initialization error:', error);
                setError('Failed to initialize dashboard');
            }
        };

        initializeDashboard();
    }, []);

    useEffect(() => {
        if (entityId) {
            fetchData(entityId);
        }
    }, [entityId, selectedTimePeriod]);

    const fetchData = async (currentEntityId) => {
        try {
            const response = await api.get(`/api/analysis/task-summary/${currentEntityId}`, {
                params: {
                    time_period: selectedTimePeriod
                }
            });
            
            if (response.data) {
                setSummary(response.data);
                setDetailedData(response.data.detailed_data || []);
                createOrUpdatePieChart(response.data);
                createOrUpdateBarChart(response.data);
                createOrUpdateCriticalityChart(response.data);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
            setError('Failed to fetch dashboard data');
        }
    };

    const fetchUsers = async () => {
        try {
            const response = await api.get('/api/analysis/users');
            setUsers(response.data);
        } catch (error) {
            console.error('Error fetching users:', error);
            setError('Failed to fetch users');
        }
    };

    const createOrUpdatePieChart = (data) => {
        if (!pieChartRef.current) return;
        
        if (pieChartInstance.current) {
            pieChartInstance.current.destroy();
        }

        const labels = [
            'Completed', 
            'Completed with Delay', 
            'Due', 
            'Due with Delay', 
            'Ongoing', 
            'Ongoing with Delay'
        ];

        const backgroundColors = [
            '#007bff',
            '#28a745',
            '#dc3545',
            '#fd7e14',
            '#17a2b8',
            '#ffc107'
        ];

        const chartData = {
            labels: labels,
            datasets: [{
                data: [
                    data.completed,
                    data.completed_with_delay,
                    data.due,
                    data.due_with_delay,
                    data.ongoing,
                    data.ongoing_with_delay
                ],
                backgroundColor: backgroundColors,
                hoverOffset: 4
            }]
        };

        const ctx = pieChartRef.current.getContext('2d');
        pieChartInstance.current = new Chart(ctx, {
            type: 'pie',
            data: chartData,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                    },
                    title: {
                        display: true,
                        text: 'Task Status Distribution'
                    }
                }
            }
        });
    };

    const createOrUpdateBarChart = (data) => {
        if (!barChartRef.current) return;
        
        if (barChartInstance.current) {
            barChartInstance.current.destroy();
        }
        
        const categoryData = data.category_data;
        const categories = Object.keys(categoryData);
        
        const statuses = [
            'Completed', 
            'Completed with Delay', 
            'Ongoing', 
            'Ongoing with Delay', 
            'Due', 
            'Due with Delay'
        ];
        
        const statusColors = {
            'Completed': '#007bff',
            'Completed with Delay': '#28a745',
            'Ongoing': '#17a2b8',
            'Ongoing with Delay': '#ffc107',
            'Due': '#dc3545',
            'Due with Delay': '#fd7e14'
        };
        
        let datasets = [];
        
        datasets = statuses.map(status => ({
            label: status,
            data: categories.map(category => categoryData[category][status] || 0),
            backgroundColor: statusColors[status],
            borderColor: 'rgba(255, 255, 255, 0.8)',
            borderWidth: 1
        }));
        
        const ctx = barChartRef.current.getContext('2d');
        barChartInstance.current = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: categories,
                datasets: datasets
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        stacked: true,
                        title: { display: true, text: 'Category' }
                    },
                    y: {
                        stacked: true,
                        title: { display: true, text: 'Number of Tasks' },
                        beginAtZero: true
                    }
                },
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: { boxWidth: 12, font: { size: 10 } }
                    },
                    title: {
                        display: true,
                        text: 'Category-wise Task Status',
                        font: { size: 16 }
                    }
                }
            }
        });
    };

    const createOrUpdateCriticalityChart = (data) => {
        if (!criticalityChartRef.current) return;
        
        if (criticalityChartInstance.current) {
            criticalityChartInstance.current.destroy();
        }
        
        const criticalityData = data.criticality_data || {};
        const criticalities = Object.keys(criticalityData);
        
        const statuses = [
            'Completed', 
            'Completed with Delay', 
            'Ongoing', 
            'Ongoing with Delay', 
            'Due', 
            'Due with Delay'
        ];
        
        const statusColors = {
            'Completed': '#007bff',
            'Completed with Delay': '#28a745',
            'Ongoing': '#17a2b8',
            'Ongoing with Delay': '#ffc107',
            'Due': '#dc3545',
            'Due with Delay': '#fd7e14'
        };
        
        let datasets = [];
        
        datasets = statuses.map(status => ({
            label: status,
            data: criticalities.map(criticality => criticalityData[criticality][status] || 0),
            backgroundColor: statusColors[status],
            borderColor: 'rgba(255, 255, 255, 0.8)',
            borderWidth: 1
        }));
        
        const ctx = criticalityChartRef.current.getContext('2d');
        criticalityChartInstance.current = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: criticalities,
                datasets: datasets
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        stacked: true,
                        title: { display: true, text: 'Criticality' }
                    },
                    y: {
                        stacked: true,
                        title: { display: true, text: 'Number of Tasks' },
                        beginAtZero: true
                    }
                },
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: { boxWidth: 12, font: { size: 10 } }
                    },
                    title: {
                        display: true,
                        text: 'Tasks by Criticality Level',
                        font: { size: 16 }
                    }
                }
            }
        });
    };

    const handleTimePeriodChange = (event) => {
        setSelectedTimePeriod(event.target.value);
    };

    const handleUserSelect = (user) => {
        setSelectedUser(user);
    };

    const handleStatusClick = (status) => {
        setSelectedStatus(status === selectedStatus ? null : status);
    };

    const handleCategoryClick = (category) => {
        setSelectedCategory(category === selectedCategory ? null : category);
    };

    const handleCriticalityClick = (criticality) => {
        setSelectedCriticality(criticality === selectedCriticality ? null : criticality);
    };

    if (error) {
        return (
            <div className="error-container">
                <h3>Error</h3>
                <p>{error}</p>
                <button onClick={() => window.location.reload()}>Retry</button>
            </div>
        );
    }

    if (!entityId) return <div className="loading">Loading dashboard data...</div>;

    return (
        <div className="dashboard-container">
            <div className="header">
                <h2>Entity Analysis Dashboard</h2>
                <div className="filters">
                    <select 
                        value={selectedTimePeriod} 
                        onChange={handleTimePeriodChange}
                    >
                        <option value="All">All Time</option>
                        <option value="Today">Today</option>
                        <option value="This Week">This Week</option>
                        <option value="This Month">This Month</option>
                        <option value="This Year">This Year</option>
                    </select>
                </div>
            </div>

            <div className="dashboard-grid">
                <div className="chart-section">
                    <div className="chart-row">
                        <div className="chart-container pie-chart">
                            <canvas ref={pieChartRef}></canvas>
                        </div>
                        <div className="chart-container bar-chart">
                            <canvas ref={barChartRef}></canvas>
                        </div>
                    </div>
                    <div className="chart-row">
                        <div className="chart-container criticality-chart">
                            <canvas ref={criticalityChartRef}></canvas>
                        </div>
                        <div className="status-summary">
                            {summary && (
                                <div className="status-grid">
                                    <div className="status-item">
                                        <span className="status-label">Total Tasks</span>
                                        <span className="status-value">{summary.total_tasks}</span>
                                    </div>
                                    <div className="status-item">
                                        <span className="status-label">Completed</span>
                                        <span className="status-value">{summary.completed}</span>
                                    </div>
                                    <div className="status-item">
                                        <span className="status-label">Ongoing</span>
                                        <span className="status-value">{summary.ongoing}</span>
                                    </div>
                                    <div className="status-item">
                                        <span className="status-label">Due</span>
                                        <span className="status-value">{summary.due}</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="details-section">
                <h3>Task Details</h3>
                <div className="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Task ID</th>
                                <th>Category</th>
                                <th>Description</th>
                                <th>Due Date</th>
                                <th>Status</th>
                                <th>Assigned To</th>
                                <th>Criticality</th>
                            </tr>
                        </thead>
                        <tbody>
                            {detailedData.map(task => (
                                <tr key={task.id}>
                                    <td>{task.id}</td>
                                    <td>{task.category}</td>
                                    <td>{task.description}</td>
                                    <td>{new Date(task.due_date).toLocaleDateString()}</td>
                                    <td>{task.status}</td>
                                    <td>{task.assigned_to}</td>
                                    <td>{task.criticality}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

export default TaskDashboard; 