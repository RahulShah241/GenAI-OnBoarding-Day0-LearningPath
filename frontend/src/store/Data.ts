import { create } from "zustand";
import { persist } from "zustand/middleware";

interface User {
  email: string;
  name: string;
  role: string;
}

interface DataStore {
  user: User | null;
  login: (email: string, password: string) => boolean;
  logout: () => void;
}

const USERS = [
  {
    email: "admin@example.com",
    password: "admin123",
    role: "ADMIN",
    name: "Admin User",
  },
  {
    email: "mod1@example.com",
    password: "mod123",
    role: "HR",
    name: "HR Manager",
  },
  {
    email: "user1@example.com",
    password: "user123",
    role: "EMPLOYEE",
    name: "Employee User",
  },
];

export const Data = create<DataStore>()(
  persist(
    (set) => ({
      user: null,

      login: (email: string, password: string) => {
        const foundUser = USERS.find(
          (u) => u.email === email && u.password === password
        );

        if (!foundUser) return false;

        set({
          user: {
            email: foundUser.email,
            name: foundUser.name,
            role: foundUser.role,
          },
        });

        return true;
      },

      logout: () => set({ user: null }),
    }),
    {
      name: "rbac-storage",
    }
  )
);
