import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { ProjectDescription, ProjectSummary } from "@/types/Project";
import type { Employee } from "@/types/Employee";
import type { EmployeeResponse } from "@/types/ChatData";
import type { EmployeeProfile } from "@/api/api";
import { Data } from "@/store/Data";

const BASE = import.meta.env.VITE_API_BASE ?? "http://localhost:8000";

// ─── Central authenticated fetch ─────────────────────────────────────────────
async function authFetch(url: string, init: RequestInit = {}): Promise<Response> {
  const headers = Data.getState().getAuthHeaders();
  const merged = { ...init, headers: { ...headers, ...(init.headers ?? {}) } };
  const res = await fetch(url, merged);
  if (res.status === 401) {
    Data.getState().logout();
  }
  return res;
}

async function checked<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.detail ?? `Request failed (${res.status})`);
  }
  return res.json() as Promise<T>;
}

// ─── Projects ─────────────────────────────────────────────────────────────────

export function useProjects() {
  return useQuery<ProjectSummary[]>({
    queryKey: ["projects", "summary"],
    queryFn: () => authFetch(`${BASE}/projects`).then((r) => checked<ProjectSummary[]>(r)),
    retry: 1,
    staleTime: 30_000,
  });
}

export function useProjectsFull() {
  return useQuery<ProjectDescription[]>({
    queryKey: ["projects", "full"],
    queryFn: () => authFetch(`${BASE}/projectsDescrition`).then((r) => checked<ProjectDescription[]>(r)),
    retry: 1,
    staleTime: 30_000,
  });
}

export function useProjectById(id: string) {
  return useQuery<ProjectDescription>({
    queryKey: ["project", id],
    queryFn: () => authFetch(`${BASE}/projects/${id}`).then((r) => checked<ProjectDescription>(r)),
    enabled: !!id,
    retry: 1,
  });
}

export function useCreateProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: Omit<ProjectDescription, "project_id">) =>
      authFetch(`${BASE}/project`, { method: "POST", body: JSON.stringify(payload) }).then((r) =>
        checked<{ message: string; project_id: string }>(r)
      ),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["projects"] }),
  });
}

// ─── Employees ────────────────────────────────────────────────────────────────

export function useEmployees() {
  return useQuery<Employee[]>({
    queryKey: ["employees"],
    queryFn: () => authFetch(`${BASE}/employees`).then((r) => checked<Employee[]>(r)),
    retry: 1,
    staleTime: 30_000,
  });
}

export function useEmployee(id: string | undefined) {
  return useQuery<Employee>({
    queryKey: ["employee", id],
    queryFn: () => authFetch(`${BASE}/employees/${id}`).then((r) => checked<Employee>(r)),
    enabled: !!id,
    retry: 1,
    staleTime: 30_000,
  });
}

export function useEmployeeChatData(id: string | undefined) {
  return useQuery<EmployeeResponse>({
    queryKey: ["employee-chat", id],
    queryFn: () => authFetch(`${BASE}/employees/chatdata/${id}`).then((r) => checked<EmployeeResponse>(r)),
    enabled: !!id,
    retry: 1,
    staleTime: 30_000,
  });
}

// ─── Profiles ─────────────────────────────────────────────────────────────────

export function useEmployeeProfile(employeeId: string | undefined) {
  return useQuery<EmployeeProfile>({
    queryKey: ["employee-profile", employeeId],
    queryFn: () =>
      authFetch(`${BASE}/employee/profile/${employeeId}`).then((r) =>
        checked<EmployeeProfile>(r)
      ),
    enabled: !!employeeId,
    retry: 1,
    staleTime: 60_000,
  });
}

export function useAllProfiles() {
  return useQuery<EmployeeProfile[]>({
    queryKey: ["hr-profiles"],
    queryFn: () =>
      authFetch(`${BASE}/hr/employee-profiles`).then((r) =>
        checked<EmployeeProfile[]>(r)
      ),
    retry: 1,
    staleTime: 30_000,
  });
}

// ─── Suggested employees per project ─────────────────────────────────────────

export interface SuggestedEmployee extends Employee {
  match_percentage: number;
  matched_skills: string[];
  missing_skills: string[];
}

export function useSuggestedEmployeesById(projectId: string) {
  return useQuery<SuggestedEmployee[]>({
    queryKey: ["suggestedEmployees", projectId],
    queryFn: () =>
      authFetch(`${BASE}/projects/${projectId}/suggested-employees`).then((r) =>
        checked<SuggestedEmployee[]>(r)
      ),
    enabled: !!projectId,
  });
}

// ─── Auth — register (ADMIN only) ────────────────────────────────────────────

export interface RegisterPayload {
  employee_id: string;
  name: string;
  email: string;
  password: string;
  role: "EMPLOYEE" | "HR" | "ADMIN";
  skills: string[];
  experience: number;
  status: string;
  designation?: string;
  department?: string;
}

export function useRegisterUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: RegisterPayload) =>
      authFetch(`${BASE}/auth/register`, { method: "POST", body: JSON.stringify(payload) }).then((r) =>
        checked<Employee>(r)
      ),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["employees"] }),
  });
}

// ─── Auth — change password ───────────────────────────────────────────────────

export function useChangePassword() {
  return useMutation({
    mutationFn: (payload: { current_password: string; new_password: string }) =>
      authFetch(`${BASE}/auth/change-password`, { method: "POST", body: JSON.stringify(payload) }).then((r) =>
        checked<{ message: string }>(r)
      ),
  });
}
