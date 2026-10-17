import { handleHackathonsRequest } from "../server/hackathonsHandler";
import { handleGeminiRequest } from "../server/geminiHandler";

describe("live hackathon search", () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    if (originalFetch) global.fetch = originalFetch;
    else delete global.fetch;
    jest.clearAllMocks();
  });

  test("reports missing server credentials instead of returning demo events", async () => {
    const result = await handleHackathonsRequest({}, "");
    expect(result.status).toBe(503);
    expect(result.body.events).toBeUndefined();
    expect(result.body.error).toMatch(/GEMINI_API_KEY/);
  });

  test("keeps only future events whose event page is in Google grounding citations", async () => {
    const startDate = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);
    const officialUrl = "https://events.example.edu/student-hackathon";
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        candidates: [{
          content: { parts: [{ text: JSON.stringify([
            { title: "Student Hackathon", organizer: "Example University", startDate, eventUrl: officialUrl, registrationUrl: "https://events.example.edu/register" },
            { title: "Unverified listing", organizer: "Unknown", startDate, eventUrl: "https://unknown.example/event", registrationUrl: "" },
            { title: "Past Hackathon", organizer: "Example University", startDate: "2020-01-01", eventUrl: officialUrl, registrationUrl: "" },
          ]) }] },
          groundingMetadata: { groundingChunks: [
            { web: { uri: officialUrl, title: "Official event page" } },
            { web: { uri: "https://events.example.edu/register", title: "Official registration" } },
          ] },
        }],
      }),
    });

    const result = await handleHackathonsRequest({ region: "Karnataka" }, "test-key");
    expect(result.status).toBe(200);
    expect(result.body.events).toHaveLength(1);
    expect(result.body.events[0].title).toBe("Student Hackathon");
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("gemini-3.8-flash:generateContent"),
      expect.objectContaining({ body: expect.stringContaining('"google_search"') })
    );
  });

  test("returns only internship listings with official cited source and valid application URL", async () => {
    const officialUrl = "https://careers.example.com/internships";
    const applicationUrl = "https://careers.example.com/apply/intern";
    const deadline = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        candidates: [{
          content: { parts: [{ text: JSON.stringify([
            { title: "Software Engineering Intern", organizer: "Example Corp", location: "Bengaluru", mode: "Hybrid", domain: "Software", applicationDeadline: deadline, applicationFee: "No application fee", applicationUrl, officialUrl },
            { title: "Unverified internship", organizer: "Unknown", applicationDeadline: deadline, applicationFee: "No application fee", applicationUrl: "https://unknown.example/apply", officialUrl: "https://unknown.example/jobs" },
            { title: "Fee not stated internship", organizer: "Example Corp", applicationDeadline: deadline, applicationFee: "", applicationUrl, officialUrl },
            { title: "Expired internship", organizer: "Example Corp", applicationDeadline: "2020-01-01", applicationFee: "No application fee", applicationUrl, officialUrl },
          ]) }] },
          groundingMetadata: { groundingChunks: [{ web: { uri: officialUrl, title: "Official careers page" } }, { web: { uri: applicationUrl, title: "Apply" } }] },
        }],
      }),
    });

    const result = await handleHackathonsRequest({ type: "internships", region: "Karnataka" }, "test-key");
    expect(result.status).toBe(200);
    expect(result.body.internships).toHaveLength(1);
    expect(result.body.internships[0].title).toBe("Software Engineering Intern");
  });

  test("builds a date-checked study plan using only the supplied subjects", async () => {
    const startDate = new Date().toISOString().slice(0, 10);
    const nextDate = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ candidates: [{ content: { parts: [{ text: JSON.stringify({
        title: "Two-day revision plan",
        summary: "Alternate concepts and practice.",
        days: [
          { day: 1, date: startDate, sessions: [{ subject: "Mathematics", focus: "Review a syllabus unit of your choice", activity: "Review notes and solve practice questions", minutes: 60, method: "Active recall, then check your work." }] },
          { day: 2, date: nextDate, sessions: [{ subject: "Physics", focus: "Review a syllabus unit of your choice", activity: "Revise concepts and practice problems", minutes: 90, method: "Use closed-book recall before checking notes." }] },
        ],
      }) }] } }] }),
    });

    const result = await handleGeminiRequest({ mode: "study-plan", subjects: ["Mathematics", "Physics"], studyDays: 2, studyHours: 2, startDate }, "test-key");
    expect(result.status).toBe(200);
    expect(result.body.plan.days).toHaveLength(2);
    expect(result.body.plan.days[1].sessions[0].subject).toBe("Physics");
    expect(JSON.parse(global.fetch.mock.calls[0][1].body).generationConfig.responseMimeType).toBe("application/json");
  });

  test("validates study plan input before calling Gemini", async () => {
    global.fetch = jest.fn();
    const result = await handleGeminiRequest({ mode: "study-plan", subjects: [], studyDays: 0 }, "test-key");
    expect(result.status).toBe(400);
    expect(global.fetch).not.toHaveBeenCalled();
  });
});
