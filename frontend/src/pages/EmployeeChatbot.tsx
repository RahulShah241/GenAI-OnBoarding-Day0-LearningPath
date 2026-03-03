import { useState, useRef, useEffect, useCallback } from "react";
import { Bot, User, Circle, Send, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { Chat_bot_questions } from "@/store/questions";
import { submitTopicToBackend } from "@/api/api";
import { Data } from "@/store/Data";
import { toast } from "sonner";

interface Message { from: "bot" | "user"; text: string; example?: string; }
interface Answer { question: string; answer: string; }
const TOPICS = Object.keys(Chat_bot_questions);

export default function EmployeeChatbot() {
  const navigate = useNavigate();
  const user = Data((state) => state.user);
  const [input, setInput] = useState("");
  const [activeTopic, setActiveTopic] = useState<string | null>(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, Answer[]>>({});
  const [submitting, setSubmitting] = useState(false);
  const [pendingTopic, setPendingTopic] = useState<string | null>(null);
  const [awaitingConfirm, setAwaitingConfirm] = useState(false);
  const [messages, setMessages] = useState<Message[]>([{
    from: "bot",
    text: "Welcome! I'll help understand your skills, experience and work preferences. Answer freely — there are no right or wrong answers.",
  }]);

  const bottomRef = useRef<HTMLDivElement>(null);
  const startedRef = useRef(false);

  const push = useCallback((msg: Message) => setMessages((p) => [...p, msg]), []);

  const startTopic = useCallback((topic: string) => {
    setActiveTopic(topic);
    setQuestionIndex(0);
    setAwaitingConfirm(false);
    setPendingTopic(null);
    const q = Chat_bot_questions[topic][0];
    setMessages((p) => [
      ...p,
      { from: "bot", text: `📌 ${topic}\nPlease share your thoughts for this section.` },
      { from: "bot", text: q.question, example: q.example },
    ]);
  }, []);

  // Start first topic once — avoids React StrictMode double-fire
  useEffect(() => {
    if (!startedRef.current) {
      startedRef.current = true;
      startTopic(TOPICS[0]);
    }
  }, [startTopic]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const isComplete = (t: string) => (answers[t]?.length ?? 0) >= Chat_bot_questions[t].length;
  const hasProgress = (t: string | null) => !!t && (answers[t]?.length ?? 0) > 0;

  const handleSend = async () => {
    const text = input.trim();
    if (!text || submitting) return;
    setInput("");
    push({ from: "user", text });

    // Confirmation flow (switching topics mid-progress)
    if (awaitingConfirm && pendingTopic) {
      if (text.toLowerCase() === "yes") startTopic(pendingTopic);
      else push({ from: "bot", text: "👍 Okay, continuing with the current topic." });
      setAwaitingConfirm(false);
      setPendingTopic(null);
      return;
    }

    if (!activeTopic) return;

    const currentQ = Chat_bot_questions[activeTopic][questionIndex].question;
    const newAnswers = [...(answers[activeTopic] ?? []), { question: currentQ, answer: text }];
    setAnswers((p) => ({ ...p, [activeTopic]: newAnswers }));

    const nextIdx = questionIndex + 1;
    const qs = Chat_bot_questions[activeTopic];

    // More questions in this topic
    if (qs[nextIdx]) {
      setQuestionIndex(nextIdx);
      setTimeout(() => push({ from: "bot", text: qs[nextIdx].question, example: qs[nextIdx].example }), 300);
      return;
    }

    // Topic complete — save to backend
    push({ from: "bot", text: `✅ "${activeTopic}" completed. Saving your responses…` });
    setSubmitting(true);
    try {
      await submitTopicToBackend({
        employeeId: user?.employee_id ?? "",
        employeeEmail: user?.email ?? "",
        role: user?.role ?? "EMPLOYEE",
        topic: activeTopic,
        answers: newAnswers,
      });
      push({ from: "bot", text: "💾 Responses saved successfully." });
      toast.success(`${activeTopic} saved`);
    } catch (err: any) {
      push({ from: "bot", text: "⚠️ Could not save responses. Please check your connection." });
      toast.error(err?.message ?? "Save failed");
    } finally {
      setSubmitting(false);
    }

    const nextTopic = TOPICS[TOPICS.indexOf(activeTopic) + 1] ?? null;
    if (nextTopic) {
      setTimeout(() => startTopic(nextTopic), 600);
    } else {
      push({ from: "bot", text: "🎉 All sections completed! Redirecting to your matched projects…" });
      setActiveTopic(null);
      setTimeout(() => navigate("/employee/job-matches"), 1800);
    }
  };

  const handleTopicClick = (topic: string) => {
    if (topic === activeTopic) return;
    if (hasProgress(activeTopic)) {
      setPendingTopic(topic);
      setAwaitingConfirm(true);
      push({ from: "bot", text: `⚠️ You have progress in "${activeTopic}". Switch to "${topic}"? (Yes / No)` });
      return;
    }
    startTopic(topic);
  };

  const restartTopic = () => {
    if (!activeTopic) return;
    setAnswers((p) => ({ ...p, [activeTopic]: [] }));
    startTopic(activeTopic);
  };

  return (
    <div className="flex h-[calc(100vh-64px)] bg-muted overflow-hidden">
      {/* Sidebar */}
      <aside className="w-60 bg-card border-r-2 border-border p-4 flex flex-col">
        <h2 className="text-lg font-semibold mb-2">Profile Sections</h2>
        <div className="h-px bg-border mb-3" />
        <nav className="flex-1 space-y-1 overflow-y-auto">
          {TOPICS.map((topic) => (
            <button
              key={topic}
              onClick={() => handleTopicClick(topic)}
              className={cn(
                "w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left text-sm transition-colors",
                topic === activeTopic
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Circle className={cn("h-2 w-2 flex-shrink-0",
                isComplete(topic) ? "fill-primary text-primary" : "fill-muted-foreground/40 text-muted-foreground/40"
              )} />
              {topic}
            </button>
          ))}
        </nav>
        {activeTopic && (
          <Button variant="outline" size="sm" onClick={restartTopic} className="mt-3 gap-2">
            <RotateCcw className="h-3.5 w-3.5" /> Restart Section
          </Button>
        )}
      </aside>

      {/* Chat area */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="bg-card border-b-2 border-border px-6 py-4">
          <h1 className="text-lg font-bold">AI Skill Assessment</h1>
          <p className="text-sm text-muted-foreground">
            {activeTopic ? `Currently: ${activeTopic}` : "All sections completed"} · {user?.name}
          </p>
        </div>

        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4 max-w-2xl mx-auto">
            {messages.map((m, i) => (
              <div key={i} className={cn("flex gap-3", m.from === "user" ? "flex-row-reverse" : "flex-row")}>
                {m.from === "bot" && (
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Bot className="h-4 w-4 text-primary" />
                  </div>
                )}
                <div className={cn(
                  "max-w-[78%] rounded-2xl px-4 py-2.5 text-sm",
                  m.from === "bot"
                    ? "bg-card border border-border text-foreground"
                    : "bg-primary text-primary-foreground"
                )}>
                  <p className="whitespace-pre-wrap">{m.text}</p>
                  {m.example && (
                    <p className="mt-2 text-xs italic border-l-2 border-primary/40 pl-2 opacity-75">
                      <span className="not-italic font-medium">Example: </span>{m.example}
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
        </ScrollArea>

        <div className="border-t-2 border-border p-4 bg-card">
          <div className="flex gap-2 max-w-2xl mx-auto">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={submitting ? "Saving…" : "Type your response…"}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
              disabled={submitting}
              className="flex-1"
            />
            <Button onClick={handleSend} disabled={submitting || !input.trim()} size="icon">
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
