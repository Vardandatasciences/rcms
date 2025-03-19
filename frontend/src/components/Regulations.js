import React, { useState, useEffect } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "./Navbar";
import "./Regulations.css";
import "./SearchFilter.css";
import AddRegulation from "./AddRegulation";
import EditRegulation from "./EditRegulation";
import DeleteRegulation from "./DeleteRegulation";
import { FaEdit, FaSearch, FaFilter, FaCheck } from "react-icons/fa";

// Add this function before the Regulations component definition
const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toISOString().split('T')[0]; // Returns YYYY-MM-DD format
};

const Regulations = () => {
  const [regulations, setRegulations] = useState([]);
  const [allRegulations, setAllRegulations] = useState([]);
  const [entityRegulations, setEntityRegulations] = useState([]);
  const [filteredRegulations, setFilteredRegulations] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  const [userEntityId, setUserEntityId] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingRegulation, setEditingRegulation] = useState(null);
  const [showManageRegulations, setShowManageRegulations] = useState(false);
  const [selectedRegulations, setSelectedRegulations] = useState([]);
  const [successMessage, setSuccessMessage] = useState("");
  const navigate = useNavigate();
  
  // Search and filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    categoryId: "",
    internalExternal: "",
    mandatoryOptional: "",
    nationalInternational: ""
  });

  useEffect(() => {
    // Get user data from session storage
    const userData = sessionStorage.getItem("user");
    if (userData) {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
      
      // Get entity_id from user data
      const entityId = parsedUser.entity_id || parsedUser.entityId || 
                      parsedUser.entityid || parsedUser.entId || 
                      parsedUser.entityID;
      
      // Get user role
      const role = parsedUser.role || "";
      setUserRole(role);
      
      if (!entityId && role !== "Global") {
        setError("Entity ID not found in user data");
        setLoading(false);
        return;
      }
      
      setUserEntityId(entityId);
      fetchData(entityId, role);
    } else {
      navigate("/login");
    }
  }, [navigate]);

  const fetchData = async (entityId, role) => {
    try {
      setLoading(true);
      
      // Fetch all regulations and categories
      const [allRegulationsResponse, categoriesResponse] = await Promise.all([
        axios.get("http://localhost:5000/regulations"),
        axios.get("http://localhost:5000/categories")
      ]);
      
      const allRegulationsData = allRegulationsResponse.data.regulations || [];
      setAllRegulations(allRegulationsData);
      setCategories(categoriesResponse.data.categories || []);
      
      // If user is Global, show all regulations
      if (role === "Global") {
        setRegulations(allRegulationsData);
        setFilteredRegulations(allRegulationsData);
        setEntityRegulations([]);
        setLoading(false);
        return;
      }
      
      // For Admin users, fetch entity-specific regulations
      try {
        const entityRegulationsResponse = await axios.get(`http://localhost:5000/entity_regulations/${entityId}`);
        const entityRegulationsData = entityRegulationsResponse.data.entity_regulations || [];
        setEntityRegulations(entityRegulationsData);
        
        // By default, show only entity regulations for Admin users
        setRegulations(entityRegulationsData);
        setFilteredRegulations(entityRegulationsData);
        
        // Store regulation IDs for selection
        setSelectedRegulations(entityRegulationsData.map(reg => reg.regulation_id));
      } catch (err) {
        console.error("Error fetching entity regulations:", err);
        
        // If entity_regulations endpoint fails, show empty list for Admin users
        setEntityRegulations([]);
        setRegulations([]);
        setFilteredRegulations([]);
        setSelectedRegulations([]);
      }
      
      setLoading(false);
    } catch (err) {
      console.error("Error fetching data:", err);
      setError("Failed to fetch data. Please try again later.");
      setLoading(false);
    }
  };

  // Apply search and filters
  useEffect(() => {
    let result = regulations;
    
    // Apply search term
    if (searchTerm) {
      const lowercasedSearch = searchTerm.toLowerCase();
      result = result.filter(
        regulation => 
          regulation.regulation_id.toLowerCase().includes(lowercasedSearch) ||
          regulation.regulation_name.toLowerCase().includes(lowercasedSearch) ||
          (regulation.regulatory_body && regulation.regulatory_body.toLowerCase().includes(lowercasedSearch)) ||
          getCategoryName(regulation.category_id).toLowerCase().includes(lowercasedSearch)
      );
    }
    
    // Apply category filter
    if (filters.categoryId) {
      result = result.filter(regulation => 
        regulation.category_id.toString() === filters.categoryId
      );
    }
    
    // Apply internal/external filter
    if (filters.internalExternal) {
      result = result.filter(regulation => 
        regulation.internal_external === filters.internalExternal
      );
    }
    
    // Apply mandatory/optional filter
    if (filters.mandatoryOptional) {
      result = result.filter(regulation => 
        regulation.mandatory_optional === filters.mandatoryOptional
      );
    }
    
    // Apply national/international filter
    if (filters.nationalInternational) {
      result = result.filter(regulation => 
        regulation.national_international === filters.nationalInternational
      );
    }
    
    setFilteredRegulations(result);
  }, [searchTerm, filters, regulations, categories]);

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
        if (userEntityId) {
          fetchData(userEntityId, userRole);
        }
      } catch (err) {
        console.error("Error deleting regulation:", err);
        setError("Failed to delete regulation. Please try again later.");
      }
    }
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters({
      ...filters,
      [name]: value
    });
  };

  const resetFilters = () => {
    setSearchTerm("");
    setFilters({
      categoryId: "",
      internalExternal: "",
      mandatoryOptional: "",
      nationalInternational: ""
    });
  };

  // Toggle regulation selection for entity
  const toggleRegulationSelection = (regulationId) => {
    setSelectedRegulations(prevSelected => {
      if (prevSelected.includes(regulationId)) {
        return prevSelected.filter(id => id !== regulationId);
      } else {
        return [...prevSelected, regulationId];
      }
      });
  };

  // Save selected regulations to entity_regulation table
  const saveEntityRegulations = async () => {
    try {
      setLoading(true);
      
      if (!userEntityId) {
        setError("Entity ID not found in user data");
        setLoading(false);
        return;
      }
      
      // Prepare data for API call
      const data = {
        entity_id: userEntityId,
        regulation_ids: selectedRegulations
      };
      
      // Call API to save entity regulations
      const response = await axios.post("http://localhost:5000/add_entity_regulations", data);
      
      // Update local state
      setSuccessMessage(`Regulations successfully updated! Added: ${response.data.added}, Removed: ${response.data.removed}`);
      
      // Refresh data to show updated entity regulations
      await fetchData(userEntityId, userRole);
      
      // Exit manage regulations mode
      setShowManageRegulations(false);
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage("");
      }, 3000);
      
      setLoading(false);
    } catch (err) {
      console.error("Error saving entity regulations:", err);
      setError("Failed to save entity regulations. Please try again later.");
      setLoading(false);
    }
  };

  // Check if a regulation is already associated with the entity
  const isRegulationAssociated = (regulationId) => {
    return entityRegulations.some(reg => reg.regulation_id === regulationId);
  };

  // Toggle between showing all regulations and entity regulations
  const toggleManageRegulations = () => {
    const newShowManageRegulations = !showManageRegulations;
    setShowManageRegulations(newShowManageRegulations);
    setShowAddForm(false);
    setEditingRegulation(null);
    
    if (newShowManageRegulations) {
      // When entering manage mode, show all regulations
      setRegulations(allRegulations);
      // Initialize selected regulations with already associated ones
      setSelectedRegulations(entityRegulations.map(reg => reg.regulation_id));
    } else {
      // When exiting manage mode, show only entity regulations
      setRegulations(entityRegulations);
    }
    
    // Reset filters when toggling
    resetFilters();
  };

  // Check if user can manage regulations (only Admin users can)
  const canManageRegulations = () => {
    return userRole === "Admin";
  };

  if (!user) return null;

  return (
    <div className={`regulations-container ${userRole === "Global" ? "global-view" : "admin-view"}`}>
      <Navbar />
      <div className="regulations-content">
        <h1>
          Regulations Management
          {userRole && (
            <span className={`role-indicator role-${userRole.toLowerCase()}`}>
              {userRole} View
            </span>
          )}
        </h1>
        
        <div className="regulations-role-description">
          {userRole === "Global" 
            ? "As a Global user, you can view all regulations across the system." 
            : "As an Admin user, you can manage regulations for your entity."}
        </div>

        <p>
          {userRole === "Global" 
            ? "View all regulations in the system" 
            : (showManageRegulations 
              ? "Select regulations to add to your entity" 
              : "View and manage regulations for your entity")}
        </p>

        <div className="regulations-actions">
          {/* Only show Add New Regulation button if not in manage mode */}
          {!showManageRegulations && (
            <Link to="/regulations/add" className="btn-add">
              Add New Regulation
            </Link>
          )}
          
          {/* Only show Manage Regulations button for Admin users */}
          {canManageRegulations() && (
            <button 
              className="btn-manage"
              onClick={toggleManageRegulations}
            >
              {showManageRegulations ? "Cancel" : "Manage Regulations"}
            </button>
          )}
        </div>

        {successMessage && (
          <div className="success-message">{successMessage}</div>
        )}

        {/* Search and Filter Section */}
        {!showAddForm && !editingRegulation && (
          <>
            <div className="search-filter-container">
              <div className="search-box">
                <FaSearch className="search-icon" />
                <input
                  type="text"
                  placeholder="Search regulations..."
                  value={searchTerm}
                  onChange={handleSearchChange}
                  className="search-input"
                />
              </div>
              
              <button 
                className="filter-toggle-btn"
                onClick={() => setShowFilters(!showFilters)}
              >
                <FaFilter /> {showFilters ? 'Hide Filters' : 'Show Filters'}
        </button>
      </div>
            
            {showFilters && (
              <div className="filters-container">
                <div className="filter-group">
                  <label htmlFor="categoryId">Category:</label>
                  <select
                    id="categoryId"
                    name="categoryId"
                    value={filters.categoryId}
                    onChange={handleFilterChange}
                  >
                    <option value="">All Categories</option>
                    {categories.map((category) => (
                      <option key={category.category_id} value={category.category_id.toString()}>
                        {category.category_type}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="filter-group">
                  <label htmlFor="internalExternal">Internal/External:</label>
                  <select
                    id="internalExternal"
                    name="internalExternal"
                    value={filters.internalExternal}
                    onChange={handleFilterChange}
                  >
                    <option value="">All</option>
                    <option value="I">Internal</option>
                    <option value="E">External</option>
                  </select>
                </div>
                
                <div className="filter-group">
                  <label htmlFor="mandatoryOptional">Mandatory/Optional:</label>
                  <select
                    id="mandatoryOptional"
                    name="mandatoryOptional"
                    value={filters.mandatoryOptional}
                    onChange={handleFilterChange}
                  >
                    <option value="">All</option>
                    <option value="M">Mandatory</option>
                    <option value="O">Optional</option>
                  </select>
                </div>
                
                <div className="filter-group">
                  <label htmlFor="nationalInternational">National/International:</label>
                  <select
                    id="nationalInternational"
                    name="nationalInternational"
                    value={filters.nationalInternational}
                    onChange={handleFilterChange}
                  >
                    <option value="">All</option>
                    <option value="N">National</option>
                    <option value="I">International</option>
                  </select>
                </div>
                
                <button className="reset-filters-btn" onClick={resetFilters}>
                  Reset Filters
                </button>
              </div>
            )}
          </>
        )}

      {showAddForm ? (
          <AddRegulation categories={categories} onRegulationAdded={() => fetchData(userEntityId, userRole)} />
      ) : editingRegulation ? (
        <EditRegulation
          regulation={editingRegulation}
          categories={categories}
          onClose={() => setEditingRegulation(null)}
            onUpdate={() => fetchData(userEntityId, userRole)}
        />
      ) : (
          <div className="regulations-table-container">
            {loading ? (
              <div className="loading">Loading regulations...</div>
            ) : error ? (
              <div className="error-message">{error}</div>
            ) : filteredRegulations.length === 0 ? (
              <div className="no-regulations">
                {regulations.length === 0 ? 
                  (userRole === "Global" ? 
                    "No regulations found in the system." : 
                    (showManageRegulations ? 
                      "No regulations found in the system." : 
                      "No regulations are associated with your entity yet. Click 'Manage Regulations' to add some.")) : 
                  "No regulations match your search criteria."}
              </div>
            ) : (
              <>
                <div className="results-count">
                  Showing {filteredRegulations.length} of {regulations.length} regulations
                </div>
                
                {showManageRegulations && (
                  <div className="manage-regulations-actions">
                    <p>Select regulations to add to your entity:</p>
                    <button 
                      className="btn-save-selections"
                      onClick={saveEntityRegulations}
                    >
                      Save Selected Regulations
                    </button>
                  </div>
                )}
                
                <table className="regulations-table">
          <thead>
            <tr>
                      {showManageRegulations && <th>Select</th>}
              <th>Regulation ID</th>
              <th>Regulation Name</th>
              <th>Category</th>
              <th>Regulatory Body</th>
              <th>Internal/External</th>
              <th>National/International</th>
              <th>Mandatory/Optional</th>
                      {!showManageRegulations && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
                    {filteredRegulations.map((regulation) => {
                      const isAssociated = isRegulationAssociated(regulation.regulation_id);
                      const isSelected = selectedRegulations.includes(regulation.regulation_id);
                      
                      return (
                        <tr 
                          key={regulation.regulation_id}
                          className={`
                            ${isAssociated && !showManageRegulations && userRole !== "Global" ? "associated-regulation" : ""}
                            ${userRole !== "Global" && isAssociated ? "entity-regulation" : ""}
                          `}
                        >
                          {showManageRegulations && (
                            <td className="select-cell">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => toggleRegulationSelection(regulation.regulation_id)}
                                id={`reg-${regulation.regulation_id}`}
                              />
                              {isAssociated && !isSelected && (
                                <span className="already-associated-note">(removing)</span>
                              )}
                              {!isAssociated && isSelected && (
                                <span className="newly-selected-note">(adding)</span>
                              )}
                            </td>
                          )}
                <td>{regulation.regulation_id}</td>
                <td>{regulation.regulation_name}</td>
                          <td>{regulation.category_type}</td>
                <td>{regulation.regulatory_body || "N/A"}</td>
                          <td>{regulation.internal_external === "I" ? "Internal" : "External"}</td>
                          <td>{regulation.national_international === "N" ? "National" : "International"}</td>
                          <td>{regulation.mandatory_optional === "M" ? "Mandatory" : "Optional"}</td>
                          {!showManageRegulations && (
                            <td className="actions-cell">
                              <Link
                                to={`/regulations/edit/${regulation.regulation_id}`}
                                className="btn-edit"
                              >
                                Edit
                              </Link>
                              <button
                                className="btn-delete"
                                onClick={() => handleDelete(regulation.regulation_id)}
                              >
                                Delete
                  </button>
                </td>
                          )}
              </tr>
                      );
                    })}
          </tbody>
        </table>
              </>
            )}
          </div>
      )}
      </div>
    </div>
  );
};

export default Regulations;
