import { useNavigate } from "react-router-dom";
import { ProjectCard } from "@/components/ProjectCard";
import { bankGenAIProject } from "@/store/ProjectData";

export default function ProjectsList() {
  const navigate = useNavigate();

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Projects</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <ProjectCard
          project={bankGenAIProject}
          onClick={() =>
            navigate(`/projects/${bankGenAIProject.project_id}`, {
              state: bankGenAIProject,
            })
          }
        />
      </div>
    </div>
  );
}
