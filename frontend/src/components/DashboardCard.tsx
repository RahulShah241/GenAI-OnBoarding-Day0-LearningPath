import { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface DashboardCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  onClick?: () => void;
}

export function DashboardCard({ title, description, icon: Icon, onClick }: DashboardCardProps) {
  return (
    <Card
      className={cn(
        "group cursor-pointer h-full",
        "bg-card border-2 border-border",
        "shadow-dashboard-card hover:shadow-dashboard-card-hover",
        "transition-all duration-300 ease-out",
        "hover:scale-[1.02] hover:border-primary/40",
        "hover:bg-dashboard-card-hover"
      )}
      onClick={onClick}
    >
      <CardContent className="flex flex-col items-center justify-center h-full p-8 gap-6">
        <div
          className={cn(
            "w-20 h-20 rounded-2xl flex items-center justify-center",
            "bg-dashboard-icon-bg border-2 border-primary/20",
            "transition-all duration-300 ease-out",
            "group-hover:scale-110 group-hover:rotate-3 group-hover:border-primary/40"
          )}
        >
          <Icon className="w-10 h-10 text-dashboard-icon-color transition-colors duration-300" />
        </div>

        <div className="text-center space-y-2">
          <h3 className="text-xl font-semibold text-foreground tracking-tight">
            {title}
          </h3>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </CardContent>
    </Card>
  );
}
