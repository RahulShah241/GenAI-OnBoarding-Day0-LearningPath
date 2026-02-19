import { useQuery } from "@tanstack/react-query";
import type { ProjectDescription, ProjectSummary } from "@/types/Project";
import type { AdminEmployeeData, Employee } from "@/types/Employee";
import type { EmployeeResponse } from "@/types/ChatData";

const API_BASE = "http://localhost:8000";

// ===== Projects =====
async function fetchProjectById(id: string): Promise<ProjectDescription> {
  const res = await fetch(`${API_BASE}/projects/${id}`);
  if (!res.ok) throw new Error("Failed to fetch project details");
  return res.json();
}

export function useProjectById(id: string) {
  return useQuery<ProjectDescription>({
    queryKey: ["project", id],
    queryFn: () => fetchProjectById(id),
    enabled: !!id, // only run if id exists
    retry: 1,
  });
}
async function fetchProjectsFull(): Promise<ProjectDescription[]> {
  const res = await fetch(`${API_BASE}/projectsDescrition`);
  if (!res.ok) throw new Error("Failed to fetch project details");
  return res.json();
}

export function useProjectsFull( ) {
    return useQuery<ProjectDescription[]>({
    queryKey: ["projects"],
    queryFn: fetchProjectsFull,
    retry: 1,
    staleTime: 30_000,
  });
}
async function fetchSuggestedEmployeesById(projectId: string) {
  const res = await fetch(`${API_BASE}/projects/${projectId}/suggested-employees`);
  if (!res.ok) throw new Error("Failed to fetch suggestions");
  return res.json();
}

export function useSuggestedEmployeesById(projectId: string) {
  return useQuery({
    queryKey: ["suggestedEmployees", projectId],
    queryFn: () => fetchSuggestedEmployeesById(projectId),
    enabled: !!projectId,
  });
}

async function fetchProjectDescription(): Promise<ProjectSummary[]> {
  const res = await fetch(`${API_BASE}/projects`);
  if (!res.ok) throw new Error("Failed to fetch projects");
  return res.json();
}

export function useProjects() {
  return useQuery<ProjectSummary[]>({
    queryKey: ["projects"],
    queryFn: fetchProjectDescription,
    retry: 1,
    staleTime: 30_000,
  });
}

// ===== Employees =====
async function fetchEmployees(): Promise<Employee[]> {
  const res = await fetch(`${API_BASE}/employees`);
  if (!res.ok) throw new Error("Failed to fetch employees");
  return res.json();
}

export function useEmployees() {
  return useQuery<Employee[]>({
    queryKey: ["employees"],
    queryFn: fetchEmployees,
    retry: 1,
    staleTime: 30_000,
  });
}

// ===== Single Employee =====


async function fetchEmployee(id: string): Promise<Employee> {
  const res = await fetch(`${API_BASE}/employees/${id}`);
  if (!res.ok) throw new Error("Failed to fetch employee");
  return res.json();
}

export function useEmployee(id: string | undefined) {
  return useQuery<Employee>({
    queryKey: ["employee", id],
    queryFn: () => fetchEmployee(id!),
    enabled: !!id,
    retry: 1,
    staleTime: 30_000,
  });
}

// ChatData by id
async function fetchEmployeeChatData(id: string): Promise<EmployeeResponse> {
  const res = await fetch(`${API_BASE}/employees/chatdata/${id}`);
  if (!res.ok) throw new Error("Failed to fetch employee");
  return res.json();
}

export function useEmployeeChatData(id: string | undefined) {
  return useQuery<EmployeeResponse>({
    queryKey: ["employee-chat", id],
    queryFn: () => fetchEmployeeChatData(id!),
    enabled: !!id,
    retry: 1,
    staleTime: 30_000,
  });
}
// AdminEmployees
async function fetchAdminEmployeeData(): Promise<AdminEmployeeData> {
  const res = await fetch(`${API_BASE}/admin/employees`);
  if (!res.ok) throw new Error("Failed to fetch employees");
  return res.json();
}
export function useAdminEmployeeData(){
  return useQuery<AdminEmployeeData>({
    queryKey: ["adminEmployees"],
    queryFn: fetchAdminEmployeeData,
    retry: 1,
    staleTime: 30_000,
  });
}

// AdminEmployees
async function deleteEmployee(id:string) {
  const res = await fetch(`${API_BASE}/admin/delete/employee/${id}`);
  if (!res.ok) throw new Error("Failed to fetch employees");
  return res.json();
}
export function useAdminEmployeeDeleteByemail(email:string |undefined){
  return useQuery({
    queryKey: ["adminEmployeeDelete",email],
    enabled:!!email,
    queryFn:()=>   deleteEmployee(email!),
    retry: 1,
    staleTime: 30_000,
  });
}
// ===== Suggested Employees (per project or all) =====
export interface SuggestedEmployee extends Employee {
  match_percentage: number;
  matched_skills: string[];
  missing_skills: string[];
}

export interface ProjectSuggestion {
  project: ProjectDescription;
  suggestions: SuggestedEmployee[];
}

async function fetchSuggestedEmployees(): Promise<ProjectSuggestion[]> {
  const res = await fetch(`${API_BASE}/suggestedEmployees`);
  if (!res.ok) throw new Error("Failed to fetch suggestions");
  return res.json();
}

export function useSuggestedEmployees() {
  return useQuery<ProjectSuggestion[]>({
    queryKey: ["suggestedEmployees"],
    queryFn: fetchSuggestedEmployees,
    retry: 1,
    staleTime: 30_000,
  });
}
