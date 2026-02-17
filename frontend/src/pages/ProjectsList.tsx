import { useNavigate } from "react-router-dom";
import { ProjectCard } from "@/components/ProjectCard";
import { useProjects } from "@/api/hooks";
import { PROJECTS } from "@/store/ProjectData";
import { Skeleton } from "@/components/ui/skeleton";

export default function ProjectsList() {
  const navigate = useNavigate();
  const { data: apiProjects, isLoading, isError } = useProjects();

  const projects = apiProjects ?? PROJECTS;

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Projects</h1>

      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
      )}

      {!isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project) => (
            <ProjectCard
              key={project.project_id}
              project={project}
              onClick={() =>
                navigate(`/hr/projects/${project.project_id}`, {
                  state: project,
                })
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}
