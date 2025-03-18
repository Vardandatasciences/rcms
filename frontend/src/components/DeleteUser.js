import React from "react";
import axios from "axios";
import "./DeleteUser.css"; // Import CSS for styling

const DeleteUser = ({ userId, onUserDeleted }) => {
  const handleDelete = () => {
    if (window.confirm("Are you sure you want to delete this user?")) {
      axios
        .delete(`http://localhost:5000/delete_user/${userId}`)
        .then(() => {
          onUserDeleted(); // Refresh users list after deletion
        })
        .catch((error) => {
          console.error("Error deleting user:", error);
        });
    }
  };

  return (
    <button className="delete-btn" onClick={handleDelete}>
      🗑️ {/* Bin Icon for Deleting */}
    </button>
  );
};

export default DeleteUser;
