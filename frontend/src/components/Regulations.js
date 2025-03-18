import React, { useState, useEffect } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "./Navbar";
import "./Regulations.css";
import AddRegulation from "./AddRegulation";
import EditRegulation from "./EditRegulation";
import DeleteRegulation from "./DeleteRegulation";
import { FaEdit } from "react-icons/fa";

const Regulations = () => {
  const [regulations, setRegulations] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingRegulation, setEditingRegulation] = useState(null);
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
      
      setRegulations(regulationsResponse.data.regulations || []);
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

  if (!user) return null;

  return (
    <div className="regulations-container">
      <Navbar />
      <div className="regulations-content">
        <h1>Regulations Management</h1>
        <p>View, add, edit, and delete regulations</p>

        <div className="regulations-actions">
          <Link to="/regulations/add" className="btn-add">
            Add New Regulation
          </Link>
        </div>

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
          <div className="regulations-table-container">
            <table className="regulations-table">
              <thead>
                <tr>
                  <th>Regulation ID</th>
                  <th>Regulation Name</th>
                  <th>Category</th>
                  <th>Regulatory Body</th>
                  <th>Internal/External</th>
                  <th>National/International</th>
                  <th>Mandatory/Optional</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {regulations.map((regulation) => (
                  <tr key={regulation.regulation_id}>
                    <td>{regulation.regulation_id}</td>
                    <td>{regulation.regulation_name}</td>
                    <td>{getCategoryName(regulation.category_id)}</td>
                    <td>{regulation.regulatory_body || "N/A"}</td>
                    <td>{regulation.internal_external === "I" ? "Internal" : "External"}</td>
                    <td>{regulation.national_international === "N" ? "National" : "International"}</td>
                    <td>{regulation.mandatory_optional === "M" ? "Mandatory" : "Optional"}</td>
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

export default Regulations;
