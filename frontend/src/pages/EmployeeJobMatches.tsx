import { useState, useMemo } from "react";
import {
  Search,
  CheckCircle2,
  XCircle,
  Star,
  MessageSquare,
  Brain,
  TrendingUp,
  AlertCircle,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useProjectsFull, useEmployeeProfile } from "@/api/hooks";
import { Data } from "@/store/Data";
import { useNavigate } from "react-router-dom";
import type { ProjectDescription } from "@/types/Project";
import type { EmployeeProfile } from "@/api/api";

// ── Matching logic ────────────────────────────────────────────────────────────
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

// ── Match Card ────────────────────────────────────────────────────────────────
function MatchCard({
  project,
  skills,
}: {
  project: ProjectDescription;
  skills: string[];
}) {
  const { percentage, matched, unmatched } = computeMatch(skills, project);
  return (
    <Card className="border-2 border-border hover:border-primary/40 hover:shadow-md transition-all">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <CardTitle className="text-base">{project.project_name}</CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              {project.domain} · {project.business_unit}
            </p>
          </div>
          <Badge
            variant={
              percentage >= 75 ? "default" : percentage >= 50 ? "secondary" : "outline"
            }
            className="shrink-0"
          >
            {percentage}%
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 pt-0">
        <Progress value={percentage} className="h-1.5" />
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div>
            <span className="text-muted-foreground">Engagement: </span>
            {project.project_duration.engagement_type}
          </div>
          <div>
            <span className="text-muted-foreground">Status: </span>
            <Badge variant="secondary" className="text-xs">
              {project.status.current_status}
            </Badge>
          </div>
          <div className="col-span-2">
            <span className="text-muted-foreground">Roles: </span>
            {project.required_roles.map((r) => r.role_name).join(", ")}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-xs font-medium flex items-center gap-1 mb-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
              Matched
            </p>
            <div className="flex flex-wrap gap-1">
              {matched.length ? (
                matched.map((s) => (
                  <Badge
                    key={s}
                    className="bg-green-100 text-green-800 border border-green-300 text-xs py-0"
                  >
                    {s}
                  </Badge>
                ))
              ) : (
                <span className="text-xs text-muted-foreground">None</span>
              )}
            </div>
          </div>
          <div>
            <p className="text-xs font-medium flex items-center gap-1 mb-1.5">
              <XCircle className="h-3.5 w-3.5 text-red-500" />
              Missing
            </p>
            <div className="flex flex-wrap gap-1">
              {unmatched.length ? (
                unmatched.map((s) => (
                  <Badge
                    key={s}
                    variant="outline"
                    className="border-red-300 text-red-600 text-xs py-0"
                  >
                    {s}
                  </Badge>
                ))
              ) : (
                <span className="text-xs text-green-600 font-medium">All matched!</span>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Profile Summary Panel ─────────────────────────────────────────────────────
function ProfilePanel({ profile }: { profile: EmployeeProfile }) {
  const softEntries = Object.entries(profile.soft_skills).filter(
    ([, v]) => v !== null && v !== undefined
  );

  return (
    <Card className="border-2 border-primary/30 bg-primary/5">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-primary" />
          <CardTitle className="text-base">Your Profile</CardTitle>
          <Badge
            variant={
              profile.readiness === "High"
                ? "default"
                : profile.readiness === "Moderate"
                ? "secondary"
                : "outline"
            }
            className="ml-auto"
          >
            {profile.readiness} Readiness
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 pt-0">
        {/* Score */}
        <div className="flex items-center gap-3">
          <div className="text-2xl font-bold text-primary">
            {profile.overall_score.toFixed(1)}
            <span className="text-sm font-normal text-muted-foreground"> / 5</span>
          </div>
          <Progress value={(profile.overall_score / 5) * 100} className="h-2 flex-1" />
        </div>

        {/* Role */}
        {profile.current_role_summary && (
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1">Current Role</p>
            <p className="text-sm line-clamp-2">{profile.current_role_summary}</p>
          </div>
        )}

        {/* Skills */}
        {profile.merged_skills?.length > 0 && (
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1.5">
              Skills ({profile.merged_skills.length})
            </p>
            <div className="flex flex-wrap gap-1">
              {profile.merged_skills.slice(0, 10).map((s) => (
                <Badge key={s} variant="secondary" className="text-xs py-0">
                  {s}
                </Badge>
              ))}
              {profile.merged_skills.length > 10 && (
                <Badge variant="outline" className="text-xs py-0">
                  +{profile.merged_skills.length - 10} more
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Soft skills */}
        {softEntries.length > 0 && (
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">Soft Skills</p>
            <div className="grid grid-cols-2 gap-2">
              {softEntries.map(([key, val]) => (
                <div key={key} className="space-y-0.5">
                  <div className="flex justify-between text-xs">
                    <span className="capitalize">{key.replace("_", " ")}</span>
                    <span className="font-medium">{(val as number).toFixed(1)}</span>
                  </div>
                  <Progress value={((val as number) / 5) * 100} className="h-1" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Learning interests */}
        {profile.learning_interests.length > 0 && (
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1">
              <TrendingUp className="h-3.5 w-3.5 inline mr-1" />
              Learning Interests
            </p>
            <p className="text-xs text-muted-foreground line-clamp-2">
              {profile.learning_interests[0]}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function EmployeeJobMatches() {
  const navigate = useNavigate();
  const user = Data((state) => state.user);
  const [search, setSearch] = useState("");

  // Try to load the rich profile; fall back to login skills
  const { data: profile, isLoading: profileLoading } = useEmployeeProfile(
    user?.employee_id
  );
  const { data: projects = [], isLoading: projectsLoading } = useProjectsFull();

  // Use merged_skills from profile if available, else fallback to user.skills
  const effectiveSkills: string[] = profile?.merged_skills?.length
    ? profile.merged_skills
    : user?.skills ?? [];

  const recommended = useMemo(
    () =>
      [...projects]
        .map((p) => ({ p, pct: computeMatch(effectiveSkills, p).percentage }))
        .sort((a, b) => b.pct - a.pct),
    [projects, effectiveSkills]
  );

  const filtered = useMemo(() => {
    if (!search.trim()) return [];
    const q = search.toLowerCase();
    return projects.filter(
      (p) =>
        p.project_name?.toLowerCase().includes(q) ||
        p.domain?.toLowerCase().includes(q) ||
        p.required_skills?.some((s) => s.skill_name.toLowerCase().includes(q)) ||
        p.required_roles?.some((r) => r.role_name.toLowerCase().includes(q))
    );
  }, [search, projects]);

  const isLoading = profileLoading || projectsLoading;

  return (
    <div className="flex flex-col h-full bg-muted">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header className="px-8 py-5 bg-card border-b-2 border-border">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold">Project Matches</h1>
            <p className="text-sm text-muted-foreground">
              {effectiveSkills.length
                ? `Based on ${effectiveSkills.length} skills: ${effectiveSkills
                    .slice(0, 4)
                    .join(", ")}${effectiveSkills.length > 4 ? "…" : ""}`
                : "Complete the assessment to see personalised matches"}
            </p>
          </div>
          <Button
            variant="outline"
            className="gap-2 shrink-0"
            onClick={() => navigate("/employee")}
          >
            <MessageSquare className="h-4 w-4" />
            Chat Again
          </Button>
        </div>
      </header>

      <main className="flex-1 overflow-auto p-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 xl:grid-cols-[320px_1fr] gap-8">

            {/* ── Left: Profile Panel ───────────────────────────────────────── */}
            <aside className="space-y-4">
              {profileLoading ? (
                <Skeleton className="h-64 rounded-xl" />
              ) : profile ? (
                <ProfilePanel profile={profile} />
              ) : (
                <Card className="border-2 border-dashed border-border">
                  <CardContent className="py-8 text-center text-sm text-muted-foreground space-y-2">
                    <AlertCircle className="h-8 w-8 mx-auto text-muted-foreground/50" />
                    <p>No profile found.</p>
                    <p className="text-xs">
                      Complete the AI assessment to generate your profile.
                    </p>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => navigate("/employee")}
                      className="mt-2"
                    >
                      Start Assessment
                    </Button>
                  </CardContent>
                </Card>
              )}
            </aside>

            {/* ── Right: Projects ───────────────────────────────────────────── */}
            <div className="space-y-10">
              {/* Recommended */}
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <Star className="h-5 w-5 text-primary" />
                  <h2 className="text-lg font-semibold">Recommended for You</h2>
                  {!isLoading && (
                    <span className="text-sm text-muted-foreground">
                      ({recommended.length} projects)
                    </span>
                  )}
                </div>
                {isLoading ? (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                    {[1, 2].map((i) => (
                      <Skeleton key={i} className="h-52 rounded-xl" />
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                    {recommended.map(({ p }) => (
                      <MatchCard key={p.project_id} project={p} skills={effectiveSkills} />
                    ))}
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
                  <Input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Project, domain, skill or role…"
                    className="pl-9"
                  />
                </div>
                {search.trim() ? (
                  filtered.length ? (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                      {filtered.map((p) => (
                        <MatchCard key={p.project_id} project={p} skills={effectiveSkills} />
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground py-6 text-center">
                      No projects matching "{search}"
                    </p>
                  )
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Start typing to search all available projects.
                  </p>
                )}
              </section>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
