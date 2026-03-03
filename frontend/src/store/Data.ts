import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface AuthUser {
  employee_id: string;
  email: string;
  name: string;
  role: string;
  skills: string[];
  experience: number;
  status: string;
  designation?: string;
  department?: string;
}

interface DataStore {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  loginError: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  getAuthHeaders: () => Record<string, string>;
}

export const Data = create<DataStore>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isLoading: false,
      loginError: null,

      login: async (email: string, password: string): Promise<boolean> => {
        set({ isLoading: true, loginError: null });
        try {
          const res = await fetch(`${import.meta.env.VITE_API_BASE ?? "http://localhost:8000"}/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password }),
          });
          if (!res.ok) {
            const body = await res.json().catch(() => ({}));
            set({ isLoading: false, loginError: body?.detail ?? "Invalid email or password" });
            return false;
          }
          const data = await res.json();
          set({
            token: data.access_token,
            user: {
              employee_id: data.employee.employee_id,
              email: data.employee.email,
              name: data.employee.name,
              role: data.employee.role,
              skills: data.employee.skills ?? [],
              experience: data.employee.experience ?? 0,
              status: data.employee.status ?? "",
              designation: data.employee.designation,
              department: data.employee.department,
            },
            isLoading: false,
            loginError: null,
          });
          return true;
        } catch {
          set({ isLoading: false, loginError: "Network error — is the backend running?" });
          return false;
        }
      },

      logout: () => set({ user: null, token: null, loginError: null }),

      getAuthHeaders: (): Record<string, string> => {
        const token = get().token;
        return {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        };
      },
    }),
    {
      name: "rbac-storage",
      partialize: (state) => ({ user: state.user, token: state.token }),
    }
  )
);
