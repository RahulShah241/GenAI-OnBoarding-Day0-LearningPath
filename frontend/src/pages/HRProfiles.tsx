import { useState, useMemo } from "react";
import { ArrowLeft, Brain, Search, TrendingUp, ChevronDown, ChevronUp, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate } from "react-router-dom";
import { useAllProfiles, useProjectsFull } from "@/api/hooks";
import type { EmployeeProfile } from "@/api/api";
import type { ProjectDescription } from "@/types/Project";

// ── helpers ────────────────────────────────────────────────────────────────────
function computeProjectMatch(skills: string[], project: ProjectDescription) {
  const required = project.required_skills.map((s) => s.skill_name.toLowerCase());
  const matched = required.filter((r) =>
    skills.some((us) => us.toLowerCase().includes(r) || r.includes(us.toLowerCase()))
  );
  return required.length ? Math.round((matched.length / required.length) * 100) : 0;
}

function ReadinessBadge({ readiness }: { readiness: string }) {
  return (
    <Badge
      variant={
        readiness === "High" ? "default" : readiness === "Moderate" ? "secondary" : "outline"
      }
      className="text-xs"
    >
      {readiness}
    </Badge>
  );
}

// ── Profile Card ───────────────────────────────────────────────────────────────
function ProfileCard({
  profile,
  projects,
}: {
  profile: EmployeeProfile;
  projects: ProjectDescription[];
}) {
  const [expanded, setExpanded] = useState(false);

  const skills = profile.merged_skills ?? profile.extracted_skills ?? [];

  const topMatches = useMemo(
    () =>
      projects
        .map((p) => ({
          id: p.project_id,
          name: p.project_name,
          pct: computeProjectMatch(skills, p),
        }))
        .sort((a, b) => b.pct - a.pct)
        .slice(0, 3),
    [projects, skills]
  );

  const softEntries = Object.entries(profile.soft_skills ?? {}).filter(
    ([, v]) => v !== null && v !== undefined
  ) as [string, number][];

  return (
    <Card className="border-2 border-border hover:border-primary/30 transition-all">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="space-y-0.5">
            <CardTitle className="text-base">{profile.name ?? profile.email}</CardTitle>
            <p className="text-xs text-muted-foreground">{profile.email}</p>
            {profile.current_role_summary && (
              <p className="text-xs text-muted-foreground line-clamp-1">
                {profile.current_role_summary}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2 flex-wrap shrink-0">
            <ReadinessBadge readiness={profile.readiness} />
            <span className="text-sm font-bold text-primary">
              {profile.overall_score.toFixed(1)}<span className="text-xs font-normal text-muted-foreground">/5</span>
            </span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3 pt-0">
        {/* Score bar */}
        <Progress value={(profile.overall_score / 5) * 100} className="h-1.5" />

        {/* Skills */}
        {skills.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {skills.slice(0, 6).map((s) => (
              <Badge key={s} variant="secondary" className="text-xs py-0">
                {s}
              </Badge>
            ))}
            {skills.length > 6 && (
              <Badge variant="outline" className="text-xs py-0">
                +{skills.length - 6}
              </Badge>
            )}
          </div>
        )}

        {/* Top project matches */}
        {topMatches.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground">Top Project Matches</p>
            {topMatches.map((m) => (
              <div key={m.id} className="flex items-center gap-2 text-xs">
                <Progress value={m.pct} className="h-1.5 flex-1" />
                <span className="w-8 text-right font-medium">{m.pct}%</span>
                <span className="text-muted-foreground truncate max-w-[130px]">{m.name}</span>
              </div>
            ))}
          </div>
        )}

        {/* Expand / collapse */}
        <Button
          variant="ghost"
          size="sm"
          className="w-full text-xs h-7 gap-1"
          onClick={() => setExpanded((v) => !v)}
        >
          {expanded ? (
            <>
              <ChevronUp className="h-3.5 w-3.5" /> Show less
            </>
          ) : (
            <>
              <ChevronDown className="h-3.5 w-3.5" /> Show more
            </>
          )}
        </Button>

        {expanded && (
          <div className="space-y-3 border-t pt-3">
            {/* Soft skills */}
            {softEntries.length > 0 && (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2">Soft Skills</p>
                <div className="grid grid-cols-2 gap-2">
                  {softEntries.map(([key, val]) => (
                    <div key={key} className="space-y-0.5">
                      <div className="flex justify-between text-xs">
                        <span className="capitalize">{key.replace("_", " ")}</span>
                        <span className="font-medium">{val.toFixed(1)}</span>
                      </div>
                      <Progress value={(val / 5) * 100} className="h-1" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Desired role */}
            {profile.desired_role_summary && (
              <div>
                <p className="text-xs font-medium text-muted-foreground">Desired Role</p>
                <p className="text-xs mt-0.5">{profile.desired_role_summary}</p>
              </div>
            )}

            {/* Learning interests */}
            {profile.learning_interests?.length > 0 && (
              <div>
                <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" /> Learning Interests
                </p>
                <p className="text-xs mt-0.5">{profile.learning_interests[0]}</p>
              </div>
            )}

            {/* Workstyle */}
            {profile.workstyle?.preferred_work_style && (
              <div>
                <p className="text-xs font-medium text-muted-foreground">Work Style</p>
                <p className="text-xs mt-0.5 line-clamp-2">{profile.workstyle.preferred_work_style}</p>
              </div>
            )}

            {/* Completed topics */}
            {profile.completed_topics?.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {profile.completed_topics.map((t) => (
                  <Badge key={t} variant="outline" className="text-xs py-0 border-green-300 text-green-700">
                    {t}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function HRProfiles() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [readinessFilter, setReadinessFilter] = useState<string>("All");

  const { data: profiles = [], isLoading: profLoading } = useAllProfiles();
  const { data: projects = [], isLoading: projLoading } = useProjectsFull();

  const isLoading = profLoading || projLoading;

  const filtered = useMemo(() => {
    let result = profiles;
    if (readinessFilter !== "All") {
      result = result.filter((p) => p.readiness === readinessFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (p) =>
          p.name?.toLowerCase().includes(q) ||
          p.email.toLowerCase().includes(q) ||
          p.extracted_skills.some((s) => s.toLowerCase().includes(q)) ||
          p.merged_skills?.some((s) => s.toLowerCase().includes(q))
      );
    }
    return result;
  }, [profiles, search, readinessFilter]);

  const stats = useMemo(
    () => ({
      total: profiles.length,
      high: profiles.filter((p) => p.readiness === "High").length,
      moderate: profiles.filter((p) => p.readiness === "Moderate").length,
      needs: profiles.filter((p) => p.readiness === "Needs Development").length,
      avgScore: profiles.length
        ? (profiles.reduce((s, p) => s + p.overall_score, 0) / profiles.length).toFixed(1)
        : "—",
    }),
    [profiles]
  );

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/hr")} className="border border-border">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Brain className="h-6 w-6 text-primary" />
            Employee Profiles
          </h1>
          <p className="text-sm text-muted-foreground">AI-assessed profiles for project matching</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: "Total Profiles", value: stats.total },
          { label: "High Readiness", value: stats.high },
          { label: "Moderate", value: stats.moderate },
          { label: "Needs Development", value: stats.needs },
          { label: "Avg Score", value: stats.avgScore },
        ].map((s) => (
          <Card key={s.label} className="border-2 border-border">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-primary">{s.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Name, email, or skill…"
            className="pl-9"
          />
        </div>
        <div className="flex gap-2">
          {["All", "High", "Moderate", "Needs Development"].map((r) => (
            <Button
              key={r}
              variant={readinessFilter === r ? "default" : "outline"}
              size="sm"
              onClick={() => setReadinessFilter(r)}
              className="text-xs"
            >
              {r}
            </Button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-64 rounded-xl" />
          ))}
        </div>
      ) : filtered.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filtered.map((profile) => (
            <ProfileCard
              key={profile.employee_id}
              profile={profile}
              projects={projects}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 text-muted-foreground">
          <Users className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No profiles found</p>
          <p className="text-sm mt-1">
            {profiles.length === 0
              ? "Employees haven't completed their assessments yet."
              : "Try adjusting your search or filters."}
          </p>
        </div>
      )}
    </div>
  );
}
