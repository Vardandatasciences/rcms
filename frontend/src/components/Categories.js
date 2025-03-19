import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Navbar from "./Navbar";
import "./Categories.css";
import { FaFolder, FaPlus, FaEdit, FaTrashAlt, FaSave, 
         FaTimes, FaSpinner, FaExclamationTriangle, 
         FaInfoCircle, FaLayerGroup, FaComment } from "react-icons/fa";

const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newCategory, setNewCategory] = useState({ category_type: "", remarks: "" });
  const [isAdding, setIsAdding] = useState(false);
  const [activeFilter, setActiveFilter] = useState("all");
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is logged in
    const userData = sessionStorage.getItem("user");
    if (!userData) {
      navigate("/login");
      return;
    }

    fetchCategories();
  }, [navigate]);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await axios.get("http://localhost:5000/categories");
      setCategories(response.data.categories || []);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching categories:", err);
      setError("Failed to fetch categories. Please try again later.");
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewCategory({ ...newCategory, [name]: value });
  };

  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!newCategory.category_type.trim()) {
      alert("Category type is required");
      return;
    }

    try {
      await axios.post("http://localhost:5000/add_category", newCategory);
      // Reset form and refresh categories
      setNewCategory({ category_type: "", remarks: "" });
      setIsAdding(false);
      fetchCategories();
    } catch (err) {
      console.error("Error adding category:", err);
      setError("Failed to add category. Please try again later.");
    }
  };

  const handleDeleteCategory = async (categoryId) => {
    if (window.confirm("Are you sure you want to delete this category?")) {
      try {
        await axios.delete(`http://localhost:5000/delete_category/${categoryId}`);
        // Refresh the categories list
        fetchCategories();
      } catch (err) {
        console.error("Error deleting category:", err);
        setError("Failed to delete category. Please try again later.");
      }
    }
  };

  return (
    <div className="categories-container">
      <Navbar />
      <div className="categories-content">
        <div className="categories-header">
          <div className="header-title">
            <h1>Categories Management</h1>
            <p>View and manage regulation categories</p>
          </div>
        </div>

        <div className="filter-tabs">
          <div 
            className="filter-tab active"
            onClick={() => setActiveFilter("all")}
          >
            <FaLayerGroup className="filter-tab-icon" /> All Categories
          </div>

          <button 
            className="btn-add-category" 
            onClick={() => setIsAdding(!isAdding)}
          >
            {isAdding ? <><FaTimes /> Cancel</> : <><FaPlus /> Add New Category</>}
          </button>
        </div>

        {isAdding && (
          <div className="add-category-form">
            <h2><FaFolder /> Add New Category</h2>
            <form onSubmit={handleAddCategory}>
              <div className="form-group">
                <label htmlFor="category_type">Category Type*</label>
                <input
                  type="text"
                  id="category_type"
                  name="category_type"
                  value={newCategory.category_type}
                  onChange={handleInputChange}
                  placeholder="Enter category name"
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="remarks">Remarks</label>
                <textarea
                  id="remarks"
                  name="remarks"
                  value={newCategory.remarks}
                  onChange={handleInputChange}
                  placeholder="Add any additional notes or descriptions"
                />
              </div>
              <div className="form-actions">
                <button type="submit" className="btn-submit">
                  <FaSave /> Save Category
                </button>
                <button type="button" className="btn-cancel" onClick={() => setIsAdding(false)}>
                  <FaTimes /> Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {loading ? (
          <div className="loading">
            <div className="loading-icon"><FaSpinner /></div>
            <h3 className="loading-message">Loading categories...</h3>
          </div>
        ) : error ? (
          <div className="error-message">
            <div className="error-icon"><FaExclamationTriangle /></div>
            <h3>Error Loading Categories</h3>
            <p>{error}</p>
          </div>
        ) : (
          <div className="categories-grid">
            {categories.length === 0 ? (
              <div className="no-categories">
                <div className="empty-icon"><FaFolder /></div>
                <h3>No Categories Found</h3>
                <p>There are no categories yet. Add a new category to get started.</p>
              </div>
            ) : (
              categories.map((category) => (
                <div className="category-card" key={category.category_id}>
                  <div className="category-header">
                    <div className="category-icon">
                      <FaFolder />
                    </div>
                    <div className="category-title">
                      <h3>{category.category_type}</h3>
                      <span className="category-id">ID: {category.category_id}</span>
                    </div>
                  </div>
                  
                  <div className="category-content">
                    <div className="category-remarks">
                      <div className="remarks-label">
                        <FaComment /> Remarks
                      </div>
                      <div className="remarks-content">
                        {category.remarks ? (
                          category.remarks
                        ) : (
                          <span className="empty-remarks">No remarks provided</span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="category-footer">
                    <button
                      className="category-btn btn-edit"
                      title="Edit Category"
                    >
                      <FaEdit />
                    </button>
                    <button
                      className="category-btn btn-delete"
                      onClick={() => handleDeleteCategory(category.category_id)}
                      title="Delete Category"
                    >
                      <FaTrashAlt />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Categories;
