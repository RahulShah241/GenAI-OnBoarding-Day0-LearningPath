import { Navigate } from "react-router-dom";
import { Data } from "../store/Data";

export default function ProtectedRoute({ roles, children }) {
  const user = Data((state) => state.user);

  console.log("[ProtectedRoute]", user);

  if (!user) return <Navigate to="/login" />;
  if (!roles.includes(user.role)) return <Navigate to="/login" />;

  return children;
}
