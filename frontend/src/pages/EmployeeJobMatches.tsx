import { useState, useMemo } from "react";
import { Search, CheckCircle2, XCircle, Star, ArrowLeft } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useProjectsFull } from "@/api/hooks";
import { Data } from "@/store/Data";
import { useNavigate } from "react-router-dom";
import type { ProjectDescription } from "@/types/Project";

function computeMatch(skills: string[], project: ProjectDescription) {
  const required = project.required_skills.map((s) => s.skill_name.toLowerCase());
  const matched = required.filter((r) =>
    skills.some((us) => us.toLowerCase().includes(r) || r.includes(us.toLowerCase()))
  );
  return {
    percentage: required.length ? Math.round((matched.length / required.length) * 100) : 0,
    matched,
    unmatched: required.filter((r) => !matched.includes(r)),
  };
}

function MatchCard({ project, skills }: { project: ProjectDescription; skills: string[] }) {
  const { percentage, matched, unmatched } = computeMatch(skills, project);
  return (
    <Card className="border-2 border-border hover:border-primary/40 hover:shadow-md transition-all">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <CardTitle className="text-base">{project.project_name}</CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">{project.domain} · {project.business_unit}</p>
          </div>
          <Badge variant={percentage >= 75 ? "default" : percentage >= 50 ? "secondary" : "outline"} className="shrink-0">
            {percentage}%
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 pt-0">
        <Progress value={percentage} className="h-1.5" />
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div><span className="text-muted-foreground">Engagement: </span>{project.project_duration.engagement_type}</div>
          <div><span className="text-muted-foreground">Status: </span><Badge variant="secondary" className="text-xs">{project.status.current_status}</Badge></div>
          <div className="col-span-2"><span className="text-muted-foreground">Roles: </span>
            {project.required_roles.map((r) => r.role_name).join(", ")}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-xs font-medium flex items-center gap-1 mb-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-green-600" />Matched</p>
            <div className="flex flex-wrap gap-1">
              {matched.length ? matched.map((s) => (
                <Badge key={s} className="bg-green-100 text-green-800 border border-green-300 text-xs py-0">{s}</Badge>
              )) : <span className="text-xs text-muted-foreground">None</span>}
            </div>
          </div>
          <div>
            <p className="text-xs font-medium flex items-center gap-1 mb-1.5"><XCircle className="h-3.5 w-3.5 text-red-500" />Missing</p>
            <div className="flex flex-wrap gap-1">
              {unmatched.length ? unmatched.map((s) => (
                <Badge key={s} variant="outline" className="border-red-300 text-red-600 text-xs py-0">{s}</Badge>
              )) : <span className="text-xs text-green-600 font-medium">All matched!</span>}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function EmployeeJobMatches() {
  const navigate = useNavigate();
  // Skills come directly from the JWT login response stored in Zustand
  const userSkills = Data((state) => state.user?.skills ?? []);
  const [search, setSearch] = useState("");
  const { data: projects = [], isLoading } = useProjectsFull();

  const recommended = useMemo(() =>
    [...projects]
      .map((p) => ({ p, pct: computeMatch(userSkills, p).percentage }))
      .sort((a, b) => b.pct - a.pct),
    [projects, userSkills]
  );

  const filtered = useMemo(() => {
    if (!search.trim()) return [];
    const q = search.toLowerCase();
    return projects.filter((p) =>
      p.project_name?.toLowerCase().includes(q) ||
      p.domain?.toLowerCase().includes(q) ||
      p.required_skills?.some((s) => s.skill_name.toLowerCase().includes(q)) ||
      p.required_roles?.some((r) => r.role_name.toLowerCase().includes(q))
    );
  }, [search, projects]);

  return (
    <div className="flex flex-col h-full bg-muted">
      <header className="px-8 py-5 bg-card border-b-2 border-border">
        <div className="max-w-6xl mx-auto flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/employee")} className="border border-border">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-xl font-bold">Job Matches</h1>
            <p className="text-sm text-muted-foreground">
              {userSkills.length
                ? `Based on your skills: ${userSkills.slice(0, 4).join(", ")}${userSkills.length > 4 ? "…" : ""}`
                : "Complete the chatbot assessment to see personalised matches"}
            </p>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-auto p-8">
        <div className="max-w-6xl mx-auto space-y-10">

          {/* Recommended */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Star className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold">Recommended for You</h2>
              {!isLoading && <span className="text-sm text-muted-foreground">({recommended.length} projects)</span>}
            </div>
            {isLoading ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {[1, 2].map((i) => <Skeleton key={i} className="h-52 rounded-xl" />)}
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {recommended.map(({ p }) => <MatchCard key={p.project_id} project={p} skills={userSkills} />)}
              </div>
            )}
          </section>

          {/* Search */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Search className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold">Search All Projects</h2>
            </div>
            <div className="relative max-w-sm mb-5">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Project, domain, skill or role…" className="pl-9" />
            </div>
            {search.trim() ? (
              filtered.length ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                  {filtered.map((p) => <MatchCard key={p.project_id} project={p} skills={userSkills} />)}
                </div>
              ) : (
                <p className="text-muted-foreground py-6 text-center">No projects matching "{search}"</p>
              )
            ) : (
              <p className="text-sm text-muted-foreground">Start typing to search all available projects.</p>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
