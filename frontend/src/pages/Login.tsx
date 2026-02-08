import { useState } from "react";
import { Data } from "@/store/Data";
import { useNavigate } from "react-router-dom";
import { Lock, AlertCircle, Eye, EyeOff, Shield, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const login = Data((state) => state.login);
  const user = Data((state) => state.user);
  const navigate = useNavigate();

  // If already logged in, redirect
  if (user) {
    if (user.role === "ADMIN") navigate("/admin", { replace: true });
    if (user.role === "HR") navigate("/hr", { replace: true });
    if (user.role === "EMPLOYEE") navigate("/employee", { replace: true });
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const success = login(email, password);
    if (!success) {
      setError("Invalid email or password");
      return;
    }

    const currentUser = Data.getState().user;
    if (currentUser?.role === "ADMIN") navigate("/admin");
    if (currentUser?.role === "HR") navigate("/hr");
    if (currentUser?.role === "EMPLOYEE") navigate("/employee");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted">
      <Card className="w-full max-w-md shadow-xl border-2 border-border">
        <CardContent className="p-8">
          <div className="text-center mb-6">
            <div className="mx-auto w-14 h-14 rounded-full bg-primary/10 border-2 border-primary/20 flex items-center justify-center mb-4">
              <Lock className="w-6 h-6 text-primary" />
            </div>
            <h2 className="text-2xl font-bold text-foreground">RBAC Login</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Role-Based Access Control Demo
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>

            <Button type="submit" className="w-full">
              Login
            </Button>
          </form>

          <div className="mt-6 p-4 rounded-lg bg-muted border border-border">
            <p className="text-sm font-medium text-foreground mb-2">
              Test Accounts:
            </p>
            <div className="space-y-1 text-xs text-muted-foreground">
              <p>
                <strong>Admin:</strong> admin@example.com / admin123
              </p>
              <p>
                <strong>HR:</strong> mod1@example.com / mod123
              </p>
              <p>
                <strong>Employee:</strong> user1@example.com / user123
              </p>
            </div>
          </div>

          <div className="flex justify-center gap-4 mt-6 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Shield className="w-3 h-3" /> Secure
            </span>
            <span className="flex items-center gap-1">
              <Check className="w-3 h-3" /> Verified
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
