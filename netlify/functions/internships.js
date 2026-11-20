const { handleInternshipsRequest } = require("../../server/internshipsHandler");

exports.handler = async event => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, headers: { Allow: "POST", "Content-Type": "application/json" }, body: JSON.stringify({ error: "Method not allowed." }) };
  }
  try {
    const result = await handleInternshipsRequest(JSON.parse(event.body || "{}"));
    return { statusCode: result.status, headers: { "Content-Type": "application/json" }, body: JSON.stringify(result.body) };
  } catch {
    return { statusCode: 400, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ error: "Invalid internship search request." }) };
  }
};
