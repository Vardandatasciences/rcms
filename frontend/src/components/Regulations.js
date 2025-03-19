import React, { useState, useEffect } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "./Navbar";
import "./Regulations.css";
import AddRegulation from "./AddRegulation";
import EditRegulation from "./EditRegulation";
import DeleteRegulation from "./DeleteRegulation";
import { FaEdit, FaTrashAlt, FaBuilding, FaGlobe, FaHome, 
         FaFlag, FaGlobeAmericas, FaCheckCircle, FaCircle, 
         FaFolder, FaFilter, FaList, FaExclamationTriangle, 
         FaCheckSquare, FaSquare } from "react-icons/fa";

const Regulations = () => {
  const [regulations, setRegulations] = useState([]);
  const [filteredRegulations, setFilteredRegulations] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingRegulation, setEditingRegulation] = useState(null);
  const [activeFilter, setActiveFilter] = useState("all");
  const navigate = useNavigate();

  useEffect(() => {
    // Get user data from session storage
    const userData = sessionStorage.getItem("user");
    if (userData) {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
      fetchData();
    } else {
      navigate("/login");
    }
  }, [navigate]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch regulations and categories in parallel
      const [regulationsResponse, categoriesResponse] = await Promise.all([
        axios.get("http://localhost:5000/regulations"),
        axios.get("http://localhost:5000/categories")
      ]);
      
      const regulationsData = regulationsResponse.data.regulations || [];
      setRegulations(regulationsData);
      setFilteredRegulations(regulationsData);
      setCategories(categoriesResponse.data.categories || []);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching data:", err);
      setError("Failed to fetch data. Please try again later.");
      setLoading(false);
    }
  };

  // Function to get category name by ID
  const getCategoryName = (categoryId) => {
    if (!categories || categories.length === 0) return "Unknown Category";
    
    const category = categories.find(cat => cat.category_id === categoryId);
    return category ? category.category_type : "Unknown Category";
  };

  // Function to handle regulation deletion
  const handleDelete = async (regulationId) => {
    if (window.confirm("Are you sure you want to delete this regulation?")) {
      try {
        await axios.delete(`http://localhost:5000/delete_regulation/${regulationId}`);
        // Refresh the regulations list
        fetchData();
      } catch (err) {
        console.error("Error deleting regulation:", err);
        setError("Failed to delete regulation. Please try again later.");
      }
    }
  };

  // Function to handle filtering
  const handleFilterChange = (filter) => {
    setActiveFilter(filter);
    
    if (filter === "all") {
      setFilteredRegulations(regulations);
      return;
    }
    
    let filtered;
    switch(filter) {
      case "internal":
        filtered = regulations.filter(reg => reg.internal_external === "I");
        break;
      case "external":
        filtered = regulations.filter(reg => reg.internal_external === "E");
        break;
      case "mandatory":
        filtered = regulations.filter(reg => reg.mandatory_optional === "M");
        break;
      case "optional":
        filtered = regulations.filter(reg => reg.mandatory_optional === "O");
        break;
      case "national":
        filtered = regulations.filter(reg => reg.national_international === "N");
        break;
      case "international":
        filtered = regulations.filter(reg => reg.national_international === "I");
        break;
      default:
        filtered = regulations;
    }
    
    setFilteredRegulations(filtered);
  };

  if (!user) return null;

  return (
    <div className="regulations-container">
      <Navbar />
      <div className="regulations-content">
        {/* <h1>Regulations Management</h1>
        <p>View, add, edit, and delete regulations</p> */}

        {/* <div className="regulations-actions">
          <Link to="/regulations/add" className="btn-add">
            Add New Regulation
          </Link>
        </div> */}

        {showAddForm ? (
          <AddRegulation categories={categories} onRegulationAdded={fetchData} />
        ) : editingRegulation ? (
          <EditRegulation
            regulation={editingRegulation}
            categories={categories}
            onClose={() => setEditingRegulation(null)}
            onUpdate={fetchData}
          />
        ) : (
          <>
            <div className="filter-tabs">
              <div 
                className={`filter-tab ${activeFilter === "all" ? "active" : ""}`}
                onClick={() => handleFilterChange("all")}
              >
                <FaList className="filter-tab-icon" /> All Regulations
              </div>
              <div 
                className={`filter-tab ${activeFilter === "internal" ? "active" : ""}`}
                onClick={() => handleFilterChange("internal")}
              >
                <FaHome className="filter-tab-icon" /> Internal
              </div>
              <div 
                className={`filter-tab ${activeFilter === "external" ? "active" : ""}`}
                onClick={() => handleFilterChange("external")}
              >
                <FaGlobe className="filter-tab-icon" /> External
              </div>
              <div 
                className={`filter-tab ${activeFilter === "mandatory" ? "active" : ""}`}
                onClick={() => handleFilterChange("mandatory")}
              >
                <FaCheckSquare className="filter-tab-icon" /> Mandatory
              </div>
              <div 
                className={`filter-tab ${activeFilter === "optional" ? "active" : ""}`}
                onClick={() => handleFilterChange("optional")}
              >
                <FaSquare className="filter-tab-icon" /> Optional
              </div>
              <div 
                className={`filter-tab ${activeFilter === "national" ? "active" : ""}`}
                onClick={() => handleFilterChange("national")}
              >
                <FaFlag className="filter-tab-icon" /> National
              </div>
              <div 
                className={`filter-tab ${activeFilter === "international" ? "active" : ""}`}
                onClick={() => handleFilterChange("international")}
              >
                <FaGlobeAmericas className="filter-tab-icon" /> International
              </div>

              <div className="regulations-actions">
                <Link to="/regulations/add" className="btn-add">
                  Add New Regulation
                </Link>
              </div>
            </div>
            
            <div className="regulations-grid">
              {loading ? (
                <div className="loading">Loading regulations...</div>
              ) : error ? (
                <div className="error">{error}</div>
              ) : (
                <>
                  {filteredRegulations.length > 0 ? (
                    filteredRegulations.map((regulation) => (
                      <div className="regulation-card" key={regulation.regulation_id}>
                        <div className="card-header">
                          <h3 className="card-title">{regulation.regulation_name}</h3>
                          <div className="card-category">
                            <FaFolder /> {getCategoryName(regulation.category_id)}
                          </div>
                        </div>
                        
                        <div className="card-content">
                          <div className="card-item">
                            <div className="card-item-icon">
                              <FaBuilding />
                            </div>
                            <div className="card-item-content">
                              <div className="card-item-label">Regulatory Body</div>
                              <div className="card-item-value">{regulation.regulatory_body || "Not specified"}</div>
                            </div>
                          </div>
                          
                          <div className="card-badges">
                            <span className={`card-badge ${regulation.internal_external === "I" ? "badge-internal" : "badge-external"}`}>
                              {regulation.internal_external === "I" ? <FaHome /> : <FaGlobe />}
                              {regulation.internal_external === "I" ? "Internal" : "External"}
                            </span>
                            
                            <span className={`card-badge ${regulation.national_international === "N" ? "badge-national" : "badge-international"}`}>
                              {regulation.national_international === "N" ? <FaFlag /> : <FaGlobeAmericas />}
                              {regulation.national_international === "N" ? "National" : "International"}
                            </span>
                            
                            <span className={`card-badge ${regulation.mandatory_optional === "M" ? "badge-mandatory" : "badge-optional"}`}>
                              {regulation.mandatory_optional === "M" ? <FaCheckCircle /> : <FaCircle />}
                              {regulation.mandatory_optional === "M" ? "Mandatory" : "Optional"}
                            </span>
                          </div>
                        </div>
                        
                        <div className="card-footer">
                          <Link to={`/regulations/edit/${regulation.regulation_id}`} className="card-btn card-btn-edit">
                            <FaEdit />
                          </Link>
                          <button
                            className="card-btn card-btn-delete"
                            onClick={() => handleDelete(regulation.regulation_id)}
                          >
                            <FaTrashAlt />
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="no-results">
                      <div className="no-results-icon"><FaExclamationTriangle /></div>
                      <h3 className="no-results-message">No regulations found</h3>
                      <p className="no-results-hint">Try adjusting your filter or add a new regulation</p>
                    </div>
                  )}
                </>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Regulations;
