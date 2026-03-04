export default async function handler(req, res) {
  // Only allow POST
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { prompt, goal, platform, ageMin, ageMax, interests, location } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: "Prompt is required" });
  }

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 500,
        messages: [{
          role: "user",
          content: `You are an expert geofencing ad copywriter. Write a high-converting local ad.

Business/offer: ${prompt}
Campaign goal: ${goal || "drive foot traffic"}
Platform: ${platform || "digital ads"}
Target audience: Ages ${ageMin || 18}-${ageMax || 55}, interests: ${interests?.join(", ") || "general"}
Location: ${location || "local area"}

Respond ONLY with valid JSON, no markdown, no backticks, no explanation:
{"name":"short campaign name max 40 chars","headline":"attention-grabbing headline max 55 chars","body":"compelling body with offer or urgency max 130 chars","cta":"one of: Visit Us Today, Get Directions, Shop Now, Claim Offer, Learn More, Book Now"}`
        }]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Anthropic error:", data);
      return res.status(500).json({ error: "AI generation failed" });
    }

    const text = data.content?.[0]?.text || "";
    const parsed = JSON.parse(text.trim());
    return res.status(200).json(parsed);

  } catch (error) {
    console.error("Server error:", error);
    return res.status(500).json({ error: "Server error: " + error.message });
  }
}
