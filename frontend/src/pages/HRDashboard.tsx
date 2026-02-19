import { FolderPlus, FolderOpen, Users, UserCheck } from "lucide-react";
import { DashboardCard } from "@/components/DashboardCard";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

type ActionItem = {
  title: string;
  description: string;
  icon: any;
  route: string;
};

const actions: ActionItem[] = [
  {
    title: "Add Project",
    description: "Create a new project and assign team members",
    icon: FolderPlus,
    route: "/hr/add-project",
  },
  {
    title: "View Projects",
    description: "Browse and manage all active projects",
    icon: FolderOpen,
    route: "/hr/projects",
  },
  {
    title: "View Employees",
    description: "Access employee directory and details",
    icon: Users,
    route: "/hr/employees",
  },
  // {
  //   title: "Suggested Employees",
  //   description: "View skill-matched employee suggestions per project",
  //   icon: UserCheck,
  //   route: "/hr/project-suggestions",
  // },
];

export default function HRDashboard() {
  const navigate = useNavigate();

  const handleCardClick = (action: ActionItem) => {
    toast.success(`Navigating to ${action.title}`);
    navigate(action.route);
  };

  return (
    <div className="flex flex-col h-full bg-muted">
      {/* Header */}
      <header className="px-8 py-6 bg-card border-b-2 border-border shadow-sm">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            HR Dashboard
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage projects, employees and deployment readiness
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-5xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {actions.map((item, index) => (
              <DashboardCard
                key={index}
                title={item.title}
                description={item.description}
                icon={item.icon}
                onClick={() => handleCardClick(item)}
              />
            ))}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="px-8 py-4 border-t-2 border-border bg-card">
        <p className="text-xs text-muted-foreground text-center">
          © 2026 HR Management System. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
