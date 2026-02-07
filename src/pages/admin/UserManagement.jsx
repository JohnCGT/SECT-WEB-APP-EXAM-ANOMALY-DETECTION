import React, { useState } from "react";
import { Link } from "react-router-dom";

const UserManagement = () => {
  const [users, setUsers] = useState([
    { id: 1, name: "Juan Dela Cruz", role: "Student", status: "Active" },
    { id: 2, name: "Maria Santos", role: "Instructor", status: "Active" },
    { id: 3, name: "Admin One", role: "Admin", status: "System" },
  ]);

  const [editingUserId, setEditingUserId] = useState(null);
  const [editForm, setEditForm] = useState({ name: "", role: "" });

  const suspendUser = (id) => {
    setUsers(users.map(user =>
      user.id === id
        ? { ...user, status: user.status === "Suspended" ? "Active" : "Suspended" }
        : user
    ));
  };

  const deleteUser = (id) => {
    setUsers(users.filter(user => user.id !== id));
  };

  const addUser = () => {
    const newUser = {
      id: users.length + 1,
      name: "New User",
      role: "Student",
      status: "Active",
    };
    setUsers([...users, newUser]);
  };

  const startEdit = (user) => {
    setEditingUserId(user.id);
    setEditForm({ name: user.name, role: user.role });
  };

  const saveEdit = (id) => {
    setUsers(users.map(user =>
      user.id === id
        ? { ...user, name: editForm.name, role: editForm.role }
        : user
    ));
    setEditingUserId(null);
  };

  return (
    <div className="p-4 bg-light min-vh-100">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4>User Management</h4>
        <Link to="/admin" className="btn btn-outline-secondary">
          ← Back to Dashboard
        </Link>
      </div>

      <div className="mb-3">
        <button className="btn btn-success" onClick={addUser}>
          + Register New User
        </button>
      </div>

      <div className="card shadow-sm">
        <div className="card-body">
          <table className="table table-hover align-middle">
            <thead className="table-light">
              <tr>
                <th>Name</th>
                <th>Role</th>
                <th>Status</th>
                <th className="text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.id}>
                  <td>
                    {editingUserId === user.id ? (
                      <input
                        className="form-control"
                        value={editForm.name}
                        onChange={(e) =>
                          setEditForm({ ...editForm, name: e.target.value })
                        }
                      />
                    ) : (
                      user.name
                    )}
                  </td>

                  <td>
                    {editingUserId === user.id ? (
                      <select
                        className="form-select"
                        value={editForm.role}
                        onChange={(e) =>
                          setEditForm({ ...editForm, role: e.target.value })
                        }
                      >
                        <option>Student</option>
                        <option>Instructor</option>
                        <option>Admin</option>
                      </select>
                    ) : (
                      user.role
                    )}
                  </td>

                  <td>
                    <span
                      className={`badge ${
                        user.status === "Active"
                          ? "bg-success"
                          : user.status === "Suspended"
                          ? "bg-warning text-dark"
                          : "bg-secondary"
                      }`}
                    >
                      {user.status}
                    </span>
                  </td>

                  <td className="text-center">
                    {user.role !== "Admin" && (
                      <>
                        {editingUserId === user.id ? (
                          <button
                            className="btn btn-sm btn-primary me-2"
                            onClick={() => saveEdit(user.id)}
                          >
                            Save
                          </button>
                        ) : (
                          <button
                            className="btn btn-sm btn-info me-2"
                            onClick={() => startEdit(user)}
                          >
                            Edit
                          </button>
                        )}

                        <button
                          className="btn btn-sm btn-warning me-2"
                          onClick={() => suspendUser(user.id)}
                        >
                          {user.status === "Suspended" ? "Activate" : "Suspend"}
                        </button>

                        <button
                          className="btn btn-sm btn-danger"
                          onClick={() => deleteUser(user.id)}
                        >
                          Delete
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default UserManagement;