import { useState } from "react";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const PROJECT_TYPES = ["Client", "Internal"];
const ENGAGEMENT_TYPES = ["Full-time", "Part-time", "Contract"];
const STATUS_OPTIONS = ["Open", "Closed", "On Hold"];

export default function AddProject() {
  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState("");

  const [projectType, setProjectType] = useState("");
  const [engagementType, setEngagementType] = useState("");
  const [status, setStatus] = useState("");

  const addSkill = () => {
    if (skillInput.trim() && !skills.includes(skillInput)) {
      setSkills([...skills, skillInput]);
      setSkillInput("");
    }
  };

  const removeSkill = (skill: string) =>
    setSkills(skills.filter((s) => s !== skill));

const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
  e.preventDefault();

  const formData = new FormData(e.currentTarget);

  const payload = {
    project_name: String(formData.get("projectName") || ""),
    project_type: projectType.toLowerCase(), // 🔥 enum safe
    business_unit: String(formData.get("businessUnit") || ""),
    domain: String(formData.get("domain") || ""),

    project_overview: {
      objective: String(formData.get("objective") || ""),
      problem_statement: String(formData.get("problemStatement") || ""),
    },

    project_duration: {
      start_date: String(formData.get("startDate") || ""), // yyyy-mm-dd
      expected_end_date: String(formData.get("endDate") || ""),
      engagement_type: engagementType.toLowerCase(), // 🔥 enum safe
    },

    required_roles: [
      {
        role_name: "Full Stack Developer",
        role_level: "mid", // 🔥 lowercase safer for enum
        headcount: Number(2),
        deployment_priority: "high", // 🔥 lowercase safer
      },
    ],

    required_skills: skills.map((s) => ({
      skill_name: s,
      required_level: "intermediate", // 🔥 lowercase safer
      mandatory: true,
    })),

    responsibilities: [
      "Develop features",
      "Collaborate with team",
    ],

    delivery_model: {
      methodology: "agile", // 🔥 lowercase safer
      sprint_length_weeks: Number(2),
      communication_mode: "hybrid", // 🔥 lowercase safer
    },

    deployment_readiness_criteria: {
      minimum_skill_match_percentage: Number(70),
      simulation_score_threshold: Number(60),
    },

    status: {
      current_status: status.toLowerCase(), // 🔥 enum safe
      deployment_stage: "planning", // 🔥 lowercase
      last_updated: new Date().toISOString(),
    },
  };

  console.log("Sending payload:", payload);

  try {
    const response = await fetch("http://localhost:8000/project", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    const result = await response.json(); // ✅ read ONLY once

  if (!response.ok) {
    console.error("Backend validation error:", result);
    alert(JSON.stringify(result, null, 2));
    return;
  }

  alert(`Project Created Successfully! ID: ${result.project_id}`);

    // e.currentTarget.reset();
    setSkills([]);
    setProjectType("");
    setEngagementType("");
    setStatus("");
  } catch (err) {
    console.error("Server error:", err);
    alert("Server error");
  }
};


  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Create New Project</h1>
        <p className="text-muted-foreground">
          Define project scope, skills and delivery details
        </p>
      </div>

      <Card className="shadow-lg border-2">
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">

            <SectionHeader title="Basic Information" />

            <Input name="projectName" placeholder="Project Name" required />

            <div className="grid grid-cols-3 gap-4">
              <Select onValueChange={setProjectType}>
                <SelectTrigger>
                  <SelectValue placeholder="Project Type" />
                </SelectTrigger>
                <SelectContent>
                  {PROJECT_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Input name="businessUnit" placeholder="Business Unit" />

              <Input name="domain" placeholder="Domain" />
            </div>

            <SectionHeader title="Project Overview" />

            <Textarea name="objective" placeholder="Objective" />
            <Textarea name="problemStatement" placeholder="Problem Statement" />

            <SectionHeader title="Timeline & Engagement" />

            <div className="grid grid-cols-3 gap-4">
              <Input name="startDate" type="date" />
              <Input name="endDate" type="date" />

              <Select onValueChange={setEngagementType}>
                <SelectTrigger>
                  <SelectValue placeholder="Engagement Type" />
                </SelectTrigger>
                <SelectContent>
                  {ENGAGEMENT_TYPES.map((e) => (
                    <SelectItem key={e} value={e}>
                      {e}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <SectionHeader title="Required Skills" />

            <div className="flex gap-2">
              <Input
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                placeholder="Enter skill"
              />
              <Button type="button" onClick={addSkill}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>

            <div className="flex flex-wrap gap-2">
              {skills.map((s) => (
                <Badge key={s}>
                  {s}
                  <X
                    className="w-3 h-3 ml-1 cursor-pointer"
                    onClick={() => removeSkill(s)}
                  />
                </Badge>
              ))}
            </div>

            <SectionHeader title="Project Status" />

            <Select onValueChange={setStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Current Status" />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Separator />

            <div className="flex justify-end">
              <Button type="submit">Create Project</Button>
            </div>

          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function SectionHeader({ title }: { title: string }) {
  return (
    <div>
      <h2 className="text-lg font-semibold mb-2">{title}</h2>
      <Separator />
    </div>
  );
}
