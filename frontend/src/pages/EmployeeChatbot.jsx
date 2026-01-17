import { useState, useRef, useEffect } from "react";
import {
  Box,
  TextField,
  Button,
  Typography,
  Paper,
  Avatar,
  List,
  ListItemButton,
  ListItemText,
  Divider,
} from "@mui/material";
import SmartToyIcon from "@mui/icons-material/SmartToy";
import PersonIcon from "@mui/icons-material/Person";
import FiberManualRecordIcon from "@mui/icons-material/FiberManualRecord";
import { Chat_bot_questions } from "../store/questions.js";
import Navbar from "./Navbar.jsx";
/* Sidebar Topics */
const CHAT_TOPICS = Object.keys(Chat_bot_questions);
console.log(CHAT_TOPICS)
export default function EmployeeChatbot() {
  const [input, setInput] = useState("");
  const [pendingRestartTopic, setPendingRestartTopic] = useState(null);
const [awaitingConfirmation, setAwaitingConfirmation] = useState(false);

  const [messages, setMessages] = useState([
    {
      from: "bot",
      text:
        "Welcome! I’ll help understand your skills, experience, and work preferences so we can align you with the right roles, projects, and learning paths. You can answer freely in your own words — there are no right or wrong answers.",
    },
  ]);
  const [activeTopic, setActiveTopic] = useState(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [awaitingAnswer, setAwaitingAnswer] = useState(false);

  const [answers, setAnswers] = useState({});

  const messagesEndRef = useRef(null);

  /* Send user message */
const handleSend = () => {
  if (!input.trim()) return;

  const userInput = input.trim();
  setInput("");

  setMessages((prev) => [...prev, { from: "user", text: userInput }]);

  // Handle confirmation flow
  if (awaitingConfirmation && pendingRestartTopic) {
    const normalized = userInput.toLowerCase();

    if (normalized === "yes") {
      // clear previous answers
      setAnswers((prev) => ({
        ...prev,
        [pendingRestartTopic]: [],
      }));

      setMessages((prev) => [
        ...prev,
        {
          from: "bot",
          text: `🔄 Restarting "${pendingRestartTopic}".`,
        },
      ]);

      startTopic(pendingRestartTopic);
    } else {
      setMessages((prev) => [
        ...prev,
        {
          from: "bot",
          text: `👍 Okay. Your existing responses for "${pendingRestartTopic}" are preserved.`,
        },
      ]);

      setAwaitingConfirmation(false);
      setPendingRestartTopic(null);
    }
    return;
  }

  // Normal Q&A flow
  if (!activeTopic || !awaitingAnswer) return;

  const currentQuestion =
    Chat_bot_questions[activeTopic][questionIndex].question;

  // Store answer
  setAnswers((prev) => ({
    ...prev,
    [activeTopic]: [
      ...(prev[activeTopic] || []),
      { question: currentQuestion, answer: userInput },
    ],
  }));

  const nextIndex = questionIndex + 1;
  const questions = Chat_bot_questions[activeTopic];

  if (questions[nextIndex]) {
    setQuestionIndex(nextIndex);

    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        { from: "bot", text: questions[nextIndex].question },
      ]);
    }, 400);
  } else {
    setAwaitingAnswer(false);

    setMessages((prev) => [
      ...prev,
      {
        from: "bot",
        text: `✅ We have stored your response for "${activeTopic}".\nYou can proceed to the next section or restart this topic for editing.`,
      },
    ]);
  }
};

const restartTopic = () => {
  if (!activeTopic) return;

  setQuestionIndex(0);
  setAwaitingAnswer(true);

  setAnswers((prev) => ({
    ...prev,
    [activeTopic]: [],
  }));

  setMessages((prev) => [
    ...prev,
    {
      from: "bot",
      text: `🔄 Restarting "${activeTopic}". Let's begin again.`,
    },
    {
      from: "bot",
      text: Chat_bot_questions[activeTopic][0].question,
    },
  ]);
};


  /* Sidebar topic click */

const handleTopicClick = (topic) => {
  // If topic already has answers → ask confirmation
  if (answers[topic]?.length > 0) {
    setPendingRestartTopic(topic);
    setAwaitingConfirmation(true);

    setMessages((prev) => [
      ...prev,
      {
        from: "bot",
        text: `⚠️ You already have responses for "${topic}".\nDo you want to restart and overwrite them? (Yes / No)`,
      },
    ]);
    return;
  }

  // Fresh topic
  startTopic(topic);
};
const startTopic = (topic) => {
  setActiveTopic(topic);
  setQuestionIndex(0);
  setAwaitingAnswer(true);
  setAwaitingConfirmation(false);
  setPendingRestartTopic(null);

  setMessages((prev) => [
    ...prev,
    {
      from: "bot",
      text: `📌 ${topic}\nPlease share your thoughts related to this section.`,
    },
    {
      from: "bot",
      text: Chat_bot_questions[topic][0].question,
    },
  ]);
};


  /* Auto-scroll */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <><Navbar /><Box sx={{ display: "flex", height: "100vh", backgroundColor: "#f4f6f8" }}>

      {/* ================= SIDEBAR ================= */}
      <Box
        sx={{
          width: 280,
          bgcolor: "#ffffff",
          borderRight: "1px solid #ddd",
          p: 2,
        }}
      >
        <Typography variant="h6" gutterBottom>
          Profile Sections
        </Typography>
        <Divider sx={{ mb: 1 }} />

        <List>
          {CHAT_TOPICS.map((topic) => {
            const isActive = topic === activeTopic;
            return (
              <ListItemButton
                key={topic}
                onClick={() => handleTopicClick(topic)}
                sx={{
                  borderRadius: 1,
                  mb: 0.5,
                  bgcolor: isActive ? "primary.light" : "transparent",
                }}
              >
                <FiberManualRecordIcon
                  sx={{
                    fontSize: 10,
                    mr: 1,
                    color: isActive ? "primary.main" : "grey.400",
                  }} />
                <ListItemText
                  primary={topic}
                  primaryTypographyProps={{
                    fontWeight: isActive ? 600 : 400,
                    fontSize: 14,
                  }} />
              </ListItemButton>
            );
          })}
        </List>
      </Box>

      {/* ================= CHAT AREA ================= */}
      <Box sx={{ flex: 1, display: "flex", flexDirection: "column" }}>

        {/* Header */}
        <Box
          sx={{
            p: 2,
            borderBottom: "1px solid #ddd",
            backgroundColor: "#fff",
          }}
        >
          <Typography variant="h6">
            AI Skill Assessment Chatbot
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Guided profile evaluation for HR alignment
          </Typography>
        </Box>

        {/* Messages */}
        <Box sx={{ flex: 1, overflowY: "auto", p: 2 }}>
          {messages.map((m, i) => (
            <Box
              key={i}
              sx={{
                display: "flex",
                justifyContent: m.from === "user" ? "flex-end" : "flex-start",
                mb: 2,
              }}
            >
              {m.from === "bot" && (
                <Avatar sx={{ mr: 1, bgcolor: "primary.main" }}>
                  <SmartToyIcon />
                </Avatar>
              )}

              <Paper
                sx={{
                  p: 1.5,
                  maxWidth: "70%",
                  bgcolor: m.from === "user" ? "primary.main" : "white",
                  color: m.from === "user" ? "white" : "black",
                  whiteSpace: "pre-line",
                }}
              >
                <Typography variant="body2">{m.text}</Typography>
              </Paper>

              {m.from === "user" && (
                <Avatar sx={{ ml: 1, bgcolor: "grey.500" }}>
                  <PersonIcon />
                </Avatar>
              )}
            </Box>
          ))}
          <div ref={messagesEndRef} />
        </Box>

        {/* Input */}
        <Box
          sx={{
            p: 2,
            borderTop: "1px solid #ddd",
            backgroundColor: "#fff",
            display: "flex",
            gap: 1,
          }}
        >
          <TextField
            fullWidth
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Share your response here..."
            onKeyDown={(e) => e.key === "Enter" && handleSend()} />
          <Button variant="contained" onClick={handleSend}>
            Send
          </Button>
        </Box>
      </Box>
    </Box></>
  );
}
