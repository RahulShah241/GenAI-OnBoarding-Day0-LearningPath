import { useState } from "react";
import { Data } from "../store/Data";
import { USERS } from "../constants/roles";
import Navbar from "./Navbar";

// Example users table for admin
export default function AdminDashboard() {
  const { user } = Data();
  const [users, setUsers] = useState([...USERS]); // Using constant USERS

  const handleDelete = (email) => {
    setUsers(users.filter((u) => u.email !== email));
  };

  const handleAdd = () => {
    const name = prompt("Enter name");
    const email = prompt("Enter email");
    const password = prompt("Enter password");
    const role = prompt("Enter role (ADMIN/HR/EMPLOYEE)");

    if (name && email && password && role) {
      setUsers([...users, { name, email, password, role }]);
    }
  };

  return (
    <><div className="p-6 min-h-screen bg-gray-50">
      <Navbar />
      <h1 className="text-2xl font-bold mb-4">Admin Dashboard</h1>
      {/* <h2 className="mb-6 text-gray-600">Logged in as: {user.name}</h2> */}
  
      <button
        className="mb-4 px-4 py-2 bg-blue-600 text-white rounded"
        onClick={handleAdd}
      >
        Add User
      </button>

      <table className="min-w-full bg-white border rounded-lg overflow-hidden">
        <thead className="bg-gray-100">
          <tr>
            <th className="py-2 px-4 border-b">Name</th>
            <th className="py-2 px-4 border-b">Email</th>
            <th className="py-2 px-4 border-b">Role</th>
            <th className="py-2 px-4 border-b">Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.email} className="hover:bg-gray-50">
              <td className="py-2 px-4 border-b">{u.name}</td>
              <td className="py-2 px-4 border-b">{u.email}</td>
              <td className="py-2 px-4 border-b">{u.role}</td>
              <td className="py-2 px-4 border-b space-x-2">
                <button
                  className="px-2 py-1 bg-red-500 text-white rounded"
                  onClick={() => handleDelete(u.email)}
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div></>
  );
}
