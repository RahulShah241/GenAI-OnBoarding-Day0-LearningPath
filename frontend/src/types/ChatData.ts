export type UserRole = "EMPLOYEE" | "HR" | "ADMIN";

export interface NLPScore {
  word_count: number;
  keyword_hits: number;
  nlp_score: number; // 0 - 1
}

export interface LLMScore {
  relevance: number;
  depth: number;
  clarity: number;
  feedback: string;
}

export interface Score {
  final_score: number;
  nlp: NLPScore;
  llm: LLMScore;
}

export interface ResponseItem {
  topic: string;
  question: string;
  answer: string;
  score: Score;
}

export interface EmployeeResponse {
  employee_email: string;
  role: UserRole;
  responses: ResponseItem[];
}
