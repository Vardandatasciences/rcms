import React, { useState, useEffect } from "react";
import axios from "axios";
import "../styles/global.css";

const AddUser = ({ onUserAdded }) => {
  const [userData, setUserData] = useState({
    user_id: "",
    entity_id: "",
    user_name: "",
    address: "",
    mobile_no: "",
    email_id: "",
    password: "",
    role: "",
  });

  const [entities, setEntities] = useState([]);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [emailStatus, setEmailStatus] = useState("");

  useEffect(() => {
    fetchEntities();
  }, []);

  const fetchEntities = () => {
    axios
      .get("http://localhost:5000/entities")
      .then((response) => {
        setEntities(response.data.entities);
      })
      .catch((error) => {
        console.error("Error fetching entities:", error);
      });
  };

  const handleChange = (e) => {
    setUserData({ ...userData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMessage("");
    setEmailStatus("");

    axios
      .post("http://localhost:5000/add_user", userData)
      .then((response) => {
        setSuccessMessage(response.data.message);
        if (response.data.emailSent) {
          setEmailStatus("A welcome email has been sent to the user with their credentials.");
        } else if (response.data.emailError) {
          setEmailStatus("User created successfully, but there was an issue sending the welcome email.");
        }
        onUserAdded();
      })
      .catch((error) => {
        if (error.response && error.response.status === 409) {
          setErrorMessage("User ID already exists. Please enter a unique User ID.");
        } else {
          console.error("Error adding user:", error);
          setErrorMessage("An error occurred while adding the user. Please try again.");
        }
      });
  };

  return (
    <div className="container">
      <div className="card">
        <h2 className="text-center mb-4">Add New User</h2>
        {successMessage && <div className="alert alert-success">{successMessage}</div>}
        {errorMessage && <div className="alert alert-danger">{errorMessage}</div>}
        {emailStatus && <div className="alert alert-info">{emailStatus}</div>}

        <form onSubmit={handleSubmit}>
          <div className="grid grid-2">
            <div className="form-group">
              <label htmlFor="user_id">User ID</label>
              <input
                type="text"
                id="user_id"
                name="user_id"
                value={userData.user_id}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="entity_id">Entity</label>
              <select
                id="entity_id"
                name="entity_id"
                value={userData.entity_id}
                onChange={handleChange}
                required
              >
                <option value="">Select Entity</option>
                {entities.map((entity) => (
                  <option key={entity.entity_id} value={entity.entity_id}>
                    {entity.entity_name} ({entity.entity_id})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="user_name">User Name</label>
              <input
                type="text"
                id="user_name"
                name="user_name"
                value={userData.user_name}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="address">Address</label>
              <input
                type="text"
                id="address"
                name="address"
                value={userData.address}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label htmlFor="mobile_no">Mobile No</label>
              <input
                type="text"
                id="mobile_no"
                name="mobile_no"
                value={userData.mobile_no}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="email_id">Email ID</label>
              <input
                type="email"
                id="email_id"
                name="email_id"
                value={userData.email_id}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                name="password"
                value={userData.password}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="role">Role</label>
              <select
                id="role"
                name="role"
                value={userData.role}
                onChange={handleChange}
                required
              >
                <option value="">Select Role</option>
                <option value="Admin">Admin</option>
                <option value="User">User</option>
              </select>
            </div>
          </div>

          <div className="text-center mt-4">
            <button type="submit" className="btn btn-primary">
              Save User
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddUser;
