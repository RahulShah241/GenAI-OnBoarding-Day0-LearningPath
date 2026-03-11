import { ProjectDescription } from "../types/Project";

export const PROJECTS: ProjectDescription[] = [
  {
    project_id: "PRJ-BANK-001",
    project_name: "GenAI Banking Operations Platform",
    project_type: "Client",
    business_unit: "BFSI",
    domain: "Banking / GenAI",
    project_overview: {
      objective: "Automate banking operations using GenAI",
      problem_statement: "Manual workflows and delayed insights",
      expected_outcomes: ["Reduced processing time", "Fraud risk mitigation", "Improved customer experience"],
    },
    project_duration: { start_date: "2026-02-01", expected_end_date: "2026-08-30", engagement_type: "Full-time" },
    required_roles: [
      { role_name: "Backend Developer", role_level: "Mid-Level", headcount: 2, deployment_priority: "High" },
      { role_name: "AI/ML Engineer", role_level: "Senior", headcount: 1, deployment_priority: "High" },
    ],
    required_skills: [
      { skill_name: "Python", required_level: "Advanced", mandatory: true },
      { skill_name: "FastAPI", required_level: "Intermediate", mandatory: true },
      { skill_name: "GenAI / RAG", required_level: "Intermediate", mandatory: false },
    ],
    responsibilities: ["Develop secure APIs", "Integrate AI pipelines", "Ensure banking compliance"],
    delivery_model: { methodology: "Agile", sprint_length_weeks: 2, communication_mode: "Daily Standups" },
    deployment_readiness_criteria: { minimum_skill_match_percentage: 75, simulation_score_threshold: 70 },
    status: { current_status: "Open", deployment_stage: "Demand Raised", last_updated: "2026-01-20" },
  },
  {
    project_id: "PRJ-ECOM-002",
    project_name: "E-Commerce Microservices Platform",
    project_type: "Internal",
    business_unit: "Retail",
    domain: "E-Commerce / Cloud",
    project_overview: {
      objective: "Build scalable microservices for e-commerce",
      problem_statement: "Monolithic architecture limits scalability",
      expected_outcomes: ["10x throughput", "Independent deployments", "Better fault isolation"],
    },
    project_duration: { start_date: "2026-03-01", expected_end_date: "2026-09-30", engagement_type: "Full-time" },
    required_roles: [
      { role_name: "Full Stack Developer", role_level: "Mid-Level", headcount: 3, deployment_priority: "High" },
      { role_name: "DevOps Engineer", role_level: "Senior", headcount: 1, deployment_priority: "Medium" },
    ],
    required_skills: [
      { skill_name: "React", required_level: "Advanced", mandatory: true },
      { skill_name: "Node.js", required_level: "Intermediate", mandatory: true },
      { skill_name: "AWS", required_level: "Intermediate", mandatory: true },
      { skill_name: "Docker", required_level: "Intermediate", mandatory: false },
    ],
    responsibilities: ["Design microservices", "Implement CI/CD", "Build responsive UI"],
    delivery_model: { methodology: "Agile", sprint_length_weeks: 2, communication_mode: "Daily Standups" },
    deployment_readiness_criteria: { minimum_skill_match_percentage: 70, simulation_score_threshold: 65 },
    status: { current_status: "Open", deployment_stage: "Team Formation", last_updated: "2026-02-01" },
  },
  {
    project_id: "PRJ-HEALTH-003",
    project_name: "Healthcare Data Analytics Dashboard",
    project_type: "Client",
    business_unit: "Healthcare",
    domain: "Healthcare / Data",
    project_overview: {
      objective: "Build real-time analytics dashboard for patient data",
      problem_statement: "Lack of data-driven decision making in healthcare ops",
      expected_outcomes: ["Real-time KPIs", "Predictive analytics", "Compliance reports"],
    },
    project_duration: { start_date: "2026-04-01", expected_end_date: "2026-10-31", engagement_type: "Full-time" },
    required_roles: [
      { role_name: "Data Engineer", role_level: "Senior", headcount: 1, deployment_priority: "High" },
      { role_name: "Frontend Developer", role_level: "Mid-Level", headcount: 2, deployment_priority: "Medium" },
    ],
    required_skills: [
      { skill_name: "Python", required_level: "Advanced", mandatory: true },
      { skill_name: "SQL", required_level: "Advanced", mandatory: true },
      { skill_name: "React", required_level: "Intermediate", mandatory: true },
      { skill_name: "Power BI", required_level: "Intermediate", mandatory: false },
    ],
    responsibilities: ["Build ETL pipelines", "Design dashboards", "Ensure HIPAA compliance"],
    delivery_model: { methodology: "Agile", sprint_length_weeks: 3, communication_mode: "Weekly Syncs" },
    deployment_readiness_criteria: { minimum_skill_match_percentage: 80, simulation_score_threshold: 75 },
    status: { current_status: "Open", deployment_stage: "Demand Raised", last_updated: "2026-02-05" },
  },
  {
    project_id: "PRJ-FIN-004",
    project_name: "FinTech Payment Gateway Integration",
    project_type: "Client",
    business_unit: "BFSI",
    domain: "FinTech / Payments",
    project_overview: {
      objective: "Integrate multi-channel payment gateway",
      problem_statement: "Fragmented payment processing across channels",
      expected_outcomes: ["Unified payment flow", "PCI-DSS compliance", "Reduced transaction failures"],
    },
    project_duration: { start_date: "2026-03-15", expected_end_date: "2026-07-15", engagement_type: "Contract" },
    required_roles: [
      { role_name: "Backend Developer", role_level: "Senior", headcount: 2, deployment_priority: "High" },
      { role_name: "QA Engineer", role_level: "Mid-Level", headcount: 1, deployment_priority: "Medium" },
    ],
    required_skills: [
      { skill_name: "Java", required_level: "Advanced", mandatory: true },
      { skill_name: "Spring Boot", required_level: "Advanced", mandatory: true },
      { skill_name: "AWS", required_level: "Intermediate", mandatory: true },
      { skill_name: "Stripe API", required_level: "Intermediate", mandatory: false },
    ],
    responsibilities: ["Build payment APIs", "Implement security protocols", "Performance testing"],
    delivery_model: { methodology: "Agile", sprint_length_weeks: 2, communication_mode: "Daily Standups" },
    deployment_readiness_criteria: { minimum_skill_match_percentage: 85, simulation_score_threshold: 80 },
    status: { current_status: "Open", deployment_stage: "Team Formation", last_updated: "2026-02-10" },
  },
];

// Keep backward compat
export const bankGenAIProject = PROJECTS[0];
