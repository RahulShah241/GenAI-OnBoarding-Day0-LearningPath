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
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Sparkles,
  GraduationCap,
  Layers,
  Filter,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useProjectsFull, useEmployeeProfile } from "@/api/hooks";
import RecommendedCoursesBlock from "@/components/RecommendedCoursesBlock";
import LearningPathBlock from "@/components/LearningPathBlock";
import { Data } from "@/store/Data";
import { useNavigate } from "react-router-dom";
import type { ProjectDescription } from "@/types/Project";
import type { EmployeeProfile } from "@/api/api";

// ── Matching logic ────────────────────────────────────────────────────────────
function computeMatch(skills: string[], project: ProjectDescription) {
  const required = (project.required_skills || []).map((s) => s.skill_name.toLowerCase());
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
  isTopMatch = false,
}: {
  project: ProjectDescription;
  skills: string[];
  isTopMatch?: boolean;
}) {
  const navigate = useNavigate();
  const { percentage, matched, unmatched } = computeMatch(skills, project);
  const [showLearningPath, setShowLearningPath] = useState(false);

  const isHighMatch = percentage >= 80;
  const isMedMatch = percentage >= 50;

  return (
    <Card
      className={`rounded-xl border transition-all duration-200 bg-card hover:shadow-md flex flex-col justify-between ${
        isHighMatch
          ? "border-emerald-500/30 hover:border-emerald-500/50"
          : "border-border hover:border-primary/40"
      }`}
    >
      <div>
        {/* Header */}
        <CardHeader className="pb-3.5">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <CardTitle className="text-base font-bold text-foreground">
                  {project.project_name}
                </CardTitle>
                {isTopMatch && (
                  <Badge className="bg-primary/10 text-primary border-primary/20 text-[10px] font-semibold gap-1">
                    <Star className="w-3 h-3 fill-primary text-primary" />
                    Top Match
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground font-medium">
                {project.domain} · {project.business_unit}
              </p>
            </div>

            {/* Match Score Badge */}
            <div
              className={`px-2.5 py-1 rounded-full text-xs font-bold border flex items-center gap-1 shrink-0 ${
                isHighMatch
                  ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30"
                  : isMedMatch
                  ? "bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/30"
                  : "bg-muted text-muted-foreground border-border"
              }`}
            >
              <Sparkles className="w-3 h-3" />
              <span>{percentage}% Match</span>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4 pt-0">
          {/* Progress Bar */}
          <div className="space-y-1">
            <Progress value={percentage} className="h-1.5" />
          </div>

          {/* Project Details Row */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs p-3 rounded-lg bg-muted/40 border border-border/40">
            <div>
              <span className="text-muted-foreground block text-[11px]">Engagement</span>
              <span className="font-semibold text-foreground capitalize">
                {project.project_duration?.engagement_type || "Full-Time"}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground block text-[11px]">Status</span>
              <Badge variant="outline" className="text-[10px] font-semibold py-0 capitalize bg-background">
                {project.status?.current_status || "Open"}
              </Badge>
            </div>
            <div className="col-span-2 sm:col-span-1">
              <span className="text-muted-foreground block text-[11px]">Roles</span>
              <span className="font-medium text-foreground truncate block">
                {project.required_roles?.map((r) => r.role_name).join(", ") || "Engineering"}
              </span>
            </div>
          </div>

          {/* Skills Breakdown */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            {/* Matched */}
            <div className="space-y-1.5">
              <p className="text-xs font-semibold flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400">
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>Matched ({matched.length})</span>
              </p>
              <div className="flex flex-wrap gap-1">
                {matched.length ? (
                  matched.map((s) => (
                    <Badge
                      key={s}
                      className="bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900 text-xs py-0.5 px-2 font-medium"
                    >
                      ✓ {s}
                    </Badge>
                  ))
                ) : (
                  <span className="text-xs text-muted-foreground italic">None directly matched</span>
                )}
              </div>
            </div>

            {/* Missing */}
            <div className="space-y-1.5">
              <p className="text-xs font-semibold flex items-center gap-1.5 text-rose-600 dark:text-rose-400">
                <XCircle className="h-3.5 w-3.5" />
                <span>Skill Gap ({unmatched.length})</span>
              </p>
              <div className="flex flex-wrap gap-1">
                {unmatched.length ? (
                  unmatched.map((s) => (
                    <Badge
                      key={s}
                      variant="outline"
                      className="bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900 text-xs py-0.5 px-2 font-medium"
                    >
                      ! {s}
                    </Badge>
                  ))
                ) : (
                  <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                    🎉 100% Match! Ready
                  </span>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </div>

      {/* Footer & Action Bar */}
      <CardContent className="pt-2 border-t border-border/40 mt-auto">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <Button
            size="sm"
            variant={showLearningPath ? "secondary" : "outline"}
            onClick={() => setShowLearningPath(!showLearningPath)}
            className="h-8 text-xs font-semibold gap-1.5"
          >
            <GraduationCap className="w-3.5 h-3.5 text-primary" />
            <span>{showLearningPath ? "Hide AI Roadmap" : "Preview AI Roadmap"}</span>
            {showLearningPath ? (
              <ChevronUp className="w-3.5 h-3.5 ml-0.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5 ml-0.5" />
            )}
          </Button>

          <Button
            size="sm"
            className="h-8 text-xs font-semibold gap-1.5 ml-auto"
            onClick={() => navigate(`/employee/job-matches/${project.project_id}`)}
          >
            <span>View Full AI Guide</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Button>
        </div>

        {/* Expandable Learning Path Section */}
        {showLearningPath && (
          <div className="pt-3 mt-3 border-t border-border/40 animate-in fade-in-50 duration-200">
            {unmatched.length > 0 && (
              <RecommendedCoursesBlock projectId={project.project_id} missingSkills={unmatched} />
            )}
            <LearningPathBlock projectId={project.project_id} defaultExpanded={true} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── Profile Summary Panel ─────────────────────────────────────────────────────
function ProfilePanel({ profile }: { profile: EmployeeProfile }) {
  const [showAllSkills, setShowAllSkills] = useState(false);
  const [showFullRole, setShowFullRole] = useState(false);

  const softEntries = Object.entries(profile.soft_skills).filter(
    ([, v]) => v !== null && v !== undefined
  );

  const skillsList = profile.merged_skills || [];
  const displayedSkills = showAllSkills ? skillsList : skillsList.slice(0, 8);

  const readinessVariant =
    profile.readiness === "High"
      ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300"
      : profile.readiness === "Moderate"
      ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300"
      : "bg-muted text-muted-foreground";

  return (
    <Card className="border border-border/80 bg-card shadow-sm rounded-xl overflow-hidden">
      {/* Header with Avatar & Readiness */}
      <CardHeader className="pb-3 border-b border-border/40 bg-gradient-to-br from-primary/5 via-transparent to-transparent">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-primary text-primary-foreground font-bold flex items-center justify-center text-sm shadow-sm">
              {profile.name ? profile.name.slice(0, 2).toUpperCase() : "EP"}
            </div>
            <div>
              <CardTitle className="text-sm font-bold">{profile.name || "Employee Profile"}</CardTitle>
              <p className="text-[11px] text-muted-foreground">{profile.email || "Onboarding Candidate"}</p>
            </div>
          </div>
          <Badge variant="outline" className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${readinessVariant}`}>
            {profile.readiness} Readiness
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 pt-4">
        {/* Overall Readiness Score Display */}
        <div className="p-3.5 rounded-xl bg-muted/40 border border-border/50 flex items-center justify-between gap-3">
          <div className="space-y-0.5">
            <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Overall Score</span>
            <div className="text-2xl font-black text-foreground flex items-baseline gap-1">
              {profile.overall_score.toFixed(1)}
              <span className="text-xs font-normal text-muted-foreground">/ 5.0</span>
            </div>
          </div>
          <div className="w-32 space-y-1">
            <div className="flex justify-between text-[10px] text-muted-foreground font-semibold">
              <span>Fit Rating</span>
              <span>{Math.round((profile.overall_score / 5) * 100)}%</span>
            </div>
            <Progress value={(profile.overall_score / 5) * 100} className="h-2" />
          </div>
        </div>

        {/* Current Role Summary */}
        {profile.current_role_summary && (
          <div className="space-y-1">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
              Current Role
            </span>
            <p className={`text-xs text-foreground/90 leading-relaxed ${showFullRole ? "" : "line-clamp-3"}`}>
              {profile.current_role_summary}
            </p>
            {profile.current_role_summary.length > 120 && (
              <button
                type="button"
                onClick={() => setShowFullRole(!showFullRole)}
                className="text-[11px] text-primary hover:underline font-medium"
              >
                {showFullRole ? "Show less" : "Read more"}
              </button>
            )}
          </div>
        )}

        {/* Skills */}
        {skillsList.length > 0 && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-[11px] text-muted-foreground uppercase tracking-wider">
                Extracted Skills ({skillsList.length})
              </span>
            </div>
            <div className="flex flex-wrap gap-1">
              {displayedSkills.map((s) => (
                <Badge
                  key={s}
                  variant="secondary"
                  className="text-xs font-medium px-2 py-0.5 bg-muted/70 hover:bg-muted text-foreground"
                >
                  {s}
                </Badge>
              ))}
              {skillsList.length > 8 && (
                <button
                  type="button"
                  onClick={() => setShowAllSkills(!showAllSkills)}
                  className="px-2 py-0.5 text-xs font-semibold text-primary rounded border border-primary/20 hover:bg-primary/10 transition-colors"
                >
                  {showAllSkills ? "Show less" : `+${skillsList.length - 8} more`}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Soft Skills */}
        {softEntries.length > 0 && (
          <div className="space-y-2 pt-1 border-t border-border/40">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
              Soft Skills Assessment
            </span>
            <div className="grid grid-cols-2 gap-2.5">
              {softEntries.map(([key, val]) => (
                <div key={key} className="p-2 rounded-lg bg-muted/30 border border-border/40 space-y-1">
                  <div className="flex justify-between items-center text-xs">
                    <span className="capitalize font-medium text-foreground text-[11px]">
                      {key.replace("_", " ")}
                    </span>
                    <span className="font-bold text-primary text-xs">{(val as number).toFixed(1)}</span>
                  </div>
                  <Progress value={((val as number) / 5) * 100} className="h-1.5" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Learning Interests */}
        {profile.learning_interests?.length > 0 && (
          <div className="p-3 rounded-lg bg-primary/5 border border-primary/15 space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-bold text-primary">
              <TrendingUp className="h-3.5 w-3.5 text-primary" />
              <span>Career & Learning Goals</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
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
  const [filterType, setFilterType] = useState<"all" | "high" | "gap">("all");

  const { data: profile, isLoading: profileLoading } = useEmployeeProfile(user?.employee_id);
  const { data: projects = [], isLoading: projectsLoading } = useProjectsFull();

  const effectiveSkills: string[] = profile?.merged_skills?.length
    ? profile.merged_skills
    : user?.skills ?? [];

  const recommended = useMemo(() => {
    return [...projects]
      .map((p) => {
        const { percentage } = computeMatch(effectiveSkills, p);
        return { p, pct: percentage };
      })
      .sort((a, b) => b.pct - a.pct);
  }, [projects, effectiveSkills]);

  const displayedProjects = useMemo(() => {
    let list = recommended;

    if (filterType === "high") {
      list = list.filter((item) => item.pct >= 80);
    } else if (filterType === "gap") {
      list = list.filter((item) => item.pct < 100);
    }

    if (!search.trim()) return list;

    const q = search.toLowerCase();
    return list.filter(
      ({ p }) =>
        p.project_name?.toLowerCase().includes(q) ||
        p.domain?.toLowerCase().includes(q) ||
        p.required_skills?.some((s) => s.skill_name.toLowerCase().includes(q)) ||
        p.required_roles?.some((r) => r.role_name.toLowerCase().includes(q))
    );
  }, [recommended, filterType, search]);

  const isLoading = profileLoading || projectsLoading;

  return (
    <div className="flex flex-col min-h-full bg-muted/30">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header className="px-6 sm:px-8 py-5 bg-card border-b border-border shadow-xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              Project Matches & Learning Roadmap
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              {effectiveSkills.length
                ? `Ranked for your ${effectiveSkills.length} verified technical skills.`
                : "Complete your onboarding assessment to unlock high-precision project matches."}
            </p>
          </div>
          <Button
            variant="outline"
            className="gap-2 shrink-0 font-semibold text-xs"
            onClick={() => navigate("/employee")}
          >
            <MessageSquare className="h-4 w-4 text-primary" />
            <span>Retake AI Chatbot</span>
          </Button>
        </div>
      </header>

      {/* ── Main Layout ─────────────────────────────────────────────────────── */}
      <main className="flex-1 p-6 sm:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 xl:grid-cols-[340px_1fr] gap-8 items-start">
            
            {/* ── Left Column: Profile Summary Panel ────────────────────────── */}
            <aside className="space-y-4 xl:sticky xl:top-6">
              {profileLoading ? (
                <Skeleton className="h-96 rounded-xl" />
              ) : profile ? (
                <ProfilePanel profile={profile} />
              ) : (
                <Card className="border-2 border-dashed border-border rounded-xl">
                  <CardContent className="py-8 text-center text-sm text-muted-foreground space-y-2">
                    <AlertCircle className="h-8 w-8 mx-auto text-muted-foreground/50" />
                    <p className="font-semibold text-foreground">No Profile Available Yet</p>
                    <p className="text-xs">
                      Complete the AI onboarding chatbot interview to generate your profile.
                    </p>
                    <Button
                      size="sm"
                      onClick={() => navigate("/employee")}
                      className="mt-3 font-semibold"
                    >
                      Start Assessment
                    </Button>
                  </CardContent>
                </Card>
              )}
            </aside>

            {/* ── Right Column: Recommended Projects ────────────────────────── */}
            <div className="space-y-6">
              {/* Filter & Search Bar */}
              <div className="flex items-center justify-between gap-3 flex-wrap bg-card p-3 rounded-xl border border-border shadow-xs">
                {/* Search */}
                <div className="relative flex-1 min-w-[240px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search by project, domain, role or skill..."
                    className="pl-9 h-9 text-xs bg-muted/40 border-border"
                  />
                </div>

                {/* Filter Pills */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
                  <button
                    onClick={() => setFilterType("all")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      filterType === "all"
                        ? "bg-primary text-primary-foreground shadow-xs"
                        : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                    }`}
                  >
                    All ({recommended.length})
                  </button>
                  <button
                    onClick={() => setFilterType("high")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                      filterType === "high"
                        ? "bg-emerald-600 text-white shadow-xs"
                        : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    <span>High Match (80%+)</span>
                  </button>
                  <button
                    onClick={() => setFilterType("gap")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                      filterType === "gap"
                        ? "bg-rose-600 text-white shadow-xs"
                        : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                    <span>With Skill Gap</span>
                  </button>
                </div>
              </div>

              {/* Projects Grid */}
              {isLoading ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                  {[1, 2, 3, 4].map((i) => (
                    <Skeleton key={i} className="h-64 rounded-xl" />
                  ))}
                </div>
              ) : displayedProjects.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
                  {displayedProjects.map(({ p }, index) => (
                    <MatchCard
                      key={p.project_id}
                      project={p}
                      skills={effectiveSkills}
                      isTopMatch={index === 0 && filterType === "all" && !search.trim()}
                    />
                  ))}
                </div>
              ) : (
                <Card className="border border-border/80 bg-card rounded-xl p-10 text-center">
                  <div className="max-w-sm mx-auto space-y-3">
                    <Search className="w-10 h-10 text-muted-foreground/40 mx-auto" />
                    <h3 className="font-bold text-base text-foreground">No matching projects found</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Try clearing your search query or switching filter tabs to see all projects.
                    </p>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSearch("");
                        setFilterType("all");
                      }}
                      className="mt-2 text-xs"
                    >
                      Reset Filters
                    </Button>
                  </div>
                </Card>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
