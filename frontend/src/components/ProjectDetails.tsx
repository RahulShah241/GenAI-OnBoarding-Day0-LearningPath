import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ProjectDescription } from "@/types/Project";

interface ProjectDetailsProps {
  project: ProjectDescription;
}

export default function ProjectDetails({ project }: ProjectDetailsProps) {
  return (
    <div className="p-8 max-w-5xl mx-auto space-y-2">
      {/* Header */}
      <h1 className="text-3xl font-bold text-foreground">
        {project.project_name}
      </h1>
      <p className="text-muted-foreground mb-4">
        {project.domain} · {project.business_unit} · {project.project_type}
      </p>

      <Separator className="mb-6" />

      {/* Overview */}
      <Section title="Project Overview">
        <p>
          <strong>Objective:</strong> {project.project_overview.objective}
        </p>
        <p className="mt-2">
          <strong>Problem:</strong> {project.project_overview.problem_statement}
        </p>

        <p className="mt-4 font-medium">Expected Outcomes</p>
        <ul className="list-disc list-inside ml-2">
          {project.project_overview.expected_outcomes.map((o) => (
            <li key={o}>{o}</li>
          ))}
        </ul>
      </Section>

      {/* Duration */}
      <Section title="Engagement Details">
        <Info label="Start Date" value={project.project_duration.start_date} />
        <Info
          label="Expected End Date"
          value={project.project_duration.expected_end_date}
        />
        <Info
          label="Engagement Type"
          value={project.project_duration.engagement_type}
        />
      </Section>

      {/* Roles */}
      <Section title="Required Roles">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {project.required_roles.map((role) => (
            <Card key={role.role_name} className="border-2 border-border">
              <CardContent className="p-4">
                <p className="font-bold">{role.role_name}</p>
                <p className="text-sm text-muted-foreground">
                  Level: {role.role_level}
                </p>
                <p className="text-sm text-muted-foreground">
                  Headcount: {role.headcount}
                </p>
                <Badge variant="destructive" className="mt-2">
                  Priority: {role.deployment_priority}
                </Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      </Section>

      {/* Skills */}
      <Section title="Required Skills">
        <div className="flex flex-wrap gap-2">
          {project.required_skills.map((skill) => (
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
        <ul className="list-disc list-inside ml-2">
          {project.responsibilities.map((r) => (
            <li key={r}>{r}</li>
          ))}
        </ul>
      </Section>

      {/* Delivery Model */}
      <Section title="Delivery Model">
        <Info label="Methodology" value={project.delivery_model.methodology} />
        <Info
          label="Sprint Length"
          value={`${project.delivery_model.sprint_length_weeks} weeks`}
        />
        <Info
          label="Communication"
          value={project.delivery_model.communication_mode}
        />
      </Section>

      {/* Deployment Readiness */}
      <Section title="Deployment Readiness Criteria">
        <Info
          label="Minimum Skill Match"
          value={`${project.deployment_readiness_criteria.minimum_skill_match_percentage}%`}
        />
        <Info
          label="Simulation Threshold"
          value={String(project.deployment_readiness_criteria.simulation_score_threshold)}
        />
      </Section>

      {/* Status */}
      <Section title="Project Status">
        <div className="flex items-center gap-2">
          <Badge variant="default">{project.status.current_status}</Badge>
          <Badge variant="outline">{project.status.deployment_stage}</Badge>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Last updated: {project.status.last_updated}
        </p>
      </Section>
    </div>
  );
}

/* ---------- Helpers ---------- */

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-6 p-5 rounded-lg border-2 border-border bg-card">
      <h2 className="text-lg font-semibold mb-3 text-foreground">{title}</h2>
      {children}
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <p>
      <strong>{label}:</strong> {value}
    </p>
  );
}
