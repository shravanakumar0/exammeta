// Shared server-side AI API helper. Provider keys must never be put in browser code.
export const readApiResponse = async (response, fallback = "The request failed.") => {
  const raw = await response.text();
  let data;
  try {
    data = raw ? JSON.parse(raw) : {};
  } catch {
    throw new Error("ExamMeta received an unexpected response. Confirm the app is running with `npm start`, then try again.");
  }
  if (!response.ok) throw new Error(data.error || fallback);
  return data;
};

export const getProjectIdeas = async (projectType, userMessage) => {
  try {
    const response = await fetch("/api/gemini", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode: "project-ideas", projectType, userMessage }),
    });
    const data = await readApiResponse(response, "AI request failed.");
    return (data.answer || "").split("\n").filter(line => line.trim());
  } catch (error) {
    console.error("Error fetching project ideas:", error);
    return [error.message || "Could not generate ideas. Try again later."];
  }
};

export const analyzePyqResources = async ({ subject, moduleNumber, resourceUrls }) => {
  const response = await fetch("/api/gemini", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      mode: "analyze-pyq",
      subject,
      moduleNumber,
      resourceUrls,
    }),
  });
  return readApiResponse(response, "Could not analyze the uploaded question papers.");
};

export const getQuestionAnswer = async ({ subject, moduleNumber, question, resourceUrl }) => {
  const response = await fetch("/api/gemini", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      mode: "question-answer",
      subject,
      moduleNumber,
      question,
      resourceUrl,
    }),
  });
  return readApiResponse(response, "Could not generate an answer.");
};
