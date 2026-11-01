import { useState } from "react";
import { useProjectLearningPath } from "@/api/hooks";
import {
  GraduationCap,
  Sparkles,
  AlertTriangle,
  Code2,
  Clock,
  Layers,
  CheckCircle2,
  ChevronRight,
  Loader2,
  RefreshCw,
  Copy,
  Check,
  Target,
  ChevronDown,
  ChevronUp,
  CheckSquare,
  Square,
  BookOpen,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

interface LearningPathBlockProps {
  projectId: string;
  variant?: "inline" | "full";
  defaultExpanded?: boolean;
}

export default function LearningPathBlock({
  projectId,
  variant = "full",
  defaultExpanded = true,
}: LearningPathBlockProps) {
  const { data, isLoading, refetch, isRefetching } = useProjectLearningPath(projectId);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [completedTasks, setCompletedTasks] = useState<Record<number, boolean>>({});
  const [selectedTierIndex, setSelectedTierIndex] = useState<number | "all">("all");
  const [isExpanded, setIsExpanded] = useState<boolean>(defaultExpanded);

  const handleCopy = (code: string, idx: number) => {
    navigator.clipboard.writeText(code);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const toggleTask = (idx: number) => {
    setCompletedTasks((prev) => ({
      ...prev,
      [idx]: !prev[idx],
    }));
  };

  if (isLoading || isRefetching) {
    return (
      <div className="rounded-xl border border-primary/20 bg-primary/5 p-6 space-y-4 my-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-primary/10 text-primary">
            <Loader2 className="w-5 h-5 animate-spin" />
          </div>
          <div>
            <h4 className="font-semibold text-sm text-foreground">
              AI Professional Tutor Generating Learning Path...
            </h4>
            <p className="text-xs text-muted-foreground">
              Analyzing skill gap and structuring priority tiers with practical code demos.
            </p>
          </div>
        </div>
        <Progress value={65} className="h-1.5 animate-pulse" />
      </div>
    );
  }

  // Handle API unavailable or HTTP status codes
  if (!data?.api_available) {
    const is429 = data?.warning_message?.includes("429");
    const is400 = data?.warning_message?.includes("400");
    const is500 = data?.warning_message?.includes("500");

    return (
      <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 my-4 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-xs text-foreground">AI Learning Path Status</span>
                <Badge
                  variant="outline"
                  className="text-[10px] px-1.5 py-0 font-medium border-amber-500/40 text-amber-700 dark:text-amber-300"
                >
                  {is429 ? "Rate Limit (429)" : is400 ? "Setup Key (400)" : is500 ? "Temporary Error (500)" : "Pending"}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                {data?.warning_message || "AI Tutor is refreshing learning recommendations."}
              </p>
            </div>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => refetch()}
            className="h-7 text-xs gap-1.5 shrink-0 border-amber-500/30 hover:bg-amber-500/10"
          >
            <RefreshCw className="w-3 h-3 text-amber-600 dark:text-amber-400" />
            <span>Retry</span>
          </Button>
        </div>
      </div>
    );
  }

  const tiers = data.learning_tiers ?? [];
  if (tiers.length === 0) return null;

  const totalExercises = tiers.filter((t) => t.practical_demo?.hands_on_task).length;
  const completedCount = Object.values(completedTasks).filter(Boolean).length;
  const progressPercent = totalExercises > 0 ? Math.round((completedCount / totalExercises) * 100) : 0;

  const displayedTiers =
    selectedTierIndex === "all" ? tiers : [tiers[selectedTierIndex]].filter(Boolean);

  return (
    <div className="rounded-xl border border-primary/20 bg-gradient-to-b from-primary/[0.03] to-transparent shadow-sm my-4 overflow-hidden transition-all">
      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div className="p-4 sm:p-5 border-b border-border/50 bg-card/60 backdrop-blur-sm">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-bold text-sm sm:text-base text-foreground tracking-tight">
                  AI Professional Tutor — Learning Path
                </h3>
                <Badge
                  variant="outline"
                  className="text-[11px] font-medium bg-primary/10 text-primary border-primary/20 gap-1"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>{tiers.length} Priority Tiers</span>
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Structured from high to low priority to bridge required technical skills.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 ml-auto">
            {totalExercises > 0 && (
              <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-md bg-muted text-xs">
                <Target className="w-3.5 h-3.5 text-primary" />
                <span className="font-medium text-muted-foreground">Exercises:</span>
                <span className="font-bold text-foreground">
                  {completedCount}/{totalExercises}
                </span>
                <span className="text-[10px] text-muted-foreground">({progressPercent}%)</span>
              </div>
            )}
            <Button
              size="sm"
              variant="ghost"
              className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground gap-1"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              <span>{isExpanded ? "Collapse" : "Expand"}</span>
              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        {/* Tutor Overview Summary */}
        {isExpanded && data.tutor_summary && (
          <div className="mt-3 p-3 rounded-lg bg-background/80 border border-border/50 text-xs text-muted-foreground leading-relaxed">
            <span className="font-semibold text-foreground mr-1.5">Overview:</span>
            {data.tutor_summary}
          </div>
        )}

        {/* Tier Filter Tabs */}
        {isExpanded && tiers.length > 1 && (
          <div className="flex items-center gap-1.5 mt-4 overflow-x-auto pb-1 scrollbar-none">
            <button
              onClick={() => setSelectedTierIndex("all")}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all shrink-0 ${
                selectedTierIndex === "all"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80"
              }`}
            >
              All Tiers ({tiers.length})
            </button>
            {tiers.map((t, idx) => {
              const isSelected = selectedTierIndex === idx;
              const isHigh =
                t.priority?.toLowerCase() === "high" || t.tier_name.toLowerCase().includes("high");
              return (
                <button
                  key={idx}
                  onClick={() => setSelectedTierIndex(idx)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-all shrink-0 flex items-center gap-1.5 ${
                    isSelected
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80"
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      isHigh ? "bg-rose-500" : "bg-amber-500"
                    }`}
                  />
                  <span>Tier {idx + 1}: {t.skill_name || "Skills"}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Content: Tiers List ───────────────────────────────────────────── */}
      {isExpanded && (
        <div className="p-4 sm:p-5 space-y-4">
          {displayedTiers.map((tier, idx) => {
            const actualIndex = selectedTierIndex === "all" ? idx : selectedTierIndex;
            const priorityLower = (tier.priority || "").toLowerCase();
            const isHigh =
              priorityLower === "high" || tier.tier_name.toLowerCase().includes("high");
            const isMedium =
              priorityLower === "medium" || tier.tier_name.toLowerCase().includes("medium");
            const isTaskDone = Boolean(completedTasks[actualIndex]);

            return (
              <div
                key={actualIndex}
                className={`rounded-xl border transition-all duration-200 bg-card p-4 sm:p-5 space-y-4 shadow-sm ${
                  isHigh
                    ? "border-rose-200 dark:border-rose-900/40 hover:border-rose-300"
                    : isMedium
                    ? "border-amber-200 dark:border-amber-900/40 hover:border-amber-300"
                    : "border-border hover:border-primary/30"
                }`}
              >
                {/* Tier Top Header */}
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge
                        variant="outline"
                        className={`font-semibold text-xs px-2.5 py-0.5 rounded-md ${
                          isHigh
                            ? "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900"
                            : isMedium
                            ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900"
                            : "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900"
                        }`}
                      >
                        {tier.tier_name || `Tier ${actualIndex + 1}`}
                      </Badge>
                      <h4 className="font-bold text-sm sm:text-base text-foreground">
                        {tier.skill_name}
                      </h4>
                    </div>
                  </div>

                  {tier.estimated_duration && (
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/80 px-2.5 py-1 rounded-md border border-border/50">
                      <Clock className="w-3.5 h-3.5 text-primary" />
                      <span className="font-medium">{tier.estimated_duration}</span>
                    </div>
                  )}
                </div>

                {/* Required Frameworks & Libraries */}
                {tier.required_frameworks && tier.required_frameworks.length > 0 && (
                  <div className="flex items-center gap-2 flex-wrap pt-0.5">
                    <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-primary" />
                      Frameworks:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {tier.required_frameworks.map((fw, fidx) => (
                        <Badge
                          key={fidx}
                          variant="secondary"
                          className="text-xs font-medium px-2 py-0.5 bg-primary/10 text-primary border border-primary/20"
                        >
                          {fw}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Core Learning Outcomes */}
                {tier.learning_objectives && tier.learning_objectives.length > 0 && (
                  <div className="space-y-2 pt-1">
                    <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      Core Learning Outcomes
                    </span>
                    <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-muted-foreground">
                      {tier.learning_objectives.map((obj, oidx) => (
                        <li
                          key={oidx}
                          className="flex items-start gap-2 p-2 rounded-lg bg-muted/40 border border-border/40 leading-relaxed"
                        >
                          <span className="text-primary font-bold mt-0.5">•</span>
                          <span>{obj}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Practical Demo & Hands-on Code Snippet */}
                {tier.practical_demo && (
                  <div className="mt-3 rounded-lg border border-border/70 bg-muted/30 overflow-hidden">
                    <div className="px-3.5 py-2 border-b border-border/50 bg-muted/70 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
                        <Code2 className="w-4 h-4 text-primary" />
                        <span>Interactive Demo: {tier.practical_demo.title}</span>
                      </div>
                      {tier.practical_demo.code_snippet && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() =>
                            handleCopy(tier.practical_demo?.code_snippet || "", actualIndex)
                          }
                          className="h-6 px-2 text-[11px] gap-1 text-muted-foreground hover:text-foreground"
                        >
                          {copiedIndex === actualIndex ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-600" />
                              <span className="text-emerald-600 font-medium">Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>Copy Code</span>
                            </>
                          )}
                        </Button>
                      )}
                    </div>

                    {/* Code block */}
                    {tier.practical_demo.code_snippet && (
                      <div className="relative">
                        <pre className="p-3.5 text-slate-100 bg-slate-950 text-[11px] font-mono overflow-x-auto leading-relaxed border-t border-slate-800 scrollbar-thin">
                          <code>{tier.practical_demo.code_snippet}</code>
                        </pre>
                      </div>
                    )}

                    {/* Actionable Hands-on Exercise */}
                    {tier.practical_demo.hands_on_task && (
                      <div className="p-3 bg-card border-t border-border/60 flex items-start justify-between gap-3 flex-wrap sm:flex-nowrap">
                        <div className="flex items-start gap-2.5">
                          <button
                            type="button"
                            onClick={() => toggleTask(actualIndex)}
                            className="mt-0.5 text-primary hover:text-primary/80 transition-colors"
                            title={isTaskDone ? "Mark incomplete" : "Mark completed"}
                          >
                            {isTaskDone ? (
                              <CheckSquare className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                            ) : (
                              <Square className="w-4 h-4 text-muted-foreground" />
                            )}
                          </button>
                          <div className="text-xs">
                            <span className="font-semibold text-foreground">
                              Hands-on Action Item:
                            </span>{" "}
                            <span
                              className={`leading-relaxed ${
                                isTaskDone
                                  ? "line-through text-muted-foreground"
                                  : "text-foreground/90"
                              }`}
                            >
                              {tier.practical_demo.hands_on_task}
                            </span>
                          </div>
                        </div>

                        <Badge
                          variant={isTaskDone ? "default" : "outline"}
                          className={`text-[10px] font-medium shrink-0 cursor-pointer ${
                            isTaskDone
                              ? "bg-emerald-600 text-white hover:bg-emerald-700"
                              : "text-muted-foreground border-border hover:bg-muted"
                          }`}
                          onClick={() => toggleTask(actualIndex)}
                        >
                          {isTaskDone ? "Completed ✓" : "Mark Done"}
                        </Badge>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
