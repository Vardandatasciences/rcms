import axios from "axios";

const DeleteEntity = ({ entityId, onDelete }) => {
  const handleDelete = () => {
    if (window.confirm("Are you sure you want to delete this entity?")) {
      axios
        .delete(`http://localhost:5000/delete_entity/${entityId}`)
        .then(() => {
          onDelete(); // Refresh entity list after deletion
        })
        .catch((error) => {
          console.error("Error deleting entity:", error);
        });
    }
  };

  return (
    <button className="delete-btn" onClick={handleDelete}>🗑</button>
  );
};

export default DeleteEntity;
