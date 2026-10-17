const { handleHackathonsRequest } = require("../../server/hackathonsHandler");

exports.handler = async event => {
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
