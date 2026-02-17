import { useState, useMemo } from "react";
import { Search, Briefcase, CheckCircle2, XCircle, Star, ArrowLeft } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useProjects } from "@/api/hooks";
import { PROJECTS } from "@/store/ProjectData";
import { EMPLOYEES } from "@/types/Employee";
import { Data } from "@/store/Data";
import { useNavigate } from "react-router-dom";
import type { ProjectDescription } from "@/types/Project";

/* ===== Skill matching helper ===== */
function computeMatch(userSkills: string[], project: ProjectDescription) {
  const required = project.required_skills.map((s) => s.skill_name.toLowerCase());
  const matched = required.filter((s) =>
    userSkills.some((us) => us.toLowerCase().includes(s) || s.includes(us.toLowerCase()))
  );
  const percentage = required.length ? Math.round((matched.length / required.length) * 100) : 0;
  return { percentage, matched, unmatched: required.filter((s) => !matched.includes(s)) };
}

/* ===== Project match card ===== */
function MatchCard({ project, userSkills }: { project: ProjectDescription; userSkills: string[] }) {
  const { percentage, matched, unmatched } = computeMatch(userSkills, project);

  return (
    <Card className="border-2 border-border hover:border-primary/40 hover:shadow-lg transition-all duration-200">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg">{project.project_name}</CardTitle>
            <p className="text-sm text-muted-foreground">{project.domain}</p>
          </div>
          <Badge variant={percentage >= 75 ? "default" : percentage >= 50 ? "secondary" : "outline"} className="text-xs">
            {percentage}% Match
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Progress value={percentage} className="h-2" />
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="font-medium text-foreground mb-1">Business Unit</p>
            <p className="text-muted-foreground">{project.business_unit}</p>
          </div>
          <div>
            <p className="font-medium text-foreground mb-1">Engagement</p>
            <p className="text-muted-foreground">{project.project_duration.engagement_type}</p>
          </div>
          <div>
            <p className="font-medium text-foreground mb-1">Duration</p>
            <p className="text-muted-foreground">{project.project_duration.start_date} → {project.project_duration.expected_end_date}</p>
          </div>
          <div>
            <p className="font-medium text-foreground mb-1">Status</p>
            <Badge variant="secondary">{project.status.current_status}</Badge>
          </div>
        </div>
        <div>
          <p className="text-sm font-medium text-foreground mb-2">Open Roles</p>
          <div className="flex flex-wrap gap-2">
            {project.required_roles.map((r) => (
              <Badge key={r.role_name} variant="outline" className="border-2">
                {r.role_name} · {r.role_level} ({r.headcount})
              </Badge>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-sm font-medium text-foreground mb-2 flex items-center gap-1">
              <CheckCircle2 className="h-4 w-4 text-green-600" /> Matched Skills
            </p>
            <div className="flex flex-wrap gap-1.5">
              {matched.length ? matched.map((s) => (
                <Badge key={s} className="bg-green-100 text-green-800 border border-green-300 text-xs">{s}</Badge>
              )) : <span className="text-xs text-muted-foreground">None</span>}
            </div>
          </div>
          <div>
            <p className="text-sm font-medium text-foreground mb-2 flex items-center gap-1">
              <XCircle className="h-4 w-4 text-red-500" /> Missing Skills
            </p>
            <div className="flex flex-wrap gap-1.5">
              {unmatched.length ? unmatched.map((s) => (
                <Badge key={s} variant="outline" className="border-red-300 text-red-600 text-xs">{s}</Badge>
              )) : <span className="text-xs text-muted-foreground">All matched!</span>}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/* ===== Main Page ===== */
export default function EmployeeJobMatches() {
  const navigate = useNavigate();
  const user = Data((state) => state.user);
  const [search, setSearch] = useState("");
  const { data: apiProjects, isLoading } = useProjects();

  const projects = apiProjects ?? PROJECTS;

  const currentEmployee = EMPLOYEES.find((e) => e.email === user?.email);
  const userSkills = currentEmployee?.skills ?? ["React", "Node.js"];

  const recommended = useMemo(() => {
    return [...projects]
      .map((p) => ({ project: p, match: computeMatch(userSkills, p).percentage }))
      .sort((a, b) => b.match - a.match);
  }, [userSkills, projects]);

  const filtered = useMemo(() => {
    if (!search.trim()) return [];
    const q = search.toLowerCase();
    return projects.filter(
      (p) =>
        p.project_name.toLowerCase().includes(q) ||
        p.domain.toLowerCase().includes(q) ||
        p.required_skills.some((s) => s.skill_name.toLowerCase().includes(q)) ||
        p.required_roles.some((r) => r.role_name.toLowerCase().includes(q))
    );
  }, [search, projects]);

  return (
    <div className="flex flex-col h-full bg-muted">
      <header className="px-8 py-6 bg-card border-b-2 border-border shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/employee")} className="border-2 border-border">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Job Profile Matches</h1>
            <p className="text-muted-foreground text-sm mt-1">Projects aligned with your skills: {userSkills.join(", ")}</p>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-auto p-8">
        <div className="max-w-7xl mx-auto space-y-10">
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Star className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-semibold text-foreground">Recommended for You</h2>
            </div>
            {isLoading ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {[1, 2].map((i) => <Skeleton key={i} className="h-48 rounded-xl" />)}
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {recommended.map(({ project }) => (
                  <MatchCard key={project.project_id} project={project} userSkills={userSkills} />
                ))}
              </div>
            )}
          </section>

          <section>
            <div className="flex items-center gap-2 mb-4">
              <Search className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-semibold text-foreground">Search Projects & Roles</h2>
            </div>
            <div className="relative max-w-md mb-6">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by project name, domain, skill, or role..." className="pl-10 border-2" />
            </div>
            {search.trim() && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {filtered.length ? filtered.map((p) => (
                  <MatchCard key={p.project_id} project={p} userSkills={userSkills} />
                )) : (
                  <p className="text-muted-foreground col-span-2 text-center py-8">No projects found matching "{search}"</p>
                )}
              </div>
            )}
            {!search.trim() && <p className="text-sm text-muted-foreground">Start typing to search across all available projects.</p>}
          </section>
        </div>
      </main>
    </div>
  );
}
