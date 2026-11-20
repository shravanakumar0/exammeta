require("dotenv").config();

const { handleGeminiRequest } = require("./geminiHandler");
const { handleHackathonsRequest } = require("./hackathonsHandler");
const { handleInternshipsRequest } = require("./internshipsHandler");
const API_PATHS = new Set(["/api/gemini", "/api/hackathons", "/api/internships"]);
const MAX_BODY_LENGTH = 500000;

function handleApiRequest(request, response) {
  const path = new URL(request.url, "http://localhost").pathname;
  if (request.method !== "POST" || !API_PATHS.has(path)) return false;

  let raw = "";
  let tooLarge = false;
  request.on("data", chunk => {
    if (tooLarge) return;
    raw += chunk;
    if (raw.length > MAX_BODY_LENGTH && !tooLarge) {
      tooLarge = true;
      response.writeHead(413, { "Content-Type": "application/json; charset=utf-8" })
        .end(JSON.stringify({ error: "Request is too large." }));
    }
  });
  request.on("end", async () => {
    if (tooLarge) return;
    response.setHeader("Content-Type", "application/json; charset=utf-8");
    try {
      const body = JSON.parse(raw);
      const result = path === "/api/hackathons"
        ? await handleHackathonsRequest(body)
        : path === "/api/internships"
          ? await handleInternshipsRequest(body)
          : await handleGeminiRequest(body);
      response.writeHead(result.status).end(JSON.stringify(result.body));
    } catch {
      if (!response.headersSent) {
        response.writeHead(400).end(JSON.stringify({ error: "Invalid AI request." }));
      }
    }
  });
  return true;
}

module.exports = { handleApiRequest };
