// Starts Meta OAuth flow for Marketing API access
export default function handler(req, res) {
  const { clientId } = req.query;
  const appId = process.env.META_APP_ID;
  const redirectUri = "https://geofence-dashboard.vercel.app/api/meta-callback";

  const scope = [
    "ads_management",
    "ads_read",
    "business_management",
    "pages_read_engagement",
  ].join(",");

  const params = new URLSearchParams({
    client_id: appId,
    redirect_uri: redirectUri,
    scope,
    response_type: "code",
    state: clientId || "self",
  });

  res.redirect(`https://www.facebook.com/v19.0/dialog/oauth?${params}`);
}
