export interface ProjectDescription {
  project_id: string;
  project_name: string;
  project_type: string;
  business_unit: string;
  domain: string;

  project_overview: {
    objective: string;
    problem_statement: string;
    expected_outcomes: string[];
  };

  project_duration: {
    start_date: string;
    expected_end_date: string;
    engagement_type: string;
  };

  required_roles: {
    role_name: string;
    role_level: string;
    headcount: number;
    deployment_priority: string;
  }[];

  required_skills: {
    skill_name: string;
    required_level: string;
    mandatory: boolean;
  }[];

  responsibilities: string[];

  delivery_model: {
    methodology: string;
    sprint_length_weeks: number;
    communication_mode: string;
  };

  deployment_readiness_criteria: {
    minimum_skill_match_percentage: number;
    simulation_score_threshold: number;
  };

  status: {
    current_status: string;
    deployment_stage: string;
    last_updated: string;
  };
}
