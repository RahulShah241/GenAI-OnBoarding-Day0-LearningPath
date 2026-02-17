import { useState, useRef, useEffect } from "react";
import { Bot, User, Circle, Send, RotateCcw, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { Chat_bot_questions } from "@/store/questions";
import { submitTopicToBackend } from "@/api/api";
import { Data } from "@/store/Data";

/* ================= TYPES ================= */
interface Message {
  from: "bot" | "user";
  text: string;
  example?: string;
}

interface Answer {
  question: string;
  answer: string;
}

/* ================= CONSTANTS ================= */
const CHAT_TOPICS = Object.keys(Chat_bot_questions);

/* ================= COMPONENT ================= */
export default function EmployeeChatbot() {
  const [input, setInput] = useState("");
  const navigate = useNavigate();
  const [activeTopic, setActiveTopic] = useState<string | null>(null);
  const [questionIndex, setQuestionIndex] = useState(0);

    const user = Data((state) => state.user);
  const [answers, setAnswers] = useState<Record<string, Answer[]>>({});
  const [messages, setMessages] = useState<Message[]>([
    {
      from: "bot",
      text: "Welcome! I'll help understand your skills, experience, and work preferences. Answer freely — there are no right or wrong answers.",
    },
  ]);

  const [pendingTopic, setPendingTopic] = useState<string | null>(null);
  const [awaitingConfirmation, setAwaitingConfirmation] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  /* ================= HELPERS ================= */
  const hasProgress = (topic: string | null) =>
    topic && (answers[topic]?.length ?? 0) > 0;

  const isTopicComplete = (topic: string) =>
    answers[topic]?.length === Chat_bot_questions[topic].length;

  const getNextTopic = (topic: string) => {
    const idx = CHAT_TOPICS.indexOf(topic);
    return CHAT_TOPICS[idx + 1] ?? null;
  };

  const pushBotMessage = (msg: Message) =>
    setMessages((prev) => [...prev, msg]);

  /* ================= START TOPIC ================= */
  const startTopic = (topic: string) => {
    setActiveTopic(topic);
    setQuestionIndex(0);
    setAwaitingConfirmation(false);
    setPendingTopic(null);

    const firstQ = Chat_bot_questions[topic][0];

    pushBotMessage({
      from: "bot",
      text: `📌 ${topic}\nPlease share your thoughts for this section.`,
    });

    pushBotMessage({
      from: "bot",
      text: firstQ.question,
      example: firstQ.example,
    });
  };
  useEffect(()=>{startTopic(Object.keys(Chat_bot_questions)[0])},[])

  /* ================= HANDLE SEND ================= */
 const handleSend =  async () => {
    if (!input.trim()) return;

    const userInput = input.trim();
    setInput("");

    pushBotMessage({ from: "user", text: userInput });

    /* ===== Confirmation Flow ===== */
    if (awaitingConfirmation && pendingTopic) {
      if (userInput.toLowerCase() === "yes") {
        startTopic(pendingTopic);
      } else {
        pushBotMessage({
          from: "bot",
          text: "👍 Okay, continuing with the current topic.",
        });
      }

      setAwaitingConfirmation(false);
      setPendingTopic(null);
      return;
    }

    /* ===== Normal Q&A Flow ===== */
    if (!activeTopic) return;

    const currentQ = Chat_bot_questions[activeTopic][questionIndex].question;

    setAnswers((prev) => ({
      ...prev,
      [activeTopic]: [
        ...(prev[activeTopic] || []),
        { question: currentQ, answer: userInput },
      ],
    }));

    const nextIndex = questionIndex + 1;
    const questions = Chat_bot_questions[activeTopic];

    /* ===== Next Question ===== */
    if (questions[nextIndex]) {
      setQuestionIndex(nextIndex);

      setTimeout(() => {
        pushBotMessage({
          from: "bot",
          text: questions[nextIndex].question,
          example: questions[nextIndex].example,
        });
      }, 300);
      return;
    }

    /* ===== Topic Completed ===== */
    pushBotMessage({
      from: "bot",
      text: `✅ "${activeTopic}" completed.`,
    });
    try {
    await submitTopicToBackend({
      employeeEmail: user.email,   // from auth context
      role: user.role,             // EMPLOYEE
      topic: activeTopic,
      answers: [
        ...(answers[activeTopic] || []),
        { question: currentQ, answer: userInput },
      ],
    });

    pushBotMessage({
      from: "bot",
      text: "💾 Responses saved successfully.",
    });
  } catch (err) {
    pushBotMessage({
      from: "bot",
      text: "⚠️ Failed to save responses. They will retry later.",
    });
  }
    const nextTopic = getNextTopic(activeTopic);

    if (nextTopic) {
      setTimeout(() => startTopic(nextTopic), 600);
    } else {
      pushBotMessage({
        from: "bot",
        text: "🎉 All sections completed! Thank you for your responses. You can now view your matched projects.",
      });
      setActiveTopic(null);
      // Navigate to job matches after a short delay
      setTimeout(() => navigate("/employee/job-matches"), 1500);
    }
  };

  /* ================= SIDEBAR CLICK ================= */
  const handleTopicClick = (topic: string) => {
    if (topic === activeTopic) return;

    if (hasProgress(activeTopic)) {
      setPendingTopic(topic);
      setAwaitingConfirmation(true);

      pushBotMessage({
        from: "bot",
        text: `⚠️ You have already answered some questions in "${activeTopic}".\nSwitching topics may discard progress.\nDo you want to continue? (Yes / No)`,
      });
      return;
    }

    startTopic(topic);
  };

  /* ================= RESTART ================= */
  const restartTopic = () => {
    if (!activeTopic) return;

    setAnswers((prev) => ({ ...prev, [activeTopic]: [] }));
    startTopic(activeTopic);
  };

  /* ================= AUTO SCROLL ================= */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  /* ================= UI ================= */
  return (
    <div className="flex h-[calc(100vh-64px)] bg-muted overflow-hidden">
      {/* ===== SIDEBAR ===== */}
      <div className="w-64 bg-card border-r-2 border-border p-4 flex flex-col shadow-sm">
        <h2 className="text-lg font-semibold mb-2">Profile Sections</h2>
        <div className="h-px bg-border mb-4" />

        <nav className="flex-1 space-y-1">
          {CHAT_TOPICS.map((topic) => (
            <button
              key={topic}
              onClick={() => handleTopicClick(topic)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left",
                topic === activeTopic
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted"
              )}
            >
              <Circle
                className={cn(
                  "h-2.5 w-2.5",
                  isTopicComplete(topic)
                    ? "fill-primary text-primary"
                    : "fill-muted text-muted"
                )}
              />
              <span className="text-sm font-medium">{topic}</span>
            </button>
          ))}
        </nav>

        {activeTopic && (
          <Button
            variant="outline"
            size="sm"
            onClick={restartTopic}
            className="mt-4 gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            Restart Topic
          </Button>
        )}
      </div>

      {/* ===== CHAT ===== */}
      <div className="flex-1 flex flex-col">
        <div className="bg-card text-foreground border-b-2 border-border p-6">
          <h1 className="text-xl font-bold">AI Skill Assessment Chatbot</h1>
          <p className="text-sm text-muted-foreground">
            Guided profile evaluation for HR alignment
          </p>
        </div>

        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4 max-w-3xl mx-auto">
            {messages.map((m, i) => (
              <div
                key={i}
                className={cn(
                  "flex gap-3",
                  m.from === "user" ? "flex-row-reverse" : "flex-row"
                )}
              >
                {m.from === "bot" && (
                  <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                    <Bot className="h-5 w-5 text-primary" />
                  </div>
                )}

                <div
                  className={cn(
                    "max-w-[75%] rounded-2xl px-4 py-3 text-sm space-y-2",
                    m.from === "bot"
                      ? "bg-muted text-foreground border border-border"
                      : "bg-primary text-primary-foreground border border-primary/60"
                  )}
                >
                  <div>{m.text}</div>

                  {m.example && (
                    <div className="text-xs italic border-l-4 border-primary pl-3 text-muted-foreground">
                      <strong className="not-italic text-foreground">
                        Example:
                      </strong>{" "}
                      {m.example}
                    </div>
                  )}
                </div>

                {m.from === "user" && (
                  <div className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center">
                    <User className="h-5 w-5 text-secondary-foreground" />
                  </div>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        <div className="border-t-2 border-border p-4 bg-card">
          <div className="flex gap-3 max-w-3xl mx-auto">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Share your response here..."
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
            />
            <Button onClick={handleSend}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
