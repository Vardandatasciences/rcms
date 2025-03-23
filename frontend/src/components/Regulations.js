import React, { useState, useEffect } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "./Navbar";
import "./Regulations.css";
import "./SearchFilter.css";
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
  const [userRole, setUserRole] = useState(null);
  const [userEntityId, setUserEntityId] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingRegulation, setEditingRegulation] = useState(null);
  const [activeFilter, setActiveFilter] = useState("all");
  const [showManageRegulations, setShowManageRegulations] = useState(false);
  const [allRegulations, setAllRegulations] = useState([]);
  const [entityRegulations, setEntityRegulations] = useState([]);
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
      
      // Extract user role and entity ID
      const role = parsedUser.role || "";
      const entityId = parsedUser.entity_id || parsedUser.entityId || "";
      
      setUserRole(role);
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
      
      const regulationsData = regulationsResponse.data.regulations || [];
      setAllRegulations(regulationsData);
      setCategories(categoriesResponse.data.categories || []);
      
      // If user is an admin, fetch entity-specific regulations
      if (role === "Admin" && entityId) {
        try {
          const entityRegulationsResponse = await axios.get(`http://localhost:5000/entity_regulations/${entityId}`);
          const entityRegulationsData = entityRegulationsResponse.data.entity_regulations || [];
          setEntityRegulations(entityRegulationsData);
          setRegulations(entityRegulationsData);
          setFilteredRegulations(entityRegulationsData);
        } catch (err) {
          console.error("Error fetching entity regulations:", err);
          setEntityRegulations([]);
          setRegulations([]);
          setFilteredRegulations([]);
        }
      } else {
        // For global users or if no entity ID, show all regulations
        setRegulations(regulationsData);
        setFilteredRegulations(regulationsData);
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
        fetchData(userEntityId, userRole);
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
        filtered = regulations.filter(reg => reg.internal_external === "I" || reg.internal_external === "Internal");
        break;
      case "external":
        filtered = regulations.filter(reg => reg.internal_external === "E" || reg.internal_external === "External");
        break;
      case "mandatory":
        filtered = regulations.filter(reg => reg.mandatory_optional === "M" || reg.mandatory_optional === "Mandatory");
        break;
      case "optional":
        filtered = regulations.filter(reg => reg.mandatory_optional === "O" || reg.mandatory_optional === "Optional");
        break;
      case "national":
        filtered = regulations.filter(reg => reg.national_international === "N" || reg.national_international === "National");
        break;
      case "international":
        filtered = regulations.filter(reg => reg.national_international === "I" || reg.national_international === "International");
        break;
      default:
        filtered = regulations;
    }
    
    setFilteredRegulations(filtered);
  };

  // Toggle manage regulations mode
  const toggleManageRegulations = () => {
    const newShowManageRegulations = !showManageRegulations;
    setShowManageRegulations(newShowManageRegulations);
    
    if (newShowManageRegulations) {
      // When showing manage regulations, display all regulations
      setRegulations(allRegulations);
      setFilteredRegulations(allRegulations);
      
      // Pre-select regulations that are already assigned to the entity
      const preSelectedIds = entityRegulations.map(reg => reg.regulation_id);
      setSelectedRegulations(preSelectedIds);
    } else {
      // When exiting manage mode, show only entity regulations
      setRegulations(entityRegulations);
      setFilteredRegulations(entityRegulations);
    }
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

  // Check if a regulation is already associated with the entity
  const isRegulationAssociated = (regulationId) => {
    return entityRegulations.some(reg => reg.regulation_id === regulationId);
  };

  // Save selected regulations to entity
  const saveEntityRegulations = async () => {
    try {
      setLoading(true);
      
      // Prepare data for API call
      const data = {
        entity_id: userEntityId,
        regulation_ids: selectedRegulations
      };
      
      // Send the request to add entity regulations
      const response = await axios.post("http://localhost:5000/add_entity_regulations", data);
      
      setSuccessMessage(`Regulations updated successfully! Added: ${response.data.added}, Removed: ${response.data.removed}`);
      
      // Refresh the data
      await fetchData(userEntityId, userRole);
      
      // Exit manage mode
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

  if (!user) return null;

  return (
    <div className={`regulations-container ${userRole === "Global" ? "global-view" : "admin-view"}`}>
      <Navbar />
      <div className="regulations-content">
        <h1>Regulations Management</h1>
        <p>{userRole === "Admin" ? 
          (showManageRegulations ? "Select regulations to add to your entity" : "View and manage regulations for your entity") : 
          "View all regulations in the system"}
        </p>

        {successMessage && (
          <div className="success-message">{successMessage}</div>
        )}

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
            {!showManageRegulations && (
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
                
                <div className="filter-actions">
                  <Link to="/regulations/add" className="btn-add action-btn">
                    Add New Regulation
                  </Link>
                  
                  {/* Only show Manage Regulations button for Admin users */}
                  {userRole === "Admin" && (
                    <button 
                      className="btn-manage action-btn" 
                      onClick={toggleManageRegulations}
                    >
                      {showManageRegulations ? "Cancel" : "Manage Regulations"}
                    </button>
                  )}
                </div>
              </div>
            )}
            
            {showManageRegulations && (
              <>
                <div className="manage-regulations-header">
                  <h2>Manage Regulations</h2>
                  <p>Select regulations to associate with your entity:</p>
                  <div className="manage-regulations-actions">
                    <button 
                      className="btn-save"
                      onClick={saveEntityRegulations}
                    >
                      Save Selected Regulations
                    </button>
                    <button 
                      className="btn-cancel"
                      onClick={toggleManageRegulations}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
                
                <div className="regulations-table-container">
                  <table className="regulations-table">
                    <thead>
                      <tr>
                        <th className="select-column">Select</th>
                        <th>ID</th>
                        <th>Name</th>
                        <th>Category</th>
                        <th>Regulatory Body</th>
                        <th>Type</th>
                        <th>Scope</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredRegulations.map((regulation) => {
                        const isAssociated = isRegulationAssociated(regulation.regulation_id);
                        const isSelected = selectedRegulations.includes(regulation.regulation_id);
                        
                        return (
                          <tr key={regulation.regulation_id} className={isSelected ? "selected-row" : ""}>
                            <td className="select-column">
                              <label className="checkbox-container">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => toggleRegulationSelection(regulation.regulation_id)}
                                />
                                <span className="checkmark"></span>
                                {isAssociated && (
                                  <span className="already-associated">(Already associated)</span>
                                )}
                              </label>
                            </td>
                            <td>{regulation.regulation_id}</td>
                            <td className="regulation-name">{regulation.regulation_name}</td>
                            <td>{getCategoryName(regulation.category_id)}</td>
                            <td>{regulation.regulatory_body || "N/A"}</td>
                            <td>
                              <span className={`status-badge ${
                                (regulation.internal_external === "I" || regulation.internal_external === "Internal") 
                                  ? "status-internal" : "status-external"}`}
                              >
                                {regulation.internal_external === "I" ? "Internal" : 
                                regulation.internal_external === "E" ? "External" : 
                                regulation.internal_external}
                              </span>
                            </td>
                            <td>
                              <span className={`status-badge ${
                                (regulation.national_international === "N" || regulation.national_international === "National") 
                                  ? "status-national" : "status-international"}`}
                              >
                                {regulation.national_international === "N" ? "National" : 
                                regulation.national_international === "I" ? "International" : 
                                regulation.national_international}
                              </span>
                            </td>
                            <td>
                              <span className={`status-badge ${
                                (regulation.mandatory_optional === "M" || regulation.mandatory_optional === "Mandatory") 
                                  ? "status-mandatory" : "status-optional"}`}
                              >
                                {regulation.mandatory_optional === "M" ? "Mandatory" : 
                                regulation.mandatory_optional === "O" ? "Optional" : 
                                regulation.mandatory_optional}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            )}
            
            <div className="regulations-grid">
              {loading ? (
                <div className="loading">Loading regulations...</div>
              ) : error ? (
                <div className="error">{error}</div>
              ) : (
                <>
                  {filteredRegulations.length > 0 ? (
                    !showManageRegulations ? (
                      // Only show grid view when NOT in manage regulations mode
                      filteredRegulations.map((regulation) => (
                        <div className="regulation-card" key={regulation.regulation_id}>
                          <div className="card-header">
                            <h3 className="card-title">{regulation.regulation_name}</h3>
                            <div className="card-category">
                              <FaFolder /> {regulation.category_type || getCategoryName(regulation.category_id)}
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
                              <span className={`card-badge ${
                                (regulation.internal_external === "I" || regulation.internal_external === "Internal") 
                                  ? "badge-internal" : "badge-external"}`}>
                                {(regulation.internal_external === "I" || regulation.internal_external === "Internal") 
                                  ? <FaHome /> : <FaGlobe />}
                                {regulation.internal_external === "I" ? "Internal" : 
                                 regulation.internal_external === "E" ? "External" : 
                                 regulation.internal_external}
                              </span>
                              
                              <span className={`card-badge ${
                                (regulation.national_international === "N" || regulation.national_international === "National") 
                                  ? "badge-national" : "badge-international"}`}>
                                {(regulation.national_international === "N" || regulation.national_international === "National") 
                                  ? <FaFlag /> : <FaGlobeAmericas />}
                                {regulation.national_international === "N" ? "National" : 
                                 regulation.national_international === "I" ? "International" : 
                                 regulation.national_international}
                              </span>
                              
                              <span className={`card-badge ${
                                (regulation.mandatory_optional === "M" || regulation.mandatory_optional === "Mandatory") 
                                  ? "badge-mandatory" : "badge-optional"}`}>
                                {(regulation.mandatory_optional === "M" || regulation.mandatory_optional === "Mandatory") 
                                  ? <FaCheckCircle /> : <FaCircle />}
                                {regulation.mandatory_optional === "M" ? "Mandatory" : 
                                 regulation.mandatory_optional === "O" ? "Optional" : 
                                 regulation.mandatory_optional}
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
                    ) : null  // Don't render anything in grid view when in manage mode
                  ) : (
                    !showManageRegulations && (
                      <div className="no-results">
                        <div className="no-results-icon"><FaExclamationTriangle /></div>
                        <h3 className="no-results-message">No regulations found</h3>
                        <p className="no-results-hint">
                          {userRole === "Admin" && !showManageRegulations
                            ? "No regulations are associated with your entity. Click 'Manage Regulations' to add some."
                            : "Try adjusting your filter or add a new regulation"}
                        </p>
                      </div>
                    )
                  )}
                </>
              )}
            </div>
          </>
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
