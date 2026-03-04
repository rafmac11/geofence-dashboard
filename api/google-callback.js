// Handles Google OAuth callback and stores tokens in Firebase
import { initializeApp, getApps } from "firebase/app";
import { getFirestore, doc, setDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
};

function getDb() {
  if (!getApps().length) initializeApp(firebaseConfig);
  return getFirestore();
}

export default async function handler(req, res) {
  const { code, state, error } = req.query;

  if (error) {
    return res.redirect(`https://geofence-dashboard.vercel.app?error=google_auth_denied`);
  }

  try {
    // Exchange code for tokens
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: "https://geofence-dashboard.vercel.app/api/google-callback",
        grant_type: "authorization_code",
      }),
    });

    const tokens = await tokenRes.json();
    if (!tokens.access_token) throw new Error("No access token received");

    // Get user email
    const userRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });
    const userInfo = await userRes.json();

    // Get Google Ads customer accounts
    const adsRes = await fetch(
      "https://googleads.googleapis.com/v14/customers:listAccessibleCustomers",
      {
        headers: {
          Authorization: `Bearer ${tokens.access_token}`,
          "developer-token": process.env.GOOGLE_ADS_DEVELOPER_TOKEN,
        },
      }
    );
    const adsData = await adsRes.json();
    const customerIds = (adsData.resourceNames || []).map(r => r.replace("customers/", ""));

    // Save to Firebase under the client ID (state) or "self"
    const db = getDb();
    const docId = state && state !== "self" ? `client_${state}` : `user_${userInfo.email.replace(/[^a-z0-9]/gi, "_")}`;
    
    await setDoc(doc(db, "adConnections", docId), {
      platform: "google",
      email: userInfo.email,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      customerIds,
      connectedAt: new Date().toISOString(),
      clientId: state !== "self" ? state : null,
    });

    res.redirect(`https://geofence-dashboard.vercel.app?google_connected=true&client=${state}`);
  } catch (e) {
    console.error(e);
    res.redirect(`https://geofence-dashboard.vercel.app?error=google_auth_failed`);
  }
}
