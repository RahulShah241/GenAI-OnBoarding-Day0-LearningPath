import { useState } from "react";
import { Data } from "../store/Data";
import { useNavigate } from "react-router-dom";
import {
  FiLock,
  FiAlertCircle,
  FiEye,
  FiEyeOff,
  FiShield,
  FiCheck,
} from "react-icons/fi";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const login = Data((state) => state.login);
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");

    const success = login(email, password);
    if (!success) {
      setError("Invalid email or password");
      return;
    }

    const user = Data.getState().user;

    if (user.role === "ADMIN") navigate("/admin");
    if (user.role === "HR") navigate("/hr");
    if (user.role === "EMPLOYEE") navigate("/employee");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md"
      >
        <div className="text-center mb-6">
          <FiLock className="mx-auto text-4xl text-blue-500" />
          <h2 className="text-2xl font-bold mt-2">RBAC Login</h2>
        </div>

        {error && (
          <div className="text-red-500 flex items-center mb-3">
            <FiAlertCircle className="mr-2" />
            {error}
          </div>
        )}

        <input
          type="email"
          placeholder="Email"
          className="w-full mb-3 p-2 border rounded"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <div className="relative mb-3">
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            className="w-full p-2 border rounded"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <span
            className="absolute right-3 top-3 cursor-pointer"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? <FiEyeOff /> : <FiEye />}
          </span>
        </div>

        <button className="w-full bg-blue-500 text-white p-2 rounded">
          Login
        </button>

        <div className="mt-6 text-sm text-gray-600">
          <p>Test Accounts:</p>
          <p>admin@example.com / admin123</p>
          <p>mod1@example.com / mod123</p>
          <p>user1@example.com / user123</p>
        </div>

        <div className="flex justify-center gap-4 mt-6 text-xs text-gray-500">
          <FiShield /> Secure <FiCheck /> Verified
        </div>
      </form>
    </div>
  );
};

export default Login;
