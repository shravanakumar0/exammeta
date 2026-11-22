const {
  handleHackathonsRequest,
} = require("../../server/hackathonsHandler");

exports.handler = async event => {
  if (event.httpMethod === "GET") {
    try {
      const result = await handleHackathonsRequest({ region: "India" });
      return {
        statusCode: result.status,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": result.status === 200 ? "public, max-age=3600" : "no-store",
        },
        body: JSON.stringify(result.body),
      };
    } catch (error) {
      console.error("Hackathon feed request failed:", error.message);
      return {
        statusCode: 502,
        headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
        body: JSON.stringify({ error: "Could not load hackathon listings. Please try again." }),
      };
    }
  }

  if (event.httpMethod !== "POST") {
    return { statusCode: 405, headers: { Allow: "POST" }, body: JSON.stringify({ error: "Method not allowed." }) };
  }
  try {
    const result = await handleHackathonsRequest(JSON.parse(event.body || "{}"));
    return {
      statusCode: result.status,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify(result.body),
    };
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: "Invalid search request." }) };
  }
};
