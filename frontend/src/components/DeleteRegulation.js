import axios from "axios";
import { FaTrash } from "react-icons/fa";
import "./DeleteRegulation.css"; // Import CSS for styling

const DeleteRegulation = ({ regulationId, onRegulationDeleted }) => {
  const handleDelete = () => {
    if (window.confirm("Are you sure you want to delete this regulation?")) {
      axios
        .delete(`http://localhost:5000/delete_regulation/${regulationId}`)
        .then(() => {
          onRegulationDeleted(); // Refresh regulations list after deletion
        })
        .catch((error) => {
          console.error("Error deleting regulation:", error);
        });
    }
  };

  return (
    <button className="delete-btn" onClick={handleDelete}>
      <FaTrash />
    </button>
  );
};

export default DeleteRegulation;
