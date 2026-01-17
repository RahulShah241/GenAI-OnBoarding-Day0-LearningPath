import { Button, Stack, Typography, Paper } from "@mui/material";
import { useAuth } from "../auth/AuthContext";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = (role) => {
    login(role);

    // ✅ Redirect based on role
    if (role === "ADMIN") navigate("/admin");
    if (role === "HR") navigate("/hr");
    if (role === "EMPLOYEE") navigate("/employee");
  };

  return (
    <Paper sx={{ p: 4, maxWidth: 400, mx: "auto", mt: 10 }}>
      <Typography variant="h5" align="center" mb={3}>
        RBAC Login
      </Typography>

      <Stack spacing={2}>
        <Button variant="contained" onClick={() => handleLogin("ADMIN")}>
          Login as Admin
        </Button>
        <Button variant="contained" onClick={() => handleLogin("HR")}>
          Login as HR
        </Button>
        <Button variant="contained" onClick={() => handleLogin("EMPLOYEE")}>
          Login as Employee
        </Button>
      </Stack>
    </Paper>
  );
}
