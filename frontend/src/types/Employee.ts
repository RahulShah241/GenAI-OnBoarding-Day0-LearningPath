export interface Employee {
  employee_id: string;
  name: string;
  email: string;
  role: "EMPLOYEE" | "HR" | "ADMIN";
  skills: string[];
  experience: number;
  status: string;
  designation?: string;
  department?: string;
}
