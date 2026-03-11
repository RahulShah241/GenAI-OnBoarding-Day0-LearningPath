import { Navigate } from "react-router-dom";
import { Data } from "@/store/Data";

interface ProtectedRouteProps {
  roles: string[];
  children: React.ReactNode;
}

/**
 * Guards a route by checking:
 *   1. Is there a logged-in user with a JWT token?  → else redirect to /login
 *   2. Does the user's role match the allowed roles? → else redirect to /login
 */
export default function ProtectedRoute({ roles, children }: ProtectedRouteProps) {
  const user = Data((state) => state.user);
  const token = Data((state) => state.token);

  if (!user || !token) return <Navigate to="/login" replace />;
  if (!roles.includes(user.role)) return <Navigate to="/login" replace />;

  return <>{children}</>;
}
