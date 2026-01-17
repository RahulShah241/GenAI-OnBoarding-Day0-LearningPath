/* eslint-disable react/prop-types */
import { useState, useEffect } from "react";
import { Data } from "../store/Data";

// Custom hook for cached localStorage management
const useCachedStorage = (key, getData) => {
  const [data, setData] = useState(() => {
    try {
      const cachedData = window.localStorage.getItem(key);
      if (cachedData) return JSON.parse(cachedData);
      const initialData = getData();
      window.localStorage.setItem(key, JSON.stringify(initialData));
      return initialData;
    } catch (error) {
      console.error("Error with data management:", error);
      return [];
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.error("Error writing to localStorage:", error);
    }
  }, [key, data]);

  return [data, setData];
};

// Modal for Editing Role
const EditRoleModal = ({ user, roles, onClose, onSave }) => {
  const [selectedRole, setSelectedRole] = useState(String(user.roleId));
  const [isActive, setIsActive] = useState(user.isActive);

  const handleSave = () => {
    onSave({ roleId: parseInt(selectedRole, 10), isActive });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Edit User Role</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            ✕
          </button>
        </div>

        <div className="space-y-4">
          {/* User Info */}
          <div className="flex items-center space-x-4">
            <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
              <span className="text-blue-600 font-medium">
                {user.name.split(" ").map((n) => n[0]).join("")}
              </span>
            </div>
            <div>
              <div className="font-medium text-gray-900">{user.name}</div>
              <div className="text-sm text-gray-500">{user.email}</div>
            </div>
          </div>

          {/* Role Selection */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">
              Assign Role
            </label>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
            >
              {roles.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.name}
                </option>
              ))}
            </select>
          </div>

          {/* Status Toggle */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">User Status</span>
            <button
              type="button"
              onClick={() => setIsActive(!isActive)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                isActive ? "bg-blue-600" : "bg-gray-200"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  isActive ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 rounded-md hover:bg-gray-200"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

// Modal for Adding User
const AddUserModal = ({ roles, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    roleId: roles[0]?.id || "",
    isActive: true,
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.password) return alert("All fields required");
    if (formData.password.length < 6) return alert("Password min 6 chars");
    onSave({ ...formData, roleId: Number(formData.roleId) });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Add New User</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Name"
            className="w-full px-4 py-2 border rounded-lg"
            required
          />
          <input
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="Email"
            className="w-full px-4 py-2 border rounded-lg"
            required
          />
          <input
            name="password"
            type="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="Password"
            className="w-full px-4 py-2 border rounded-lg"
            required
          />
          <select
            name="roleId"
            value={formData.roleId}
            onChange={handleChange}
            className="w-full px-4 py-2 border rounded-lg"
          >
            {roles.map((role) => (
              <option key={role.id} value={role.id}>{role.name}</option>
            ))}
          </select>
          <div className="flex justify-between items-center">
            <span>Active</span>
            <button
              type="button"
              onClick={() =>
                setFormData((prev) => ({ ...prev, isActive: !prev.isActive }))
              }
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                formData.isActive ? "bg-blue-600" : "bg-gray-200"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  formData.isActive ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>
          <div className="flex justify-end gap-3 mt-4">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-100 rounded-md">Cancel</button>
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md">Add User</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default function AdminDashboard() {
  const { currentUser, roles } = Data();
  const [users, setUsers] = useCachedStorage("users", () => Data.getState().users);
  const [editingUser, setEditingUser] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);

  const userRole = roles.find((r) => r.id === currentUser?.roleId);
  const isAdmin = userRole?.name.toLowerCase() === "admin";
  const isModerator = userRole?.name.toLowerCase() === "moderator";

  const canEdit = isAdmin;
  const canDelete = isAdmin;
  const canAddUser = isAdmin || isModerator;

  const handleEditSave = (userId, updates) => {
    setUsers(users.map((user) => user.id === userId ? { ...user, ...updates } : user));
    setEditingUser(null);
  };

  const handleAddUser = (newUser) => {
    setUsers([...users, { ...newUser, id: crypto.randomUUID() }]);
    setShowAddModal(false);
  };

  const handleDeleteUser = (userId) => {
    setUsers(users.filter((user) => user.id !== userId));
  };

  const sortedUsers = [...users].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <div className="border-b bg-white shadow-sm px-4 py-3 flex justify-between items-center">
        <h1 className="font-medium">Admin RBAC Dashboard</h1>
        {canAddUser && (
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Add User
          </button>
        )}
      </div>

      {/* Users Table */}
      <div className="container mx-auto px-4 py-6">
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-2xl font-semibold mb-4">Users Details</h2>
          <table className="w-full text-left border-collapse">
            <thead>
              <tr>
                <th className="px-4 py-2 border-b">Name</th>
                <th className="px-4 py-2 border-b">Email</th>
                <th className="px-4 py-2 border-b">Role</th>
                <th className="px-4 py-2 border-b">Status</th>
                {(canEdit || canDelete) && <th className="px-4 py-2 border-b">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {sortedUsers.map((user) => {
                const roleName = roles.find((r) => r.id === user.roleId)?.name;
                return (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2">{user.name}</td>
                    <td className="px-4 py-2">{user.email}</td>
                    <td className="px-4 py-2">{roleName || "No Role"}</td>
                    <td className="px-4 py-2">{user.isActive ? "Active" : "Inactive"}</td>
                    {(canEdit || canDelete) && (
                      <td className="px-4 py-2 space-x-2">
                        {canEdit && <button className="text-blue-600 hover:underline" onClick={() => setEditingUser(user)}>Edit</button>}
                        {canDelete && <button className="text-red-600 hover:underline" onClick={() => handleDeleteUser(user.id)}>Delete</button>}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      {editingUser && canEdit && <EditRoleModal user={editingUser} roles={roles} onClose={() => setEditingUser(null)} onSave={(updates) => handleEditSave(editingUser.id, updates)} />}
      {showAddModal && canAddUser && <AddUserModal roles={roles} onClose={() => setShowAddModal(false)} onSave={handleAddUser} />}
    </div>
  );
}
