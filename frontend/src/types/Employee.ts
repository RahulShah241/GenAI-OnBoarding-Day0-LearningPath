export interface Employee {
  id: string;
  name: string;
  email: string;
  role: "EMPLOYEE" | "HR" | "ADMIN";
  skills: string[];
  experience: number;
  status: "Bench" | "Allocated";
}

export const EMPLOYEES: Employee[] = [
  {
    id: "E001",
    name: "Rahul Shah",
    email: "rahul@company.com",
    role: "EMPLOYEE",
    skills: ["React", "Node.js", "GenAI"],
    experience: 2,
    status: "Bench",
  },
  {
    id: "E002",
    name: "Anita Verma",
    email: "anita@company.com",
    role: "EMPLOYEE",
    skills: ["Java", "Spring Boot", "AWS"],
    experience: 4,
    status: "Allocated",
  },
];
