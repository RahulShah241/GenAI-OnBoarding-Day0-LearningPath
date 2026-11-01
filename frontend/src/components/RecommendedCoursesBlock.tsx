import { useProjectRecommendedCourses } from "@/api/hooks";
import { BookOpen, ExternalLink, Sparkles, GraduationCap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface RecommendedCoursesBlockProps {
  projectId: string;
  missingSkills?: string[];
}

export default function RecommendedCoursesBlock({
  projectId,
  missingSkills,
}: RecommendedCoursesBlockProps) {
  const { data, isLoading } = useProjectRecommendedCourses(projectId, missingSkills);

  if (isLoading) return null;

  const courses = data?.recommended_courses ?? [];

  if (!courses || courses.length === 0) {
    return null;
  }

  return (
    <div className="rounded-xl border border-primary/20 bg-primary/[0.02] p-4 sm:p-5 my-4 space-y-3.5">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2 text-primary font-bold text-sm">
          <BookOpen className="w-4 h-4 text-primary" />
          <span>Curated Skill Gap Online Courses</span>
        </div>
        <Badge
          variant="outline"
          className="text-[10px] font-semibold bg-background text-primary border-primary/30 uppercase tracking-wider gap-1"
        >
          <Sparkles className="w-3 h-3" />
          <span>{courses.length} Resources</span>
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {courses.map((c, idx) => (
          <div
            key={idx}
            className="p-3.5 rounded-lg border border-border bg-card hover:border-primary/40 hover:shadow-sm transition-all flex flex-col justify-between space-y-2.5"
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-1.5 flex-wrap">
                <Badge
                  variant="secondary"
                  className="font-semibold text-xs bg-primary/10 text-primary border border-primary/20"
                >
                  {c.skill}
                </Badge>
                <span className="text-[10px] uppercase font-bold text-muted-foreground bg-muted px-2 py-0.5 rounded">
                  {c.platform || "Online Resource"}
                </span>
              </div>
              <p className="text-xs font-semibold text-foreground leading-snug line-clamp-2">
                {c.course_title}
              </p>
            </div>

            <a
              href={c.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-between w-full pt-2 border-t border-border/50 text-xs font-semibold text-primary hover:text-primary/80 transition-colors"
            >
              <span>Explore Course</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}
