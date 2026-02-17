const submitData = async () => {
  const res = await fetch("http://localhost:8000/employee/topic-response", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      employee_email: "john@company.com",
      role: "Backend Developer",
      topic: "Problem Solving",
      question: "How do you debug production issues?",
      answer: "I analyze logs, reproduce locally, and deploy a fix.",
    }),
  });

  const data = await res.json(); // 👈 parse response
  console.log("Backend response:", data);
};

submitData();
