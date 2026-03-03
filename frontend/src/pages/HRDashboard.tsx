import { FolderPlus, FolderOpen, Users, UserCheck } from "lucide-react";
import { DashboardCard } from "@/components/DashboardCard";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useProjects, useEmployees } from "@/api/hooks";
import { Card, CardContent } from "@/components/ui/card";

const actions = [
  { title: "Add Project", description: "Create a new project and assign team members", icon: FolderPlus, route: "/hr/add-project" },
  { title: "View Projects", description: "Browse and manage all active projects", icon: FolderOpen, route: "/hr/projects" },
  { title: "View Employees", description: "Access employee directory and details", icon: Users, route: "/hr/employees" },
];

export default function HRDashboard() {
  const navigate = useNavigate();
  const { data: projects = [] } = useProjects();
  const { data: employees = [] } = useEmployees();

  const stats = [
    { label: "Total Projects", value: projects.length },
    { label: "Open Projects", value: projects.filter((p) => p.current_status?.toLowerCase() === "open").length },
    { label: "Total Employees", value: employees.length },
    { label: "On Bench", value: employees.filter((e) => e.status === "Bench").length },
  ];

  return (
    <div className="flex flex-col h-full bg-muted">
      <header className="px-8 py-6 bg-card border-b-2 border-border shadow-sm">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl font-bold tracking-tight">HR Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage projects, employees and deployment readiness</p>
        </div>
      </header>

      <main className="flex-1 p-8 space-y-8">
        <div className="max-w-7xl mx-auto space-y-8">

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {stats.map((s) => (
              <Card key={s.label} className="border-2 border-border">
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-bold text-primary">{s.value}</p>
                  <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {actions.map((item) => (
              <DashboardCard
                key={item.route}
                title={item.title}
                description={item.description}
                icon={item.icon}
                onClick={() => { toast.success(`Navigating to ${item.title}`); navigate(item.route); }}
              />
            ))}
          </div>
        </div>
      </main>

      <footer className="px-8 py-4 border-t-2 border-border bg-card">
        <p className="text-xs text-muted-foreground text-center">© 2026 HR Management System</p>
      </footer>
    </div>
  );
}
