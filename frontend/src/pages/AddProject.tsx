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

  const addSkill = () => {
    if (skillInput.trim() && !skills.includes(skillInput)) {
      setSkills([...skills, skillInput]);
      setSkillInput("");
    }
  };

  const removeSkill = (skill: string) =>
    setSkills(skills.filter((s) => s !== skill));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert("Project Created (UI Demo)");
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground">
          Create New Project
        </h1>
        <p className="text-muted-foreground">
          Define project scope, skills and delivery details
        </p>
      </div>

      <Card className="shadow-lg rounded-xl border-2 border-border">
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* BASIC INFO */}
            <SectionHeader title="Basic Information" />

            <div className="space-y-4">
              <div>
                <Label htmlFor="projectName">Project Name</Label>
                <Input
                  id="projectName"
                  placeholder="GenAI Banking Platform"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>Project Type</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {PROJECT_TYPES.map((t) => (
                        <SelectItem key={t} value={t}>
                          {t}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="businessUnit">Business Unit</Label>
                  <Input id="businessUnit" placeholder="BFSI" />
                </div>

                <div>
                  <Label htmlFor="domain">Domain</Label>
                  <Input id="domain" placeholder="Banking / AI" />
                </div>
              </div>
            </div>

            {/* OVERVIEW */}
            <SectionHeader title="Project Overview" />

            <div className="space-y-4">
              <div>
                <Label htmlFor="objective">Objective</Label>
                <Textarea
                  id="objective"
                  rows={2}
                  placeholder="Automate banking workflows using GenAI"
                />
              </div>

              <div>
                <Label htmlFor="problemStatement">Problem Statement</Label>
                <Textarea
                  id="problemStatement"
                  rows={2}
                  placeholder="Manual workflows, delayed insights"
                />
              </div>
            </div>

            {/* DURATION */}
            <SectionHeader title="Timeline & Engagement" />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="startDate">Start Date</Label>
                <Input id="startDate" type="date" />
              </div>

              <div>
                <Label htmlFor="endDate">Expected End Date</Label>
                <Input id="endDate" type="date" />
              </div>

              <div>
                <Label>Engagement Type</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select engagement" />
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
            </div>

            {/* SKILLS */}
            <SectionHeader title="Required Skills" />

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-3">
                <Label htmlFor="skillInput">Skill</Label>
                <Input
                  id="skillInput"
                  placeholder="FastAPI, GenAI, React"
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  onKeyDown={(e) =>
                    e.key === "Enter" && (e.preventDefault(), addSkill())
                  }
                />
              </div>
              <div className="flex items-end">
                <Button
                  type="button"
                  onClick={addSkill}
                  className="w-full h-10"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Skill
                </Button>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {skills.map((s) => (
                <Badge
                  key={s}
                  variant="secondary"
                  className="px-3 py-1 text-sm flex items-center gap-1"
                >
                  {s}
                  <button
                    type="button"
                    onClick={() => removeSkill(s)}
                    className="ml-1 hover:text-destructive"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>

            {/* STATUS */}
            <SectionHeader title="Project Status" />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Current Status</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* ACTIONS */}
            <Separator className="my-6" />

            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline">
                Cancel
              </Button>
              <Button type="submit" size="lg" className="px-8">
                Create Project
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

/* ---------- Section Header ---------- */
function SectionHeader({ title }: { title: string }) {
  return (
    <div className="pt-4">
      <h2 className="text-lg font-semibold text-foreground mb-2">{title}</h2>
      <Separator />
    </div>
  );
}
