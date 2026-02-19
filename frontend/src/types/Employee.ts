export interface Employee {
  employee_id: string;
  name: string;
  email: string;
  role: "EMPLOYEE" | "HR" | "ADMIN";
  skills: string[];
  experience: number;
  status: "Bench" | "Allocated";
  designation?: string;
  department?: string;
}
export interface AdminEmployeeData{
  employee_id: string;
  name: string;
  email: string;
  role: "EMPLOYEE" | "HR" | "ADMIN";
}
export const EMPLOYEES: Employee[] = [
  {
    employee_id: "E001",
    name: "Rahul Shah",
    email: "rahul@company.com",
    role: "EMPLOYEE",
    skills: ["React", "Node.js", "GenAI"],
    experience: 2,
    status: "Bench",
    designation: "Full Stack Developer",
    department: "Engineering",
  },
  {
    employee_id: "E002",
    name: "Anita Verma",
    email: "anita@company.com",
    role: "EMPLOYEE",
    skills: ["Java", "Spring Boot", "AWS"],
    experience: 4,
    status: "Allocated",
    designation: "Backend Developer",
    department: "Engineering",
  },
  {
    employee_id: "E003",
    name: "Priya Nair",
    email: "priya@company.com",
    role: "EMPLOYEE",
    skills: ["Python", "FastAPI", "GenAI / RAG", "SQL"],
    experience: 3,
    status: "Bench",
    designation: "AI/ML Engineer",
    department: "Data Science",
  },
  {
    employee_id: "E004",
    name: "Vikram Joshi",
    email: "vikram@company.com",
    role: "EMPLOYEE",
    skills: ["React", "AWS", "Docker", "Node.js"],
    experience: 5,
    status: "Bench",
    designation: "DevOps Engineer",
    department: "Infrastructure",
  },
  {
    employee_id: "E005",
    name: "Sneha Patil",
    email: "sneha@company.com",
    role: "EMPLOYEE",
    skills: ["Python", "SQL", "Power BI", "React"],
    experience: 3,
    status: "Bench",
    designation: "Data Engineer",
    department: "Analytics",
  },
  {
    employee_id: "E006",
    name: "Arjun Mehta",
    email: "arjun@company.com",
    role: "EMPLOYEE",
    skills: ["Java", "Spring Boot", "Stripe API", "AWS"],
    experience: 6,
    status: "Allocated",
    designation: "Senior Backend Developer",
    department: "Engineering",
  },
];
