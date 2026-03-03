import { useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useEmployee, useEmployeeChatData } from "@/api/hooks";

export default function EmployeeDetails() {
  const { id } = useParams<{ id: string }>();
  const { data: employee, isLoading: empLoading, isError: empError } = useEmployee(id);
  const { data: chatData, isLoading: chatLoading } = useEmployeeChatData(id);

  if (empLoading) return (
    <div className="p-8 max-w-4xl mx-auto space-y-4">
      <Skeleton className="h-48 rounded-xl" />
      <Skeleton className="h-64 rounded-xl" />
    </div>
  );

  if (empError || !employee) return (
    <div className="p-8 text-center text-muted-foreground">Employee not found</div>
  );

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">

      {/* Profile card */}
      <Card className="border-2 border-border shadow-md">
        <CardHeader className="border-b-2 border-border">
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-2xl">{employee.name}</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">{employee.designation} · {employee.department}</p>
            </div>
            <Badge variant={employee.status === "Allocated" ? "default" : "secondary"} className="text-sm">
              {employee.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-4 space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            <Info label="Email" value={employee.email} />
            <Info label="Role" value={employee.role} />
            <Info label="Experience" value={`${employee.experience} years`} />
            <Info label="Designation" value={employee.designation ?? "—"} />
            <Info label="Department" value={employee.department ?? "—"} />
            <Info label="Employee ID" value={employee.employee_id} />
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-2">Skills</p>
            <div className="flex flex-wrap gap-2">
              {employee.skills?.map((s) => <Badge key={s} variant="secondary">{s}</Badge>)}
              {(!employee.skills || employee.skills.length === 0) && (
                <span className="text-sm text-muted-foreground">No skills listed</span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Assessment responses */}
      <Card className="border-2 border-border shadow-md">
        <CardHeader className="border-b-2 border-border">
          <CardTitle className="text-xl">
            Assessment Responses
            {chatData?.responses && (
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                ({chatData.responses.length} responses)
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4 max-h-[600px] overflow-y-auto space-y-4">
          {chatLoading ? (
            <div className="space-y-3">{[1, 2].map((i) => <Skeleton key={i} className="h-24 rounded" />)}</div>
          ) : chatData?.responses?.length ? (
            chatData.responses.map((r: any, i: number) => (
              <div key={i} className="border rounded-lg p-4 space-y-3 bg-muted/30">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">{r.topic}</Badge>
                </div>
                <div>
                  <p className="text-xs font-semibold text-muted-foreground">Question</p>
                  <p className="text-sm mt-0.5">{r.question}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-muted-foreground">Answer</p>
                  <p className="text-sm mt-0.5">{r.answer}</p>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2 border-t">
                  <Score label="Final Score" value={r.score?.final_score} max={5} />
                  <Score label="NLP Score" value={r.score?.nlp?.nlp_score} max={5} />
                  <Score label="Relevance" value={r.score?.llm?.relevance} max={5} />
                  <Score label="Clarity" value={r.score?.llm?.clarity} max={5} />
                </div>
                {r.score?.llm?.feedback && (
                  <div className="text-xs italic text-muted-foreground border-l-2 border-primary/30 pl-2">
                    {r.score.llm.feedback}
                  </div>
                )}
              </div>
            ))
          ) : (
            <p className="text-muted-foreground text-sm text-center py-6">No assessment responses yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-medium mt-0.5">{value}</p>
    </div>
  );
}

function Score({ label, value, max }: { label: string; value?: number; max: number }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-semibold mt-0.5">
        {value !== undefined ? `${value} / ${max}` : "—"}
      </p>
    </div>
  );
}
