export const sendMessage = async (message) => {
  console.log("[API CALL] Sending:", message);

  return new Promise((resolve) =>
    setTimeout(() => resolve({ reply: "AI understood your skillset 👍" }), 800)
  );
};
