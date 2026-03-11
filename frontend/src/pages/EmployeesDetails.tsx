import { useState } from "react";
import { useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Brain, MessageSquare } from "lucide-react";
import { useEmployee, useEmployeeChatData, useEmployeeProfile } from "@/api/hooks";

type Tab = "profile" | "responses";

export default function EmployeeDetails() {
  const { id } = useParams<{ id: string }>();
  const [tab, setTab] = useState<Tab>("profile");

  const { data: employee, isLoading: empLoading, isError: empError } = useEmployee(id);
  const { data: chatData, isLoading: chatLoading } = useEmployeeChatData(id);
  const { data: profile, isLoading: profileLoading } = useEmployeeProfile(id);

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
    <div className="p-8 max-w-5xl mx-auto space-y-6">

      {/* ── Employee card ──────────────────────────────────────────────────── */}
      <Card className="border-2 border-border shadow-md">
        <CardHeader className="border-b-2 border-border">
          <div className="flex items-start justify-between flex-wrap gap-3">
            <div>
              <CardTitle className="text-2xl">{employee.name}</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {employee.designation} · {employee.department}
              </p>
            </div>
            <div className="flex items-center gap-3">
              {profile && (
                <Badge
                  variant={
                    profile.readiness === "High"
                      ? "default"
                      : profile.readiness === "Moderate"
                      ? "secondary"
                      : "outline"
                  }
                >
                  <Brain className="h-3 w-3 mr-1" />
                  {profile.readiness} Readiness
                </Badge>
              )}
              <Badge variant={employee.status === "Allocated" ? "default" : "secondary"} className="text-sm">
                {employee.status}
              </Badge>
            </div>
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

          {/* Skills (merged from profile if available) */}
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-2">Skills</p>
            <div className="flex flex-wrap gap-2">
              {(profile?.merged_skills ?? employee.skills)?.map((s) => (
                <Badge key={s} variant="secondary">{s}</Badge>
              ))}
              {!(profile?.merged_skills ?? employee.skills)?.length && (
                <span className="text-sm text-muted-foreground">No skills listed</span>
              )}
            </div>
            {profile?.extracted_skills?.length > 0 && (
              <p className="text-xs text-muted-foreground mt-1">
                {profile.extracted_skills.length} skills extracted from assessment
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ── Tab bar ────────────────────────────────────────────────────────── */}
      <div className="flex gap-2 border-b border-border">
        <button
          onClick={() => setTab("profile")}
          className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            tab === "profile"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Brain className="h-4 w-4" /> AI Profile
        </button>
        <button
          onClick={() => setTab("responses")}
          className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            tab === "responses"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <MessageSquare className="h-4 w-4" /> Raw Responses
          {chatData?.responses && (
            <Badge variant="secondary" className="text-xs py-0 ml-1">
              {chatData.responses.length}
            </Badge>
          )}
        </button>
      </div>

      {/* ── Profile tab ────────────────────────────────────────────────────── */}
      {tab === "profile" && (
        <Card className="border-2 border-border shadow-md">
          <CardHeader className="border-b-2 border-border">
            <CardTitle className="text-xl flex items-center gap-2">
              <Brain className="h-5 w-5 text-primary" /> Generated Profile
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-5">
            {profileLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 rounded" />)}
              </div>
            ) : profile ? (
              <div className="space-y-5">
                {/* Score */}
                <div className="flex items-center gap-4">
                  <div className="text-3xl font-bold text-primary">
                    {profile.overall_score.toFixed(1)}
                    <span className="text-sm font-normal text-muted-foreground"> / 5</span>
                  </div>
                  <Progress value={(profile.overall_score / 5) * 100} className="h-2.5 flex-1" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Role summaries */}
                  <div className="space-y-3">
                    {profile.current_role_summary && (
                      <ProfileField label="Current Role" value={profile.current_role_summary} />
                    )}
                    {profile.desired_role_summary && (
                      <ProfileField label="Desired Role" value={profile.desired_role_summary} />
                    )}
                    {profile.experience_summary && (
                      <ProfileField label="Experience" value={profile.experience_summary} />
                    )}
                  </div>

                  {/* Soft skills */}
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-2">Soft Skills</p>
                    <div className="space-y-2">
                      {Object.entries(profile.soft_skills ?? {})
                        .filter(([, v]) => v !== null && v !== undefined)
                        .map(([key, val]) => (
                          <div key={key} className="space-y-0.5">
                            <div className="flex justify-between text-xs">
                              <span className="capitalize">{key.replace("_", " ")}</span>
                              <span className="font-medium">{(val as number).toFixed(1)} / 5</span>
                            </div>
                            <Progress value={((val as number) / 5) * 100} className="h-1.5" />
                          </div>
                        ))}
                    </div>
                  </div>
                </div>

                {/* Learning & Workstyle */}
                {profile.learning_interests?.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Learning Interests</p>
                    <ul className="list-disc list-inside space-y-0.5">
                      {profile.learning_interests.map((li, i) => (
                        <li key={i} className="text-sm">{li}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {profile.workstyle?.preferred_work_style && (
                  <ProfileField label="Work Style" value={profile.workstyle.preferred_work_style} />
                )}
                {profile.workstyle?.motivations && (
                  <ProfileField label="Motivations" value={profile.workstyle.motivations} />
                )}

                {/* Completed topics */}
                {profile.completed_topics?.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-2">Completed Sections</p>
                    <div className="flex flex-wrap gap-1.5">
                      {profile.completed_topics.map((t) => (
                        <Badge key={t} variant="outline" className="text-xs border-green-300 text-green-700">
                          {t}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm text-center py-8">
                No profile generated yet — employee hasn't completed the assessment.
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── Responses tab ──────────────────────────────────────────────────── */}
      {tab === "responses" && (
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
          <CardContent className="pt-4 max-h-[700px] overflow-y-auto space-y-4">
            {chatLoading ? (
              <div className="space-y-3">{[1, 2].map((i) => <Skeleton key={i} className="h-24 rounded" />)}</div>
            ) : chatData?.responses?.length ? (
              chatData.responses.map((r: any, i: number) => (
                <div key={i} className="border rounded-lg p-4 space-y-3 bg-muted/30">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="outline" className="text-xs">{r.topic}</Badge>
                    {r.score?.threshold_passed === false && (
                      <Badge variant="destructive" className="text-xs">Below Threshold</Badge>
                    )}
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
      )}
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

function ProfileField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-semibold text-muted-foreground">{label}</p>
      <p className="text-sm mt-0.5">{value}</p>
    </div>
  );
}
