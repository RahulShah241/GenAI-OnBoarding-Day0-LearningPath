import { useState } from "react";
import { Plus, X, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCreateProject } from "@/api/hooks";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

const PROJECT_TYPES = ["Client", "Internal", "Internal Innovation"];
const ENGAGEMENT_TYPES = ["Full-Time", "Part-Time", "Contract"];
const STATUSES = ["Open", "Closed", "On Hold"];
const METHODOLOGIES = ["Agile", "Scrum", "Kanban", "Waterfall"];
const PRIORITIES = ["High", "Medium", "Low"];
const LEVELS = ["Junior", "Mid", "Senior", "Lead"];

export default function AddProject() {
  const navigate = useNavigate();
  const { mutate: createProject, isPending, isSuccess } = useCreateProject();

  // Controlled select fields
  const [projectType, setProjectType] = useState("");
  const [engagementType, setEngagementType] = useState("");
  const [status, setStatus] = useState("");
  const [methodology, setMethodology] = useState("Agile");
  const [roleLevel, setRoleLevel] = useState("Mid");
  const [priority, setPriority] = useState("High");

  // Dynamic list fields
  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState("");
  const [outcomes, setOutcomes] = useState<string[]>([]);
  const [responsibilities, setResponsibilities] = useState<string[]>([]);

  const addSkill = () => {
    const v = skillInput.trim();
    if (v && !skills.includes(v)) { setSkills([...skills, v]); setSkillInput(""); }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!projectType || !engagementType || !status) {
      toast.error("Please fill in all dropdown fields");
      return;
    }
    const fd = new FormData(e.currentTarget);
    const g = (n: string) => String(fd.get(n) ?? "");

    createProject({
      project_name: g("projectName"),
      project_type: projectType,
      business_unit: g("businessUnit"),
      domain: g("domain"),
      project_overview: {
        objective: g("objective"),
        problem_statement: g("problemStatement"),
        expected_outcomes: outcomes,
      },
      project_duration: {
        start_date: g("startDate"),
        expected_end_date: g("endDate"),
        engagement_type: engagementType,
      },
      required_roles: [{
        role_name: g("roleName") || "Developer",
        role_level: roleLevel,
        headcount: parseInt(g("headcount") || "1"),
        deployment_priority: priority,
      }],
      required_skills: skills.map((s) => ({
        skill_name: s, required_level: "Intermediate", mandatory: true,
      })),
      responsibilities,
      delivery_model: {
        methodology,
        sprint_length_weeks: parseInt(g("sprintWeeks") || "2"),
        communication_mode: g("commMode") || "Daily Standups",
      },
      deployment_readiness_criteria: {
        minimum_skill_match_percentage: parseInt(g("minMatch") || "70"),
        simulation_score_threshold: parseInt(g("simThreshold") || "60"),
      },
      status: {
        current_status: status,
        deployment_stage: "Planning",
        last_updated: new Date().toISOString(),
      },
    } as any, {
      onSuccess: (data) => {
        toast.success(`Project created! ID: ${data.project_id}`);
        setTimeout(() => navigate("/hr/projects"), 1200);
      },
      onError: (err: Error) => toast.error(err.message),
    });
  };

  return (
    <div className="max-w-4xl mx-auto p-6 pb-16">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Create New Project</h1>
        <p className="text-muted-foreground text-sm mt-1">Fill in the details below. All fields marked * are required.</p>
      </div>

      <Card className="border-2 border-border">
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-8">

            {/* Basic info */}
            <Section title="Basic Information">
              <Input name="projectName" placeholder="Project Name *" required />
              <div className="grid grid-cols-3 gap-3">
                <Select onValueChange={setProjectType}>
                  <SelectTrigger><SelectValue placeholder="Project Type *" /></SelectTrigger>
                  <SelectContent>{PROJECT_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
                <Input name="businessUnit" placeholder="Business Unit *" required />
                <Input name="domain" placeholder="Domain *" required />
              </div>
            </Section>

            {/* Overview */}
            <Section title="Project Overview">
              <Textarea name="objective" placeholder="Objective *" required rows={2} />
              <Textarea name="problemStatement" placeholder="Problem Statement *" required rows={2} />
              <ListInput label="Expected Outcomes" items={outcomes} setItems={setOutcomes} placeholder="Add an outcome…" />
            </Section>

            {/* Timeline */}
            <Section title="Timeline & Engagement">
              <div className="grid grid-cols-3 gap-3">
                <div><label className="text-xs text-muted-foreground">Start Date *</label><Input name="startDate" type="date" required /></div>
                <div><label className="text-xs text-muted-foreground">End Date *</label><Input name="endDate" type="date" required /></div>
                <div>
                  <label className="text-xs text-muted-foreground">Engagement Type *</label>
                  <Select onValueChange={setEngagementType}>
                    <SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger>
                    <SelectContent>{ENGAGEMENT_TYPES.map((e) => <SelectItem key={e} value={e}>{e}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
            </Section>

            {/* Required role */}
            <Section title="Required Role">
              <div className="grid grid-cols-4 gap-3">
                <Input name="roleName" placeholder="Role Name" defaultValue="Developer" />
                <Select value={roleLevel} onValueChange={setRoleLevel}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{LEVELS.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent>
                </Select>
                <Input name="headcount" type="number" min="1" placeholder="Headcount" defaultValue="1" />
                <Select value={priority} onValueChange={setPriority}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{PRIORITIES.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </Section>

            {/* Skills */}
            <Section title="Required Skills">
              <div className="flex gap-2">
                <Input value={skillInput} onChange={(e) => setSkillInput(e.target.value)} placeholder="e.g. Python, React…"
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addSkill())} />
                <Button type="button" onClick={addSkill} variant="secondary"><Plus className="w-4 h-4" /></Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {skills.map((s) => (
                  <Badge key={s} className="gap-1 cursor-pointer" onClick={() => setSkills(skills.filter((x) => x !== s))}>
                    {s} <X className="w-3 h-3" />
                  </Badge>
                ))}
              </div>
            </Section>

            {/* Responsibilities */}
            <Section title="Responsibilities">
              <ListInput label="" items={responsibilities} setItems={setResponsibilities} placeholder="Add a responsibility…" />
            </Section>

            {/* Delivery */}
            <Section title="Delivery Model">
              <div className="grid grid-cols-3 gap-3">
                <Select value={methodology} onValueChange={setMethodology}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{METHODOLOGIES.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
                </Select>
                <div>
                  <label className="text-xs text-muted-foreground">Sprint Length (weeks)</label>
                  <Input name="sprintWeeks" type="number" min="1" defaultValue="2" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Communication Mode</label>
                  <Input name="commMode" defaultValue="Daily Standups" />
                </div>
              </div>
            </Section>

            {/* Readiness */}
            <Section title="Deployment Readiness">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground">Min Skill Match %</label>
                  <Input name="minMatch" type="number" min="0" max="100" defaultValue="70" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Simulation Threshold</label>
                  <Input name="simThreshold" type="number" min="0" max="100" defaultValue="60" />
                </div>
              </div>
            </Section>

            {/* Status */}
            <Section title="Project Status">
              <Select onValueChange={setStatus}>
                <SelectTrigger className="max-w-xs"><SelectValue placeholder="Current Status *" /></SelectTrigger>
                <SelectContent>{STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </Section>

            <Separator />
            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => navigate("/hr/projects")}>Cancel</Button>
              <Button type="submit" disabled={isPending || isSuccess}>
                {isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Creating…</>
                  : isSuccess ? <><CheckCircle2 className="w-4 h-4 mr-2" />Created!</>
                  : "Create Project"}
              </Button>
            </div>

          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <div><h3 className="text-base font-semibold">{title}</h3><Separator className="mt-1" /></div>
      {children}
    </div>
  );
}

function ListInput({ label, items, setItems, placeholder }: {
  label: string; items: string[];
  setItems: React.Dispatch<React.SetStateAction<string[]>>; placeholder: string;
}) {
  const [val, setVal] = useState("");
  const add = () => { const v = val.trim(); if (v && !items.includes(v)) { setItems([...items, v]); setVal(""); } };
  return (
    <div className="space-y-2">
      {label && <p className="text-sm font-medium">{label}</p>}
      <div className="flex gap-2">
        <Input value={val} onChange={(e) => setVal(e.target.value)} placeholder={placeholder}
          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), add())} />
        <Button type="button" onClick={add} variant="secondary"><Plus className="w-4 h-4" /></Button>
      </div>
      <div className="flex flex-wrap gap-2">
        {items.map((item) => (
          <Badge key={item} className="gap-1 cursor-pointer" onClick={() => setItems(items.filter((v) => v !== item))}>
            {item} <X className="w-3 h-3" />
          </Badge>
        ))}
      </div>
    </div>
  );
}
