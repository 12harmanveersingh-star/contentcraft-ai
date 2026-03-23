exports.handler = async function(event, context) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: JSON.stringify({ error: "Method not allowed" }) };
  }
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json"
  };
  try {
    const { prompt } = JSON.parse(event.body);
    if (!prompt || prompt.trim().length < 3) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: "Prompt bahut chhota hai!" }) };
    }
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return { statusCode: 500, headers, body: JSON.stringify({ error: "API key configure nahi hui." }) };
    }
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 1000,
        messages: [{ role: "user", content: prompt }]
      })
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      if (response.status === 429) return { statusCode: 429, headers, body: JSON.stringify({ error: "AI busy hai! Thodi der baad try karo. ⏳" }) };
      if (response.status === 401) return { statusCode: 401, headers, body: JSON.stringify({ error: "API key galat hai! 🔑" }) };
      return { statusCode: response.status, headers, body: JSON.stringify({ error: err.error?.message || "Server error" }) };
    }
    const data = await response.json();
    const text = data.content?.[0]?.text || "Kuch output nahi mila.";
    return { statusCode: 200, headers, body: JSON.stringify({ text }) };
  } catch (err) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: "Network error: " + err.message }) };
  }
};
