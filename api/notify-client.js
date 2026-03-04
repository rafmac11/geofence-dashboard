// Sends email notification to client when campaign goes live
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { clientEmail, clientName, campaignName, platform, location, budget, launchedBy } = req.body;
  if (!clientEmail || !campaignName) return res.status(400).json({ error: "Missing fields" });

  // Use Anthropic API to generate a personalized notification email
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
        content: `Write a short, professional email notifying a client their ad campaign just went live. 
        Client name: ${clientName || "there"}
        Campaign: ${campaignName}
        Platform: ${platform}
        Location: ${location}
        Daily Budget: $${budget}/day
        Launched by: ${launchedBy}
        
        Keep it under 100 words. Friendly and professional. No subject line needed. Just the body.`
      }]
    })
  });

  const aiData = await response.json();
  const emailBody = aiData.content?.[0]?.text || `Hi ${clientName}, your campaign "${campaignName}" on ${platform} targeting ${location} is now live with a $${budget}/day budget.`;

  // In production you'd use SendGrid/Resend/Postmark here
  // For now we return the generated email so it can be copied/sent manually
  res.json({
    success: true,
    to: clientEmail,
    subject: `🚀 Your campaign "${campaignName}" is now live!`,
    body: emailBody,
    note: "Copy this email and send it to your client, or connect SendGrid to automate delivery."
  });
}
