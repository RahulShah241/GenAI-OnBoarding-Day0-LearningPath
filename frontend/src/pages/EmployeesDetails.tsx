import { useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EMPLOYEES } from "@/types/Employee";

export default function EmployeeDetails() {
  const { id } = useParams();
  const employee = EMPLOYEES.find((e) => e.id === id);

  if (!employee) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        Employee not found
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      <Card className="border-2 border-border shadow-md">
        <CardHeader className="border-b-2 border-border">
          <CardTitle className="text-2xl">{employee.name}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InfoRow label="Email" value={employee.email} />
            <InfoRow label="Role" value={employee.role} />
            <InfoRow label="Experience" value={`${employee.experience} years`} />
            <div>
              <span className="text-sm font-medium text-muted-foreground">
                Status
              </span>
              <div className="mt-1">
                <Badge
                  variant={
                    employee.status === "Allocated" ? "default" : "secondary"
                  }
                >
                  {employee.status}
                </Badge>
              </div>
            </div>
          </div>

          <div>
            <span className="text-sm font-medium text-muted-foreground">
              Skills
            </span>
            <div className="flex gap-2 mt-2 flex-wrap">
              {employee.skills.map((s) => (
                <Badge key={s} variant="secondary">
                  {s}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="text-sm font-medium text-muted-foreground">{label}</span>
      <p className="text-foreground">{value}</p>
    </div>
  );
}
