import React, { useState } from "react";
import axios from "axios";
import "./EditEntity.css"; // Import CSS for styling

const EditEntity = ({ entity, onClose, onUpdate }) => {
  const [editedData, setEditedData] = useState(entity);
  const [successMessage, setSuccessMessage] = useState("");

  const handleChange = (e) => {
    setEditedData({ ...editedData, [e.target.name]: e.target.value });
  };

  const handleUpdate = () => {
    axios
      .put(`http://localhost:5000/update_entity/${editedData.entity_id}`, editedData)
      .then((response) => {
        setSuccessMessage(response.data.message);
        setTimeout(() => {
          setSuccessMessage("");
          onUpdate(); // Refresh entity list
          onClose(); // Close the edit form
        }, 2000);
      })
      .catch((error) => {
        console.error("Error updating entity:", error);
      });
  };

  return (
    <div className="edit-entity-container">
      <h2>Edit Entity</h2>
      {successMessage && <p className="success-message">{successMessage}</p>}

      <form>
        {Object.keys(editedData).map((key) => (
          key !== "entity_id" && ( // Prevent editing entity_id
            <div key={key}>
              <label>{key.replace("_", " ")}:</label>
              <input
                type="text"
                name={key}
                value={editedData[key]}
                onChange={handleChange}
              />
            </div>
          )
        ))}
        <div className="buttons">
          <button type="button" className="save-btn" onClick={handleUpdate}>✔ Save</button>
          <button type="button" className="cancel-btn" onClick={onClose}>✖ Cancel</button>
        </div>
      </form>
    </div>
  );
};

export default EditEntity;
