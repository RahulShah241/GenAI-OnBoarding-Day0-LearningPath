import { useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useEmployee ,useEmployeeChatData} from "@/api/hooks";
import { EMPLOYEES } from "@/types/Employee";

export default function EmployeeDetails() {
  const { id } = useParams();
  const { data: apiEmployee } = useEmployee(id);
  const { data: apiChatData, isLoading } = useEmployeeChatData(id);
  console.log(apiEmployee)
  console.log(apiChatData)
  // Fallback to local mock data if API fails
  const employee = apiEmployee ?? EMPLOYEES.find((e) => e.employee_id === id);
   
  if (isLoading) {
    return (
      <div className="p-8 max-w-4xl mx-auto space-y-6">
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="p-8 text-center text-muted-foreground">Employee not found</div>
    );
  }

  return (
  <div className="p-8 max-w-4xl mx-auto space-y-6">
    
    {/* ========================= */}
    {/* Employee Basic Info Card */}
    {/* ========================= */}
    <Card className="border-2 border-border shadow-md">
      <CardHeader className="border-b-2 border-border">
        <CardTitle className="text-2xl">{employee.name}</CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InfoRow label="Email" value={employee.email} />
          <InfoRow label="Role" value={employee.role} />
          <InfoRow label="Experience" value={`${employee.experience} years`} />
          <InfoRow label="Designation" value={employee.designation ?? "—"} />
          <InfoRow label="Department" value={employee.department ?? "—"} />

          <div>
            <span className="text-sm font-medium text-muted-foreground">Status</span>
            <div className="mt-1">
              <Badge variant={employee.status === "Allocated" ? "default" : "secondary"}>
                {employee.status}
              </Badge>
            </div>
          </div>
        </div>

        <div>
          <span className="text-sm font-medium text-muted-foreground">Skills</span>
          <div className="flex gap-2 mt-2 flex-wrap">
            {employee.skills?.map((s: string) => (
              <Badge key={s} variant="secondary">
                {s}
              </Badge>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>

    {/* ========================= */}
    {/* Employee Responses Card */}
    {/* ========================= */}
    <Card className="border-2 border-border shadow-md">
      <CardHeader className="border-b-2 border-border">
        <CardTitle className="text-xl">Assessment Responses</CardTitle>
      </CardHeader>

      <CardContent className="space-y-6 max-h-[500px] overflow-y-auto">
        {apiChatData.responses && apiChatData.responses.length > 0 ? (
          apiChatData.responses.map((response: any, index: number) => (
            <div
              key={index}
              className="border rounded-lg p-4 space-y-3 bg-muted/30"
            >
              <div>
                <p className="text-sm font-semibold text-muted-foreground">
                  Question
                </p>
                <p className="text-foreground">{response.question}</p>
              </div>

              <div>
                <p className="text-sm font-semibold text-muted-foreground">
                  Answer
                </p>
                <p className="text-foreground">{response.answer}</p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2 border-t">
                <ScoreItem label="Final Score" value={response.score?.final_score} />
                <ScoreItem label="NLP Score" value={response.score?.nlp?.nlp_score} />
                <ScoreItem label="Relevance" value={response.score?.llm?.relevance} />
                <ScoreItem label="Clarity" value={response.score?.llm?.clarity} />
              </div>

              {response.score?.llm?.feedback && (
                <div className="pt-2">
                  <p className="text-xs font-medium text-muted-foreground">
                    AI Feedback
                  </p>
                  <p className="text-sm italic text-foreground">
                    {response.score.llm.feedback}
                  </p>
                </div>
              )}
            </div>
          ))
        ) : (
          <p className="text-muted-foreground text-sm">
            No assessment responses available.
          </p>
        )}
      </CardContent>
    </Card>
  </div>
);

}
function ScoreItem({ label, value }: { label: string; value?: number }) {
  return (
    <div>
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="text-sm font-semibold text-foreground">
        {value !== undefined ? value : "—"}
      </p>
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
