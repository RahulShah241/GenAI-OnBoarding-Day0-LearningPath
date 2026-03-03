import { useState } from "react";
import { Data } from "@/store/Data";
import { useNavigate } from "react-router-dom";
import { Lock, AlertCircle, Eye, EyeOff, Shield, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const login = Data((state) => state.login);
  const isLoading = Data((state) => state.isLoading);
  const loginError = Data((state) => state.loginError);
  const user = Data((state) => state.user);
  const navigate = useNavigate();

  // Already authenticated → redirect immediately
  if (user) {
    if (user.role === "ADMIN") navigate("/admin", { replace: true });
    else if (user.role === "HR") navigate("/hr", { replace: true });
    else navigate("/employee", { replace: true });
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const ok = await login(email, password);
    if (!ok) return;
    const role = Data.getState().user?.role;
    if (role === "ADMIN") navigate("/admin");
    else if (role === "HR") navigate("/hr");
    else navigate("/employee");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted">
      <Card className="w-full max-w-md shadow-xl border-2 border-border">
        <CardContent className="p-8">
          <div className="text-center mb-6">
            <div className="mx-auto w-14 h-14 rounded-full bg-primary/10 border-2 border-primary/20 flex items-center justify-center mb-4">
              <Lock className="w-6 h-6 text-primary" />
            </div>
            <h2 className="text-2xl font-bold">Sign In</h2>
            <p className="text-sm text-muted-foreground mt-1">Employee–Project Matching Platform</p>
          </div>

          {loginError && (
            <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span className="text-sm">{loginError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoading}
              autoComplete="username"
            />
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
                autoComplete="current-password"
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading
                ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Signing in…</>
                : "Sign In"
              }
            </Button>
          </form>

          <div className="mt-6 p-4 rounded-lg bg-muted border border-border">
            <p className="text-sm font-medium mb-2">Test Accounts</p>
            <div className="space-y-1 text-xs text-muted-foreground">
              <p><strong>Admin:</strong> admin@company.com / admin123</p>
              <p><strong>HR:</strong> hr@company.com / hr123</p>
              <p><strong>Employee:</strong> rahul@company.com / e001123</p>
            </div>
          </div>

          <div className="flex justify-center gap-4 mt-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><Shield className="w-3 h-3" /> JWT Secured</span>
            <span className="flex items-center gap-1"><Check className="w-3 h-3" /> Role-Based</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
