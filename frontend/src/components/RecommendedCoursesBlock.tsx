import { useProjectRecommendedCourses } from "@/api/hooks";
import { BookOpen, ExternalLink, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

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

  // Requirement: if no API registered or no courses returned, hide block
  if (!courses || courses.length === 0) {
    return null;
  }

  return (
    <Card className="border-2 border-primary/20 bg-primary/5 shadow-sm mt-6">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold flex items-center justify-between">
          <div className="flex items-center gap-2 text-primary">
            <Sparkles className="w-4 h-4 text-primary" />
            <BookOpen className="w-4 h-4 text-primary" />
            <span>Skill Gap Improvement Courses</span>
          </div>
          <Badge variant="outline" className="text-xs bg-background text-primary border-primary/30">
            AI Gap Analysis
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2.5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {courses.map((c, idx) => (
            <div
              key={idx}
              className="p-3 rounded-lg border border-border bg-card hover:border-primary/40 transition-colors flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <Badge variant="secondary" className="font-semibold text-xs">
                    {c.skill}
                  </Badge>
                  <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                    {c.platform}
                  </span>
                </div>
                <p className="text-xs font-medium text-foreground line-clamp-2">
                  {c.course_title}
                </p>
              </div>
              <a
                href={c.url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
              >
                <span>Open Course Link</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
