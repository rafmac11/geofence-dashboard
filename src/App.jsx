const DARK = {
  bg: "#0a0f0a",
  headerBg: "#060c06",
  card: "#0d1a0d",
  input: "#060c06",
  border: "#1f3d1f",
  text: "#e8f5e8",
  muted: "#4d7a4d",
  accent: "#22c55e",
};

const LIGHT = {
  bg: "#f4f9f4",
  headerBg: "#ffffff",
  card: "#ffffff",
  input: "#f4f9f4",
  border: "#d1e8d1",
  text: "#1a2e1a",
  muted: "#5a8a5a",
  accent: "#16a34a",
};

import { useState, useEffect, useRef } from "react";
import { saveCampaign, loadCampaigns, updateCampaign, deleteCampaign, signInWithGoogle, signOutUser, auth, saveClient, loadClients, updateClient, deleteClient } from "./firebase.js";
import { onAuthStateChanged } from "firebase/auth";

const STEPS = ["Goal", "Platform", "Geofence", "Audience", "Creative", "Budget", "Launch"];

const GOALS = [
  { id: "foottraffic", icon: "🏪", label: "Drive Foot Traffic", desc: "Get more people into your physical location" },
  { id: "conquest", icon: "⚔️", label: "Conquer Competitors", desc: "Target customers at rival locations" },
  { id: "events", icon: "🎯", label: "Event Targeting", desc: "Reach attendees at specific venues" },
  { id: "retarget", icon: "🔁", label: "Retargeting", desc: "Re-engage past visitors and prospects" },
  { id: "awareness", icon: "📣", label: "Brand Awareness", desc: "Increase local brand visibility" },
];

const PLATFORMS = [
  { id: "google", name: "Google Ads", logo: "G", color: "#4285F4", best: "Search intent + Maps", minBudget: 500 },
  { id: "meta", name: "Meta Ads", logo: "f", color: "#1877F2", best: "Demographics + social", minBudget: 300 },
  { id: "groundtruth", name: "GroundTruth", logo: "GT", color: "#FF6B35", best: "Precise polygon fencing", minBudget: 1000 },
  { id: "simpli", name: "Simpli.fi", logo: "S", color: "#00C851", best: "Programmatic + hyperlocal", minBudget: 1500 },
  { id: "tiktok", name: "TikTok Ads", logo: "T", color: "#010101", best: "18–35 demographics", minBudget: 500 },
  { id: "snapchat", name: "Snapchat", logo: "👻", color: "#FFFC00", best: "Gen Z + youth audience", minBudget: 400 },
];

const INTERESTS = ["Shoppers", "Sports Fans", "Foodies", "Tech Enthusiasts", "Parents", "Commuters", "Travelers", "Fitness", "Homeowners", "Renters", "DIY & Home Improvement", "Luxury Buyers"];

const BUDGET_RECS = {
  foottraffic: { google: [30,50], meta: [20,40], groundtruth: [50,100], simpli: [60,120], tiktok: [25,50], snapchat: [20,40] },
  conquest:    { google: [50,100], meta: [30,60], groundtruth: [80,150], simpli: [80,160], tiktok: [30,60], snapchat: [25,50] },
  events:      { google: [40,80], meta: [25,50], groundtruth: [60,120], simpli: [60,120], tiktok: [30,60], snapchat: [30,60] },
  retarget:    { google: [20,40], meta: [15,30], groundtruth: [40,80], simpli: [50,100], tiktok: [20,40], snapchat: [15,30] },
  awareness:   { google: [25,50], meta: [20,40], groundtruth: [50,100], simpli: [50,100], tiktok: [20,40], snapchat: [20,40] },
};

const PLATFORM_CHECKLIST = {
  google: [
    { step: "Sign in to Google Ads", url: "https://ads.google.com", detail: "Go to ads.google.com and sign in or create an account." },
    { step: "Create a new campaign", url: "", detail: "Click '+ New Campaign' → Choose your goal (Visits, Awareness, etc.)" },
    { step: "Set location targeting", url: "", detail: "Under Settings → Locations → Advanced search → Radius targeting. Enter your address and set your radius." },
    { step: "Set your budget & bidding", url: "", detail: "Enter your daily budget. Use 'Maximize Clicks' to start, switch to Target CPA after 30 conversions." },
    { step: "Create your ad", url: "", detail: "Use the headline and body copy from your campaign brief below. Add all 3 headline variations for best performance." },
    { step: "Enable Location Extensions", url: "", detail: "Under Ads & Extensions → Extensions → Location. This shows your address in the ad." },
    { step: "Set ad schedule", url: "", detail: "Under Settings → Ad Schedule. Run ads only during business hours to save budget." },
    { step: "Launch & monitor", url: "", detail: "Click Publish. Check performance daily for the first week. Pause keywords with 0 clicks after 2 weeks." },
  ],
  meta: [
    { step: "Open Meta Ads Manager", url: "https://www.facebook.com/adsmanager", detail: "Go to facebook.com/adsmanager. You need a Business Page to run ads." },
    { step: "Create a new campaign", url: "", detail: "Click '+ Create' → Choose objective: Traffic (website clicks) or Store Traffic (foot visits)." },
    { step: "Set location at Ad Set level", url: "", detail: "Under Audience → Locations → Drop Pin → enter your address → set radius 1–5 miles. Select 'People recently in this location'." },
    { step: "Define your audience", url: "", detail: "Age: match your campaign settings. Interests: add relevant categories. Detailed targeting expansion: ON for more reach." },
    { step: "Set your budget", url: "", detail: "Set your daily budget. Use Campaign Budget Optimization (CBO) if running multiple ad sets." },
    { step: "Create your ad", url: "", detail: "Upload your image/video. Paste your headline and body copy from the brief below. Add your website URL." },
    { step: "Install Meta Pixel", url: "https://www.facebook.com/business/help/952192354843755", detail: "Add the Pixel to your website for retargeting future visitors. Essential for measuring conversions." },
    { step: "Launch & monitor", url: "", detail: "Click Publish. Give it 3–5 days before judging performance — Meta's algorithm needs time to optimize." },
  ],
  groundtruth: [
    { step: "Contact GroundTruth sales", url: "https://www.groundtruth.com/contact/", detail: "GroundTruth requires direct contact. Request a managed campaign or self-serve platform access." },
    { step: "Define your geofence polygon", url: "", detail: "Provide the exact address(es) to fence. GroundTruth can fence individual buildings, parking lots, or event venues precisely." },
    { step: "Set up conversion zone", url: "", detail: "Define your own location as a 'conversion zone' so GroundTruth can measure foot traffic lift from your ads." },
    { step: "Upload your creative", url: "", detail: "Provide banner ads in standard IAB sizes: 300x250, 320x50, 728x90. Use your headline and body copy from the brief." },
    { step: "Set audience targeting", url: "", detail: "Add demographic filters: age, gender, interests. Enable Venue Replay to retarget past visitors." },
    { step: "Set flight dates & budget", url: "", detail: "Minimum $1,000 recommended. Set start/end dates. GroundTruth will pace your budget automatically." },
    { step: "Review & approve", url: "", detail: "GroundTruth reviews all campaigns before launch (usually 24–48 hours). Ensure creative meets their specs." },
    { step: "Monitor walk-in attribution", url: "", detail: "Track verified store visits in your dashboard. Compare to pre-campaign baseline to measure true lift." },
  ],
  simpli: [
    { step: "Sign up for Simpli.fi", url: "https://simpli.fi/contact/", detail: "Contact Simpli.fi for platform access. Minimum spend is typically $1,500/month." },
    { step: "Choose targeting type", url: "", detail: "Select Geofencing, Addressable Geofencing (by address list), or Search Retargeting (by keyword)." },
    { step: "Upload address list (if addressable)", url: "", detail: "Export addresses from your CRM or mailing list. Upload as CSV. Simpli.fi matches to device IDs." },
    { step: "Set geofence boundaries", url: "", detail: "Draw your target area on the map. You can target multiple locations simultaneously." },
    { step: "Upload creative assets", url: "", detail: "Provide HTML5 or image banners. Standard sizes: 300x250, 728x90, 160x600, 320x50." },
    { step: "Configure campaign settings", url: "", detail: "Set flight dates, daily cap, frequency cap (recommend max 5 impressions/user/day), and bid price." },
    { step: "Enable conversion tracking", url: "", detail: "Place their conversion pixel on your thank-you page or use their foot traffic attribution tool." },
    { step: "Launch & optimize", url: "", detail: "Review performance at 72 hours. Adjust bids for high-performing placements. Pause underperforming sites." },
  ],
  tiktok: [
    { step: "Open TikTok Ads Manager", url: "https://ads.tiktok.com", detail: "Go to ads.tiktok.com. Create a Business Account if you don't have one." },
    { step: "Create a new campaign", url: "", detail: "Click '+ Create' → Choose objective: Traffic, Conversions, or Reach. Minimum budget $50/day." },
    { step: "Set location at Ad Group level", url: "", detail: "Under Audience → Location → select your country → choose City or DMA region. TikTok doesn't support radius targeting." },
    { step: "Define audience", url: "", detail: "Age: set to match your campaign. Interests: add relevant categories. Behavior: add relevant actions." },
    { step: "Set budget & schedule", url: "", detail: "Set daily budget ($20+ minimum per ad group). Schedule ads during peak hours for your audience." },
    { step: "Create your TikTok ad", url: "", detail: "Upload a vertical video (9:16, 15–60 seconds). Add text overlay with your headline. Include clear CTA button." },
    { step: "Enable TikTok Pixel", url: "https://ads.tiktok.com/help/article/tiktok-pixel", detail: "Install the TikTok Pixel on your website to track conversions and build retargeting audiences." },
    { step: "Launch & monitor", url: "", detail: "Allow 7 days before optimizing — TikTok's algorithm needs data. Refresh creative every 2 weeks to avoid fatigue." },
  ],
  snapchat: [
    { step: "Open Snapchat Ads Manager", url: "https://ads.snapchat.com", detail: "Go to ads.snapchat.com. Create a Business Account with your Snapchat account." },
    { step: "Create a new campaign", url: "", detail: "Click '+ New Campaign' → Choose goal: Awareness, Traffic, or Conversions." },
    { step: "Set location targeting", url: "", detail: "Under Audience → Demographics → Location. Select cities or zip codes near your target area." },
    { step: "Define your audience", url: "", detail: "Age range (note: Snapchat skews 13–34). Add Lifestyle Categories relevant to your business." },
    { step: "Set budget", url: "", detail: "Minimum $5/day. Recommended $20–50/day for local campaigns. Run Thursday–Sunday for best results." },
    { step: "Create your Snap Ad", url: "", detail: "Upload a vertical video or image (9:16). Keep it under 10 seconds. Add your headline as text overlay. Include swipe-up URL." },
    { step: "Add Snap Pixel", url: "https://businesshelp.snap.com/s/article/snap-pixel-about", detail: "Install the Snap Pixel for conversion tracking and to build Custom Audiences for retargeting." },
    { step: "Launch & monitor", url: "", detail: "Check Story completion rate (aim for 50%+). Refresh creative every 2 weeks — Snapchat audiences fatigue quickly." },
  ],
};


const CONTRACTOR_TEMPLATES = [
  {
    id: "concrete",
    icon: "🏗️",
    label: "Concrete Contractor",
    color: "#94a3b8",
    description: "Driveways, patios, foundations",
    campaign: {
      goal: "conquest",
      platform: "meta",
      radius: 2,
      ageMin: 35,
      ageMax: 65,
      gender: "all",
      interests: ["Homeowners", "DIY & Home Improvement"],
      headline: "Maple Grove's #1 Concrete Contractor",
      body: "Cracked or faded driveway? We replace concrete driveways, patios & sidewalks. Free estimates — local, licensed & insured. Call today!",
      cta: "Get Free Estimate",
      dailyBudget: 40,
      duration: 30,
      name: "Concrete — Neighborhood Targeting",
    },
    targetIdeas: [
      "Home Depot / Menards parking lots",
      "Upscale residential neighborhoods",
      "Real estate open houses",
      "Landscape supply stores",
      "HOA meeting locations",
    ],
    audienceTip: "Target homeowners 35-65 in neighborhoods where homes are 15-25 years old — driveways need replacing every 20-30 years.",
    budgetTip: "Start with $40/day Meta + $30/day Google. One concrete job ($3,000-8,000) pays for months of ads.",
    adTips: [
      "Show before/after photos — dramatic visual impact",
      "Mention financing options if available",
      "Include 'Free Estimate' as your CTA always",
      "Run seasonal: Spring (post-winter damage) and Fall (before freeze)",
    ],
  },
  {
    id: "roofing",
    icon: "🏠",
    label: "Roofing Contractor",
    color: "#f97316",
    description: "Roof replacement, repair, inspections",
    campaign: {
      goal: "foottraffic",
      platform: "google",
      radius: 5,
      ageMin: 35,
      ageMax: 65,
      gender: "all",
      interests: ["Homeowners", "DIY & Home Improvement", "Luxury Buyers"],
      headline: "Storm Damage? Free Roof Inspection",
      body: "Licensed roofing contractor serving the Twin Cities. Insurance claims welcome. Free inspections — same week appointments available. 20+ years experience.",
      cta: "Schedule Inspection",
      dailyBudget: 60,
      duration: 30,
      name: "Roofing — Storm Season Campaign",
    },
    targetIdeas: [
      "Insurance agent offices",
      "Home improvement stores (Home Depot, Menards, Lowe's)",
      "Neighborhoods with older homes (30+ years)",
      "Areas recently hit by hail or windstorm",
      "Competing roofer locations",
      "Real estate offices (buyers need roof inspections)",
    ],
    audienceTip: "After a hail storm, fence the affected zip codes immediately — highest-intent moment for roofing leads.",
    budgetTip: "$50-75/day. One roof replacement = $8,000-20,000. Even 1 job per month at $50/day = massive ROI.",
    adTips: [
      "Lead with insurance — 'We handle your insurance claim'",
      "Use urgency after storms: 'Recent hail damage in your area'",
      "Show your license number and BBB rating",
      "Video ads showing before/after replacements perform best",
    ],
  },
  {
    id: "general",
    icon: "🔨",
    label: "General Contractor",
    color: "#22c55e",
    description: "Remodeling, additions, full renovations",
    campaign: {
      goal: "awareness",
      platform: "meta",
      radius: 10,
      ageMin: 30,
      ageMax: 60,
      gender: "all",
      interests: ["Homeowners", "DIY & Home Improvement", "Luxury Buyers", "Shoppers"],
      headline: "Transform Your Home — Local GC",
      body: "Kitchen remodels, bathroom renovations, room additions & more. Licensed general contractor with 15+ years local experience. Free design consultation.",
      cta: "Get Free Quote",
      dailyBudget: 50,
      duration: 45,
      name: "General Contractor — Home Remodel",
    },
    targetIdeas: [
      "Home & Garden shows / Expo centers",
      "Kitchen & bath showrooms (IKEA, Floor & Decor)",
      "Real estate offices (new buyers renovate)",
      "Luxury neighborhoods",
      "Permit offices (homeowners researching projects)",
      "Interior design studios",
    ],
    audienceTip: "General contractors need longer campaigns (45-60 days) — remodeling decisions take weeks. Retarget anyone who engages.",
    budgetTip: "$50/day across Meta + Google. Kitchen remodel = $25,000-75,000. Budget isn't the issue — trust is. Use ads to build credibility.",
    adTips: [
      "Portfolio photos are everything — show your best work",
      "Collect Google reviews and mention the count in ads",
      "Offer a free design consultation to reduce commitment barrier",
      "Carousel ads work great — show multiple project types",
    ],
  },
  {
    id: "copier",
    icon: "🖨️",
    label: "Copier & MF Printer Sales",
    color: "#3b82f6",
    description: "Office equipment sales, lease & service",
    campaign: {
      goal: "conquest",
      platform: "google",
      radius: 10,
      ageMin: 30,
      ageMax: 60,
      gender: "all",
      interests: ["Tech Enthusiasts", "Shoppers"],
      headline: "Upgrade Your Office Copier — Free Demo",
      body: "Tired of constant breakdowns and high service costs? We sell, lease and service Canon, Konica Minolta & Ricoh multifunction printers. Same-day service. Local dealer — serving the Twin Cities for 20+ years.",
      cta: "Get Free Demo",
      dailyBudget: 35,
      duration: 30,
      name: "Copier & MFP — B2B Office Campaign",
    },
    targetIdeas: [
      "Office parks and business complexes",
      "Competing copier dealer locations (Ricoh, Xerox, Konica dealers)",
      "Staples / Office Depot (people shopping for office equipment)",
      "FedEx / UPS / print shops (businesses with high print needs)",
      "Law offices and medical office buildings",
      "Real estate and accounting offices",
      "Chamber of Commerce events",
      "Business expos and trade shows",
    ],
    audienceTip: "Target decision-makers aged 30-60 in office parks and commercial buildings. Best days: Tuesday–Thursday when office managers are at their desks making purchasing decisions.",
    budgetTip: "$35-50/day on Google Search + Display. One copier lease = $200-500/month for 3-5 years ($7,200–30,000 lifetime value). Service contracts add even more recurring revenue.",
    adTips: [
      "Lead with pain points: 'Tired of your copier breaking down?'",
      "Mention lease options — 'From $99/month' lowers the barrier to yes",
      "Highlight same-day or next-day service as a key differentiator",
      "Target competitor customers: 'Switching from Xerox? We'll beat your current price'",
    ],
  },
];

const BLANK_CAMPAIGN = {
  goal: null, platform: null, location: "", radius: 1, fence_type: "circle",
  ageMin: 18, ageMax: 55, gender: "all", interests: [],
  headline: "", body: "", cta: "Visit Us Today",
  dailyBudget: 50, duration: 14, name: "",
  status: "active", spent: 0, impressions: 0, clicks: 0, conversions: 0,
};

const ALLOWED_EMAILS = [
  "rafael@jrcopier.com",
];

const pulse = `
@keyframes pulse-ring {
  0% { transform: scale(0.8); opacity: 1; }
  100% { transform: scale(2.5); opacity: 0; }
}
@keyframes fadeUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
}
@keyframes spin {
  to { transform: rotate(360deg); }
}
.fade-up { animation: fadeUp 0.4s ease forwards; }
.blink { animation: blink 1.8s infinite; }
`;





// ─── Templates View ────────────────────────────────────────────────────────────

function TemplatesView({ T, onUseTemplate }) {
  const [expanded, setExpanded] = useState(null);

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "40px 32px" }}>
      <div style={{ marginBottom: 32 }}>
        <div style={{ fontSize: 11, color: T.muted, letterSpacing: 3, marginBottom: 4 }}>QUICK START</div>
        <div style={{ fontSize: 26, fontWeight: 700, color: T.text, marginBottom: 8 }}>Campaign Templates</div>
        <div style={{ fontSize: 13, color: T.muted }}>Pre-built campaigns for contractor industries. Click USE TEMPLATE to launch a campaign with everything pre-filled.</div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {CONTRACTOR_TEMPLATES.map(t => (
          <div key={t.id} style={{ background: T.card, border: `1px solid ${expanded === t.id ? t.color : T.border}`, borderRadius: 10, overflow: "hidden", transition: "border-color 0.2s" }}>
            
            {/* Header */}
            <div style={{ padding: "20px 24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <div style={{ fontSize: 32 }}>{t.icon}</div>
                <div>
                  <div style={{ fontSize: 17, fontWeight: 700, color: T.text }}>{t.label}</div>
                  <div style={{ fontSize: 12, color: T.muted }}>{t.description}</div>
                </div>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => setExpanded(expanded === t.id ? null : t.id)}
                  style={{ padding: "8px 16px", background: "transparent", border: `1px solid ${T.border}`, borderRadius: 4, color: T.muted, cursor: "pointer", fontSize: 12 }}>
                  {expanded === t.id ? "LESS ▲" : "DETAILS ▼"}
                </button>
                <button onClick={() => onUseTemplate(t)}
                  style={{ padding: "8px 20px", background: t.color, color: "#000", border: "none", borderRadius: 4, cursor: "pointer", fontWeight: 700, fontSize: 12, letterSpacing: 1 }}>
                  USE TEMPLATE →
                </button>
              </div>
            </div>

            {/* Quick stats bar */}
            <div style={{ borderTop: `1px solid ${T.border}`, display: "flex" }}>
              {[
                ["GOAL", t.campaign.goal?.toUpperCase()],
                ["PLATFORM", t.campaign.platform?.toUpperCase()],
                ["DAILY BUDGET", `$${t.campaign.dailyBudget}/day`],
                ["DURATION", `${t.campaign.duration} days`],
                ["RADIUS", `${t.campaign.radius} mi`],
                ["AUDIENCE", `${t.campaign.ageMin}–${t.campaign.ageMax}`],
              ].map(([label, val]) => (
                <div key={label} style={{ flex: 1, padding: "10px 16px", borderRight: `1px solid ${T.border}` }}>
                  <div style={{ fontSize: 9, color: T.muted, letterSpacing: 1.5, marginBottom: 3 }}>{label}</div>
                  <div style={{ fontSize: 12, color: T.text, fontWeight: 600 }}>{val}</div>
                </div>
              ))}
            </div>

            {/* Expanded details */}
            {expanded === t.id && (
              <div style={{ borderTop: `1px solid ${T.border}`, padding: 24, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
                
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: t.color, letterSpacing: 2, marginBottom: 12 }}>📍 WHERE TO PLACE YOUR FENCE</div>
                  {t.targetIdeas.map((idea, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 8 }}>
                      <span style={{ color: t.color, fontSize: 14, flexShrink: 0 }}>→</span>
                      <span style={{ fontSize: 13, color: T.text }}>{idea}</span>
                    </div>
                  ))}
                </div>

                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: t.color, letterSpacing: 2, marginBottom: 12 }}>💡 AD COPY PREVIEW</div>
                  <div style={{ background: T.bg, border: `1px solid ${T.border}`, borderRadius: 6, padding: 14, marginBottom: 16 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: T.text, marginBottom: 4 }}>{t.campaign.headline}</div>
                    <div style={{ fontSize: 12, color: T.muted, lineHeight: 1.6 }}>{t.campaign.body}</div>
                    <div style={{ marginTop: 8, display: "inline-block", padding: "4px 12px", background: t.color+"33", border: `1px solid ${t.color}`, borderRadius: 3, fontSize: 11, color: t.color, fontWeight: 700 }}>{t.campaign.cta}</div>
                  </div>

                  <div style={{ fontSize: 11, fontWeight: 700, color: t.color, letterSpacing: 2, marginBottom: 8 }}>🎯 AUDIENCE TIP</div>
                  <div style={{ fontSize: 12, color: T.muted, lineHeight: 1.6, marginBottom: 16 }}>{t.audienceTip}</div>

                  <div style={{ fontSize: 11, fontWeight: 700, color: t.color, letterSpacing: 2, marginBottom: 8 }}>💰 BUDGET TIP</div>
                  <div style={{ fontSize: 12, color: T.muted, lineHeight: 1.6 }}>{t.budgetTip}</div>
                </div>

                <div style={{ gridColumn: "span 2", borderTop: `1px solid ${T.border}`, paddingTop: 20 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: t.color, letterSpacing: 2, marginBottom: 12 }}>✅ AD CREATIVE TIPS</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                    {t.adTips.map((tip, i) => (
                      <div key={i} style={{ display: "flex", gap: 8, padding: "10px 14px", background: T.bg, borderRadius: 6, border: `1px solid ${T.border}` }}>
                        <span style={{ color: t.color, flexShrink: 0 }}>✓</span>
                        <span style={{ fontSize: 12, color: T.text, lineHeight: 1.5 }}>{tip}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ gridColumn: "span 2", textAlign: "right" }}>
                  <button onClick={() => onUseTemplate(t)}
                    style={{ padding: "12px 32px", background: t.color, color: "#000", border: "none", borderRadius: 6, cursor: "pointer", fontWeight: 700, fontSize: 14, letterSpacing: 1 }}>
                    🚀 USE THIS TEMPLATE
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Clients View ─────────────────────────────────────────────────────────────

const INDUSTRIES = ["Retail", "Restaurant & Food", "Healthcare", "Automotive", "Real Estate", "Legal", "Home Services", "Fitness & Wellness", "Beauty & Salon", "Education", "Finance", "Technology", "Entertainment", "Non-Profit", "Other"];

const BLANK_CLIENT = {
  businessName: "", contactName: "", email: "", phone: "", website: "",
  industry: "", monthlyBudget: "", contractStart: "", contractEnd: "",
  contractValue: "", billingCycle: "monthly", notes: "", status: "active",
};

function ClientsView({ clients, campaigns, T, onAdd, onEdit, onDelete, onRequestAccess }) {
  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "40px 32px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 32 }}>
        <div>
          <div style={{ fontSize: 11, color: T.muted, letterSpacing: 3, marginBottom: 4 }}>MANAGE — ALL CLIENTS</div>
          <div style={{ fontSize: 26, fontWeight: 700, color: T.text }}>Client Directory</div>
        </div>
        <button onClick={onAdd} style={{ padding: "10px 24px", background: T.accent, color: "#000", border: "none", borderRadius: 4, cursor: "pointer", fontWeight: 700, letterSpacing: 2, fontSize: 12 }}>+ ADD CLIENT</button>
      </div>
      {clients.length === 0 ? (
        <div style={{ background: T.card, border: "1px solid " + T.border, borderRadius: 6, padding: 60, textAlign: "center", color: T.muted }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🏢</div>
          <div style={{ fontSize: 14, marginBottom: 4 }}>No clients yet</div>
          <div style={{ fontSize: 12 }}>Add your first client to get started</div>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 16 }}>
          {clients.map(c => {
            const cc = campaigns.filter(camp => camp.clientId === c.id);
            const active = cc.filter(camp => camp.status === "active").length;
            return (
              <div key={c.id} style={{ background: T.card, border: "1px solid " + T.border, borderRadius: 8, padding: 24 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: T.text, marginBottom: 2 }}>{c.businessName}</div>
                    <div style={{ fontSize: 11, color: T.muted }}>{c.industry}</div>
                  </div>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button onClick={() => onEdit(c)} style={{ padding: "4px 10px", border: "1px solid " + T.border, borderRadius: 4, background: "transparent", color: T.muted, cursor: "pointer", fontSize: 11 }}>EDIT</button>
                    <button onClick={() => onDelete(c.id)} style={{ padding: "4px 10px", border: "1px solid #ef444433", borderRadius: 4, background: "transparent", color: "#ef4444", cursor: "pointer", fontSize: 11 }}>DEL</button>
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 16 }}>
                  {[["Contact", c.contactName],["Email", c.email],["Phone", c.phone],["Budget", c.monthlyBudget ? "$" + Number(c.monthlyBudget).toLocaleString() + "/mo" : "—"],["Contract", c.contractValue ? "$" + Number(c.contractValue).toLocaleString() : "—"],["Billing", c.billingCycle]].map(([label, val]) => (
                    <div key={label}>
                      <div style={{ fontSize: 9, color: T.muted, letterSpacing: 1.5, marginBottom: 2 }}>{label.toUpperCase()}</div>
                      <div style={{ fontSize: 12, color: T.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{val || "—"}</div>
                    </div>
                  ))}
                </div>
                <div style={{ borderTop: "1px solid " + T.border, paddingTop: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ fontSize: 11, color: T.muted }}><span style={{ color: T.accent, fontWeight: 700 }}>{active}</span> active · {cc.length} total campaigns</div>
                  {c.contractEnd && <div style={{ fontSize: 10, color: T.muted }}>Ends: {c.contractEnd}</div>}
                </div>
                <div style={{ marginTop: 12, marginBottom: 8 }}>
                  <button onClick={() => onRequestAccess(c)}
                    style={{ width: "100%", padding: "9px", background: "transparent", border: `1px solid ${T.accent}44`, borderRadius: 4, color: T.accent, cursor: "pointer", fontSize: 11, fontWeight: 700, letterSpacing: 1 }}>
                    🔑 REQUEST AD ACCESS
                  </button>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <a href={`/api/google-auth?clientId=${c.id}`}
                    style={{ flex: 1, padding: "7px 0", background: c.googleConnected ? "#22c55e22" : "transparent", border: "1px solid " + (c.googleConnected ? "#22c55e" : T.border), borderRadius: 4, color: c.googleConnected ? "#22c55e" : T.muted, fontSize: 11, fontWeight: 700, textAlign: "center", textDecoration: "none", letterSpacing: 1 }}>
                    {c.googleConnected ? "✓ GOOGLE" : "＋ GOOGLE"}
                  </a>
                  <a href={`/api/meta-auth?clientId=${c.id}`}
                    style={{ flex: 1, padding: "7px 0", background: c.metaConnected ? "#22c55e22" : "transparent", border: "1px solid " + (c.metaConnected ? "#22c55e" : T.border), borderRadius: 4, color: c.metaConnected ? "#22c55e" : T.muted, fontSize: 11, fontWeight: 700, textAlign: "center", textDecoration: "none", letterSpacing: 1 }}>
                    {c.metaConnected ? "✓ META" : "＋ META"}
                  </a>
                </div>
                {c.notes && <div style={{ marginTop: 10, padding: "8px 12px", background: T.bg, borderRadius: 4, fontSize: 11, color: T.muted, lineHeight: 1.5 }}>{c.notes}</div>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}


// ─── Access Request Modal ───────────────────────────────────────────────────

const GOOGLE_MCC_ID = import.meta.env.VITE_GOOGLE_MCC_ID || "YOUR-MCC-ID";
const META_BUSINESS_ID = import.meta.env.VITE_META_BUSINESS_ID || "YOUR-META-BUSINESS-ID";

function AccessRequestModal({ T, client, onClose }) {
  const [copied, setCopied] = useState("");
  const [activeTab, setActiveTab] = useState("email");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [sendError, setSendError] = useState("");

  const googleInstructions = `Hi ${client.contactName || client.businessName},

To get started with your Google Ads campaigns, I need Standard access to your Google Ads account. Here's how to grant it:

1. Sign in to your Google Ads account at ads.google.com
2. Click the tools icon (⚙️) in the top right → select "Access and security"
3. Click the blue "+" button
4. Enter my email: rafael@jrcopier.com
5. Set the access level to "Standard"
6. Click "Send invitation"

You'll get a confirmation — that's it! Takes about 60 seconds.

Alternatively, if you'd like to link to my Manager Account directly (more secure — no shared passwords), I can send you a link request to approve with one click.

Let me know if you have any questions!

— Rafael
JR Copier of MN`;

  const metaInstructions = `Hi ${client.contactName || client.businessName},

To manage your Meta (Facebook/Instagram) ad campaigns, I need Advertiser access to your Meta Business account. Here's how:

OPTION 1 — Add me directly:
1. Go to business.facebook.com
2. Click "Settings" (gear icon) → "Ad Accounts"
3. Select your ad account
4. Click "Add People"
5. Enter my email: rafael@jrcopier.com
6. Set role to "Advertiser"
7. Click Confirm

OPTION 2 — Partner Access (recommended — more secure):
1. Go to business.facebook.com → Settings → Partners
2. Click "Add" → "Give a partner access to your assets"
3. Enter my Meta Business ID: ${META_BUSINESS_ID}
4. Select your Ad Account and set role to "Advertiser"
5. Click Save

Either option takes less than 2 minutes and means you stay in full control — you can remove access any time.

— Rafael
JR Copier of MN`;

  const combinedEmail = `Hi ${client.contactName || client.businessName},

To launch your geofencing campaigns on Google and Meta, I need access to both ad accounts. Here's a quick guide:

━━ GOOGLE ADS ━━
1. Go to ads.google.com → Tools (⚙️) → Access and Security
2. Click "+" → Enter rafael@jrcopier.com → Role: Standard → Send Invitation

━━ META ADS ━━
1. Go to business.facebook.com → Settings → Ad Accounts
2. Select your account → Add People → rafael@jrcopier.com → Role: Advertiser

Both steps take about 2 minutes total. Once access is granted, I can launch your campaigns and you'll receive a notification email when they go live.

Questions? Reply to this email or call me directly.

— Rafael
JR Copier of MN
(763) xxx-xxxx`;

  const copy = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(""), 2500);
  };

  const sendEmail = async (text, subjectLine) => {
    if (!client.email) { setSendError("No email address on file for this client."); return; }
    setSending(true); setSendError(""); setSent(false);
    try {
      const res = await fetch("/api/send-access-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: client.email,
          clientName: client.contactName || client.businessName,
          subject: subjectLine || "Action needed: Grant ad access for your campaigns",
          body: text,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Send failed");
      setSent(true);
      setTimeout(() => setSent(false), 4000);
    } catch(e) {
      setSendError(e.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 3000, background: "rgba(0,0,0,0.75)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ width: 620, maxHeight: "90vh", background: T.bg, border: `1px solid ${T.border}`, borderRadius: 10, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        
        {/* Header */}
        <div style={{ padding: "20px 24px", borderBottom: `1px solid ${T.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: T.text, letterSpacing: 1 }}>🔑 REQUEST AD ACCESS</div>
            <div style={{ fontSize: 11, color: T.muted, marginTop: 2 }}>{client.businessName} · {client.email || "no email on file"}</div>
          </div>
          <button onClick={onClose} style={{ background: "transparent", border: "none", color: T.muted, cursor: "pointer", fontSize: 20, lineHeight: 1 }}>✕</button>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", borderBottom: `1px solid ${T.border}` }}>
          {[["email", "📧 Combined Email"], ["google", "G Google Ads"], ["meta", "f Meta Ads"]].map(([id, label]) => (
            <button key={id} onClick={() => setActiveTab(id)}
              style={{ flex: 1, padding: "12px 8px", background: activeTab === id ? T.card : "transparent", border: "none", borderBottom: activeTab === id ? `2px solid ${T.accent}` : "2px solid transparent", color: activeTab === id ? T.accent : T.muted, cursor: "pointer", fontSize: 12, fontWeight: activeTab === id ? 700 : 400 }}>
              {label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: "auto", padding: 24 }}>

          {activeTab === "email" && (
            <div>
              <div style={{ fontSize: 11, color: T.muted, marginBottom: 12 }}>Send this single email to your client — covers both Google and Meta access in one message.</div>
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 6, padding: 16, fontSize: 12, color: T.text, lineHeight: 1.8, whiteSpace: "pre-wrap", fontFamily: "inherit", marginBottom: 12 }}>
                {combinedEmail}
              </div>
              {sendError && <div style={{ padding: "8px 12px", background: "#ef444422", border: "1px solid #ef4444", borderRadius: 4, fontSize: 11, color: "#ef4444", marginBottom: 8 }}>{sendError}</div>}
              {!client.email && <div style={{ padding: "8px 12px", background: "#f59e0b22", border: "1px solid #f59e0b", borderRadius: 4, fontSize: 11, color: "#f59e0b", marginBottom: 8 }}>⚠️ No email on file — add client email to send directly.</div>}
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => sendEmail(combinedEmail, "Action needed: Grant ad access for your campaigns")}
                  disabled={sending || !client.email}
                  style={{ flex: 2, padding: "11px", background: sent ? "#22c55e" : T.accent, color: "#000", border: "none", borderRadius: 4, cursor: client.email ? "pointer" : "not-allowed", fontWeight: 700, fontSize: 13, letterSpacing: 1, opacity: !client.email ? 0.5 : 1 }}>
                  {sending ? "SENDING..." : sent ? "✓ EMAIL SENT!" : `📧 SEND TO ${client.email || "CLIENT"}`}
                </button>
                <button onClick={() => copy(combinedEmail, "email")}
                  style={{ flex: 1, padding: "11px", background: copied === "email" ? T.accent+"22" : "transparent", border: `1px solid ${T.border}`, color: T.muted, borderRadius: 4, cursor: "pointer", fontWeight: 700, fontSize: 12 }}>
                  {copied === "email" ? "✓ COPIED" : "📋 COPY"}
                </button>
              </div>
            </div>
          )}

          {activeTab === "google" && (
            <div>
              <div style={{ fontSize: 11, color: T.muted, marginBottom: 16 }}>Two ways to get Google Ads access — Option 2 (MCC link) is the professional agency approach.</div>
              
              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 6, padding: 16, marginBottom: 12 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: T.accent, marginBottom: 10, letterSpacing: 1 }}>OPTION 1 — Direct User Access</div>
                {["Client signs in to ads.google.com", "Tools (⚙️) → Access and Security", 'Click "+" → Enter rafael@jrcopier.com', "Role: Standard → Send Invitation", "You get an email to accept — done!"].map((step, i) => (
                  <div key={i} style={{ display: "flex", gap: 10, marginBottom: 8, alignItems: "flex-start" }}>
                    <div style={{ width: 20, height: 20, borderRadius: "50%", background: T.accent+"22", color: T.accent, fontSize: 11, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{i+1}</div>
                    <div style={{ fontSize: 12, color: T.text, paddingTop: 2 }}>{step}</div>
                  </div>
                ))}
              </div>

              <div style={{ background: T.card, border: `1px solid ${T.accent}44`, borderRadius: 6, padding: 16, marginBottom: 12 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: T.accent, marginBottom: 4, letterSpacing: 1 }}>⭐ OPTION 2 — MCC Manager Link (Recommended)</div>
                <div style={{ fontSize: 11, color: T.muted, marginBottom: 10 }}>Client approves with one click — no passwords shared, professional agency setup.</div>
                {["You send a link request from your MCC at ads.google.com/home/tools/manager-accounts", "Client receives email from Google → clicks Accept", "Their account appears in your MCC dashboard", "You manage from Geofence HQ without needing their login"].map((step, i) => (
                  <div key={i} style={{ display: "flex", gap: 10, marginBottom: 8, alignItems: "flex-start" }}>
                    <div style={{ width: 20, height: 20, borderRadius: "50%", background: T.accent+"33", color: T.accent, fontSize: 11, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{i+1}</div>
                    <div style={{ fontSize: 12, color: T.text, paddingTop: 2 }}>{step}</div>
                  </div>
                ))}
              </div>

              <div style={{ fontSize: 11, color: T.muted, marginBottom: 8 }}>Copy the email instructions to send to your client:</div>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => sendEmail(googleInstructions, "Action needed: Grant Google Ads access")}
                  disabled={sending || !client.email}
                  style={{ flex: 2, padding: "11px", background: sent ? "#22c55e" : T.accent, color: "#000", border: "none", borderRadius: 4, cursor: client.email ? "pointer" : "not-allowed", fontWeight: 700, fontSize: 13, opacity: !client.email ? 0.5 : 1 }}>
                  {sending ? "SENDING..." : sent ? "✓ SENT!" : "📧 SEND GOOGLE EMAIL"}
                </button>
                <button onClick={() => copy(googleInstructions, "google")}
                  style={{ flex: 1, padding: "11px", background: "transparent", border: `1px solid ${T.border}`, color: T.muted, borderRadius: 4, cursor: "pointer", fontWeight: 700, fontSize: 12 }}>
                  {copied === "google" ? "✓ COPIED" : "📋 COPY"}
                </button>
              </div>
            </div>
          )}

          {activeTab === "meta" && (
            <div>
              <div style={{ fontSize: 11, color: T.muted, marginBottom: 16 }}>Two ways to get Meta Ads access — Partner Access is the professional agency approach.</div>

              <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 6, padding: 16, marginBottom: 12 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#1877F2", marginBottom: 10, letterSpacing: 1 }}>OPTION 1 — Direct User Access</div>
                {["Client goes to business.facebook.com", "Settings → Ad Accounts → select their account", 'Click "Add People" → Enter rafael@jrcopier.com', "Role: Advertiser → Confirm"].map((step, i) => (
                  <div key={i} style={{ display: "flex", gap: 10, marginBottom: 8, alignItems: "flex-start" }}>
                    <div style={{ width: 20, height: 20, borderRadius: "50%", background: "#1877F222", color: "#1877F2", fontSize: 11, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{i+1}</div>
                    <div style={{ fontSize: 12, color: T.text, paddingTop: 2 }}>{step}</div>
                  </div>
                ))}
              </div>

              <div style={{ background: T.card, border: "1px solid #1877F244", borderRadius: 6, padding: 16, marginBottom: 12 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#1877F2", marginBottom: 4, letterSpacing: 1 }}>⭐ OPTION 2 — Partner Access (Recommended)</div>
                <div style={{ fontSize: 11, color: T.muted, marginBottom: 10 }}>Client adds your Business ID — you never need their password.</div>
                {['Client goes to business.facebook.com → Settings → Partners', 'Click "Add" → "Give a partner access to your assets"', `Enter your Meta Business ID: ${META_BUSINESS_ID}`, "Select their Ad Account → Role: Advertiser → Save"].map((step, i) => (
                  <div key={i} style={{ display: "flex", gap: 10, marginBottom: 8, alignItems: "flex-start" }}>
                    <div style={{ width: 20, height: 20, borderRadius: "50%", background: "#1877F233", color: "#1877F2", fontSize: 11, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{i+1}</div>
                    <div style={{ fontSize: 12, color: T.text, paddingTop: 2 }}>{step}</div>
                  </div>
                ))}
              </div>

              <div style={{ fontSize: 11, color: T.muted, marginBottom: 8 }}>Copy the email instructions to send to your client:</div>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => sendEmail(metaInstructions, "Action needed: Grant Meta Ads access")}
                  disabled={sending || !client.email}
                  style={{ flex: 2, padding: "11px", background: sent ? "#22c55e" : "#1877F2", color: "#fff", border: "none", borderRadius: 4, cursor: client.email ? "pointer" : "not-allowed", fontWeight: 700, fontSize: 13, opacity: !client.email ? 0.5 : 1 }}>
                  {sending ? "SENDING..." : sent ? "✓ SENT!" : "📧 SEND META EMAIL"}
                </button>
                <button onClick={() => copy(metaInstructions, "meta")}
                  style={{ flex: 1, padding: "11px", background: "transparent", border: `1px solid ${T.border}`, color: T.muted, borderRadius: 4, cursor: "pointer", fontWeight: 700, fontSize: 12 }}>
                  {copied === "meta" ? "✓ COPIED" : "📋 COPY"}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: "14px 24px", borderTop: `1px solid ${T.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontSize: 11, color: T.muted }}>Once access is granted, connect their accounts with + GOOGLE / + META on the client card.</div>
          <button onClick={onClose} style={{ padding: "8px 20px", background: "transparent", border: `1px solid ${T.border}`, color: T.muted, borderRadius: 4, cursor: "pointer", fontSize: 12 }}>CLOSE</button>
        </div>
      </div>
    </div>
  );
}

function ClientModal({ T, client, onClose, onSave }) {
  const [form, setForm] = useState(client ? { businessName: "", contactName: "", email: "", phone: "", website: "", industry: "", monthlyBudget: "", contractStart: "", contractEnd: "", contractValue: "", billingCycle: "monthly", notes: "", status: "active", ...client } : { businessName: "", contactName: "", email: "", phone: "", website: "", industry: "", monthlyBudget: "", contractStart: "", contractEnd: "", contractValue: "", billingCycle: "monthly", notes: "", status: "active" });
  const [saving, setSaving] = useState(false);
  const set = (f, v) => setForm(p => ({ ...p, [f]: v }));
  const handleSave = async () => { if (!form.businessName.trim()) return; setSaving(true); try { await onSave(form); } finally { setSaving(false); } };
  const inp = { background: T.input, border: "1px solid " + T.border, borderRadius: 4, padding: "9px 12px", color: T.text, fontSize: 13, outline: "none", width: "100%", boxSizing: "border-box" };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 2000, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.7)" }} onClick={onClose}>
      <div style={{ width: 620, maxHeight: "90vh", background: T.bg, border: "1px solid " + T.border, borderRadius: 10, overflow: "hidden", display: "flex", flexDirection: "column" }} onClick={e => e.stopPropagation()}>
        <div style={{ padding: "20px 28px", borderBottom: "1px solid " + T.border, display: "flex", justifyContent: "space-between", alignItems: "center", background: T.headerBg, flexShrink: 0 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: T.accent, letterSpacing: 2 }}>{client ? "EDIT CLIENT" : "ADD NEW CLIENT"}</div>
          <button onClick={onClose} style={{ background: "transparent", border: "1px solid " + T.border, color: T.muted, width: 32, height: 32, borderRadius: 4, cursor: "pointer", fontSize: 18 }}>x</button>
        </div>
        <div style={{ overflowY: "auto", padding: "24px 28px", flex: 1 }}>
          <div style={{ fontSize: 11, color: T.accent, letterSpacing: 2, marginBottom: 12, fontWeight: 700 }}>BUSINESS INFO</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px 16px", marginBottom: 20 }}>
            <div style={{ gridColumn: "span 2" }}>
              <label style={{ display: "block", fontSize: 10, letterSpacing: 2, color: T.muted, marginBottom: 6 }}>BUSINESS NAME *</label>
              <input value={form.businessName} onChange={e => set("businessName", e.target.value)} placeholder="e.g. Acme Roofing Co." style={inp} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 10, letterSpacing: 2, color: T.muted, marginBottom: 6 }}>INDUSTRY</label>
              <select value={form.industry} onChange={e => set("industry", e.target.value)} style={{ ...inp }}>
                <option value="">Select...</option>
                {["Retail","Restaurant & Food","Healthcare","Automotive","Real Estate","Legal","Home Services","Fitness & Wellness","Beauty & Salon","Education","Finance","Technology","Entertainment","Non-Profit","Other"].map(i => <option key={i} value={i}>{i}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: "block", fontSize: 10, letterSpacing: 2, color: T.muted, marginBottom: 6 }}>WEBSITE</label>
              <input value={form.website} onChange={e => set("website", e.target.value)} placeholder="https://example.com" style={inp} />
            </div>
          </div>
          <div style={{ fontSize: 11, color: T.accent, letterSpacing: 2, marginBottom: 12, fontWeight: 700 }}>CONTACT INFO</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px 16px", marginBottom: 20 }}>
            <div>
              <label style={{ display: "block", fontSize: 10, letterSpacing: 2, color: T.muted, marginBottom: 6 }}>CONTACT NAME</label>
              <input value={form.contactName} onChange={e => set("contactName", e.target.value)} placeholder="John Smith" style={inp} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 10, letterSpacing: 2, color: T.muted, marginBottom: 6 }}>EMAIL</label>
              <input type="email" value={form.email} onChange={e => set("email", e.target.value)} placeholder="john@company.com" style={inp} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 10, letterSpacing: 2, color: T.muted, marginBottom: 6 }}>PHONE</label>
              <input value={form.phone} onChange={e => set("phone", e.target.value)} placeholder="(555) 000-0000" style={inp} />
            </div>
          </div>
          <div style={{ fontSize: 11, color: T.accent, letterSpacing: 2, marginBottom: 12, fontWeight: 700 }}>BILLING & CONTRACT</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px 16px", marginBottom: 20 }}>
            <div>
              <label style={{ display: "block", fontSize: 10, letterSpacing: 2, color: T.muted, marginBottom: 6 }}>MONTHLY AD BUDGET ($)</label>
              <input type="number" value={form.monthlyBudget} onChange={e => set("monthlyBudget", e.target.value)} placeholder="e.g. 2000" style={inp} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 10, letterSpacing: 2, color: T.muted, marginBottom: 6 }}>CONTRACT VALUE ($)</label>
              <input type="number" value={form.contractValue} onChange={e => set("contractValue", e.target.value)} placeholder="e.g. 6000" style={inp} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 10, letterSpacing: 2, color: T.muted, marginBottom: 6 }}>CONTRACT START</label>
              <input type="date" value={form.contractStart} onChange={e => set("contractStart", e.target.value)} style={inp} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 10, letterSpacing: 2, color: T.muted, marginBottom: 6 }}>CONTRACT END</label>
              <input type="date" value={form.contractEnd} onChange={e => set("contractEnd", e.target.value)} style={inp} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 10, letterSpacing: 2, color: T.muted, marginBottom: 6 }}>BILLING CYCLE</label>
              <select value={form.billingCycle} onChange={e => set("billingCycle", e.target.value)} style={{ ...inp }}>
                {["monthly","quarterly","annual","one-time"].map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: "block", fontSize: 10, letterSpacing: 2, color: T.muted, marginBottom: 6 }}>STATUS</label>
              <select value={form.status} onChange={e => set("status", e.target.value)} style={{ ...inp }}>
                {["active","paused","completed","prospect"].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div style={{ fontSize: 11, color: T.accent, letterSpacing: 2, marginBottom: 12, fontWeight: 700 }}>NOTES</div>
          <textarea value={form.notes} onChange={e => set("notes", e.target.value)} placeholder="Internal notes about this client..." rows={3}
            style={{ ...inp, resize: "none" }} />
        </div>
        <div style={{ padding: "16px 28px", borderTop: "1px solid " + T.border, display: "flex", justifyContent: "flex-end", gap: 10, background: T.headerBg, flexShrink: 0 }}>
          <button onClick={onClose} style={{ padding: "10px 24px", background: "transparent", border: "1px solid " + T.border, color: T.muted, borderRadius: 4, cursor: "pointer", fontSize: 12 }}>CANCEL</button>
          <button onClick={handleSave} disabled={saving || !form.businessName.trim()}
            style={{ padding: "10px 28px", background: form.businessName.trim() ? T.accent : T.border, color: form.businessName.trim() ? "#000" : T.muted, border: "none", borderRadius: 4, cursor: "pointer", fontWeight: 700, fontSize: 12, letterSpacing: 1 }}>
            {saving ? "SAVING..." : client ? "SAVE CHANGES" : "ADD CLIENT"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Copy Brief Component ─────────────────────────────────────────────────────

function CopyBrief({ campaign, totalBudget, T }) {
  const [copied, setCopied] = useState(null);
  const platform = PLATFORMS.find(p => p.id === campaign.platform);
  const goal = GOALS.find(g => g.id === campaign.goal);

  const formats = {
    google: `GOOGLE ADS BRIEF
Campaign: ${campaign.name || "Untitled"}
Goal: ${goal?.label}
Location: ${campaign.location} (${campaign.radius} mi radius)
Audience: Ages ${campaign.ageMin}–${campaign.ageMax}, ${campaign.gender}
Interests: ${campaign.interests.join(", ")}

HEADLINES (max 30 chars each):
1. ${campaign.headline.slice(0,30)}
2. [Add variation here]
3. [Add variation here]

DESCRIPTIONS (max 90 chars each):
1. ${campaign.body.slice(0,90)}
2. [Add variation here]

CTA: ${campaign.cta}
Daily Budget: $${campaign.dailyBudget} | Duration: ${campaign.duration} days | Total: $${totalBudget}`,

    meta: `META ADS BRIEF
Campaign: ${campaign.name || "Untitled"}
Goal: ${goal?.label}
Location: ${campaign.location} (${campaign.radius} mi radius)
Audience: Ages ${campaign.ageMin}–${campaign.ageMax}, ${campaign.gender}
Interests: ${campaign.interests.join(", ")}

PRIMARY TEXT (max 125 chars):
${campaign.body.slice(0,125)}

HEADLINE (max 40 chars):
${campaign.headline.slice(0,40)}

DESCRIPTION (max 30 chars):
${campaign.cta}

Daily Budget: $${campaign.dailyBudget} | Duration: ${campaign.duration} days | Total: $${totalBudget}`,

    tiktok: `TIKTOK ADS BRIEF
Campaign: ${campaign.name || "Untitled"}
Goal: ${goal?.label}
Location: ${campaign.location}
Audience: Ages ${campaign.ageMin}–${campaign.ageMax}, ${campaign.gender}
Interests: ${campaign.interests.join(", ")}

AD TEXT (max 100 chars):
${campaign.body.slice(0,100)}

DISPLAY NAME: [Your business name]
CTA BUTTON: ${campaign.cta}

Video specs: 9:16 vertical, 15–60 seconds, with captions
Daily Budget: $${campaign.dailyBudget} | Duration: ${campaign.duration} days | Total: $${totalBudget}`,

    snapchat: `SNAPCHAT ADS BRIEF
Campaign: ${campaign.name || "Untitled"}
Goal: ${goal?.label}
Location: ${campaign.location}
Audience: Ages ${campaign.ageMin}–${campaign.ageMax}, ${campaign.gender}

HEADLINE (max 34 chars):
${campaign.headline.slice(0,34)}

BRAND NAME: [Your business name]
CTA: ${campaign.cta}

Creative specs: 9:16 vertical image or video, under 10 seconds
Daily Budget: $${campaign.dailyBudget} | Duration: ${campaign.duration} days | Total: $${totalBudget}`,

    groundtruth: `GROUNDTRUTH CAMPAIGN BRIEF
Campaign: ${campaign.name || "Untitled"}
Goal: ${goal?.label}
Target Location: ${campaign.location} (${campaign.radius} mi radius)
Audience: Ages ${campaign.ageMin}–${campaign.ageMax}, ${campaign.gender}
Interests: ${campaign.interests.join(", ")}

AD COPY:
Headline: ${campaign.headline}
Body: ${campaign.body}
CTA: ${campaign.cta}

Banner sizes needed: 300x250, 320x50, 728x90, 160x600
Total Budget: $${totalBudget} ($${campaign.dailyBudget}/day × ${campaign.duration} days)`,

    simpli: `SIMPLI.FI CAMPAIGN BRIEF
Campaign: ${campaign.name || "Untitled"}
Goal: ${goal?.label}
Target Location: ${campaign.location} (${campaign.radius} mi radius)
Audience: Ages ${campaign.ageMin}–${campaign.ageMax}, ${campaign.gender}
Interests: ${campaign.interests.join(", ")}

AD COPY:
Headline: ${campaign.headline}
Body: ${campaign.body}
CTA: ${campaign.cta}

Banner sizes needed: 300x250, 728x90, 160x600, 320x50
Total Budget: $${totalBudget} ($${campaign.dailyBudget}/day × ${campaign.duration} days)`,
  };

  const copyText = (platformId) => {
    const text = formats[platformId] || formats.google;
    navigator.clipboard.writeText(text);
    setCopied(platformId);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div style={{ marginTop: 20, background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: T.accent, letterSpacing: 2, marginBottom: 4 }}>📋 ONE-CLICK COPY FOR EACH PLATFORM</div>
      <div style={{ fontSize: 11, color: T.muted, marginBottom: 14 }}>Copy your ad brief formatted for the platform you're uploading to.</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {PLATFORMS.map(p => (
          <button key={p.id} onClick={() => copyText(p.id)}
            style={{ padding: "8px 16px", borderRadius: 4, border: `1px solid`, borderColor: copied === p.id ? T.accent : T.border, background: copied === p.id ? T.accent+"22" : "transparent", color: copied === p.id ? T.accent : T.text, cursor: "pointer", fontSize: 12, fontWeight: 600, transition: "all 0.15s", display: "flex", alignItems: "center", gap: 6 }}>
            <span>{p.logo}</span>
            {copied === p.id ? "✓ COPIED!" : `Copy for ${p.name}`}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Launch Checklist Component ───────────────────────────────────────────────

function LaunchChecklist({ platform, steps, T }) {
  const [checked, setChecked] = useState({});
  const toggle = (i) => setChecked(p => ({ ...p, [i]: !p[i] }));
  const doneCount = Object.values(checked).filter(Boolean).length;

  return (
    <div style={{ marginTop: 20, background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, overflow: "hidden" }}>
      <div style={{ padding: "16px 20px", borderBottom: `1px solid ${T.border}`, display: "flex", justifyContent: "space-between", alignItems: "center", background: T.headerBg }}>
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: T.accent, letterSpacing: 2 }}>🚀 {platform.name.toUpperCase()} LAUNCH CHECKLIST</div>
          <div style={{ fontSize: 11, color: T.muted, marginTop: 2 }}>Step-by-step guide to go live</div>
        </div>
        <div style={{ fontSize: 12, color: doneCount === steps.length ? T.accent : T.muted, fontWeight: 700 }}>
          {doneCount}/{steps.length} DONE
        </div>
      </div>
      {steps.map((s, i) => (
        <div key={i} onClick={() => toggle(i)}
          style={{ padding: "14px 20px", borderBottom: i < steps.length - 1 ? `1px solid ${T.border}` : "none", display: "flex", gap: 14, cursor: "pointer", background: checked[i] ? T.accent+"08" : "transparent", transition: "background 0.15s" }}>
          <div style={{ width: 22, height: 22, borderRadius: 4, border: `2px solid`, borderColor: checked[i] ? T.accent : T.border, background: checked[i] ? T.accent : "transparent", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", color: "#000", fontWeight: 700, fontSize: 13, marginTop: 1 }}>
            {checked[i] ? "✓" : ""}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: checked[i] ? T.muted : T.text, textDecoration: checked[i] ? "line-through" : "none", marginBottom: 3 }}>
              Step {i+1}: {s.step}
            </div>
            <div style={{ fontSize: 11, color: T.muted, lineHeight: 1.6 }}>{s.detail}</div>
            {s.url && <a href={s.url} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()}
              style={{ fontSize: 11, color: T.accent, marginTop: 4, display: "inline-block" }}>→ Open {s.step} ↗</a>}
          </div>
        </div>
      ))}
      {doneCount === steps.length && (
        <div style={{ padding: "16px 20px", background: T.accent+"22", textAlign: "center", fontSize: 13, fontWeight: 700, color: T.accent }}>
          🎉 ALL STEPS COMPLETE — YOU'RE LIVE!
        </div>
      )}
    </div>
  );
}

// ─── Documentation Panel ─────────────────────────────────────────────────────

const DOCS = [
  {
    id: "overview",
    icon: "🗺️",
    title: "What is Geofencing?",
    content: [
      { h: "How It Works", p: "Geofencing uses GPS, Wi-Fi, and cellular signals to draw a virtual boundary around a real-world location. When a mobile user enters or exits that boundary, they receive a targeted ad on their device in real time." },
      { h: "Why It Works", p: "Geofencing delivers ads at the moment of highest intent — when someone is physically near your location, at a competitor, or attending a relevant event. This hyper-local timing drives significantly higher conversion rates than standard display ads." },
      { h: "Key Metrics", p: "Track these KPIs: CTR (Click-Through Rate) — aim for 0.3–0.8%. Foot Traffic Attribution — how many ad viewers visited in person. Conversion Rate — actions taken (calls, purchases, signups). CPM (Cost Per 1,000 Impressions) — typically $3–$15 for geofencing." },
    ]
  },
  {
    id: "google",
    icon: "G",
    title: "Google Ads",
    content: [
      { h: "Setup: Location Targeting", p: "In Google Ads, go to Campaigns → Settings → Locations. Click 'Advanced search' and select 'Radius targeting'. Enter your address and set a radius of 0.5–5 miles. Google uses GPS and IP data to target users in that zone." },
      { h: "Best Ad Formats", p: "Search Ads: Appear when users search Google near your location. Ideal for high-intent customers. Display Ads: Banner ads shown in apps and websites. Best for awareness. Local Campaigns: Auto-optimized for store visits using Maps, Search, YouTube, and Display simultaneously." },
      { h: "Retargeting with RLSA", p: "Remarketing Lists for Search Ads (RLSA) lets you bid higher for past website visitors who search near your location. Go to Audiences → Remarketing → add your website visitors list. Then increase bids by 20–50% for this segment when they're in your geofence." },
      { h: "Budget & Bidding", p: "Start with $20–50/day. Use 'Maximize Clicks' initially to gather data, then switch to 'Target CPA' once you have 30+ conversions. Set ad scheduling to run only during business hours for efficiency." },
      { h: "Pro Tips", p: "Enable 'Location Extensions' to show your address and phone number. Use 'Callout Extensions' to highlight local offers like 'Visit Us Today — 0.3 miles away'. Set negative radius exclusions to avoid wasting budget on distant users." },
    ]
  },
  {
    id: "meta",
    icon: "f",
    title: "Meta Ads (Facebook & Instagram)",
    content: [
      { h: "Setup: Location Targeting", p: "In Meta Ads Manager, create a new campaign. At the Ad Set level, scroll to 'Audience' → 'Locations'. Select 'Drop Pin' and enter your address. Choose a 1–5 mile radius. Select 'People recently in this location' for foot traffic campaigns." },
      { h: "Retargeting with Custom Audiences", p: "Meta's retargeting is among the most powerful available. Create a Custom Audience from: Website visitors (install Meta Pixel first), Customer list (upload emails/phones), App activity, or Video viewers. Then target these users when they enter your geofence for double-intent targeting." },
      { h: "Lookalike Audiences", p: "Once you have 100+ customers, create a Lookalike Audience. Meta finds users with similar demographics and behaviors to your best customers, within your geofenced area. Start with 1% lookalike for highest match quality." },
      { h: "Best Ad Formats", p: "Single Image: Simple, fast to create. Best for offers and promotions. Carousel: Show multiple products or locations. Video: 15-second videos get 3x more engagement. Stories: Full-screen immersive format, swipe-up to your landing page. Use Instagram Reels for younger demographics." },
      { h: "Budget Strategy", p: "Facebook recommends at least $5/day per ad set. For local geofencing, $15–30/day is effective. Use Campaign Budget Optimization (CBO) to let Meta allocate budget to best-performing ad sets automatically. Run ads 7 days before and during your promotion period." },
    ]
  },
  {
    id: "groundtruth",
    icon: "GT",
    title: "GroundTruth",
    content: [
      { h: "Why GroundTruth", p: "GroundTruth is purpose-built for location advertising with the most precise geofencing available — down to specific store aisles. They verify location data against 4+ signals to eliminate GPS fraud, giving you real attribution." },
      { h: "Setup Process", p: "Contact GroundTruth directly or through a media agency. Define your target location (they can fence specific buildings, parking lots, or event venues as polygons). Set your audience targeting, creative, and flight dates. Minimum spend is typically $1,000/month." },
      { h: "Competitive Conquesting", p: "GroundTruth excels at competitor targeting — place a geofence directly around a rival's location. When their customers visit, your ad appears offering a better deal. This is one of the highest-ROI strategies in local advertising. Maintain a 100-meter minimum distance to avoid customer confusion." },
      { h: "Venue Replay", p: "GroundTruth's 'Venue Replay' lets you retarget people who visited a location in the past 30–90 days, even after they leave. Build a pool of competitor visitors and retarget them at home, at work, and everywhere they browse." },
      { h: "Measurement", p: "GroundTruth provides Walk-In Attribution — verified in-store visits driven by your ads. They compare exposed vs. unexposed users to calculate true lift. Expect a 10–30% visit lift for well-executed campaigns." },
    ]
  },
  {
    id: "simpli",
    icon: "S",
    title: "Simpli.fi",
    content: [
      { h: "What Makes Simpli.fi Unique", p: "Simpli.fi specializes in unstructured data targeting — they can target based on specific addresses, zip codes, or even individual household addresses (addressable geofencing). This is ideal for direct mail matching and hyperlocal B2B targeting." },
      { h: "Addressable Geofencing", p: "Upload a list of physical addresses (e.g., your customer mailing list or a list of businesses). Simpli.fi places a precise fence around each address and serves ads to devices detected there. This bridges offline and digital marketing." },
      { h: "Search Retargeting", p: "Target people who searched specific keywords on Google or Bing in the past 30 days, within your geographic area. Example: Target anyone within 5 miles who searched 'roof repair' in the last month. Extremely high intent." },
      { h: "Programmatic Buying", p: "Simpli.fi accesses 200+ ad exchanges, showing your ad across thousands of apps and websites. Their algorithm optimizes in real-time for your goal — visits, clicks, or conversions. CPMs typically range $8–$20 for premium placements." },
      { h: "Reporting", p: "Access real-time dashboards showing impressions, clicks, CTR, and foot traffic conversion. Compare performance by location, time of day, and creative. Use this data to optimize radius and budget allocation." },
    ]
  },
  {
    id: "tiktok",
    icon: "T",
    title: "TikTok Ads",
    content: [
      { h: "Setup: Location Targeting", p: "In TikTok Ads Manager, create a campaign with 'Traffic' or 'Conversions' objective. At the Ad Group level, under Audience → Location, select your country then 'Specific Locations'. You can target by city, state, or DMA (metro area). TikTok does not yet support radius-based geofencing — use city/DMA targeting." },
      { h: "Best Audience for TikTok", p: "TikTok's core audience is 18–35. It's ideal for restaurants, entertainment, beauty, fitness, fashion, and tech brands. Interest targeting categories relevant to local businesses: Food & Beverage, Sports & Outdoors, Home & Garden, Automotive." },
      { h: "Ad Formats", p: "TopView: First ad users see when opening TikTok. Highest visibility, premium cost. In-Feed Ads: Appear in the For You feed, skippable after 3 seconds. Branded Hashtag Challenge: Encourage user-generated content. Spark Ads: Boost your own organic TikTok posts — most authentic format." },
      { h: "Creative Best Practices", p: "First 3 seconds are critical — hook immediately. Use vertical video (9:16). Add captions — 80% watch without sound. Feature real people, not polished ads. Include a clear CTA overlay. User-generated style content consistently outperforms produced ads on TikTok." },
      { h: "Budget & Bidding", p: "Minimum campaign budget is $50/day. Minimum ad group budget is $20/day. Use 'Lowest Cost' bidding to start. Once you have data, switch to 'Cost Cap' to control your CPA. Run for at least 7 days before optimizing — TikTok's algorithm needs time to learn." },
    ]
  },
  {
    id: "snapchat",
    icon: "👻",
    title: "Snapchat Ads",
    content: [
      { h: "Setup: Location Targeting", p: "In Snapchat Ads Manager, at the Ad Set level click 'Audiences' → 'Demographics' → 'Location'. Select specific cities, zip codes, or DMA regions. Snapchat also offers 'Snap to Store' measurement to track in-store visits after seeing an ad." },
      { h: "Snap Map Advertising", p: "Snap Map lets users see what's happening around them. Submit your business location to appear on the map. Run 'Place Promotions' to appear when users explore nearby locations — extremely high purchase intent for food, entertainment, and events." },
      { h: "Best Ad Formats", p: "Single Image/Video Ads: Run in Stories, with swipe-up to your website. Story Ads: Appear in the Discover section — good for brand storytelling. Collection Ads: Show multiple products with a tile grid — great for e-commerce. Filters: Location-based overlays users add to their own Snaps — viral brand exposure." },
      { h: "Audience", p: "Snapchat reaches 90% of 13–24 year olds and 75% of 13–34 year olds in the US. Best for: restaurants, entertainment venues, beauty, fashion, events, colleges, and any brand targeting Gen Z. Avoid if your customer is primarily 45+." },
      { h: "Budget Tips", p: "Minimum budget is $5/day. Start with $20–50/day for local campaigns. Use 'Auto-Bidding' initially. Snapchat ads perform best Thursday–Sunday. A/B test multiple creatives — Snapchat's audience fatigues quickly. Refresh creatives every 2 weeks." },
    ]
  },
  {
    id: "bestpractices",
    icon: "⚡",
    title: "Best Practices",
    content: [
      { h: "Choosing Your Radius", p: "Urban areas: 0.5–1 mile. Suburban areas: 1–3 miles. Rural areas: 3–5 miles. Keep it tight — a 1-mile radius in a dense city can reach 50,000+ people. Larger fences dilute relevance. For competitor conquesting, fence only the competitor's parking lot and immediate block." },
      { h: "Timing Your Campaigns", p: "Run ads 1–2 hours before peak times (lunch hour, Friday evenings, weekend mornings). Use dayparting to show ads only during business hours. Increase bids by 20% on weekends. Pause campaigns when you're closed — wasted budget on unreachable customers." },
      { h: "Creative That Converts", p: "Lead with location: 'You're 0.3 miles away.' Create urgency: 'Today Only' or 'This Weekend'. Show the offer immediately — don't make them guess. Use a single clear CTA. Mobile-first design: large text, bold visuals, minimal copy. A/B test your headline — it makes the biggest difference." },
      { h: "Attribution & Measurement", p: "Set up conversion tracking before launching. For offline businesses, use unique promo codes per channel to track source. Use UTM parameters on all landing page URLs. Compare week-over-week foot traffic against your ad spend. True attribution takes 4–6 weeks of consistent data." },
      { h: "Budget Allocation", p: "Starter budget: $500–1,000/month across 1–2 platforms. Split: 50% Google (search intent), 30% Meta (retargeting), 20% programmatic (GroundTruth/Simpli.fi). Scale what works — double budget on campaigns hitting 0.5%+ CTR. Pause anything below 0.1% CTR after 2 weeks." },
    ]
  },
];

function DocsPanel({ T, onClose }) {
  const [activeDoc, setActiveDoc] = useState("overview");
  const doc = DOCS.find(d => d.id === activeDoc);

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1000, display: "flex" }} onClick={onClose}>
      <div style={{ flex: 1, background: "rgba(0,0,0,0.6)" }} />
      <div style={{ width: 780, background: T.bg, borderLeft: `1px solid ${T.border}`, display: "flex", flexDirection: "column", height: "100vh", overflow: "hidden" }}
        onClick={e => e.stopPropagation()}>

        {/* Docs Header */}
        <div style={{ padding: "20px 28px", borderBottom: `1px solid ${T.border}`, display: "flex", justifyContent: "space-between", alignItems: "center", background: T.headerBg, flexShrink: 0 }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, color: T.accent, letterSpacing: 2 }}>📚 PLATFORM DOCS</div>
            <div style={{ fontSize: 11, color: T.muted, marginTop: 2 }}>Setup guides for every ad platform</div>
          </div>
          <button onClick={onClose} style={{ background: "transparent", border: `1px solid ${T.border}`, color: T.muted, width: 32, height: 32, borderRadius: 4, cursor: "pointer", fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
        </div>

        <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
          {/* Sidebar nav */}
          <div style={{ width: 200, borderRight: `1px solid ${T.border}`, padding: "16px 0", flexShrink: 0, overflowY: "auto", background: T.headerBg }}>
            {DOCS.map(d => (
              <button key={d.id} onClick={() => setActiveDoc(d.id)}
                style={{ width: "100%", textAlign: "left", padding: "10px 20px", background: activeDoc === d.id ? T.accent+"22" : "transparent", borderLeft: activeDoc === d.id ? `3px solid ${T.accent}` : "3px solid transparent", border: "none", color: activeDoc === d.id ? T.accent : T.muted, cursor: "pointer", fontSize: 12, display: "flex", alignItems: "center", gap: 10, transition: "all 0.15s" }}>
                <span style={{ fontSize: 14 }}>{d.icon}</span>
                <span style={{ fontWeight: activeDoc === d.id ? 700 : 400 }}>{d.title}</span>
              </button>
            ))}
          </div>

          {/* Content */}
          <div style={{ flex: 1, overflowY: "auto", padding: "28px 32px" }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: T.text, marginBottom: 4 }}>{doc.title}</div>
            <div style={{ height: 2, width: 40, background: T.accent, marginBottom: 28, borderRadius: 2 }} />
            {doc.content.map((section, i) => (
              <div key={i} style={{ marginBottom: 28 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: T.accent, letterSpacing: 1.5, marginBottom: 8, textTransform: "uppercase" }}>{section.h}</div>
                <div style={{ fontSize: 13, color: T.text, lineHeight: 1.9, background: T.card, border: `1px solid ${T.border}`, borderRadius: 6, padding: "14px 18px" }}>{section.p}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [view, setView] = useState("dashboard");
  const [step, setStep] = useState(0);
  const [campaign, setCampaign] = useState(BLANK_CAMPAIGN);
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [launched, setLaunched] = useState(false);
  const [error, setError] = useState(null);
  const [theme, setTheme] = useState("dark");
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [showDocs, setShowDocs] = useState(false);
  const [signingIn, setSigningIn] = useState(false);
  const [clientNotif, setClientNotif] = useState(null);
  const [accessClient, setAccessClient] = useState(null);
  const [clients, setClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [showClientModal, setShowClientModal] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const T = theme === "dark" ? DARK : LIGHT;

  // Handle OAuth callback params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("google_connected")) {
      setError(null);
      alert("✅ Google Ads connected successfully!");
      window.history.replaceState({}, "", "/");
    }
    if (params.get("meta_connected")) {
      setError(null);
      alert("✅ Meta Ads connected successfully!");
      window.history.replaceState({}, "", "/");
    }
    if (params.get("error")) {
      setError("Connection failed: " + params.get("error").replace(/_/g, " "));
      window.history.replaceState({}, "", "/");
    }
  }, []);

  // Listen for auth state changes
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (u && !ALLOWED_EMAILS.includes(u.email)) {
        await signOutUser();
        setError("Access denied. Your email is not on the approved list.");
        setAuthLoading(false);
        return;
      }
      setUser(u);
      setAuthLoading(false);
    });
    return unsub;
  }, []);

  // Load campaigns and clients when user logs in
  useEffect(() => {
    if (user) { fetchCampaigns(); fetchClients(); }
    else { setCampaigns([]); setClients([]); }
  }, [user]);

  async function fetchCampaigns() {
    if (!user) return;
    try {
      setLoading(true);
      const data = await loadCampaigns(user.uid);
      // Sort newest first
      data.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      setCampaigns(data);
    } catch (e) {
      setError("Could not load campaigns. Check your Firebase config in .env");
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function fetchClients() {
    if (!user) return;
    try {
      const data = await loadClients(user.uid);
      data.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      setClients(data);
    } catch (e) { console.error(e); }
  }

  const update = (field, val) => setCampaign(p => ({ ...p, [field]: val }));
  const toggleInterest = (i) => {
    setCampaign(p => ({
      ...p,
      interests: p.interests.includes(i) ? p.interests.filter(x => x !== i) : [...p.interests, i]
    }));
  };

  const totalBudget = campaign.dailyBudget * campaign.duration;
  const estImpressions = Math.round((campaign.dailyBudget * 1000) / 8 * campaign.duration);
  const estClicks = Math.round(estImpressions * 0.038);

  const canNext = () => {
    if (step === 0) return !!campaign.goal;
    if (step === 1) return !!campaign.platform;
    if (step === 2) return campaign.location.length > 2;
    if (step === 3) return campaign.interests.length > 0;
    if (step === 4) return campaign.headline.length > 2;
    if (step === 5) return campaign.dailyBudget >= 10;
    return true;
  };

  const handleLaunch = async () => {
    setSaving(true);
    try {
      const platform = PLATFORMS.find(p => p.id === campaign.platform);
      const newCamp = {
        ...campaign,
        name: campaign.name || `${campaign.location} Campaign`,
        clientId: selectedClient?.id || null,
        clientName: selectedClient?.businessName || null,
        platformName: platform?.name || "—",
        budget: totalBudget,
        estImpressions,
        estClicks,
        ctr: "—",
      };
      const id = await saveCampaign(newCamp, user.uid);
      setCampaigns(prev => [{ id, ...newCamp }, ...prev]);
      setLaunched(true);
      setTimeout(() => {
        setView("dashboard");
        setStep(0);
        setLaunched(false);
        setCampaign(BLANK_CAMPAIGN);
      }, 2800);
    } catch (e) {
      setError("Failed to save campaign. Check your Firebase config.");
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const handleSignIn = async () => {
    setSigningIn(true);
    setError(null);
    try {
      const u = await signInWithGoogle();
      if (!ALLOWED_EMAILS.includes(u.email)) {
        await signOutUser();
        setError("Access denied. Your email is not on the approved list.");
      }
    } catch (e) {
      setError("Sign in failed. Please try again.");
    } finally {
      setSigningIn(false);
    }
  };

  const handleToggleStatus = async (camp) => {
    const newStatus = camp.status === "active" ? "paused" : "active";
    await updateCampaign(camp.id, { status: newStatus });
    setCampaigns(prev => prev.map(c => c.id === camp.id ? { ...c, status: newStatus } : c));
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this campaign?")) return;
    await deleteCampaign(id);
    setCampaigns(prev => prev.filter(c => c.id !== id));
  };

  // Show loading spinner while checking auth
  if (authLoading) return (
    <div style={{ fontFamily: "'Courier New', monospace", background: DARK.bg, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 16 }}>
      <div style={{ width: 48, height: 48, border: `3px solid #1f3d1f`, borderTopColor: "#22c55e", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
      <style>{pulse}</style>
    </div>
  );

  // Show login screen if not authenticated
  if (!user) return (
    <div style={{ fontFamily: "'Courier New', monospace", background: T.bg, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: T.text }}>
      <style>{pulse}</style>
      <div style={{ textAlign: "center", maxWidth: 420, padding: 40 }}>
        <div style={{ position: "relative", width: 64, height: 64, margin: "0 auto 24px" }}>
          <div style={{ position: "absolute", inset: 0, borderRadius: "50%", border: `2px solid ${T.accent}`, animation: "pulse-ring 2s infinite" }} />
          <div style={{ position: "absolute", inset: 12, borderRadius: "50%", background: T.accent }} />
        </div>
        <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: 4, color: T.accent, marginBottom: 8 }}>GEOFENCE.HQ</div>
        <div style={{ fontSize: 13, color: T.muted, marginBottom: 40, letterSpacing: 1 }}>Location-Based Ad Campaign Manager</div>
        <button onClick={handleSignIn} disabled={signingIn}
          style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, width: "100%", padding: "14px 24px", background: signingIn ? T.card : "#fff", color: "#1a1a1a", border: `1px solid ${T.border}`, borderRadius: 6, cursor: signingIn ? "default" : "pointer", fontSize: 14, fontWeight: 700, letterSpacing: 1, transition: "all 0.2s" }}>
          <svg width="18" height="18" viewBox="0 0 18 18"><path fill="#4285F4" d="M16.51 8H8.98v3h4.3c-.18 1-.74 1.48-1.6 2.04v2.01h2.6a7.8 7.8 0 0 0 2.38-5.88c0-.57-.05-.66-.15-1.18z"/><path fill="#34A853" d="M8.98 17c2.16 0 3.97-.72 5.3-1.94l-2.6-2.01c-.72.48-1.63.77-2.7.77-2.09 0-3.85-1.4-4.49-3.29H1.81v2.07A8 8 0 0 0 8.98 17z"/><path fill="#FBBC05" d="M4.49 10.53A4.86 4.86 0 0 1 4.23 9c0-.52.09-1.03.26-1.53V5.4H1.81a8 8 0 0 0 0 7.2l2.68-2.07z"/><path fill="#EA4335" d="M8.98 4.18c1.17 0 2.23.4 3.06 1.2l2.3-2.3A8 8 0 0 0 1.81 5.4L4.49 7.47c.64-1.89 2.4-3.29 4.49-3.29z"/></svg>
          {signingIn ? "SIGNING IN..." : "SIGN IN WITH GOOGLE"}
        </button>
        {error && <div style={{ marginTop: 16, fontSize: 12, color: "#ef4444" }}>{error}</div>}
        <div style={{ marginTop: 32, fontSize: 11, color: T.muted, lineHeight: 1.8 }}>
          Your campaigns are private and only visible to you.<br/>Powered by Firebase Authentication.
        </div>
        <button onClick={() => setTheme(t => t === "dark" ? "light" : "dark")}
          style={{ marginTop: 24, background: "transparent", border: `1px solid ${T.border}`, color: T.muted, padding: "6px 14px", borderRadius: 4, cursor: "pointer", fontSize: 12 }}>
          {theme === "dark" ? "☀️ Light Mode" : "🌙 Dark Mode"}
        </button>
      </div>
    </div>
  );

  return (
    <div style={{ fontFamily: "'Courier New', monospace", background: T.bg, minHeight: "100vh", color: T.text, transition: "background 0.3s, color 0.3s" }}>
      <style>{pulse}</style>

      {/* Docs Panel */}
      {showDocs && <DocsPanel T={T} onClose={() => setShowDocs(false)} />}

      {/* Header */}
      <div style={{ borderBottom: `1px solid ${T.border}`, padding: "0 32px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 60, background: T.headerBg }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ position: "relative", width: 32, height: 32 }}>
            <div style={{ position: "absolute", inset: 0, borderRadius: "50%", border: `2px solid ${T.accent}`, animation: "pulse-ring 2s infinite" }} />
            <div style={{ position: "absolute", inset: 6, borderRadius: "50%", background: T.accent }} />
          </div>
          <span style={{ fontSize: 18, fontWeight: 700, letterSpacing: 3, color: T.accent }}>GEOFENCE.HQ</span>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {error && <span style={{ fontSize: 11, color: "#ef4444", marginRight: 8 }}>⚠ {error}</span>}
          <button onClick={() => setShowDocs(true)}
            style={{ padding: "6px 14px", borderRadius: 4, border: `1px solid ${T.border}`, background: "transparent", color: T.muted, cursor: "pointer", fontSize: 12, letterSpacing: 1 }}>📚 DOCS</button>
          {[["dashboard","DASHBOARD"],["templates","TEMPLATES"],["clients","CLIENTS"],["wizard","+ NEW CAMPAIGN"]].map(([v,label]) => (
            <button key={v} onClick={() => { setView(v); setStep(0); setLaunched(false); setError(null); }}
              style={{ padding: "6px 18px", borderRadius: 4, border: "1px solid", borderColor: view === v ? T.accent : T.border, background: view === v ? T.accent + "22" : "transparent", color: view === v ? T.accent : T.muted, cursor: "pointer", fontSize: 12, letterSpacing: 2 }}>
              {label}
            </button>
          ))}
          <button onClick={() => setTheme(t => t === "dark" ? "light" : "dark")}
            style={{ padding: "6px 14px", borderRadius: 4, border: `1px solid ${T.border}`, background: "transparent", color: T.muted, cursor: "pointer", fontSize: 16 }}>
            {theme === "dark" ? "☀️" : "🌙"}
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: 8, paddingLeft: 8, borderLeft: `1px solid ${T.border}` }}>
            {user?.photoURL && <img src={user.photoURL} alt="" style={{ width: 28, height: 28, borderRadius: "50%", border: `1px solid ${T.accent}` }} />}
            <span style={{ fontSize: 11, color: T.muted, maxWidth: 120, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user?.displayName?.split(" ")[0]}</span>
            <button onClick={() => signOutUser()}
              style={{ padding: "4px 10px", borderRadius: 4, border: `1px solid ${T.border}`, background: "transparent", color: T.muted, cursor: "pointer", fontSize: 11, letterSpacing: 1 }}>OUT</button>
          </div>
        </div>
      </div>

      {view === "templates" && <TemplatesView T={T} onUseTemplate={(t) => {
        setCampaign(prev => ({ ...prev, ...t.campaign }));
        setView("wizard");
        setStep(0);
        setLaunched(false);
      }} />}
      {view === "dashboard" && <DashboardView campaigns={campaigns} loading={loading} onNew={() => setView("wizard")} onToggleStatus={handleToggleStatus} onDelete={handleDelete} T={T} clients={clients} selectedClient={selectedClient} setSelectedClient={setSelectedClient} />}
      {view === "clients" && <ClientsView clients={clients} campaigns={campaigns} T={T} onAdd={() => { setEditingClient(null); setShowClientModal(true); }} onEdit={(c) => { setEditingClient(c); setShowClientModal(true); }} onDelete={async (id) => { if (!confirm("Delete this client?")) return; await deleteClient(id); setClients(p => p.filter(c => c.id !== id)); }} onRequestAccess={(c) => setAccessClient(c)} />}
      {accessClient && <AccessRequestModal T={T} client={accessClient} onClose={() => setAccessClient(null)} />}
      {view === "wizard" && (launched
        ? <>
          <LaunchScreen name={campaign.name || `${campaign.location} Campaign`} T={T} />
          {clientNotif && (
            <div style={{ position: "fixed", inset: 0, zIndex: 3000, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div style={{ width: 520, background: T.bg, border: `1px solid ${T.border}`, borderRadius: 10, padding: 28, fontFamily: "'Courier New', monospace" }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: T.accent, marginBottom: 4, letterSpacing: 2 }}>📧 CLIENT NOTIFICATION READY</div>
                <div style={{ fontSize: 11, color: T.muted, marginBottom: 16 }}>To: {clientNotif.to} · Subject: {clientNotif.subject}</div>
                <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 6, padding: 16, fontSize: 13, color: T.text, lineHeight: 1.8, marginBottom: 16, whiteSpace: "pre-wrap" }}>{clientNotif.body}</div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={() => { navigator.clipboard.writeText(clientNotif.body); }}
                    style={{ flex: 1, padding: "10px", background: T.accent+"22", border: `1px solid ${T.accent}`, color: T.accent, borderRadius: 4, cursor: "pointer", fontSize: 12, fontWeight: 700 }}>
                    📋 COPY EMAIL
                  </button>
                  <button onClick={() => setClientNotif(null)}
                    style={{ flex: 1, padding: "10px", background: "transparent", border: `1px solid ${T.border}`, color: T.muted, borderRadius: 4, cursor: "pointer", fontSize: 12 }}>
                    DISMISS
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
        : <WizardView step={step} setStep={setStep} campaign={campaign} update={update} toggleInterest={toggleInterest} canNext={canNext} totalBudget={totalBudget} estImpressions={estImpressions} estClicks={estClicks} onLaunch={handleLaunch} saving={saving} T={T} clients={clients} selectedClient={selectedClient} setSelectedClient={setSelectedClient} />
      )}
      {showClientModal && <ClientModal T={T} client={editingClient} onClose={() => setShowClientModal(false)} onSave={async (data) => {
        if (editingClient) {
          await updateClient(editingClient.id, data);
          setClients(p => p.map(c => c.id === editingClient.id ? { ...c, ...data } : c));
        } else {
          const id = await saveClient(data, user.uid);
          setClients(p => [{ id, ...data }, ...p]);
        }
        setShowClientModal(false);
      }} />}
    </div>
  );
}

function DashboardView({ campaigns, loading, onNew, onToggleStatus, onDelete, T, clients, selectedClient, setSelectedClient }) {
  const totalSpent = campaigns.reduce((a, c) => a + (c.spent || 0), 0);
  const totalImpressions = campaigns.reduce((a, c) => a + (c.impressions || 0), 0);
  const totalClicks = campaigns.reduce((a, c) => a + (c.clicks || 0), 0);
  const totalConversions = campaigns.reduce((a, c) => a + (c.conversions || 0), 0);

  return (
    <div style={{ padding: 32 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 28 }}>
        <div>
          <div style={{ fontSize: 11, color: T.muted, letterSpacing: 3, marginBottom: 4 }}>OVERVIEW — ALL CAMPAIGNS</div>
          <div style={{ fontSize: 26, fontWeight: 700, color: T.text }}>Campaign Dashboard</div>
        </div>
        <button onClick={onNew} style={{ padding: "10px 24px", background: T.accent, color: "#000", border: "none", borderRadius: 4, cursor: "pointer", fontWeight: 700, letterSpacing: 2, fontSize: 12 }}>+ NEW CAMPAIGN</button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginBottom: 28 }}>
        {[
          { label: "TOTAL SPENT", value: `$${totalSpent.toLocaleString()}` },
          { label: "IMPRESSIONS", value: totalImpressions.toLocaleString() },
          { label: "CLICKS", value: totalClicks.toLocaleString() },
          { label: "CONVERSIONS", value: totalConversions.toLocaleString() },
        ].map(s => (
          <div key={s.label} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 6, padding: "20px 24px" }}>
            <div style={{ fontSize: 10, color: T.muted, letterSpacing: 3, marginBottom: 8 }}>{s.label}</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: T.accent }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 6, overflow: "hidden" }}>
        <div style={{ padding: "16px 24px", borderBottom: `1px solid ${T.border}`, fontSize: 11, letterSpacing: 3, color: T.muted }}>
          ALL CAMPAIGNS {loading && <span style={{ marginLeft: 8, display: "inline-block", width: 12, height: 12, border: "2px solid #22c55e", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite", verticalAlign: "middle" }} />}
        </div>

        {!loading && campaigns.length === 0 && (
          <div style={{ padding: 48, textAlign: "center", color: T.muted }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>📡</div>
            <div style={{ fontSize: 14 }}>No campaigns yet. Create your first one!</div>
          </div>
        )}

        {campaigns.map((c, i) => (
          <div key={c.id} style={{ padding: "20px 24px", borderBottom: i < campaigns.length - 1 ? "1px solid #111d11" : "none", display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 100px 100px", gap: 12, alignItems: "center", animation: "fadeUp 0.4s ease forwards", animationDelay: `${i * 0.06}s`, opacity: 0 }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4, color: T.text }}>{c.name}</div>
              <div style={{ fontSize: 11, color: T.muted }}>{c.platformName} · {c.radius} mi · {c.location}</div>
            </div>
            <div>
              <div style={{ fontSize: 10, color: "#4d7a4d", marginBottom: 3 }}>BUDGET</div>
              <div style={{ fontSize: 13 }}>${(c.spent || 0).toLocaleString()} <span style={{ color: "#4d7a4d" }}>/ ${(c.budget || 0).toLocaleString()}</span></div>
              <div style={{ marginTop: 5, height: 3, background: "#1f3d1f", borderRadius: 2 }}>
                <div style={{ height: "100%", background: "#22c55e", borderRadius: 2, width: `${c.budget ? Math.min(100, ((c.spent || 0) / c.budget) * 100) : 0}%` }} />
              </div>
            </div>
            <div><div style={{ fontSize: 10, color: "#4d7a4d", marginBottom: 3 }}>IMPRESSIONS</div><div style={{ fontSize: 13 }}>{(c.impressions || 0).toLocaleString()}</div></div>
            <div><div style={{ fontSize: 10, color: "#4d7a4d", marginBottom: 3 }}>CLICKS</div><div style={{ fontSize: 13 }}>{(c.clicks || 0).toLocaleString()}</div></div>
            <div>
              <button onClick={() => onToggleStatus(c)} style={{ padding: "5px 12px", borderRadius: 20, fontSize: 10, letterSpacing: 1, fontWeight: 700, background: c.status === "active" ? "#22c55e22" : "#ffffff11", color: c.status === "active" ? "#22c55e" : "#888", border: `1px solid ${c.status === "active" ? "#22c55e44" : "#333"}`, cursor: "pointer" }}>
                {c.status === "active" && <span className="blink" style={{ marginRight: 4 }}>●</span>}
                {(c.status || "active").toUpperCase()}
              </button>
            </div>
            <div>
              <button onClick={() => onDelete(c.id)} style={{ padding: "5px 12px", borderRadius: 4, fontSize: 11, background: "transparent", color: "#4d2d2d", border: "1px solid #3d1f1f", cursor: "pointer" }}>Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function WizardView({ step, setStep, campaign, update, toggleInterest, canNext, totalBudget, estImpressions, estClicks, onLaunch, saving, T, clients, selectedClient, setSelectedClient }) {
  return (
    <div style={{ maxWidth: 760, margin: "0 auto", padding: "40px 24px" }}>
      <div style={{ display: "flex", gap: 6, marginBottom: 40 }}>
        {STEPS.map((s, i) => (
          <div key={s} style={{ flex: 1 }}>
            <div style={{ height: 3, background: i <= step ? T.accent : T.border, borderRadius: 2, marginBottom: 6, transition: "background 0.3s" }} />
            <div style={{ fontSize: 9, letterSpacing: 1.5, color: i <= step ? T.accent : T.muted, textAlign: "center" }}>{s.toUpperCase()}</div>
          </div>
        ))}
      </div>

      <div className="fade-up" key={step}>
        {step === 0 && <StepGoal campaign={campaign} update={update} T={T} />}
        {step === 1 && <StepPlatform campaign={campaign} update={update} T={T} />}
        {step === 2 && <StepGeofence campaign={campaign} update={update} T={T} />}
        {step === 3 && <StepAudience campaign={campaign} update={update} toggleInterest={toggleInterest} T={T} />}
        {step === 4 && <StepCreative campaign={campaign} update={update} T={T} />}
        {step === 5 && <StepBudget campaign={campaign} update={update} totalBudget={totalBudget} estImpressions={estImpressions} estClicks={estClicks} T={T} />}
        {step === 6 && <StepReview campaign={campaign} totalBudget={totalBudget} estImpressions={estImpressions} estClicks={estClicks} T={T} />}
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 40 }}>
        <button onClick={() => setStep(s => s - 1)} disabled={step === 0}
          style={{ padding: "12px 28px", background: "transparent", border: `1px solid ${T.border}`, color: step === 0 ? T.border : T.muted, borderRadius: 4, cursor: step === 0 ? "default" : "pointer", letterSpacing: 2, fontSize: 12 }}>← BACK</button>
        {step < 6
          ? <button onClick={() => setStep(s => s + 1)} disabled={!canNext()}
              style={{ padding: "12px 32px", background: canNext() ? T.accent : T.border, color: canNext() ? "#000" : T.muted, border: "none", borderRadius: 4, cursor: canNext() ? "pointer" : "default", fontWeight: 700, letterSpacing: 2, fontSize: 12, transition: "all 0.2s" }}>NEXT →</button>
          : <button onClick={onLaunch} disabled={saving}
              style={{ padding: "12px 36px", background: saving ? T.border : T.accent, color: saving ? T.muted : "#000", border: "none", borderRadius: 4, cursor: saving ? "default" : "pointer", fontWeight: 700, letterSpacing: 2, fontSize: 13 }}>
              {saving ? "SAVING..." : "🚀 LAUNCH CAMPAIGN"}
            </button>
        }
      </div>
    </div>
  );
}

function SectionTitle({ step, title, sub, T }) {
  return (
    <div style={{ marginBottom: 28 }}>
      <div style={{ fontSize: 11, color: T.accent, letterSpacing: 3, marginBottom: 6 }}>STEP {step} OF 7</div>
      <div style={{ fontSize: 24, fontWeight: 700, marginBottom: 8, color: T.text }}>{title}</div>
      <div style={{ fontSize: 13, color: T.muted, lineHeight: 1.6 }}>{sub}</div>
    </div>
  );
}

function StepGoal({ campaign, update, T }) {
  return (
    <div>
      <SectionTitle step={1} title="What's your campaign goal?" sub="This determines your ad format, bidding strategy, and success metrics." T={T} />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        {GOALS.map(g => (
          <div key={g.id} onClick={() => update("goal", g.id)}
            style={{ padding: "20px 22px", border: "1px solid", borderColor: campaign.goal === g.id ? T.accent : T.border, borderRadius: 6, cursor: "pointer", background: campaign.goal === g.id ? T.accent+"11" : T.card, transition: "all 0.2s" }}>
            <div style={{ fontSize: 24, marginBottom: 8 }}>{g.icon}</div>
            <div style={{ fontWeight: 700, marginBottom: 4, color: T.text }}>{g.label}</div>
            <div style={{ fontSize: 12, color: T.muted }}>{g.desc}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function StepPlatform({ campaign, update, T }) {
  return (
    <div>
      <SectionTitle step={2} title="Choose your ad platform" sub="Each platform has different strengths. Pick the one that matches your audience." T={T} />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        {PLATFORMS.map(p => (
          <div key={p.id} onClick={() => update("platform", p.id)}
            style={{ padding: "18px 22px", border: "1px solid", borderColor: campaign.platform === p.id ? T.accent : T.border, borderRadius: 6, cursor: "pointer", background: campaign.platform === p.id ? T.accent+"11" : T.card, display: "flex", alignItems: "center", gap: 16, transition: "all 0.2s" }}>
            <div style={{ width: 44, height: 44, borderRadius: 8, background: p.color + "22", border: `1px solid ${p.color}44`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 900, color: p.color, flexShrink: 0 }}>{p.logo}</div>
            <div>
              <div style={{ fontWeight: 700, marginBottom: 4, color: T.text }}>{p.name}</div>
              <div style={{ fontSize: 11, color: T.muted }}>✓ {p.best}</div>
              <div style={{ fontSize: 11, color: T.muted }}>Min: ${p.minBudget.toLocaleString()}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function StepGeofence({ campaign, update, T }) {
  const [mapLoaded, setMapLoaded] = useState(false);
  const [googleMap, setGoogleMap] = useState(null);
  const [mainMarker, setMainMarker] = useState(null);
  const [mainCircle, setMainCircle] = useState(null);
  const [compMarkers, setCompMarkers] = useState([]);
  const [searching, setSearching] = useState(false);
  const [competitors, setCompetitors] = useState([]);
  const [compSearch, setCompSearch] = useState("");
  const [compSearching, setCompSearching] = useState(false);
  const [coords, setCoords] = useState(campaign.coords || null);
  const mapDivRef = useRef(null);
  const GKEY = import.meta.env.VITE_GOOGLE_MAPS_KEY;

  useEffect(() => {
    if (window.google?.maps) { setMapLoaded(true); return; }
    if (document.getElementById("gmap-script")) {
      const check = setInterval(() => { if (window.google?.maps) { setMapLoaded(true); clearInterval(check); } }, 100);
      return;
    }
    window.__googleMapsCallback = () => setMapLoaded(true);
    const script = document.createElement("script");
    script.id = "gmap-script";
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GKEY}&libraries=places,marker&v=beta&loading=async&callback=__googleMapsCallback`;
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);
  }, []);

  useEffect(() => {
    if (!mapLoaded || !mapDivRef.current || googleMap) return;
    const map = new window.google.maps.Map(mapDivRef.current, {
      center: { lat: 45.0731, lng: -93.4563 },
      zoom: 13,
      mapTypeId: "roadmap",
      styles: [
        { elementType: "geometry", stylers: [{ color: "#1a2e1a" }] },
        { elementType: "labels.text.stroke", stylers: [{ color: "#0a150a" }] },
        { elementType: "labels.text.fill", stylers: [{ color: "#8ab08a" }] },
        { featureType: "water", elementType: "geometry", stylers: [{ color: "#0d2b0d" }] },
        { featureType: "road", elementType: "geometry", stylers: [{ color: "#2d5a2d" }] },
        { featureType: "road.arterial", elementType: "geometry", stylers: [{ color: "#3d6e3d" }] },
        { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#4d8a4d" }] },
        { featureType: "road.highway", elementType: "geometry.stroke", stylers: [{ color: "#22c55e" }] },
        { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#0f2a0f" }] },
        { featureType: "administrative.locality", elementType: "labels.text.fill", stylers: [{ color: "#22c55e" }] },
      ],
    });
    map.addListener("click", (e) => placeMainPin(map, e.latLng.lat(), e.latLng.lng()));
    setGoogleMap(map);
  }, [mapLoaded]);

  useEffect(() => {
    if (!googleMap || !coords) return;
    if (mainCircle) mainCircle.setMap(null);
    const c = new window.google.maps.Circle({
      map: googleMap, center: coords, radius: campaign.radius * 1609.34,
      fillColor: "#22c55e", fillOpacity: 0.12, strokeColor: "#22c55e", strokeWeight: 2,
    });
    setMainCircle(c);
  }, [campaign.radius, coords, googleMap]);

  const placeMainPin = (map, lat, lng) => {
    if (mainMarker) mainMarker.setMap(null);
    const marker = new window.google.maps.Marker({
      position: { lat, lng }, map,
      icon: { path: window.google.maps.SymbolPath.CIRCLE, scale: 10, fillColor: "#22c55e", fillOpacity: 1, strokeColor: "#fff", strokeWeight: 2 },
    });
    setMainMarker(marker);
    const newCoords = { lat, lng };
    setCoords(newCoords);
    update("coords", newCoords);
    new window.google.maps.Geocoder().geocode({ location: { lat, lng } }, (results, status) => {
      if (status === "OK" && results[0]) update("location", results[0].formatted_address);
    });
  };

  const geocodeSearch = () => {
    if (!campaign.location.trim() || !googleMap) return;
    setSearching(true);
    new window.google.maps.Geocoder().geocode({ address: campaign.location }, (results, status) => {
      setSearching(false);
      if (status === "OK" && results[0]) {
        const loc = results[0].geometry.location;
        googleMap.setCenter(loc); googleMap.setZoom(15);
        placeMainPin(googleMap, loc.lat(), loc.lng());
        update("location", results[0].formatted_address);
      }
    });
  };

  const searchCompetitors = async () => {
    if (!compSearch.trim() || !coords || !googleMap) return;
    setCompSearching(true);
    compMarkers.forEach(m => m.setMap(null));
    setCompMarkers([]); setCompetitors([]);
    try {
      const { Place } = await window.google.maps.importLibrary("places");
      const request = {
        textQuery: compSearch,
        fields: ["displayName", "location", "formattedAddress", "rating", "userRatingCount", "businessStatus"],
        locationBias: { lat: coords.lat, lng: coords.lng },
        maxResultCount: 8,
      };
      const { places } = await Place.searchByText(request);
      setCompSearching(false);
      if (places?.length) {
        const top = places.slice(0, 8);
        // Convert to compatible format
        const formatted = top.map(p => ({
          name: p.displayName,
          vicinity: p.formattedAddress,
          rating: p.rating,
          user_ratings_total: p.userRatingCount,
          location: p.location,
        }));
        setCompetitors(formatted);
        const newMarkers = formatted.map((place, i) => {
          const m = new window.google.maps.Marker({
            position: place.location, map: googleMap,
            icon: { path: window.google.maps.SymbolPath.CIRCLE, scale: 9, fillColor: "#ef4444", fillOpacity: 1, strokeColor: "#fff", strokeWeight: 2 },
            label: { text: String(i + 1), color: "#fff", fontSize: "10px", fontWeight: "bold" },
            title: place.name,
          });
          const iw = new window.google.maps.InfoWindow({ content: `<div style="color:#000;padding:4px;font-size:13px"><strong>${place.name}</strong><br/>${place.vicinity || ""}</div>` });
          m.addListener("click", () => iw.open(googleMap, m));
          return m;
        });
        setCompMarkers(newMarkers);
        const bounds = new window.google.maps.LatLngBounds();
        bounds.extend(coords);
        formatted.forEach(p => bounds.extend(p.location));
        googleMap.fitBounds(bounds);
      }
    } catch(e) {
      console.error("Places search error:", e);
      setCompSearching(false);
    }
  };

  const fenceCompetitor = (place) => {
    const lat = typeof place.location.lat === "function" ? place.location.lat() : place.location.lat;
    const lng = typeof place.location.lng === "function" ? place.location.lng() : place.location.lng;
    googleMap.setCenter({ lat, lng }); googleMap.setZoom(16);
    placeMainPin(googleMap, lat, lng);
    update("location", place.vicinity || place.name);
    update("competitorName", place.name);
  };

  return (
    <div>
      <SectionTitle step={3} title="Set your geofence" sub="Search an address or click the map to place your fence." T={T} />
      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <input value={campaign.location} onChange={e => update("location", e.target.value)}
          onKeyDown={e => e.key === "Enter" && geocodeSearch()}
          placeholder="e.g. 123 Main St, Maple Grove MN or Home Depot Minneapolis"
          style={{ flex: 1, background: T.input, border: `1px solid ${T.border}`, borderRadius: 4, padding: "10px 14px", color: T.text, fontSize: 13, outline: "none" }} />
        <button onClick={geocodeSearch} disabled={searching || !mapLoaded}
          style={{ padding: "10px 20px", background: T.accent, color: "#000", border: "none", borderRadius: 4, cursor: "pointer", fontWeight: 700, fontSize: 12, whiteSpace: "nowrap" }}>
          {searching ? "..." : "📍 FIND"}
        </button>
      </div>
      <div style={{ borderRadius: 8, overflow: "hidden", border: `1px solid ${T.border}`, marginBottom: 16 }}>
        {!mapLoaded && <div style={{ height: 400, background: T.card, display: "flex", alignItems: "center", justifyContent: "center", color: T.muted, fontSize: 13 }}>Loading Google Maps...</div>}
        <div ref={mapDivRef} style={{ height: 400, display: mapLoaded ? "block" : "none" }} />
      </div>
      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20, marginBottom: 16 }}>
        <label style={{ display: "block", fontSize: 11, letterSpacing: 2, color: T.muted, marginBottom: 8 }}>FENCE RADIUS: {campaign.radius} MILE{campaign.radius !== 1 ? "S" : ""}</label>
        <input type="range" min={0.1} max={10} step={0.1} value={campaign.radius} onChange={e => update("radius", parseFloat(e.target.value))} style={{ width: "100%", accentColor: T.accent }} />
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: T.muted, marginTop: 4 }}>
          <span>0.1 mi (hyperlocal)</span><span>5 mi</span><span>10 mi (broad)</span>
        </div>
      </div>
      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "#ef4444", letterSpacing: 2, marginBottom: 4 }}>⚔️ COMPETITOR FINDER</div>
        <div style={{ fontSize: 11, color: T.muted, marginBottom: 12 }}>Red numbered pins appear on the map. Click FENCE THIS to target a competitor.</div>
        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          <input value={compSearch} onChange={e => setCompSearch(e.target.value)}
            onKeyDown={e => e.key === "Enter" && searchCompetitors()}
            placeholder="e.g. Office Depot, Staples, dental office, roofing company..."
            style={{ flex: 1, background: T.input, border: `1px solid ${T.border}`, borderRadius: 4, padding: "9px 12px", color: T.text, fontSize: 13, outline: "none" }} />
          <button onClick={searchCompetitors} disabled={compSearching || !coords || !mapLoaded}
            style={{ padding: "9px 18px", background: "#ef444422", color: "#ef4444", border: "1px solid #ef444444", borderRadius: 4, cursor: "pointer", fontSize: 12, fontWeight: 700 }}>
            {compSearching ? "SEARCHING..." : "SEARCH"}
          </button>
        </div>
        {!coords && <div style={{ fontSize: 11, color: T.muted }}>📍 Place a pin on the map first, then search for competitors nearby.</div>}
        {competitors.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {competitors.map((p, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", background: T.bg, border: `1px solid ${T.border}`, borderRadius: 6 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 24, height: 24, borderRadius: "50%", background: "#ef4444", color: "#fff", fontSize: 11, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{i + 1}</div>
                  <div>
                    <div style={{ fontSize: 13, color: T.text, fontWeight: 600 }}>{p.name}</div>
                    <div style={{ fontSize: 11, color: T.muted }}>{p.vicinity}</div>
                    {p.rating && <div style={{ fontSize: 10, color: "#f59e0b" }}>{"★".repeat(Math.round(p.rating))} {p.rating} ({p.user_ratings_total} reviews)</div>}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  <button onClick={() => fenceCompetitor(p)}
                    style={{ padding: "6px 14px", background: T.accent, color: "#000", border: "none", borderRadius: 4, cursor: "pointer", fontSize: 11, fontWeight: 700, whiteSpace: "nowrap" }}>
                    FENCE THIS
                  </button>
                  <button onClick={() => {
                    const updated = competitors.filter((_, idx) => idx !== i);
                    setCompetitors(updated);
                    if (compMarkers[i]) { compMarkers[i].setMap(null); }
                    setCompMarkers(prev => prev.filter((_, idx) => idx !== i));
                  }}
                    style={{ width: 28, height: 28, background: "transparent", border: `1px solid ${T.border}`, borderRadius: 4, cursor: "pointer", color: T.muted, fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StepAudience({ campaign, update, toggleInterest, T }) {
  return (
    <div>
      <SectionTitle step={4} title="Define your audience" sub="Layer demographics on top of your geofence for precision targeting." T={T} />
      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 24, marginBottom: 16 }}>
        <div style={{ fontSize: 11, letterSpacing: 2, color: T.muted, marginBottom: 16 }}>AGE RANGE: {campaign.ageMin} – {campaign.ageMax}</div>
        <div style={{ display: "flex", gap: 16 }}>
          <input type="range" min={13} max={65} value={campaign.ageMin} onChange={e => update("ageMin", +e.target.value)} style={{ flex: 1, accentColor: T.accent }} />
          <input type="range" min={13} max={65} value={campaign.ageMax} onChange={e => update("ageMax", +e.target.value)} style={{ flex: 1, accentColor: T.accent }} />
        </div>
      </div>
      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 24, marginBottom: 16 }}>
        <div style={{ fontSize: 11, letterSpacing: 2, color: T.muted, marginBottom: 12 }}>GENDER</div>
        <div style={{ display: "flex", gap: 10 }}>
          {["all", "male", "female", "nonbinary"].map(g => (
            <div key={g} onClick={() => update("gender", g)}
              style={{ padding: "8px 16px", border: "1px solid", borderColor: campaign.gender === g ? T.accent : T.border, borderRadius: 4, cursor: "pointer", fontSize: 12, color: campaign.gender === g ? T.accent : T.text, background: campaign.gender === g ? T.accent+"11" : "transparent", textTransform: "capitalize" }}>{g}</div>
          ))}
        </div>
      </div>
      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 24 }}>
        <div style={{ fontSize: 11, letterSpacing: 2, color: T.muted, marginBottom: 12 }}>INTERESTS (select at least one)</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {INTERESTS.map(i => (
            <div key={i} onClick={() => toggleInterest(i)}
              style={{ padding: "8px 16px", border: "1px solid", borderColor: campaign.interests.includes(i) ? T.accent : T.border, borderRadius: 20, cursor: "pointer", fontSize: 12, background: campaign.interests.includes(i) ? T.accent+"22" : "transparent", color: campaign.interests.includes(i) ? T.accent : T.text, transition: "all 0.15s" }}>{i}</div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StepCreative({ campaign, update, T }) {
  const platform = PLATFORMS.find(p => p.id === campaign.platform);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [showAi, setShowAi] = useState(false);
  const [aiError, setAiError] = useState(null);

  const generateWithAI = async () => {
    if (!aiPrompt.trim()) return;
    setAiLoading(true);
    setAiError(null);
    try {
      const goal = GOALS.find(g => g.id === campaign.goal)?.label || campaign.goal;
      const response = await fetch("/api/generate-ad", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: aiPrompt,
          goal,
          platform: platform?.name,
          ageMin: campaign.ageMin,
          ageMax: campaign.ageMax,
          interests: campaign.interests,
          location: campaign.location,
        })
      });
      const parsed = await response.json();
      if (parsed.headline) update("headline", parsed.headline);
      if (parsed.body) update("body", parsed.body);
      if (parsed.cta) update("cta", parsed.cta);
      if (parsed.name) update("name", parsed.name);
      setShowAi(false);
      setAiPrompt("");
    } catch (e) {
      setAiError("Could not generate ad. Try again.");
      console.error(e);
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div>
      <SectionTitle step={5} title="Create your ad" sub="Write compelling copy or let AI generate it for you." T={T} />

      <div style={{ background: T.headerBg, border: "1px solid #22c55e55", borderRadius: 8, padding: 20, marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 20 }}>✨</span>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#22c55e" }}>AI Ad Generator</div>
              <div style={{ fontSize: 11, color: "#4d7a4d" }}>Describe your business — Claude writes your ad instantly</div>
            </div>
          </div>
          <button onClick={() => setShowAi(s => !s)}
            style={{ padding: "7px 18px", background: showAi ? "transparent" : "#22c55e", color: showAi ? "#4d7a4d" : "#000", border: "1px solid #22c55e55", borderRadius: 4, cursor: "pointer", fontSize: 11, fontWeight: 700, letterSpacing: 1 }}>
            {showAi ? "CANCEL" : "✨ GENERATE"}
          </button>
        </div>
        {showAi && (
          <div style={{ marginTop: 14 }}>
            <textarea value={aiPrompt} onChange={e => setAiPrompt(e.target.value)}
              placeholder="e.g. We offer roof inspections and gutter cleaning. Running a spring special — 20% off for homeowners who book this month."
              rows={3}
              style={{ width: "100%", background: T.card, border: "1px solid #22c55e33", borderRadius: 4, padding: "10px 12px", color: T.text, fontSize: 13, outline: "none", resize: "none", boxSizing: "border-box", marginBottom: 10 }} />
            {aiError && <div style={{ fontSize: 12, color: "#ef4444", marginBottom: 8 }}>{aiError}</div>}
            <button onClick={generateWithAI} disabled={aiLoading || !aiPrompt.trim()}
              style={{ width: "100%", padding: 11, background: aiLoading || !aiPrompt.trim() ? "#1f3d1f" : "#22c55e", color: aiLoading || !aiPrompt.trim() ? "#2d4d2d" : "#000", border: "none", borderRadius: 4, cursor: aiLoading ? "default" : "pointer", fontWeight: 700, fontSize: 13, letterSpacing: 1 }}>
              {aiLoading ? "✨ WRITING YOUR AD..." : "✨ WRITE MY AD"}
            </button>
          </div>
        )}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        <div>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20, marginBottom: 14 }}>
            <label style={{ display: "block", fontSize: 11, letterSpacing: 2, color: T.muted, marginBottom: 8 }}>CAMPAIGN NAME</label>
            <input value={campaign.name} onChange={e => update("name", e.target.value)} placeholder="e.g. Summer Promo — Downtown"
              style={{ width: "100%", background: T.input, border: `1px solid ${T.border}`, borderRadius: 4, padding: "10px 12px", color: T.text, fontSize: 13, outline: "none", boxSizing: "border-box" }} />
          </div>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20, marginBottom: 14 }}>
            <label style={{ display: "block", fontSize: 11, letterSpacing: 2, color: T.muted, marginBottom: 8 }}>HEADLINE</label>
            <input value={campaign.headline} onChange={e => update("headline", e.target.value)} placeholder="e.g. You're Just Steps Away!" maxLength={60}
              style={{ width: "100%", background: T.input, border: `1px solid ${T.border}`, borderRadius: 4, padding: "10px 12px", color: T.text, fontSize: 13, outline: "none", boxSizing: "border-box" }} />
            <div style={{ fontSize: 10, color: T.muted, marginTop: 4, textAlign: "right" }}>{campaign.headline.length}/60</div>
          </div>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20, marginBottom: 14 }}>
            <label style={{ display: "block", fontSize: 11, letterSpacing: 2, color: T.muted, marginBottom: 8 }}>BODY TEXT</label>
            <textarea value={campaign.body} onChange={e => update("body", e.target.value)} placeholder="e.g. Get 20% off today when you show this ad in-store." maxLength={150} rows={3}
              style={{ width: "100%", background: T.input, border: `1px solid ${T.border}`, borderRadius: 4, padding: "10px 12px", color: T.text, fontSize: 13, outline: "none", resize: "none", boxSizing: "border-box" }} />
          </div>
          <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 20 }}>
            <label style={{ display: "block", fontSize: 11, letterSpacing: 2, color: T.muted, marginBottom: 8 }}>CALL TO ACTION</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {["Visit Us Today", "Get Directions", "Shop Now", "Claim Offer", "Learn More", "Book Now"].map(cta => (
                <div key={cta} onClick={() => update("cta", cta)}
                  style={{ padding: "7px 14px", border: "1px solid", borderColor: campaign.cta === cta ? T.accent : T.border, borderRadius: 4, cursor: "pointer", fontSize: 11, background: campaign.cta === cta ? T.accent+"22" : "transparent", color: campaign.cta === cta ? T.accent : T.text }}>{cta}</div>
              ))}
            </div>
          </div>
        </div>
        <div>
          <div style={{ fontSize: 11, letterSpacing: 2, color: "#4d7a4d", marginBottom: 12 }}>AD PREVIEW</div>
          <div style={{ background: "#fff", borderRadius: 12, padding: 16, color: "#000" }}>
            <div style={{ fontSize: 10, color: "#888", marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{ width: 24, height: 24, borderRadius: "50%", background: platform?.color || "#888", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: "#fff", fontWeight: 900 }}>{platform?.logo || "?"}</div>
              <span>Sponsored · {platform?.name || "Platform"}</span>
            </div>
            <div style={{ background: "#f0f0f0", height: 120, borderRadius: 8, marginBottom: 10, display: "flex", alignItems: "center", justifyContent: "center", color: "#999", fontSize: 12 }}>[ Ad Image ]</div>
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>{campaign.headline || "Your headline here"}</div>
            <div style={{ fontSize: 12, color: "#555", marginBottom: 10, lineHeight: 1.5 }}>{campaign.body || "Your ad body text will appear here."}</div>
            <button style={{ width: "100%", padding: 10, background: platform?.color || "#22c55e", color: "#fff", border: "none", borderRadius: 6, fontWeight: 700, fontSize: 13 }}>{campaign.cta}</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function StepBudget({ campaign, update, totalBudget, estImpressions, estClicks, T }) {
  return (
    <div>
      <SectionTitle step={6} title="Set your budget" sub="Start small and scale what works. You can adjust anytime after launch." T={T} />
      {campaign.goal && campaign.platform && BUDGET_RECS[campaign.goal]?.[campaign.platform] && (
        <div style={{ background: T.accent+"11", border: `1px solid ${T.accent}44`, borderRadius: 8, padding: "14px 20px", marginBottom: 16, display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 20 }}>💡</span>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.accent, marginBottom: 2 }}>RECOMMENDED FOR YOUR GOAL</div>
            <div style={{ fontSize: 12, color: T.text }}>
              For <strong>{GOALS.find(g=>g.id===campaign.goal)?.label}</strong> on <strong>{PLATFORMS.find(p=>p.id===campaign.platform)?.name}</strong>: 
              <span style={{ color: T.accent, fontWeight: 700 }}> ${BUDGET_RECS[campaign.goal][campaign.platform][0]}–${BUDGET_RECS[campaign.goal][campaign.platform][1]}/day</span> is typical for effective local campaigns.
              <button onClick={() => update("dailyBudget", BUDGET_RECS[campaign.goal][campaign.platform][0])}
                style={{ marginLeft: 10, padding: "2px 10px", background: T.accent, color: "#000", border: "none", borderRadius: 4, cursor: "pointer", fontSize: 11, fontWeight: 700 }}>
                USE MIN
              </button>
              <button onClick={() => update("dailyBudget", BUDGET_RECS[campaign.goal][campaign.platform][1])}
                style={{ marginLeft: 6, padding: "2px 10px", background: "transparent", color: T.accent, border: `1px solid ${T.accent}`, borderRadius: 4, cursor: "pointer", fontSize: 11, fontWeight: 700 }}>
                USE MAX
              </button>
            </div>
          </div>
        </div>
      )}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 24 }}>
          <label style={{ display: "block", fontSize: 11, letterSpacing: 2, color: T.muted, marginBottom: 8 }}>DAILY BUDGET</label>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 24, color: "#4d7a4d" }}>$</span>
            <input type="number" value={campaign.dailyBudget} onChange={e => update("dailyBudget", Math.max(10, +e.target.value))} min={10}
              style={{ background: "transparent", border: "none", color: "#22c55e", fontSize: 32, fontWeight: 700, width: 100, outline: "none" }} />
            <span style={{ color: "#4d7a4d", fontSize: 13 }}>/ day</span>
          </div>
          <input type="range" min={10} max={500} value={campaign.dailyBudget} onChange={e => update("dailyBudget", +e.target.value)} style={{ width: "100%", accentColor: "#22c55e", marginTop: 10 }} />
        </div>
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 24 }}>
          <label style={{ display: "block", fontSize: 11, letterSpacing: 2, color: T.muted, marginBottom: 8 }}>DURATION</label>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <input type="number" value={campaign.duration} onChange={e => update("duration", Math.max(1, +e.target.value))} min={1}
              style={{ background: "transparent", border: "none", color: "#22c55e", fontSize: 32, fontWeight: 700, width: 70, outline: "none" }} />
            <span style={{ color: "#4d7a4d", fontSize: 13 }}>days</span>
          </div>
          <input type="range" min={1} max={90} value={campaign.duration} onChange={e => update("duration", +e.target.value)} style={{ width: "100%", accentColor: "#22c55e", marginTop: 10 }} />
        </div>
      </div>
      <div style={{ background: T.card, border: `1px solid ${T.accent}22`, borderRadius: 8, padding: 24 }}>
        <div style={{ fontSize: 11, letterSpacing: 2, color: T.muted, marginBottom: 16 }}>PROJECTED RESULTS</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16 }}>
          {[["TOTAL SPEND", `$${totalBudget.toLocaleString()}`], ["EST. IMPRESSIONS", estImpressions.toLocaleString()], ["EST. CLICKS", estClicks.toLocaleString()]].map(([l, v]) => (
            <div key={l} style={{ textAlign: "center" }}>
              <div style={{ fontSize: 26, fontWeight: 700, color: T.accent }}>{v}</div>
              <div style={{ fontSize: 10, color: T.muted, letterSpacing: 2, marginTop: 4 }}>{l}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StepReview({ campaign, totalBudget, estImpressions, estClicks, T }) {
  const goal = GOALS.find(g => g.id === campaign.goal);
  const platform = PLATFORMS.find(p => p.id === campaign.platform);
  const rows = [
    ["Goal", `${goal?.icon} ${goal?.label}`],
    ["Platform", platform?.name],
    ["Location", campaign.location],
    ["Radius", `${campaign.radius} miles`],
    ["Audience", `Ages ${campaign.ageMin}–${campaign.ageMax}, ${campaign.gender}`],
    ["Interests", campaign.interests.join(", ")],
    ["Headline", campaign.headline],
    ["CTA", campaign.cta],
    ["Budget", `$${totalBudget.toLocaleString()} total ($${campaign.dailyBudget}/day × ${campaign.duration} days)`],
    ["Est. Impressions", estImpressions.toLocaleString()],
    ["Est. Clicks", estClicks.toLocaleString()],
  ];
  return (
    <div>
      <SectionTitle step={7} title="Review & Launch" sub="Everything look good? Hit launch to save your campaign to Firebase." T={T} />
      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, overflow: "hidden" }}>
        {rows.map(([label, val], i) => (
          <div key={label} style={{ display: "flex", padding: "14px 22px", borderBottom: i < rows.length - 1 ? `1px solid ${T.border}` : "none" }}>
            <div style={{ width: 160, fontSize: 11, color: T.muted, letterSpacing: 1.5, flexShrink: 0 }}>{label.toUpperCase()}</div>
            <div style={{ fontSize: 13 }}>{val || <span style={{ color: T.muted }}>—</span>}</div>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 16, padding: "14px 20px", background: T.accent+"11", border: `1px solid ${T.accent}33`, borderRadius: 6, fontSize: 12, color: T.muted, lineHeight: 1.8 }}>
        ✓ Campaign will be saved to Firebase instantly<br />
        ✓ You can pause or delete anytime from the dashboard<br />
        ✓ Update impression/click data manually as your campaign runs
      </div>

      {/* One-click copy formatted for platform */}
      <CopyBrief campaign={campaign} totalBudget={totalBudget} T={T} />

      {/* Launch checklist */}
      {campaign.platform && PLATFORM_CHECKLIST[campaign.platform] && (
        <LaunchChecklist platform={PLATFORMS.find(p=>p.id===campaign.platform)} steps={PLATFORM_CHECKLIST[campaign.platform]} T={T} />
      )}
    </div>
  );
}

function LaunchScreen({ name, T }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "70vh", gap: 20 }}>
      <div style={{ position: "relative", width: 120, height: 120 }}>
        {[1, 0.7, 0.45].map((scale, i) => (
          <div key={i} style={{ position: "absolute", top: "50%", left: "50%", width: 110 * scale, height: 110 * scale, transform: "translate(-50%,-50%)", borderRadius: "50%", border: "2px solid #22c55e", animation: `pulse-ring ${1.5 + i * 0.5}s infinite`, animationDelay: `${i * 0.3}s` }} />
        ))}
        <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", fontSize: 36 }}>🚀</div>
      </div>
      <div style={{ fontSize: 22, fontWeight: 700, color: T.accent, letterSpacing: 2 }}>CAMPAIGN LAUNCHED!</div>
      <div style={{ fontSize: 14, color: T.muted, textAlign: "center" }}>"{name}" saved to Firebase.<br />Returning to dashboard...</div>
    </div>
  );
}
