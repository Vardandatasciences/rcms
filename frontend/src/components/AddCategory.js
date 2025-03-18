import React, { useState } from "react";
import axios from "axios";
import "./AddCategory.css"; // Import CSS for styling

const AddCategory = ({ onCategoryAdded }) => {
  const [newCategory, setNewCategory] = useState({
    category_type: "",
    remarks: "",
  });

  const [successMessage, setSuccessMessage] = useState("");

  const handleChange = (e) => {
    setNewCategory({ ...newCategory, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    axios
      .post("http://localhost:5000/add_category", newCategory)
      .then((response) => {
        setSuccessMessage(response.data.message);
        onCategoryAdded(); // Refresh categories list
      })
      .catch((error) => {
        console.error("Error adding category:", error);
      });
  };

  return (
    <div className="add-category-container">
      <h2>Add New Category</h2>
      {successMessage && <p className="success-message">{successMessage}</p>}
      <form onSubmit={handleSubmit}>
        <div>
          <label>Category Type:</label>
          <input
            type="text"
            name="category_type"
            value={newCategory.category_type}
            onChange={handleChange}
            required
          />
        </div>
        <div>
          <label>Remarks:</label>
          <input
            type="text"
            name="remarks"
            value={newCategory.remarks}
            onChange={handleChange}
          />
        </div>
        <div className="buttons">
          <button type="submit" className="save-btn">Save</button>
        </div>
      </form>
    </div>
  );
};

export default AddCategory;
