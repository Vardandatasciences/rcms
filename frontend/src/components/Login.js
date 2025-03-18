import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./Login.css";

const Login = () => {
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is already logged in
    const userData = sessionStorage.getItem("user");
    if (userData) {
      navigate("/dashboard");
    }
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!userId || !password) {
      setError("Please enter both User ID and Password");
      return;
    }
    
    try {
      setLoading(true);
      setError("");
      
      const response = await axios.post("http://localhost:5000/login", {
        user_id: userId,
        password: password,
      });
      
      // Log the response to see what data we're getting
      console.log("Login response:", response.data);
      
      if (response.data && response.data.user_id) {
        // Store user data with consistent property names
        // Use both entity_id and entityId to ensure compatibility with all components
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
        
        // Log what we're storing in session storage
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
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h1>RCMS</h1>
          <p>Regulatory Compliance Management System</p>
        </div>
        
        <form onSubmit={handleSubmit} className="login-form">
          {error && <div className="error-message">{error}</div>}
          
          <div className="form-group">
            <label htmlFor="userId">User ID</label>
            <input
              type="text"
              id="userId"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          
          <button type="submit" className="login-button" disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login; 