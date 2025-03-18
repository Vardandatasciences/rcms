import axios from "axios";
import { FaTrash } from "react-icons/fa";
import "./DeleteCategory.css"; // Import CSS for styling

const DeleteCategory = ({ categoryId, onCategoryDeleted }) => {
  const handleDelete = () => {
    if (window.confirm("Are you sure you want to delete this category?")) {
      axios
        .delete(`http://localhost:5000/delete_category/${categoryId}`)
        .then(() => {
          onCategoryDeleted(); // Refresh categories list after deletion
        })
        .catch((error) => {
          console.error("Error deleting category:", error);
        });
    }
  };

  return (
    <button className="delete-btn" onClick={handleDelete}>
      <FaTrash />
    </button>
  );
};

export default DeleteCategory;
