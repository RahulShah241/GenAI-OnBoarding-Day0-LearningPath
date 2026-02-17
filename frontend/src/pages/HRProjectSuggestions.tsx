import { useState, useMemo } from "react";
import { Search, Briefcase, ChevronDown, ChevronUp, ArrowLeft } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { PROJECTS } from "@/store/ProjectData";
import { EMPLOYEES } from "@/types/Employee";
import { useSuggestedEmployees, useProjects,useProjectsFull, useProjectById, useSuggestedEmployeesById } from "@/api/hooks";
import { useNavigate, useParams } from "react-router-dom";
import type { ProjectDescription } from "@/types/Project";
import type { Employee } from "@/types/Employee";

/* ===== Local match helper (fallback) ===== */
function matchEmployee(employee: Employee, project: ProjectDescription) {
  const required = project.required_skills.map((s) => s.skill_name.toLowerCase());
  const matched = required.filter((r) =>
    employee.skills.some((es) => es.toLowerCase().includes(r) || r.includes(es.toLowerCase()))
  );
  const percentage = required.length ? Math.round((matched.length / required.length) * 100) : 0;
  return { percentage, matchedSkills: matched, missingSkills: required.filter((s) => !matched.includes(s)) };
}

/* ===== Employee suggestion row ===== */
function EmployeeSuggestionRow({ employee, project }: { employee: Employee; project: ProjectDescription }) {
  const { percentage, matchedSkills, missingSkills } = matchEmployee(employee, project);

  return (
    <TableRow>
      <TableCell>
        <div>
          <p className="font-medium text-foreground">{employee.name}</p>
          <p className="text-xs text-muted-foreground">{employee.email}</p>
        </div>
      </TableCell>
      <TableCell><span className="text-sm">{employee.designation ?? "—"}</span></TableCell>
      <TableCell><span className="text-sm">{employee.experience} yrs</span></TableCell>
      <TableCell>
        <Badge variant={employee.status === "Bench" ? "default" : "secondary"}>{employee.status}</Badge>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2 min-w-[120px]">
          <Progress value={percentage} className="h-2 flex-1" />
          <span className="text-xs font-medium w-10 text-right">{percentage}%</span>
        </div>
      </TableCell>
      <TableCell>
        <div className="flex flex-wrap gap-1">
          {matchedSkills.map((s) => (
            <Badge key={s} className="bg-green-100 text-green-800 border border-green-300 text-xs">{s}</Badge>
          ))}
          {missingSkills.map((s) => (
            <Badge key={s} variant="outline" className="border-red-300 text-red-600 text-xs">{s}</Badge>
          ))}
        </div>
      </TableCell>
    </TableRow>
  );
}

/* ===== Project accordion card ===== */
function ProjectSuggestionCard({ project }: { project: ProjectDescription }) {
  const [expanded, setExpanded] = useState(false);

  const suggestions = useMemo(() => {
    return EMPLOYEES.filter((e) => e.role === "EMPLOYEE")
      .map((e) => ({ employee: e, match: matchEmployee(e, project).percentage }))
      .filter((e) => e.match > 0)
      .sort((a, b) => b.match - a.match);
  }, [project]);

  return (
    <Card className="border-2 border-border hover:shadow-lg transition-all duration-200">
      <CardHeader className="cursor-pointer select-none" onClick={() => setExpanded(!expanded)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 border-2 border-primary/20 flex items-center justify-center">
              <Briefcase className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">{project.project_name}</CardTitle>
              <p className="text-sm text-muted-foreground">{project.domain}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="border-2">{suggestions.length} Suggested</Badge>
            <Badge variant="secondary">{project.status.current_status}</Badge>
            {expanded ? <ChevronUp className="h-5 w-5 text-muted-foreground" /> : <ChevronDown className="h-5 w-5 text-muted-foreground" />}
          </div>
        </div>
        <div className="flex gap-6 mt-3 text-sm text-muted-foreground">
          <span><strong className="text-foreground">Roles:</strong> {project.required_roles.map((r) => r.role_name).join(", ")}</span>
          <span><strong className="text-foreground">Skills:</strong> {project.required_skills.map((s) => s.skill_name).join(", ")}</span>
          <span><strong className="text-foreground">Min Match:</strong> {project.deployment_readiness_criteria.minimum_skill_match_percentage}%</span>
        </div>
      </CardHeader>
      {expanded && (
        <CardContent>
          {suggestions.length > 0 ? (
            <div className="border-2 border-border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted">
                    <TableHead>Employee</TableHead>
                    <TableHead>Designation</TableHead>
                    <TableHead>Experience</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Match %</TableHead>
                    <TableHead>Skills</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {suggestions.map(({ employee }) => (
                    <EmployeeSuggestionRow key={employee.id} employee={employee} project={project} />
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">No matching employees found.</p>
          )}
        </CardContent>
      )}
    </Card>
  );
}

export default function HRProjectSuggestions() {
  const { projectId } = useParams();
  const navigate = useNavigate();

  const { data: project } = useProjectById(projectId!);
  const { data: suggestions, isLoading } = useSuggestedEmployeesById(projectId!);

  if (isLoading) {
    return <Skeleton className="h-40 m-8 rounded-xl" />;
  }

  if (!project) {
    return <div className="p-8 text-red-500">Project not found</div>;
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <Button variant="ghost" onClick={() => navigate(-1)}>
        ← Back
      </Button>

      <h1 className="text-2xl font-bold">
        Suggested Employees for {project.project_name}
      </h1>

      <div className="border-2 border-border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted">
              <TableHead>Employee</TableHead>
              <TableHead>Match %</TableHead>
              <TableHead>Matched Skills</TableHead>
              <TableHead>Missing Skills</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {suggestions?.map((emp: any) => (
              <TableRow key={emp.employee_id}>
                <TableCell>{emp.name}</TableCell>
                <TableCell>
                  <Progress value={emp.match_percentage} className="h-2" />
                  <span className="text-xs ml-2">
                    {emp.match_percentage}%
                  </span>
                </TableCell>
                <TableCell>
                  {emp.matched_skills.map((s: string) => (
                    <Badge key={s} className="mr-1">
                      {s}
                    </Badge>
                  ))}
                </TableCell>
                <TableCell>
                  {emp.missing_skills.map((s: string) => (
                    <Badge key={s} variant="outline" className="mr-1">
                      {s}
                    </Badge>
                  ))}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

