export const submitTopicToBackend = async ({
  employeeEmail,
  role,
  topic,
  answers,
}) => {
  for (const item of answers) {
    await fetch("http://localhost:8000/employee/topic-response", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        employee_email: employeeEmail,
        role:role,
        topic:topic,
        question: item.question,
        answer: item.answer,
      }),
    });
  }
};
