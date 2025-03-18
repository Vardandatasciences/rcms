import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Navbar from "./Navbar";
import "./Categories.css"; // Import CSS for styling
import AddCategory from "./AddCategory"; // Import AddCategory component
import DeleteCategory from "./DeleteCategory"; // Import DeleteCategory component

const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newCategory, setNewCategory] = useState({ category_type: "", remarks: "" });
  const [isAdding, setIsAdding] = useState(false);
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
        <h1>Categories Management</h1>
        <p>View and manage regulation categories</p>

        <div className="categories-actions">
          <button 
            className="btn-add-category" 
            onClick={() => setIsAdding(!isAdding)}
          >
            {isAdding ? "Cancel" : "Add New Category"}
          </button>
        </div>

        {isAdding && (
          <div className="add-category-form">
            <h2>Add New Category</h2>
            <form onSubmit={handleAddCategory}>
              <div className="form-group">
                <label htmlFor="category_type">Category Type*</label>
                <input
                  type="text"
                  id="category_type"
                  name="category_type"
                  value={newCategory.category_type}
                  onChange={handleInputChange}
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
                />
              </div>
              <button type="submit" className="btn-submit">
                Add Category
              </button>
            </form>
          </div>
        )}

        {loading ? (
          <div className="loading">Loading categories...</div>
        ) : error ? (
          <div className="error-message">{error}</div>
        ) : categories.length === 0 ? (
          <div className="no-categories">
            <p>No categories found. Add a new category to get started.</p>
          </div>
        ) : (
          <div className="categories-table-container">
            <table className="categories-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Category Type</th>
                  <th>Remarks</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((category) => (
                  <tr key={category.category_id}>
                    <td>{category.category_id}</td>
                    <td>{category.category_type}</td>
                    <td>{category.remarks || "-"}</td>
                    <td className="actions-cell">
                      <button
                        className="btn-delete"
                        onClick={() => handleDeleteCategory(category.category_id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Categories;
