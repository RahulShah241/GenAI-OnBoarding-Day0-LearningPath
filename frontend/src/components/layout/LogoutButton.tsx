import { Data } from "@/store/Data";
import { LogOut, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";

const ROLE_COLORS: Record<string, string> = {
  ADMIN: "bg-destructive/10 text-destructive",
  HR: "bg-blue-100 text-blue-700",
  EMPLOYEE: "bg-green-100 text-green-700",
};

export default function LogoutButton() {
  const user = Data((state) => state.user);
  const logout = Data((state) => state.logout);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="flex items-center gap-4">
      {user && (
        <div className="hidden md:flex items-center gap-3 bg-muted py-2 px-4 rounded-lg">
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground">
            <User className="w-4 h-4" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-medium text-foreground">{user.name}</span>
            <span className="text-xs text-muted-foreground">{user.email}</span>
          </div>
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${ROLE_COLORS[user.role] ?? "bg-muted"}`}>
            {user.role}
          </span>
        </div>
      )}
      <Button onClick={handleLogout} variant="destructive" className="flex items-center gap-2">
        <LogOut className="w-4 h-4" />
        <span className="hidden md:inline">Logout</span>
      </Button>
    </div>
  );
}
