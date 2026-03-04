// Handles Meta OAuth callback and stores tokens
import { initializeApp, getApps } from "firebase/app";
import { getFirestore, doc, setDoc } from "firebase/firestore";

function getDb() {
  if (!getApps().length) {
    initializeApp({
      apiKey: process.env.VITE_FIREBASE_API_KEY,
      authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.VITE_FIREBASE_PROJECT_ID,
    });
  }
  return getFirestore();
}

export default async function handler(req, res) {
  const { code, state, error } = req.query;

  if (error) {
    return res.redirect(`https://geofence-dashboard.vercel.app?error=meta_auth_denied`);
  }

  try {
    const redirectUri = "https://geofence-dashboard.vercel.app/api/meta-callback";

    // Exchange code for access token
    const tokenRes = await fetch(
      `https://graph.facebook.com/v19.0/oauth/access_token?` +
      new URLSearchParams({
        client_id: process.env.META_APP_ID,
        client_secret: process.env.META_APP_SECRET,
        redirect_uri: redirectUri,
        code,
      })
    );
    const tokenData = await tokenRes.json();
    if (!tokenData.access_token) throw new Error("No access token");

    // Get long-lived token (60 days)
    const longTokenRes = await fetch(
      `https://graph.facebook.com/v19.0/oauth/access_token?` +
      new URLSearchParams({
        grant_type: "fb_exchange_token",
        client_id: process.env.META_APP_ID,
        client_secret: process.env.META_APP_SECRET,
        fb_exchange_token: tokenData.access_token,
      })
    );
    const longToken = await longTokenRes.json();
    const finalToken = longToken.access_token || tokenData.access_token;

    // Get user info
    const userRes = await fetch(
      `https://graph.facebook.com/v19.0/me?fields=id,name,email&access_token=${finalToken}`
    );
    const userInfo = await userRes.json();

    // Get ad accounts
    const adAccountsRes = await fetch(
      `https://graph.facebook.com/v19.0/me/adaccounts?fields=id,name,account_status&access_token=${finalToken}`
    );
    const adAccountsData = await adAccountsRes.json();
    const adAccounts = adAccountsData.data || [];

    // Save to Firebase
    const db = getDb();
    const docId = state && state !== "self" ? `client_${state}_meta` : `user_${userInfo.id}_meta`;

    await setDoc(doc(db, "adConnections", docId), {
      platform: "meta",
      userId: userInfo.id,
      name: userInfo.name,
      email: userInfo.email,
      accessToken: finalToken,
      adAccounts,
      connectedAt: new Date().toISOString(),
      clientId: state !== "self" ? state : null,
    });

    res.redirect(`https://geofence-dashboard.vercel.app?meta_connected=true&client=${state}`);
  } catch (e) {
    console.error("Meta callback error:", e);
    res.redirect(`https://geofence-dashboard.vercel.app?error=meta_auth_failed`);
  }
}
