import { useNavigate } from "react-router-dom";
import { ProjectCard } from "@/components/ProjectCard";
import { useProjects } from "@/api/hooks";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Plus, RefreshCw } from "lucide-react";

export default function ProjectsList() {
  const navigate = useNavigate();
  const { data: projects = [], isLoading, isError, refetch } = useProjects();

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Projects</h1>
          {!isLoading && (
            <p className="text-sm text-muted-foreground mt-1">{projects.length} project{projects.length !== 1 ? "s" : ""}</p>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={() => refetch()} title="Refresh">
            <RefreshCw className="w-4 h-4" />
          </Button>
          <Button onClick={() => navigate("/hr/add-project")} className="gap-2">
            <Plus className="w-4 h-4" /> Add Project
          </Button>
        </div>
      </div>

      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-36 rounded-xl" />)}
        </div>
      )}

      {isError && (
        <div className="text-center py-12">
          <p className="text-destructive mb-3">Failed to load projects</p>
          <Button variant="outline" onClick={() => refetch()}>Try Again</Button>
        </div>
      )}

      {!isLoading && !isError && projects.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <p className="mb-4">No projects yet.</p>
          <Button onClick={() => navigate("/hr/add-project")} className="gap-2">
            <Plus className="w-4 h-4" /> Create First Project
          </Button>
        </div>
      )}

      {!isLoading && !isError && projects.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project) => (
            <ProjectCard
              key={project.project_id}
              project={project}
              onClick={() => navigate(`/hr/projects/${project.project_id}`, { state: project })}
            />
          ))}
        </div>
      )}
    </div>
  );
}
