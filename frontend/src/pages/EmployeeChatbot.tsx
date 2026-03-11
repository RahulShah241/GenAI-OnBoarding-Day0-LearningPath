/**
 * EmployeeChatbot.tsx
 * ────────────────────
 * On mount:
 *   1. Calls GET /employee/progress/{id}  — fetches whatever the employee already answered
 *   2. Reconstructs the full chat history (bot questions + user answers) from backend data
 *   3. Marks completed topics + partial progress in the sidebar
 *   4. Resumes from the EXACT next unanswered question (topic + question index)
 *
 * Per answer:
 *   • Submits one answer at a time (POST /employee/topic-response)
 *   • NLP threshold not met → amber warning, same question re-asked
 *   • Accepted → advances question index / topic, updates sidebar + profile snapshot
 *
 * On all topics done:
 *   • Calls POST /employee/finalize-profile  → redirects to /employee/job-matches
 */

import { useState, useRef, useEffect, useCallback } from "react";
import {
  Bot, User, Circle, Send, RotateCcw,
  AlertTriangle, CheckCircle2, Brain, Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { Chat_bot_questions } from "@/store/questions";
import { submitSingleAnswer, finalizeProfile } from "@/api/api";
import type { TopicResponseResult } from "@/api/api";
import { Data } from "@/store/Data";
import { toast } from "sonner";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Message {
  from: "bot" | "user";
  text: string;
  example?: string;
  type?: "info" | "warning" | "success" | "error" | "history";
}

interface ProgressData {
  has_progress: boolean;
  completed_topics: string[];
  answered_questions: Record<string, string[]>;   // topic → list of answered question texts
  conversation_history: Array<{
    topic: string;
    question: string;
    answer: string;
    score: { final_score: number };
  }>;
  profile_snapshot: {
    overall_score: number;
    readiness: string;
    extracted_skills: string[];
  } | null;
}

// ─── Constants ────────────────────────────────────────────────────────────────
const TOPICS = Object.keys(Chat_bot_questions);
const BASE = (import.meta as any).env?.VITE_API_BASE ?? "http://localhost:8000";

// ─── Pure helpers ─────────────────────────────────────────────────────────────

function topicFullyAnswered(
  topic: string,
  answeredQs: Record<string, string[]>
): boolean {
  const answered = new Set(answeredQs[topic] ?? []);
  const total: number = (Chat_bot_questions as any)[topic].length;
  return answered.size >= total;
}

function findResumePoint(
  answeredQs: Record<string, string[]>
): { topic: string; questionIndex: number } | null {
  for (const topic of TOPICS) {
    const answered = new Set(answeredQs[topic] ?? []);
    const idx: number = (Chat_bot_questions as any)[topic].findIndex(
      (q: { question: string }) => !answered.has(q.question)
    );
    if (idx !== -1) return { topic, questionIndex: idx };
  }
  return null;
}

function buildHistoryMessages(
  history: ProgressData["conversation_history"],
  answeredQs: Record<string, string[]>
): Message[] {
  if (!history.length) return [];
  const msgs: Message[] = [
    {
      from: "bot",
      text: "👋 Welcome back! I've loaded your previous responses. Resuming from where you left off…",
      type: "info",
    },
  ];
  let lastTopic = "";
  for (const r of history) {
    if (r.topic !== lastTopic) {
      lastTopic = r.topic;
      const done = topicFullyAnswered(r.topic, answeredQs);
      msgs.push({
        from: "bot",
        text: done ? `📌 ${r.topic} ✅` : `📌 ${r.topic}`,
        type: done ? "success" : "info",
      });
    }
    msgs.push({ from: "bot", text: r.question, type: "history" });
    msgs.push({
      from: "user",
      text: `${r.answer}  (score: ${r.score?.final_score?.toFixed(1) ?? "—"})`,
      type: "history" as any,
    });
  }
  return msgs;
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function EmployeeChatbot() {
  const navigate = useNavigate();
  const user = Data((state) => state.user);

  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [activeTopic, setActiveTopic] = useState<string | null>(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [completedTopics, setCompletedTopics] = useState<Set<string>>(new Set());
  // topic → Set of answered question texts
  const [answeredQs, setAnsweredQs] = useState<Record<string, Set<string>>>({});

  const [retryCount, setRetryCount] = useState(0);
  const [awaitingConfirm, setAwaitingConfirm] = useState(false);
  const [pendingTopic, setPendingTopic] = useState<string | null>(null);
  const [profileSnapshot, setProfileSnapshot] = useState<{
    overall_score: number;
    readiness: string;
    extracted_skills: string[];
  } | null>(null);

  const bottomRef = useRef<HTMLDivElement>(null);
  const initializedRef = useRef(false);

  const push = useCallback((msg: Message) => setMessages((p) => [...p, msg]), []);

  // ── Start / resume topic at specific question index ────────────────────────
  const startTopicAt = useCallback(
    (topic: string, qIdx: number) => {
      setActiveTopic(topic);
      setQuestionIndex(qIdx);
      setRetryCount(0);
      setAwaitingConfirm(false);
      setPendingTopic(null);

      const qs = (Chat_bot_questions as any)[topic];
      const q = qs[qIdx];

      const header: Message =
        qIdx === 0
          ? {
              from: "bot",
              text: `📌 ${topic}\nPlease share your thoughts for this section.`,
              type: "info",
            }
          : {
              from: "bot",
              text: `▶ Continuing "${topic}" — question ${qIdx + 1} of ${qs.length}`,
              type: "info",
            };

      setMessages((p) => [
        ...p,
        header,
        { from: "bot", text: q.question, example: q.example },
      ]);
    },
    []
  );

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ── On mount: fetch progress ───────────────────────────────────────────────
  useEffect(() => {
    if (initializedRef.current || !user?.employee_id) return;
    initializedRef.current = true;

    (async () => {
      const freshStart = () => {
        setMessages([
          {
            from: "bot",
            text: "Welcome! I'll help understand your skills, experience and work preferences to match you with the right projects. Answer freely — there are no right or wrong answers.",
            type: "info",
          },
        ]);
        setLoading(false);
        startTopicAt(TOPICS[0], 0);
      };

      try {
        const headers = Data.getState().getAuthHeaders();
        const res = await fetch(
          `${BASE}/employee/progress/${user.employee_id}`,
          { headers }
        );

        if (!res.ok) { freshStart(); return; }

        const progress: ProgressData = await res.json();

        // Restore state
        const aqSets: Record<string, Set<string>> = {};
        for (const [topic, qs] of Object.entries(progress.answered_questions)) {
          aqSets[topic] = new Set(qs);
        }
        setAnsweredQs(aqSets);

        const fullyDone = new Set(
          TOPICS.filter((t) => topicFullyAnswered(t, progress.answered_questions))
        );
        setCompletedTopics(fullyDone);

        if (progress.profile_snapshot) setProfileSnapshot(progress.profile_snapshot);

        if (!progress.has_progress) { freshStart(); return; }

        // All done → redirect
        if (fullyDone.size === TOPICS.length) {
          setMessages([{
            from: "bot",
            text: "🎉 You've already completed the full assessment! Redirecting to your matched projects…",
            type: "success",
          }]);
          setLoading(false);
          setTimeout(() => navigate("/employee/job-matches"), 1800);
          return;
        }

        // Partial — rebuild history then resume
        setMessages(buildHistoryMessages(progress.conversation_history, progress.answered_questions));
        setLoading(false);

        const resume = findResumePoint(progress.answered_questions);
        if (!resume) { navigate("/employee/job-matches"); return; }

        setTimeout(() => startTopicAt(resume.topic, resume.questionIndex), 400);
      } catch {
        freshStart();
      }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.employee_id]);

  // ── Send ───────────────────────────────────────────────────────────────────
  const handleSend = async () => {
    const text = input.trim();
    if (!text || submitting || loading) return;
    setInput("");
    push({ from: "user", text });

    // Topic-switch confirm
    if (awaitingConfirm && pendingTopic) {
      if (text.toLowerCase() === "yes") {
        const aq = answeredQs[pendingTopic];
        const idx = aq
          ? (Chat_bot_questions as any)[pendingTopic].findIndex(
              (q: { question: string }) => !aq.has(q.question)
            )
          : 0;
        startTopicAt(pendingTopic, Math.max(idx, 0));
      } else {
        push({ from: "bot", text: "👍 Okay, continuing with the current section." });
      }
      setAwaitingConfirm(false);
      setPendingTopic(null);
      return;
    }

    if (!activeTopic) return;

    const currentQ = (Chat_bot_questions as any)[activeTopic][questionIndex];
    setSubmitting(true);

    try {
      const result: TopicResponseResult = await submitSingleAnswer(
        user?.employee_id ?? "",
        user?.email ?? "",
        user?.role ?? "EMPLOYEE",
        activeTopic,
        currentQ.question,
        text
      );

      // Threshold failed
      if (!result.threshold_passed) {
        setRetryCount((c) => c + 1);
        push({
          from: "bot",
          text: `⚠️ Score: ${result.final_score.toFixed(1)} / ${(result.min_score_required ?? 2.5).toFixed(1)} — answer is too brief.\n\n${result.feedback}\n\nPlease add more specific detail.`,
          type: "warning",
        });
        setSubmitting(false);
        return;
      }

      // Accepted
      setRetryCount(0);
      if (result.profile_snapshot) setProfileSnapshot(result.profile_snapshot);

      // Mark question answered in local state
      setAnsweredQs((prev) => {
        const next = { ...prev };
        next[activeTopic] = new Set(prev[activeTopic] ?? []);
        next[activeTopic].add(currentQ.question);
        return next;
      });

      const qs = (Chat_bot_questions as any)[activeTopic];
      const nextIdx = questionIndex + 1;

      if (qs[nextIdx]) {
        // Next question same topic
        setQuestionIndex(nextIdx);
        setTimeout(
          () => push({ from: "bot", text: qs[nextIdx].question, example: qs[nextIdx].example }),
          300
        );
      } else {
        // Topic complete
        setCompletedTopics((prev) => new Set([...prev, activeTopic]));
        push({
          from: "bot",
          text: `✅ "${activeTopic}" section completed! Responses saved.`,
          type: "success",
        });

        const nextTopic = TOPICS[TOPICS.indexOf(activeTopic) + 1] ?? null;
        if (nextTopic) {
          setTimeout(() => startTopicAt(nextTopic, 0), 700);
        } else {
          // All done
          push({
            from: "bot",
            text: "🎉 All sections completed! Generating your profile…",
            type: "success",
          });
          try {
            const { profile } = await finalizeProfile(user?.employee_id ?? "");
            push({
              from: "bot",
              text: `✨ Profile ready!\n• Overall Score: ${profile.overall_score} / 5\n• Readiness: ${profile.readiness}\n• Skills: ${profile.extracted_skills.slice(0, 6).join(", ") || "—"}\n\nRedirecting…`,
              type: "success",
            });
            setProfileSnapshot({
              overall_score: profile.overall_score,
              readiness: profile.readiness,
              extracted_skills: profile.extracted_skills,
            });
          } catch {
            push({ from: "bot", text: "Profile generated. Redirecting…", type: "success" });
          }
          setActiveTopic(null);
          setTimeout(() => navigate("/employee/job-matches"), 2200);
        }
      }
    } catch (err: any) {
      push({
        from: "bot",
        text: `⚠️ Could not save: ${err?.message ?? "Connection error"}. Please try again.`,
        type: "error",
      });
      toast.error(err?.message ?? "Save failed");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Sidebar topic click ────────────────────────────────────────────────────
  const handleTopicClick = (topic: string) => {
    if (topic === activeTopic || loading) return;
    if (activeTopic && !completedTopics.has(activeTopic)) {
      setPendingTopic(topic);
      setAwaitingConfirm(true);
      push({
        from: "bot",
        text: `⚠️ Unfinished questions in "${activeTopic}". Switch to "${topic}"? (Yes / No)`,
        type: "warning",
      });
      return;
    }
    const aq = answeredQs[topic];
    const idx = aq
      ? (Chat_bot_questions as any)[topic].findIndex(
          (q: { question: string }) => !aq.has(q.question)
        )
      : 0;
    startTopicAt(topic, Math.max(idx, 0));
  };

  // ── Restart topic ──────────────────────────────────────────────────────────
  const restartTopic = () => {
    if (!activeTopic) return;
    setAnsweredQs((prev) => { const n = { ...prev }; delete n[activeTopic]; return n; });
    setCompletedTopics((prev) => { const n = new Set(prev); n.delete(activeTopic); return n; });
    startTopicAt(activeTopic, 0);
  };

  const allDone = completedTopics.size === TOPICS.length;

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="flex h-[calc(100vh-64px)] bg-muted overflow-hidden">

      {/* Sidebar */}
      <aside className="w-64 bg-card border-r-2 border-border p-4 flex flex-col gap-3">
        <div>
          <h2 className="text-base font-semibold">Profile Sections</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {loading ? "Loading…" : `${completedTopics.size} / ${TOPICS.length} done`}
          </p>
          <div className="mt-2 h-1.5 rounded-full bg-muted-foreground/20 overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-500"
              style={{ width: `${(completedTopics.size / TOPICS.length) * 100}%` }}
            />
          </div>
        </div>

        <div className="h-px bg-border" />

        <nav className="flex-1 space-y-1 overflow-y-auto">
          {loading
            ? TOPICS.map((_, i) => <Skeleton key={i} className="h-8 rounded-lg" />)
            : TOPICS.map((topic) => {
                const done = completedTopics.has(topic);
                const active = topic === activeTopic;
                const partialCount = answeredQs[topic]?.size ?? 0;
                const totalCount: number = (Chat_bot_questions as any)[topic].length;
                const partial = !done && partialCount > 0;

                return (
                  <button
                    key={topic}
                    onClick={() => handleTopicClick(topic)}
                    className={cn(
                      "w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left text-sm transition-colors",
                      active
                        ? "bg-primary/10 text-primary font-medium"
                        : done
                        ? "text-green-700 hover:bg-green-50"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <Circle
                      className={cn(
                        "h-2 w-2 flex-shrink-0",
                        done
                          ? "fill-green-500 text-green-500"
                          : partial
                          ? "fill-amber-400 text-amber-400"
                          : active
                          ? "fill-primary text-primary"
                          : "fill-muted-foreground/30 text-muted-foreground/30"
                      )}
                    />
                    <span className="flex-1 truncate">{topic}</span>
                    {done && <CheckCircle2 className="h-3 w-3 text-green-500 flex-shrink-0" />}
                    {partial && (
                      <span className="text-xs text-amber-500 flex-shrink-0">
                        {partialCount}/{totalCount}
                      </span>
                    )}
                  </button>
                );
              })}
        </nav>

        {/* Live profile snapshot */}
        {profileSnapshot && (
          <div className="rounded-lg border border-border bg-muted/50 p-3 text-xs space-y-1.5">
            <div className="flex items-center gap-1 font-medium text-primary">
              <Brain className="h-3.5 w-3.5" /> Live Profile
            </div>
            <div>Score: <span className="font-semibold">{profileSnapshot.overall_score} / 5</span></div>
            <Badge
              variant={
                profileSnapshot.readiness === "High"
                  ? "default"
                  : profileSnapshot.readiness === "Moderate"
                  ? "secondary"
                  : "outline"
              }
              className="text-xs py-0"
            >
              {profileSnapshot.readiness}
            </Badge>
            {profileSnapshot.extracted_skills.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1">
                {profileSnapshot.extracted_skills.slice(0, 4).map((s) => (
                  <Badge key={s} variant="outline" className="text-xs py-0 border-primary/40 text-primary">
                    {s}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTopic && !loading && (
          <Button variant="outline" size="sm" onClick={restartTopic} className="gap-2">
            <RotateCcw className="h-3.5 w-3.5" /> Restart Section
          </Button>
        )}
      </aside>

      {/* Chat area */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Header */}
        <div className="bg-card border-b-2 border-border px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold">AI Skill Assessment</h1>
            <p className="text-sm text-muted-foreground">
              {loading
                ? "Loading your progress…"
                : activeTopic
                ? `${activeTopic} · Q${questionIndex + 1} of ${(Chat_bot_questions as any)[activeTopic]?.length ?? 1}`
                : allDone
                ? "All sections completed"
                : "Ready"}
              {" · "}{user?.name}
            </p>
          </div>
          {retryCount > 0 && (
            <div className="flex items-center gap-1.5 text-amber-600 text-xs">
              <AlertTriangle className="h-4 w-4" />
              Retry #{retryCount} — please add more detail
            </div>
          )}
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 p-4">
          {loading ? (
            <div className="max-w-2xl mx-auto space-y-4 py-6">
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading your previous responses…
              </div>
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-14 rounded-2xl" />)}
            </div>
          ) : (
            <div className="space-y-4 max-w-2xl mx-auto">
              {messages.map((m, i) => (
                <div
                  key={i}
                  className={cn("flex gap-3", m.from === "user" ? "flex-row-reverse" : "flex-row")}
                >
                  {m.from === "bot" && (
                    <div
                      className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
                        m.type === "warning" ? "bg-amber-100"
                          : m.type === "success" ? "bg-green-100"
                          : m.type === "error" ? "bg-red-100"
                          : m.type === "history" ? "bg-muted"
                          : "bg-primary/10"
                      )}
                    >
                      <Bot
                        className={cn(
                          "h-4 w-4",
                          m.type === "warning" ? "text-amber-600"
                            : m.type === "success" ? "text-green-600"
                            : m.type === "error" ? "text-red-500"
                            : m.type === "history" ? "text-muted-foreground"
                            : "text-primary"
                        )}
                      />
                    </div>
                  )}

                  <div
                    className={cn(
                      "max-w-[78%] rounded-2xl px-4 py-2.5 text-sm",
                      m.from === "bot"
                        ? m.type === "warning"
                          ? "bg-amber-50 border border-amber-200 text-amber-900"
                          : m.type === "success"
                          ? "bg-green-50 border border-green-200 text-green-900"
                          : m.type === "error"
                          ? "bg-red-50 border border-red-200 text-red-900"
                          : m.type === "history"
                          ? "bg-muted/60 border border-border/50 text-muted-foreground"
                          : "bg-card border border-border text-foreground"
                        : (m as any).type === "history"
                        ? "bg-primary/50 text-primary-foreground"
                        : "bg-primary text-primary-foreground"
                    )}
                  >
                    <p className="whitespace-pre-wrap">{m.text}</p>
                    {m.example && (
                      <p className="mt-2 text-xs italic border-l-2 border-primary/40 pl-2 opacity-75">
                        <span className="not-italic font-medium">Example: </span>
                        {m.example}
                      </p>
                    )}
                  </div>

                  {m.from === "user" && (
                    <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
                      <User className="h-4 w-4" />
                    </div>
                  )}
                </div>
              ))}
              <div ref={bottomRef} />
            </div>
          )}
        </ScrollArea>

        {/* Input bar */}
        <div className="border-t-2 border-border p-4 bg-card">
          <div className="flex gap-2 max-w-2xl mx-auto">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={
                loading ? "Loading your progress…"
                  : submitting ? "Saving…"
                  : allDone ? "Assessment complete"
                  : "Type your response…"
              }
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
              disabled={submitting || allDone || loading}
              className="flex-1"
            />
            <Button
              onClick={handleSend}
              disabled={submitting || !input.trim() || allDone || loading}
              size="icon"
            >
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
          {retryCount > 0 && (
            <p className="text-xs text-amber-600 mt-1.5 text-center max-w-2xl mx-auto">
              Answer too brief — write 2–3 sentences with specific details to proceed.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
