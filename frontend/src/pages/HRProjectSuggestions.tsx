import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useProjectById, useSuggestedEmployeesById, type SuggestedEmployee } from "@/api/hooks";
import { useNavigate, useParams } from "react-router-dom";

export default function HRProjectSuggestions() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");

  const { data: project, isLoading: projLoading } = useProjectById(projectId!);
  const { data: suggestions = [], isLoading: sugLoading } = useSuggestedEmployeesById(projectId!);

  const filtered = (suggestions as SuggestedEmployee[]).filter((e) =>
    !search ||
    e.name.toLowerCase().includes(search.toLowerCase()) ||
    e.email.toLowerCase().includes(search.toLowerCase()) ||
    e.matched_skills.some((s) => s.toLowerCase().includes(search.toLowerCase()))
  );

  if (projLoading || sugLoading) return (
    <div className="p-8 space-y-4 max-w-6xl mx-auto">
      <Skeleton className="h-24 rounded-xl" />
      <Skeleton className="h-12 rounded-xl" />
      <Skeleton className="h-64 rounded-xl" />
    </div>
  );

  if (!project) return <div className="p-8 text-destructive">Project not found</div>;

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">

      <Button variant="ghost" className="gap-2 -ml-2" onClick={() => navigate(-1)}>
        <ArrowLeft className="h-4 w-4" /> Back to Project
      </Button>

      {/* Project summary */}
      <Card className="border-2 border-border">
        <CardHeader>
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div className="space-y-1">
              <CardTitle className="text-2xl">{project.project_name}</CardTitle>
              <p className="text-muted-foreground text-sm">{project.domain} · {project.business_unit} · {project.project_type}</p>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {project.required_skills.map((s) => (
                  <Badge key={s.skill_name} variant={s.mandatory ? "default" : "secondary"} className="text-xs">
                    {s.skill_name} {s.mandatory ? "●" : "○"}
                  </Badge>
                ))}
              </div>
            </div>
            <div className="text-right space-y-1 text-sm">
              <p className="text-muted-foreground">Min skill match</p>
              <p className="text-2xl font-bold text-primary">
                {project.deployment_readiness_criteria.minimum_skill_match_percentage}%
              </p>
              <Badge>{project.status.current_status}</Badge>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Suggestions */}
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-xl font-semibold">
            Suggested Employees
            <span className="ml-2 text-base font-normal text-muted-foreground">
              ({filtered.length} of {suggestions.length})
            </span>
          </h2>
          <Input
            className="max-w-xs"
            placeholder="Filter by name or skill…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <Card className="border-2 border-border overflow-hidden">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted">
                  <TableHead>Employee</TableHead>
                  <TableHead>Designation</TableHead>
                  <TableHead>Exp.</TableHead>
                  <TableHead>Availability</TableHead>
                  <TableHead className="w-44">Match</TableHead>
                  <TableHead>Matched Skills</TableHead>
                  <TableHead>Missing Skills</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((emp) => (
                  <TableRow key={emp.employee_id}>
                    <TableCell>
                      <p className="font-medium">{emp.name}</p>
                      <p className="text-xs text-muted-foreground">{emp.email}</p>
                    </TableCell>
                    <TableCell className="text-sm">{emp.designation ?? "—"}</TableCell>
                    <TableCell className="text-sm">{emp.experience} yrs</TableCell>
                    <TableCell>
                      <Badge variant={emp.status === "Bench" ? "default" : "secondary"}>{emp.status}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Progress value={emp.match_percentage} className="h-2 flex-1" />
                        <span className="text-xs font-semibold w-9 text-right">{emp.match_percentage}%</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {emp.matched_skills.map((s) => (
                          <Badge key={s} className="bg-green-100 text-green-800 border border-green-300 text-xs py-0">{s}</Badge>
                        ))}
                        {emp.matched_skills.length === 0 && <span className="text-xs text-muted-foreground">—</span>}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {emp.missing_skills.map((s) => (
                          <Badge key={s} variant="outline" className="border-red-300 text-red-600 text-xs py-0">{s}</Badge>
                        ))}
                        {emp.missing_skills.length === 0 && <span className="text-xs text-green-600 font-medium">All matched</span>}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-10">
                      No matching employees found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
