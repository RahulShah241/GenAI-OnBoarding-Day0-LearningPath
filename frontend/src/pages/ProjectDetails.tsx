import {
  Box,
  Card,
  CardContent,
  Chip,
  Divider,
  Grid,
  Stack,
  Typography,
} from "@mui/material";
import { bankGenAIProject } from "../store/ProjectData";

export default function ProjectDetails() {
  const project = bankGenAIProject;

  return (
    <Box p={4}>
      {/* Header */}
      <Typography variant="h4" fontWeight="bold">
        {project.project_name}
      </Typography>
      <Typography color="text.secondary" mb={2}>
        {project.domain} · {project.business_unit} · {project.project_type}
      </Typography>

      <Divider sx={{ mb: 3 }} />

      {/* Overview */}
      <Section title="Project Overview">
        <Typography><b>Objective:</b> {project.project_overview.objective}</Typography>
        <Typography mt={1}><b>Problem:</b> {project.project_overview.problem_statement}</Typography>

        <Typography mt={2} fontWeight="medium">Expected Outcomes</Typography>
        <ul>
          {project.project_overview.expected_outcomes.map((o) => (
            <li key={o}>{o}</li>
          ))}
        </ul>
      </Section>

      {/* Duration */}
      <Section title="Engagement Details">
        <Info label="Start Date" value={project.project_duration.start_date} />
        <Info label="Expected End Date" value={project.project_duration.expected_end_date} />
        <Info label="Engagement Type" value={project.project_duration.engagement_type} />
      </Section>

      {/* Roles */}
      <Section title="Required Roles">
        <Grid container spacing={2}>
          {project.required_roles.map((role) => (
            <Grid item xs={12} md={4} key={role.role_name}>
              <Card variant="outlined">
                <CardContent>
                  <Typography fontWeight="bold">{role.role_name}</Typography>
                  <Typography variant="body2">
                    Level: {role.role_level}
                  </Typography>
                  <Typography variant="body2">
                    Headcount: {role.headcount}
                  </Typography>
                  <Chip
                    label={`Priority: ${role.deployment_priority}`}
                    color="error"
                    size="small"
                    sx={{ mt: 1 }}
                  />
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Section>

      {/* Skills */}
      <Section title="Required Skills">
        <Stack direction="row" spacing={1} flexWrap="wrap">
          {project.required_skills.map((skill) => (
            <Chip
              key={skill.skill_name}
              label={`${skill.skill_name} (${skill.required_level})`}
              color={skill.mandatory ? "primary" : "default"}
            />
          ))}
        </Stack>
      </Section>

      {/* Responsibilities */}
      <Section title="Responsibilities">
        <ul>
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
          value={project.deployment_readiness_criteria.simulation_score_threshold}
        />
      </Section>

      {/* Status */}
      <Section title="Project Status">
        <Chip label={project.status.current_status} color="success" />
        <Chip
          label={project.status.deployment_stage}
          variant="outlined"
          sx={{ ml: 1 }}
        />
        <Typography variant="caption" display="block" mt={1}>
          Last updated: {project.status.last_updated}
        </Typography>
      </Section>
    </Box>
  );
}

/* ---------- Helpers ---------- */

function Section({ title, children }) {
  return (
    <Box mb={4}>
      <Typography variant="h6" mb={1}>
        {title}
      </Typography>
      {children}
    </Box>
  );
}

function Info({ label, value }) {
  return (
    <Typography>
      <b>{label}:</b> {value}
    </Typography>
  );
}
