import { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Brain,
  GraduationCap,
  Sparkles,
  RefreshCw,
  Clock,
  Layers,
  Award,
  AlertCircle,
  ShieldCheck,
  Code2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useProjectById, useEmployeeProfile } from "@/api/hooks";
import LearningPathBlock from "@/components/LearningPathBlock";
import RecommendedCoursesBlock from "@/components/RecommendedCoursesBlock";
import { Data } from "@/store/Data";

function computeMatch(skills: string[], requiredSkills: { skill_name: string }[]) {
  const required = requiredSkills.map((s) => s.skill_name.toLowerCase());
  const matched = required.filter((r) =>
    skills.some((us) => us.toLowerCase().includes(r) || r.includes(us.toLowerCase()))
  );
  const unmatched = required.filter((r) => !matched.includes(r));
  const percentage = required.length ? Math.round((matched.length / required.length) * 100) : 0;
  return { percentage, matched, unmatched };
}

export default function EmployeeMatchSummaryDetail() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const user = Data((state) => state.user);
  const [showAiGuide, setShowAiGuide] = useState(true);

  const { data: project, isLoading: projectLoading } = useProjectById(projectId!);
  const { data: profile, isLoading: profileLoading } = useEmployeeProfile(user?.employee_id);

  const effectiveSkills: string[] = profile?.merged_skills?.length
    ? profile.merged_skills
    : user?.skills ?? [];

  const matchData = useMemo(() => {
    if (!project) return { percentage: 0, matched: [], unmatched: [] };
    return computeMatch(effectiveSkills, project.required_skills || []);
  }, [effectiveSkills, project]);

  const isLoading = projectLoading || profileLoading;

  if (isLoading) {
    return (
      <div className="p-8 max-w-6xl mx-auto space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-40 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="p-8 max-w-4xl mx-auto text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-destructive mx-auto" />
        <h2 className="text-xl font-bold">Project Not Found</h2>
        <Button variant="outline" onClick={() => navigate("/employee/job-matches")}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Project Matches
        </Button>
      </div>
    );
  }

  const { percentage, matched, unmatched } = matchData;

  return (
    <div className="min-h-screen bg-muted/40 pb-12">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header className="px-8 py-6 bg-card border-b border-border shadow-sm">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => navigate("/employee/job-matches")}
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Matches
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                <span>{project.project_name}</span>
                <Badge
                  variant={percentage >= 75 ? "default" : percentage >= 50 ? "secondary" : "outline"}
                  className="text-xs"
                >
                  {percentage}% Match
                </Badge>
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                {project.domain} · {project.business_unit} · {project.project_type}
              </p>
            </div>
          </div>

          <Button
            className="gap-2 font-semibold shadow-sm"
            onClick={() => setShowAiGuide(true)}
          >
            <GraduationCap className="h-4 w-4" />
            <span>AI Learning Path Guide</span>
          </Button>
        </div>
      </header>

      {/* ── Main Content ───────────────────────────────────────────────────── */}
      <main className="max-w-6xl mx-auto p-8 space-y-8">
        
        {/* ── Section 1: Match Compatibility & Profile Breakdown Summary ────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Match Score Card */}
          <Card className="border-2 border-primary/20 bg-card shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center justify-between">
                <span>Match Compatibility</span>
                <ShieldCheck className="h-4 w-4 text-primary" />
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-1">
              <div className="text-center p-4 bg-primary/5 rounded-xl border border-primary/10">
                <div className="text-4xl font-extrabold text-primary">{percentage}%</div>
                <p className="text-xs text-muted-foreground mt-1 font-medium">
                  Overall Skill Compatibility Rating
                </p>
                <Progress value={percentage} className="h-2 mt-3" />
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-border/60">
                  <span className="text-muted-foreground">Engagement Type:</span>
                  <span className="font-semibold">{project.project_duration?.engagement_type}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-border/60">
                  <span className="text-muted-foreground">Status:</span>
                  <Badge variant="secondary" className="text-[10px]">
                    {project.status?.current_status}
                  </Badge>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-muted-foreground">Required Match Threshold:</span>
                  <span className="font-medium">
                    {project.deployment_readiness_criteria?.minimum_skill_match_percentage}%
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Skill Match vs Gap Analysis */}
          <Card className="border-2 border-border bg-card shadow-sm lg:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Layers className="h-4 w-4 text-primary" />
                <span>Skill Match vs Gap Analysis</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5 pt-1">
              
              {/* Matched Skills */}
              <div>
                <p className="text-xs font-semibold flex items-center gap-1.5 mb-2 text-green-700 dark:text-green-400">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Matched Skills ({matched.length})</span>
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {matched.length ? (
                    matched.map((s) => (
                      <Badge
                        key={s}
                        className="bg-green-100 text-green-800 border border-green-300 text-xs px-2.5 py-0.5"
                      >
                        ✓ {s}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-xs text-muted-foreground italic">
                      No direct skill match found yet.
                    </span>
                  )}
                </div>
              </div>

              {/* Missing Skills Gap */}
              <div>
                <p className="text-xs font-semibold flex items-center gap-1.5 mb-2 text-destructive">
                  <XCircle className="h-4 w-4" />
                  <span>Skill Gap / Required Improvements ({unmatched.length})</span>
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {unmatched.length ? (
                    unmatched.map((s) => (
                      <Badge
                        key={s}
                        variant="outline"
                        className="border-red-300 text-red-700 dark:text-red-400 text-xs px-2.5 py-0.5 bg-red-500/5"
                      >
                        ! {s}
                      </Badge>
                    ))
                  ) : (
                    <Badge variant="secondary" className="bg-green-500/10 text-green-700 text-xs">
                      🎉 100% Skill Match! No skill gap for this project.
                    </Badge>
                  )}
                </div>
              </div>

              {/* Roles Required */}
              {project.required_roles?.length > 0 && (
                <div className="pt-2 border-t border-border/60">
                  <p className="text-xs font-semibold text-muted-foreground mb-1.5">
                    Target Roles:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {project.required_roles.map((r) => (
                      <Badge key={r.role_name} variant="outline" className="text-xs">
                        {r.role_name} ({r.role_level})
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ── Section 2: Candidate Profile Snapshot ──────────────────────────── */}
        {profile && (
          <Card className="border-2 border-primary/20 bg-primary/5">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <Brain className="h-5 w-5 text-primary" />
                  <span>Candidate Profile Snapshot ({user?.name || profile.name})</span>
                </CardTitle>
                <Badge variant="default" className="text-xs">
                  {profile.readiness} Readiness
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 pt-1">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div>
                  <span className="text-muted-foreground">Overall Rating: </span>
                  <strong className="text-primary font-bold">
                    {profile.overall_score?.toFixed(1)} / 5
                  </strong>
                </div>
                <div>
                  <span className="text-muted-foreground">Tech Readiness: </span>
                  <strong className="font-bold">
                    {profile.tech_readiness?.toFixed(1)} / 5
                  </strong>
                </div>
                <div>
                  <span className="text-muted-foreground">Domain Knowledge: </span>
                  <strong className="font-bold">
                    {profile.domain_knowledge?.toFixed(1)} / 5
                  </strong>
                </div>
              </div>

              {profile.current_role_summary && (
                <p className="text-xs text-muted-foreground bg-card p-3 rounded-lg border border-border">
                  <strong>Current Summary:</strong> {profile.current_role_summary}
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* ── Section 3: AI Learning Path & Profile Guide ────────────────────── */}
        {showAiGuide && (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-bold text-foreground">
                  AI Professional Tutor Guide & Learning Path
                </h2>
              </div>
              <Badge variant="secondary" className="text-xs">
                Models: 3.8-flash (with automatic fallback)
              </Badge>
            </div>

            {/* AI Learning Path Component */}
            <LearningPathBlock projectId={project.project_id} />

            {/* Course Recommendations */}
            <RecommendedCoursesBlock projectId={project.project_id} missingSkills={unmatched} />
          </div>
        )}

      </main>
    </div>
  );
}
