export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { to, clientName, subject, body } = req.body;
  if (!to || !body) return res.status(400).json({ error: "Missing fields" });

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Rafael <rafael@webleadsnow.com>",
        to: [to],
        subject: subject || `Action needed: Grant ad access for your campaigns`,
        text: body,
        html: body
          .split("\n\n")
          .map(p => p.startsWith("━") 
            ? `<hr style="border:1px solid #22c55e;margin:16px 0"><strong style="color:#1a4731">${p.replace(/━+/g, "").trim()}</strong>`
            : `<p style="margin:0 0 12px;line-height:1.6">${p.replace(/\n/g, "<br>")}</p>`
          )
          .join("")
          .replace(
            /<p[^>]*>(.*?)<\/p>/g,
            (m, t) => `<p style="margin:0 0 12px;line-height:1.6;font-family:Arial,sans-serif;font-size:14px;color:#1a2e1a">${t}</p>`
          ),
      }),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Resend error");

    res.json({ success: true, id: data.id });
  } catch (e) {
    console.error("Resend error:", e);
    res.status(500).json({ error: e.message });
  }
}
