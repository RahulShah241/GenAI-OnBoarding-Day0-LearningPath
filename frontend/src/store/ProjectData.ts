import { ProjectDescription } from "../types/Project";

export const bankGenAIProject: ProjectDescription = {
  project_id: "PRJ-BANK-001",
  project_name: "GenAI Banking Operations Platform",
  project_type: "Client",
  business_unit: "BFSI",
  domain: "Banking / GenAI",

  project_overview: {
    objective: "Automate banking operations using GenAI",
    problem_statement: "Manual workflows and delayed insights",
    expected_outcomes: [
      "Reduced processing time",
      "Fraud risk mitigation",
      "Improved customer experience",
    ],
  },

  project_duration: {
    start_date: "2026-02-01",
    expected_end_date: "2026-08-30",
    engagement_type: "Full-time",
  },

  required_roles: [
    {
      role_name: "Backend Developer",
      role_level: "Mid-Level",
      headcount: 2,
      deployment_priority: "High",
    },
  ],

  required_skills: [
    { skill_name: "Python", required_level: "Advanced", mandatory: true },
    { skill_name: "FastAPI", required_level: "Intermediate", mandatory: true },
    { skill_name: "GenAI / RAG", required_level: "Intermediate", mandatory: false },
  ],

  responsibilities: [
    "Develop secure APIs",
    "Integrate AI pipelines",
    "Ensure banking compliance",
  ],

  delivery_model: {
    methodology: "Agile",
    sprint_length_weeks: 2,
    communication_mode: "Daily Standups",
  },

  deployment_readiness_criteria: {
    minimum_skill_match_percentage: 75,
    simulation_score_threshold: 70,
  },

  status: {
    current_status: "Open",
    deployment_stage: "Demand Raised",
    last_updated: "2026-01-20",
  },
};
