import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  FaUser, FaLock, FaShieldAlt, FaChartLine, FaCheckCircle, 
  FaUsersCog, FaTasks, FaBell, FaClipboardCheck, FaDatabase,
  FaUserShield, FaChartBar, FaCog
} from 'react-icons/fa';
import { MdError, MdSecurity, MdCategory, MdAnalytics } from 'react-icons/md';
import axios from 'axios';
import '../styles/Login.css';

const Login = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    user_id: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Check if user is already logged in
  useEffect(() => {
    const userData = sessionStorage.getItem("user");
    if (userData) {
      navigate("/dashboard");
    }
  }, [navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Validate form inputs
    if (!formData.user_id || !formData.password) {
      setError('Please enter both User ID and Password');
      setIsLoading(false);
      return;
    }

    try {
      // Make API call to login endpoint
      const response = await axios.post('http://localhost:5000/login', formData);
      
      console.log("Login response:", response.data);
      
      if (response.data && response.data.user_id) {
        // Store user data with consistent property names
        const userData = {
          user_id: response.data.user_id,
          userId: response.data.user_id,
          entity_id: response.data.entity_id,
          entityId: response.data.entity_id,
          entity_name: response.data.entity_name,
          entityName: response.data.entity_name,
          user_name: response.data.user_name,
          userName: response.data.user_name,
          role: response.data.role
        };
        
        console.log("Storing user data in session:", userData);
        
        // Store user data in session storage
        sessionStorage.setItem("user", JSON.stringify(userData));
        
        // Redirect to dashboard
        navigate("/dashboard");
      } else {
        setError("Invalid response from server. Please try again.");
      }
    } catch (err) {
      console.error("Login error:", err);
      setError(err.response?.data?.error || "Login failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const features = [
    {
      icon: <FaShieldAlt />,
      title: "Security",
      value: "Enterprise-Grade",
      color: "#4f46e5"
    },
    {
      icon: <FaChartBar />,
      title: "Analytics",
      value: "Real-time",
      color: "#0ea5e9"
    },
    {
      icon: <FaUserShield />,
      title: "Compliance",
      value: "ISO 27001",
      color: "#06b6d4"
    },
    {
      icon: <FaDatabase />,
      title: "Data Protection",
      value: "GDPR Ready",
      color: "#6366f1"
    }
  ];

  const stats = [
    { value: "98%", label: "Compliance Rate" },
    { value: "500+", label: "Organizations" },
    { value: "24/7", label: "Support" }
  ];

  return (
    <div className="login-container">
      <div className="login-background">
        <div className="login-gradient"></div>
        <div className="login-grid"></div>
      </div>

      <div className="login-content-wrapper">
        <div className="login-left">
          <motion.div 
            className="product-title"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1>RCMS</h1>
            <p>Risk Compliance Management System</p>
          </motion.div>

          <div className="features-showcase">
            {features.map((feature, index) => (
              <motion.div 
                key={index}
                className="feature-item"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                style={{ '--accent-color': feature.color }}
              >
                <motion.div 
                  className="feature-icon"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {feature.icon}
                </motion.div>
                <div className="feature-text">
                  <h3>{feature.title}</h3>
                  <p>{feature.value}</p>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="stats-row">
            {stats.map((stat, index) => (
              <motion.div 
                key={index}
                className="stat-item"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + index * 0.1 }}
              >
                <motion.span 
                  className="stat-value"
                  whileHover={{ scale: 1.1 }}
                >
                  {stat.value}
                </motion.span>
                <span className="stat-label">{stat.label}</span>
              </motion.div>
            ))}
          </div>
        </div>

        <motion.div 
          className="login-form-container"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="login-header">
            <motion.div 
              className="login-icon"
              animate={{
                scale: [1, 1.1, 1],
                rotate: [0, 360],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              <FaShieldAlt size={30} />
            </motion.div>
            <h2>Welcome Back</h2>
            <p>Log in to your RCMS account</p>
          </div>

          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-group">
              <label>
                <FaUser /> User ID
              </label>
              <motion.input
                type="text"
                name="user_id"
                value={formData.user_id}
                onChange={handleChange}
                placeholder="Enter your user ID"
                whileFocus={{ scale: 1.01 }}
              />
            </div>

            <div className="form-group">
              <label>
                <FaLock /> Password
              </label>
              <motion.input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter your password"
                whileFocus={{ scale: 1.01 }}
              />
            </div>

            {error && (
              <motion.div 
                className="error-message"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <MdError size={20} />
                {error}
              </motion.div>
            )}

            <motion.button
              type="submit"
              className="login-button"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              disabled={isLoading}
            >
              {isLoading ? (
                <motion.div 
                  className="loading-spinner"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                />
              ) : (
                'Log In'
              )}
            </motion.button>

            <div className="form-footer">
              <a href="/forgot-password">Forgot Password?</a>
              <a href="/register">Create Account</a>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
};

export default Login; 