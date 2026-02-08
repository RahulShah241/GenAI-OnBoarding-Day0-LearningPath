import { useLocation } from "react-router-dom";
import ProjectDetails from "@/components/ProjectDetails";

export default function ProjectDetailsPage() {
  const { state } = useLocation();

  return <ProjectDetails project={state} />;
}
