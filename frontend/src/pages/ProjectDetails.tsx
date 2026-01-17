import { ProjectDescription } from "@/types/project";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
// src/types/project.ts

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
  non_functional_requirements: string[];

  delivery_model: {
    methodology: string;
    sprint_length_weeks: number;
    communication_mode: string;
  };

  stakeholders: {
    stakeholder_role: string;
    engagement_level: string;
  }[];

  deployment_readiness_criteria: {
    minimum_skill_match_percentage: number;
    required_certifications: string[];
    simulation_score_threshold: number;
  };

  bench_optimization: {
    allows_partial_allocation: boolean;
    upskilling_during_project: boolean;
  };

  risk_factors: string[];

  ai_matching_metadata: {
    priority_weight: number;
    critical_skills_weight: number;
    availability_weight: number;
  };

  status: {
    current_status: string;
    deployment_stage: string;
    created_by: string;
    last_updated: string;
  };
}

export default function ProjectDetails({ project }: { project: ProjectDescription }) {
  return (
    <div className="space-y-6">

      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">{project.project_name}</h2>
        <p className="text-muted-foreground">
          {project.domain} · {project.business_unit}
        </p>
      </div>

      {/* Overview */}
      <Section title="Project Overview">
        <p><b>Objective:</b> {project.project_overview.objective}</p>
        <p><b>Problem:</b> {project.project_overview.problem_statement}</p>

        <ul className="list-disc ml-5 mt-2">
          {project.project_overview.expected_outcomes.map((o:any) => (
            <li key={o}>{o}</li>
          ))}
        </ul>
      </Section>

      {/* Duration */}
      <Section title="Engagement Details">
        <Info label="Start Date" value={project.project_duration.start_date} />
        <Info label="Expected End" value={project.project_duration.expected_end_date} />
        <Info label="Engagement Type" value={project.project_duration.engagement_type} />
      </Section>

      {/* Required Roles */}
      <Section title="Required Roles">
        {project.required_roles.map((role:any, i:any) => (
          <Card key={i}>
            <CardContent className="p-4 space-y-1">
              <h4 className="font-semibold">{role.role_name}</h4>
              <p className="text-sm text-muted-foreground">
                Level: {role.role_level} · Headcount: {role.headcount}
              </p>
              <Badge variant="destructive">
                Priority: {role.deployment_priority}
              </Badge>
            </CardContent>
          </Card>
        ))}
      </Section>

      {/* Required Skills */}
      <Section title="Required Skills">
        <div className="flex flex-wrap gap-2">
          {project.required_skills.map((skill:any) => (
            <Badge
              key={skill.skill_name}
              variant={skill.mandatory ? "default" : "secondary"}
            >
              {skill.skill_name} ({skill.required_level})
            </Badge>
          ))}
        </div>
      </Section>

      {/* Responsibilities */}
      <Section title="Responsibilities">
        <ul className="list-disc ml-5">
          {project.responsibilities.map((r:any) => (
            <li key={r}>{r}</li>
          ))}
        </ul>
      </Section>

      {/* Delivery Model */}
      <Section title="Delivery Model">
        <Info label="Methodology" value={project.delivery_model.methodology} />
        <Info label="Sprint Length" value={`${project.delivery_model.sprint_length_weeks} weeks`} />
        <Info label="Communication" value={project.delivery_model.communication_mode} />
      </Section>

      {/* Deployment Readiness */}
      <Section title="Deployment Readiness Criteria">
        <Info
          label="Minimum Skill Match"
          value={`${project.deployment_readiness_criteria.minimum_skill_match_percentage}%`}
        />
        <Info
          label="Simulation Score"
          value={`${project.deployment_readiness_criteria.simulation_score_threshold}`}
        />
      </Section>

      {/* Status */}
      <Section title="Project Status">
        <Badge>{project.status.current_status}</Badge>
        <Badge variant="outline">{project.status.deployment_stage}</Badge>
        <p className="text-xs text-muted-foreground mt-2">
          Last updated: {project.status.last_updated}
        </p>
      </Section>
    </div>
  );
}

function Section({ title, children }: any) {
  return (
    <Card>
      <CardContent className="p-6 space-y-3">
        <h3 className="font-semibold text-lg">{title}</h3>
        {children}
      </CardContent>
    </Card>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <p className="text-sm">
      <span className="text-muted-foreground">{label}: </span>
      <span className="font-medium">{value}</span>
    </p>
  );
}
