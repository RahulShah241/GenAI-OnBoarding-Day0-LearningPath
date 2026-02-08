import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./auth/AuthContext";
import ProtectedRoute from "./auth/ProtectedRoute";

import Login from "./pages/Login";
import AdminDashboard from "./pages/AdminDashboard";
import HRDashboard from "./pages/HRDashboard";
import EmployeeChatbot from "./pages/EmployeeChatbot";
import ProjectsDetailsPage from "./pages/ProjectsDetailsPage";
import ProjectsList from './pages/ProjectsList'
import AddProject from "./pages/AddProject";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route
            path="/admin"
            element={
              <ProtectedRoute roles={["ADMIN"]}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          
          <Route path="/hr" element={<ProtectedRoute roles={["HR"]}><HRDashboard /></ProtectedRoute>} />
          <Route path="/hr/projects" element={<ProtectedRoute roles={["HR"]}><ProjectsList /></ProtectedRoute>} />
          <Route path="/projects/:id" element={<ProtectedRoute roles={["HR"]}><ProjectsDetailsPage /></ProtectedRoute>} />

          {/* Stub routes (safe placeholders) */}
          <Route path="/hr/add-project" element={<ProtectedRoute roles={["HR"]}> <AddProject/></ProtectedRoute>} />
          <Route path="/hr/employees" element={<div>Employees Page</div>} />


          <Route
            path="/hr"
            element={
              <ProtectedRoute roles={["HR"]}>
                <HRDashboard />
              </ProtectedRoute>
            }
          />
          

          <Route
            path="/employee"
            element={
              <ProtectedRoute roles={["EMPLOYEE"]}>
                <EmployeeChatbot />
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
