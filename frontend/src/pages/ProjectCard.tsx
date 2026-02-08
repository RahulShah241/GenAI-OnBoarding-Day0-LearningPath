import { ProjectDescription } from "../types/Project";

interface Props {
  project: ProjectDescription;
  onClick: () => void;
}

export function ProjectCard({ project, onClick }: Props) {
  return (
    <div
      onClick={onClick}
      className="border rounded-lg p-4 cursor-pointer hover:shadow-md transition"
    >
      <h3 className="text-lg font-semibold">{project.project_name}</h3>
      <p className="text-sm text-gray-500">{project.domain}</p>

      <span className="inline-block mt-2 px-2 py-1 text-xs bg-blue-100 rounded">
        {project.status.current_status}
      </span>
    </div>
  );
}
