import { Data } from "@/store/Data";

const BASE = import.meta.env.VITE_API_BASE ?? "http://localhost:8000";

// ── shared fetch helper ───────────────────────────────────────────────────────
async function apiFetch<T = unknown>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const headers = {
    ...Data.getState().getAuthHeaders(),
    ...(options.headers as Record<string, string> | undefined),
  };
  const res = await fetch(`${BASE}${path}`, { ...options, headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as any)?.detail ?? `API error ${res.status}`);
  }
  return res.json() as Promise<T>;
}

// ── Types ──────────────────────────────────────────────────────────────────────
export interface AnswerItem {
  question: string;
  answer: string;
}

export interface SubmitTopicPayload {
  employeeId: string;
  employeeEmail: string;
  role: string;
  topic: string;
  answers: AnswerItem[];
}

export interface TopicResponseResult {
  message: string;
  topic: string;
  final_score: number;
  feedback: string;
  threshold_passed: boolean;
  min_score_required?: number;
  profile_snapshot?: {
    overall_score: number;
    readiness: string;
    extracted_skills: string[];
  };
}

export interface EmployeeProfile {
  employee_id: string;
  email: string;
  name?: string;
  current_role_summary?: string;
  desired_role_summary?: string;
  experience_summary?: string;
  years_of_experience?: number;
  extracted_skills: string[];
  merged_skills: string[];
  soft_skills: {
    communication?: number;
    collaboration?: number;
    problem_solving?: number;
    ownership?: number;
  };
  learning_interests: string[];
  workstyle: {
    preferred_work_style?: string;
    motivations?: string;
  };
  overall_score: number;
  readiness: string;
  completed_topics: string[];
  submitted_at?: string;
}

// ── Submit a single topic answer (one per Q) ──────────────────────────────────
export const submitSingleAnswer = async (
  employeeId: string,
  employeeEmail: string,
  role: string,
  topic: string,
  question: string,
  answer: string
): Promise<TopicResponseResult> => {
  return apiFetch<TopicResponseResult>("/employee/topic-response", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      employee_id: employeeId,
      employee_email: employeeEmail,
      role,
      topic,
      question,
      answer,
    }),
  });
};

// ── Legacy: submit all answers for a topic in parallel ───────────────────────
export const submitTopicToBackend = async ({
  employeeId,
  employeeEmail,
  role,
  topic,
  answers,
}: SubmitTopicPayload): Promise<TopicResponseResult[]> => {
  return Promise.all(
    answers.map((item) =>
      submitSingleAnswer(employeeId, employeeEmail, role, topic, item.question, item.answer)
    )
  );
};

// ── Finalize profile after all topics are done ────────────────────────────────
export const finalizeProfile = async (
  employeeId: string
): Promise<{ message: string; profile: EmployeeProfile }> => {
  return apiFetch("/employee/finalize-profile", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ employee_id: employeeId }),
  });
};

// ── Fetch own profile ─────────────────────────────────────────────────────────
export const fetchEmployeeProfile = async (
  employeeId: string
): Promise<EmployeeProfile> => {
  return apiFetch<EmployeeProfile>(`/employee/profile/${employeeId}`);
};

// ── Fetch all profiles (HR/ADMIN) ─────────────────────────────────────────────
export const fetchAllProfiles = async (): Promise<EmployeeProfile[]> => {
  return apiFetch<EmployeeProfile[]>("/hr/employee-profiles");
};
