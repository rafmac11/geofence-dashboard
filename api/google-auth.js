// Starts Google OAuth flow for Google Ads access
export default function handler(req, res) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const redirectUri = "https://geofence-dashboard.vercel.app/api/google-callback";
  const scope = [
    "https://www.googleapis.com/auth/adwords",
    "https://www.googleapis.com/auth/userinfo.email",
  ].join(" ");

  const { clientId: passedClientId } = req.query;

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope,
    access_type: "offline",
    prompt: "consent",
    state: passedClientId || "self",
  });

  res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`);
}
