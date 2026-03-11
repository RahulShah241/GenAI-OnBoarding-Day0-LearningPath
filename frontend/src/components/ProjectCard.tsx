import { ProjectDescription, ProjectSummary } from "@/types/Project";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Props {
  project: ProjectSummary;
  onClick: () => void;
}

export function ProjectCard({ project, onClick }: Props) {
  return (
    <Card
      onClick={onClick}
      className="cursor-pointer border-2 border-border hover:border-primary/40 hover:shadow-lg transition-all duration-200"
    >
      <CardContent className="p-5">
        <h3 className="text-lg font-semibold text-foreground">
          {project.project_name}
        </h3>
        <p className="text-sm text-muted-foreground mt-1">{project.domain}</p>

        <Badge variant="secondary" className="mt-3">
          {project.current_status}
        </Badge>
      </CardContent>
    </Card>
  );
}
