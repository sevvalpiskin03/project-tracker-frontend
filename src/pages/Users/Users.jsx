import { useEffect, useState } from "react";
import api from "../../services/api";

function Users({ isAdminMode }) {
  const [users, setUsers] = useState([]);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");

  const [editingUserId, setEditingUserId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchUsers = async () => {
    try {
      const response = await api.get("/users");
      setUsers(response.data);
    } catch (error) {
      console.error("Users could not be fetched:", error);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      if (editingUserId !== null) {
        await api.put(`/users/${editingUserId}`, {
          firstName,
          lastName,
          email,
        });
      } else {
        await api.post("/users", {
          firstName,
          lastName,
          email,
        });
      }

      setFirstName("");
      setLastName("");
      setEmail("");
      setEditingUserId(null);

      await fetchUsers();
    } catch (error) {
      console.error("User operation failed:", error);
    }
  };

  const handleEdit = (user) => {
    setEditingUserId(user.id);
    setFirstName(user.firstName);
    setLastName(user.lastName);
    setEmail(user.email);
  };

  const handleCancelEdit = () => {
    setEditingUserId(null);
    setFirstName("");
    setLastName("");
    setEmail("");
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/users/${id}`);
      await fetchUsers();
    } catch (error) {
      console.error("User could not be deleted:", error);
    }
  };

  const handleSearch = async (event) => {
    event.preventDefault();

    try {
      if (searchTerm.trim() === "") {
        await fetchUsers();
        return;
      }

      const response = await api.get("/users/search", {
        params: {
          keyword: searchTerm,
        },
      });

      setUsers(response.data);
    } catch (error) {
      console.error("Users could not be searched:", error);
    }
  };

  const handleClearSearch = async () => {
    setSearchTerm("");
    await fetchUsers();
  };

 useEffect(() => {
  const searchUsers = async () => {
    try {
      if (searchTerm.trim() === "") {
        await fetchUsers();
        return;
      }

      const response = await api.get("/users/search", {
        params: {
          keyword: searchTerm,
        },
      });

      setUsers(response.data);
    } catch (error) {
      console.error("Users could not be searched:", error);
    }
  };

  const timeoutId = setTimeout(() => {
    searchUsers();
  }, 300);

  return () => clearTimeout(timeoutId);
}, [searchTerm]);

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="fw-bold mb-0">Users</h2>

        <span
          className={`badge ${
            isAdminMode ? "text-bg-warning" : "text-bg-secondary"
          }`}
        >
          {isAdminMode ? "Admin Mode" : "User Mode"}
        </span>
      </div>

      <div className="card shadow-sm mb-4">
  <div className="card-body">
    <div className="input-group">
      <input
        type="text"
        className="form-control"
        placeholder="Search users..."
        value={searchTerm}
        onChange={(event) => setSearchTerm(event.target.value)}
      />

      <button
        type="button"
        className="btn btn-outline-secondary"
        onClick={() => setSearchTerm("")}
      >
        Clear
      </button>
    </div>
  </div>
</div>

      {isAdminMode && (
        <div className="card shadow-sm mb-4">
          <div className="card-body">
            <h5 className="card-title mb-3">
              {editingUserId !== null ? "Update User" : "Add User"}
            </h5>

            <form onSubmit={handleSubmit}>
              <div className="row g-3">
                <div className="col-md-4">
                  <label className="form-label">First Name</label>

                  <input
                    type="text"
                    className="form-control"
                    value={firstName}
                    onChange={(event) => setFirstName(event.target.value)}
                    required
                  />
                </div>

                <div className="col-md-4">
                  <label className="form-label">Last Name</label>

                  <input
                    type="text"
                    className="form-control"
                    value={lastName}
                    onChange={(event) => setLastName(event.target.value)}
                    required
                  />
                </div>

                <div className="col-md-4">
                  <label className="form-label">Email</label>

                  <input
                    type="email"
                    className="form-control"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    required
                  />
                </div>
              </div>

              <button type="submit" className="btn btn-primary mt-3">
                {editingUserId !== null ? "Update User" : "Add User"}
              </button>

              {editingUserId !== null && (
                <button
                  type="button"
                  className="btn btn-secondary mt-3 ms-2"
                  onClick={handleCancelEdit}
                >
                  Cancel
                </button>
              )}
            </form>
          </div>
        </div>
      )}

      <div className="card shadow-sm">
        <div className="card-body">
          <table className="table table-hover align-middle">
            <thead>
              <tr>
                <th>ID</th>
                <th>First Name</th>
                <th>Last Name</th>
                <th>Email</th>

                {isAdminMode && <th>Actions</th>}
              </tr>
            </thead>

            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td>{user.id}</td>
                  <td>{user.firstName}</td>
                  <td>{user.lastName}</td>
                  <td>{user.email}</td>

                  {isAdminMode && (
                    <td>
                      <button
                        className="btn btn-warning btn-sm me-2"
                        onClick={() => handleEdit(user)}
                      >
                        Edit
                      </button>

                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => handleDelete(user.id)}
                      >
                        Delete
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>

          {users.length === 0 && (
            <p className="text-center text-muted mb-0">
              No users found.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default Users;