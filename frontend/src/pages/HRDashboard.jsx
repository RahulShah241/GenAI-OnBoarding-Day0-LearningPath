import { FolderPlus, FolderOpen, Users } from "lucide-react";
import  {DashboardCard } from "./DashboardCard";
import { toast } from "sonner";
import Navbar from "./Navbar";

const actions = [
  { 
    title: "Add Project", 
    description: "Create a new project and assign team members",
    icon: FolderPlus 
  },
  { 
    title: "View Projects", 
    description: "Browse and manage all active projects",
    icon: FolderOpen 
  },
  { 
    title: "View Employees", 
    description: "Access employee directory and details",
    icon: Users 
  },
];

export default function HRDashboard() {
  const handleCardClick = (title) => {
    toast.info(`${title} clicked`);
  };

  return (
    <><Navbar /><div className="h-full flex flex-col bg-dashboard-bg">
      {/* Header */}
      <header className="px-8 py-6 bg-card border-b border-border/50">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl font-bold text-dashboard-header tracking-tight">
            HR Dashboard
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage your projects and team efficiently
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-5xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-72">
            {actions.map((item, index) => (
              <DashboardCard
                key={index}
                title={item.title}
                description={item.description}
                icon={item.icon}
                onClick={() => handleCardClick(item.title)} />
            ))}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="px-8 py-4 border-t border-border/50 bg-card">
        <div className="max-w-7xl mx-auto">
          <p className="text-xs text-muted-foreground text-center">
            © 2026 HR Management System. All rights reserved.
          </p>
        </div>
      </footer>
    </div></>
  );
}
