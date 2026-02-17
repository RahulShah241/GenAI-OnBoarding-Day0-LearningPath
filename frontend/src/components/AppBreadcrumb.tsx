import { useLocation, Link } from "react-router-dom";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Home } from "lucide-react";
import { Data } from "@/store/Data";

const LABEL_MAP: Record<string, string> = {
  hr: "HR Dashboard",
  admin: "Admin Dashboard",
  employee: "Employee",
  projects: "Projects",
  employees: "Employees",
  "add-project": "Add Project",
  "project-suggestions": "Suggested Employees",
  "job-matches": "Job Matches",
};

export function AppBreadcrumb() {
  const location = useLocation();
  const user = Data((s) => s.user);

  const segments = location.pathname.split("/").filter(Boolean);
  if (segments.length <= 1) return null; // Don't show on root dashboard

  const rootPath = `/${segments[0]}`;
  const rootLabel = LABEL_MAP[segments[0]] ?? segments[0];

  const crumbs = segments.slice(1).map((seg, i) => {
    const path = `/${segments.slice(0, i + 2).join("/")}`;
    const label = LABEL_MAP[seg] ?? decodeURIComponent(seg);
    return { path, label };
  });

  return (
    <Breadcrumb className="px-8 py-3 bg-card border-b-2 border-border">
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link to={rootPath} className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground">
              <Home className="h-3.5 w-3.5" />
              {rootLabel}
            </Link>
          </BreadcrumbLink>
        </BreadcrumbItem>

        {crumbs.map((crumb, i) => (
          <span key={crumb.path} className="contents">
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              {i === crumbs.length - 1 ? (
                <BreadcrumbPage className="capitalize">{crumb.label}</BreadcrumbPage>
              ) : (
                <BreadcrumbLink asChild>
                  <Link to={crumb.path} className="capitalize text-muted-foreground hover:text-foreground">
                    {crumb.label}
                  </Link>
                </BreadcrumbLink>
              )}
            </BreadcrumbItem>
          </span>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
