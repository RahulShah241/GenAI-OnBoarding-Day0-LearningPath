import { Shield } from "lucide-react";
import LogoutButton from "./LogoutButton";

const Navbar = () => (
  <div className="bg-card border-b-2 border-border shadow-md">
    <div className="px-6 py-3.5 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl border-2 border-primary/30 bg-primary flex items-center justify-center text-primary-foreground shadow-sm">
          <Shield className="w-5 h-5" />
        </div>
        <h1 className="text-lg font-semibold text-foreground tracking-tight">RBAC Dashboard</h1>
      </div>
      <LogoutButton />
    </div>
  </div>
);

export default Navbar;
