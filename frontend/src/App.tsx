import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import ProtectedRoute from "@/auth/ProtectedRoute";
import Navbar from "@/components/layout/Navbar";
import { AppBreadcrumb } from "@/components/AppBreadcrumb";

/* Pages */
import Login from "@/pages/Login";
import AdminDashboard from "@/pages/AdminDashboard";
import HRDashboard from "@/pages/HRDashboard";
import EmployeeChatbot from "@/pages/EmployeeChatbot";
import ProjectsDetailsPage from "@/pages/ProjectsDetailsPage";
import ProjectsList from "@/pages/ProjectsList";
import AddProject from "@/pages/AddProject";
import EmployeeList from "@/pages/EmployeesList";
import EmployeeDetails from "@/pages/EmployeesDetails";
import EmployeeJobMatches from "@/pages/EmployeeJobMatches";
import HRProjectSuggestions from "@/pages/HRProjectSuggestions";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

/* Layout Wrapper — renders shared Navbar + page content */
const AppLayout = ({ children }: { children: React.ReactNode }) => (
  <>
    <Navbar />
    <AppBreadcrumb />
    <main className="min-h-[calc(100vh-64px)]">{children}</main>
  </>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />

      <BrowserRouter
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      >
        <Routes>
          {/* Redirect */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />

          {/* ================= ADMIN ================= */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute roles={["ADMIN"]}>
                <AppLayout>
                  <AdminDashboard />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          {/* ================= HR ================= */}
          <Route
            path="/hr"
            element={
              <ProtectedRoute roles={["HR"]}>
                <AppLayout>
                  <HRDashboard />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/hr/projects"
            element={
              <ProtectedRoute roles={["HR"]}>
                <AppLayout>
                  <ProjectsList />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/hr/add-project"
            element={
              <ProtectedRoute roles={["HR"]}>
                <AppLayout>
                  <AddProject />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/hr/employees"
            element={
              <ProtectedRoute roles={["HR"]}>
                <AppLayout>
                  <EmployeeList />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/hr/employees/:id"
            element={
              <ProtectedRoute roles={["HR"]}>
                <AppLayout>
                  <EmployeeDetails />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/hr/projects/:id"
            element={
              <ProtectedRoute roles={["HR"]}>
                <AppLayout>
                  <ProjectsDetailsPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
  path="/hr/projects/:projectId/suggested-employees"
  element={
    <ProtectedRoute roles={["HR"]}>
      <AppLayout>
        <HRProjectSuggestions />
      </AppLayout>
    </ProtectedRoute>
  }
/>


          {/* ================= EMPLOYEE ================= */}
          <Route
            path="/employee"
            element={
              <ProtectedRoute roles={["EMPLOYEE"]}>
                <AppLayout>
                  <EmployeeChatbot />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/employee/job-matches"
            element={
              <ProtectedRoute roles={["EMPLOYEE"]}>
                <AppLayout>
                  <EmployeeJobMatches />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          {/* ================= 404 ================= */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
