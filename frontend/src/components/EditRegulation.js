import React, { useState, useEffect } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "./Navbar";
import "./EditRegulation.css";

const EditRegulation = () => {
  const { regulationId } = useParams();
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    regulation_name: "",
    category_id: "",
    regulatory_body: "",
    internal_external: "I",
    national_international: "N",
    mandatory_optional: "M"
  });

  useEffect(() => {
    // Check if user is logged in
    const userData = sessionStorage.getItem("user");
    if (!userData) {
      navigate("/login");
      return;
    }

    // Fetch data
    fetchData();
  }, [navigate, regulationId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch categories and regulation details in parallel
      const [categoriesResponse, regulationResponse] = await Promise.all([
        axios.get("http://localhost:5000/categories"),
        axios.get(`http://localhost:5000/regulation_details/${regulationId}`)
      ]);
      
      setCategories(categoriesResponse.data.categories || []);
      
      // Set form data from regulation details
      if (regulationResponse.data && regulationResponse.data.regulation) {
        const regulation = regulationResponse.data.regulation;
        setFormData({
          regulation_name: regulation.regulation_name || "",
          category_id: regulation.category_id || "",
          regulatory_body: regulation.regulatory_body || "",
          internal_external: regulation.internal_external || "I",
          national_international: regulation.national_international || "N",
          mandatory_optional: regulation.mandatory_optional || "M"
        });
      } else {
        setError("Failed to fetch regulation details.");
      }
      
      setLoading(false);
    } catch (err) {
      console.error("Error fetching data:", err);
      setError("Failed to fetch data. Please try again later.");
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      
      // Validate form data
      if (!formData.regulation_name || !formData.category_id) {
        setError("Regulation name and category are required.");
        setLoading(false);
        return;
      }
      
      // Submit form data
      await axios.put(`http://localhost:5000/edit_regulation/${regulationId}`, formData);
      
      // Navigate back to regulations list
      navigate("/regulations");
    } catch (err) {
      console.error("Error updating regulation:", err);
      setError(err.response?.data?.error || "Failed to update regulation. Please try again later.");
      setLoading(false);
    }
  };

  return (
    <div className="edit-regulation-container">
      <Navbar />
      <div className="edit-regulation-content">
        <h1>Edit Regulation</h1>
        
        {loading ? (
          <div className="loading">Loading regulation details...</div>
        ) : error ? (
          <div className="error">
            {error}
            <button 
              className="btn-back" 
              onClick={() => navigate("/regulations")}
            >
              Back to Regulations
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="regulation-form">
            <div className="form-group">
              <label htmlFor="regulation_id">Regulation ID:</label>
              <input
                type="text"
                id="regulation_id"
                value={regulationId}
                readOnly
                className="readonly-input"
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="regulation_name">Regulation Name:</label>
              <input
                type="text"
                id="regulation_name"
                name="regulation_name"
                value={formData.regulation_name}
                onChange={handleInputChange}
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="category_id">Category:</label>
              <select
                id="category_id"
                name="category_id"
                value={formData.category_id}
                onChange={handleInputChange}
                required
              >
                <option value="">Select Category</option>
                {categories && categories.map((category) => (
            <option key={category.category_id} value={category.category_id}>
              {category.category_type}
            </option>
          ))}
        </select>
            </div>
            
            <div className="form-group">
              <label htmlFor="regulatory_body">Regulatory Body:</label>
              <input
                type="text"
                id="regulatory_body"
                name="regulatory_body"
                value={formData.regulatory_body}
                onChange={handleInputChange}
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="internal_external">Internal/External:</label>
              <select
                id="internal_external"
                name="internal_external"
                value={formData.internal_external}
                onChange={handleInputChange}
              >
          <option value="I">Internal</option>
          <option value="E">External</option>
        </select>
            </div>
            
            <div className="form-group">
              <label htmlFor="national_international">National/International:</label>
              <select
                id="national_international"
                name="national_international"
                value={formData.national_international}
                onChange={handleInputChange}
              >
          <option value="N">National</option>
          <option value="I">International</option>
        </select>
            </div>
            
            <div className="form-group">
              <label htmlFor="mandatory_optional">Mandatory/Optional:</label>
              <select
                id="mandatory_optional"
                name="mandatory_optional"
                value={formData.mandatory_optional}
                onChange={handleInputChange}
              >
          <option value="M">Mandatory</option>
          <option value="O">Optional</option>
        </select>
            </div>
            
            <div className="form-actions">
              <button type="submit" className="btn-save" disabled={loading}>
                {loading ? "Saving..." : "Update Regulation"}
              </button>
              <button
                type="button"
                className="btn-cancel"
                onClick={() => navigate("/regulations")}
              >
                Cancel
              </button>
        </div>
      </form>
        )}
      </div>
    </div>
  );
};

export default EditRegulation;
