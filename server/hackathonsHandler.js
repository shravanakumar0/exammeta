const SEARCH_MODEL = "gemini-3.8-flash";

const isSafeHttpUrl = value => {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "https:";
  } catch {
    return false;
  }
};

async function handleHackathonsRequest(body = {}, apiKey = process.env.GEMINI_API_KEY) {
  const type = body.type === "internships" ? "internships" : "hackathons";
  const resultKey = type === "internships" ? "internships" : "events";
  if (!apiKey) {
    return { status: 503, body: { error: `Live ${type} search is not configured. Set a rotated GEMINI_API_KEY in the server environment.` } };
  }
  const region = body.region === "Karnataka" ? "Karnataka, India" : "India";
  const topic = String(body.query || "").trim().slice(0, 100);
  const today = new Date().toISOString().slice(0, 10);
  const prompt = type === "internships"
    ? `Search Google for real, currently open student internships in ${region}${topic ? ` related to ${topic}` : ""}. Today is ${today}. Use only official employer career pages or authorized application pages. Return only postings with a verifiable active application page and explicit official confirmation that applying is free with no application or registration fee. Do not infer that an internship is free because no fee was mentioned. Exclude expired, sample, demo, and unverified listings. Do not guess dates or details. Do not conflate application fees with whether the internship pays a stipend. Return ONLY a JSON array (no markdown), each item with: title, organizer (employer), location, mode (In-person, Online, Hybrid, or empty), domain, applicationDeadline (YYYY-MM-DD or empty), applicationFee (exactly "No application fee" only when explicitly verified by the cited page), applicationUrl (official HTTPS application page), officialUrl (official HTTPS source page). Limit to 12.`
    : `Search Google for real, upcoming hackathons in ${region}${topic ? ` related to ${topic}` : ""}. Today is ${today}. Return ONLY events that are confirmed by an official organizer or registration page, have a future start date, and are not demos, sample listings, cancelled events, or already-ended events. Include events even if registration has not opened yet, but then set registrationUrl to an empty string. Do not guess missing values. Return ONLY a JSON array (no markdown), each item with: title, organizer, startDate (YYYY-MM-DD), endDate (YYYY-MM-DD or empty), location (city/state or Online), mode (In-person, Online, or Hybrid), eventUrl (official event page URL), registrationUrl (official registration URL or empty). If you cannot verify the official page and future date, omit the event. Limit to 12 events.`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 45000);
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${SEARCH_MODEL}:generateContent`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        tools: [{ google_search: {} }],
        generationConfig: { temperature: 0.1, responseMimeType: "application/json" },
      }),
      signal: controller.signal,
    });
    let data;
    try {
      data = await response.json();
    } catch {
      return { status: 502, body: { error: "Google-grounded search returned an unreadable response. Please retry." } };
    }
    if (!response.ok) {
      const detail = String(data?.error?.message || "");
      const invalidKey = [401, 403].includes(response.status) || /api.?key.*(invalid|not valid)|API_KEY_INVALID|permission denied/i.test(detail);
      if (invalidKey) {
        return { status: 502, body: { error: "Gemini rejected the server API key. Check GEMINI_API_KEY and Gemini API access for its Google project." } };
      }
      if (response.status === 429) {
        return { status: 429, body: { error: "Live hackathon search quota is exhausted or rate-limited. Check Google AI Studio and Google Search grounding usage, then retry." } };
      }
      return { status: 502, body: { error: detail || `Google-grounded event search failed (HTTP ${response.status}).` } };
    }
    const candidate = data?.candidates?.[0];
    const text = candidate?.content?.parts?.map(part => part.text || "").join("\n").trim() || "[]";
    const citations = candidate?.groundingMetadata?.groundingChunks || [];
    const sourceUrls = new Set(citations.map(chunk => chunk.web?.uri).filter(isSafeHttpUrl));
    const parsed = JSON.parse(text.replace(/^```(?:json)?\s*|\s*```$/g, ""));
    if (!Array.isArray(parsed)) throw new Error("Expected a list of results.");

    if (type === "internships") {
      const internships = parsed.filter(item => {
        const officialUrl = String(item.officialUrl || "");
        const applicationUrl = String(item.applicationUrl || "");
        const deadline = String(item.applicationDeadline || "");
        const validDeadline = !deadline || (/^\d{4}-\d{2}-\d{2}$/.test(deadline) && deadline >= today);
        const title = String(item.title || "");
        return Boolean(title && item.organizer && String(item.applicationFee || "").toLowerCase() === "no application fee" &&
          !/(demo|sample|test|expired|closed)/i.test(`${title} ${deadline}`) &&
          isSafeHttpUrl(officialUrl) && sourceUrls.has(officialUrl) && isSafeHttpUrl(applicationUrl) && sourceUrls.has(applicationUrl) && validDeadline);
      }).slice(0, 12);
      const sources = citations.map(chunk => chunk.web).filter(source => isSafeHttpUrl(source?.uri));
      return { status: 200, body: { internships, sources, searchedAt: new Date().toISOString() } };
    }

    const events = parsed.filter(event => {
      const startDate = /^\d{4}-\d{2}-\d{2}$/.test(event.startDate || "") ? event.startDate : "";
      const eventUrl = String(event.eventUrl || "");
      const registrationUrl = String(event.registrationUrl || "");
      const title = String(event.title || "");
      return Boolean(
        title && !/(demo|sample|test event|cancelled|canceled)/i.test(title) &&
        startDate > today && isSafeHttpUrl(eventUrl) && sourceUrls.has(eventUrl) &&
        (!registrationUrl || (isSafeHttpUrl(registrationUrl) && sourceUrls.has(registrationUrl)))
      );
    }).slice(0, 12);
    const sources = citations.map(chunk => chunk.web).filter(source => isSafeHttpUrl(source?.uri));
    return { status: 200, body: { [resultKey]: events, sources, searchedAt: new Date().toISOString() } };
  } catch (error) {
    return { status: 502, body: { error: error.name === "AbortError" ? "Event search timed out. Try again." : "Could not verify current event listings. Try again later." } };
  } finally {
    clearTimeout(timeout);
  }
}

module.exports = { handleHackathonsRequest };
