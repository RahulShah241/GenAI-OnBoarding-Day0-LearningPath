import { Data } from "@/store/Data";

interface AnswerItem {
  question: string;
  answer: string;
}

interface SubmitTopicPayload {
  employeeId: string;
  employeeEmail: string;
  role: string;
  topic: string;
  answers: AnswerItem[];
}

/**
 * POST /employee/topic-response  — one request per answer, run in parallel.
 * Attaches the JWT Bearer token from the Zustand store automatically.
 */
export const submitTopicToBackend = async ({
  employeeId,
  employeeEmail,
  role,
  topic,
  answers,
}: SubmitTopicPayload): Promise<void> => {
  const headers = Data.getState().getAuthHeaders();

  await Promise.all(
    answers.map((item) =>
      fetch(`${import.meta.env.VITE_API_BASE ?? "http://localhost:8000"}/employee/topic-response`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          employee_id: employeeId,
          employee_email: employeeEmail,
          role,
          topic,
          question: item.question,
          answer: item.answer,
        }),
      }).then(async (res) => {
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err?.detail ?? `Failed to submit answer for topic "${topic}"`);
        }
        return res.json();
      })
    )
  );
};
