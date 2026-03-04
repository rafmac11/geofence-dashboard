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

import { useState, useEffect } from "react";
import { saveCampaign, loadCampaigns, updateCampaign, deleteCampaign } from "./firebase.js";

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

const BLANK_CAMPAIGN = {
  goal: null, platform: null, location: "", radius: 1, fence_type: "circle",
  ageMin: 18, ageMax: 55, gender: "all", interests: [],
  headline: "", body: "", cta: "Visit Us Today",
  dailyBudget: 50, duration: 14, name: "",
  status: "active", spent: 0, impressions: 0, clicks: 0, conversions: 0,
};

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
  const T = theme === "dark" ? DARK : LIGHT;

  // Load campaigns from Firebase on mount
  useEffect(() => {
    fetchCampaigns();
  }, []);

  async function fetchCampaigns() {
    try {
      setLoading(true);
      const data = await loadCampaigns();
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
        platformName: platform?.name || "—",
        budget: totalBudget,
        estImpressions,
        estClicks,
        ctr: "—",
      };
      const id = await saveCampaign(newCamp);
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

  return (
    <div style={{ fontFamily: "'Courier New', monospace", background: T.bg, minHeight: "100vh", color: T.text, transition: "background 0.3s, color 0.3s" }}>
      <style>{pulse}</style>

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
          {["dashboard", "wizard"].map(v => (
            <button key={v} onClick={() => { setView(v); setStep(0); setLaunched(false); setError(null); }}
              style={{ padding: "6px 18px", borderRadius: 4, border: "1px solid", borderColor: view === v ? T.accent : T.border, background: view === v ? T.accent + "22" : "transparent", color: view === v ? T.accent : T.muted, cursor: "pointer", fontSize: 12, letterSpacing: 2, textTransform: "uppercase" }}>
              {v === "wizard" ? "+ New Campaign" : v}
            </button>
          ))}
          <button onClick={() => setTheme(t => t === "dark" ? "light" : "dark")}
            style={{ padding: "6px 14px", borderRadius: 4, border: `1px solid ${T.border}`, background: "transparent", color: T.muted, cursor: "pointer", fontSize: 16 }}>
            {theme === "dark" ? "☀️" : "🌙"}
          </button>
        </div>
      </div>

      {view === "dashboard"
        ? <DashboardView campaigns={campaigns} loading={loading} onNew={() => setView("wizard")} onToggleStatus={handleToggleStatus} onDelete={handleDelete} T={T} />
        : launched
          ? <LaunchScreen name={campaign.name || `${campaign.location} Campaign`} T={T} />
          : <WizardView step={step} setStep={setStep} campaign={campaign} update={update} toggleInterest={toggleInterest} canNext={canNext} totalBudget={totalBudget} estImpressions={estImpressions} estClicks={estClicks} onLaunch={handleLaunch} saving={saving} T={T} />
      }
    </div>
  );
}

function DashboardView({ campaigns, loading, onNew, onToggleStatus, onDelete, T }) {
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

function WizardView({ step, setStep, campaign, update, toggleInterest, canNext, totalBudget, estImpressions, estClicks, onLaunch, saving, T }) {
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
  return (
    <div>
      <SectionTitle step={3} title="Set your geofence" sub="Define where your ads will trigger. Tighter fences = more relevant audience." T={T} />
      <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: 24, marginBottom: 16 }}>
        <label style={{ display: "block", fontSize: 11, letterSpacing: 2, color: T.muted, marginBottom: 8 }}>TARGET LOCATION</label>
        <input value={campaign.location} onChange={e => update("location", e.target.value)}
          placeholder="e.g. 123 Main St, Chicago, IL"
          style={{ width: "100%", background: T.input, border: `1px solid ${T.border}`, borderRadius: 4, padding: "12px 14px", color: T.text, fontSize: 14, outline: "none", boxSizing: "border-box" }} />
      </div>
      <div style={{ background: "#0d1a0d", border: "1px solid #1f3d1f", borderRadius: 8, padding: 24, marginBottom: 16 }}>
        <label style={{ display: "block", fontSize: 11, letterSpacing: 2, color: "#4d7a4d", marginBottom: 8 }}>RADIUS: {campaign.radius} MILE{campaign.radius !== 1 ? "S" : ""}</label>
        <input type="range" min={0.1} max={10} step={0.1} value={campaign.radius} onChange={e => update("radius", parseFloat(e.target.value))} style={{ width: "100%", accentColor: "#22c55e" }} />
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#2d4d2d", marginTop: 4 }}>
          <span>0.1 mi</span><span>5 mi</span><span>10 mi</span>
        </div>
      </div>
      <div style={{ background: "#0d1a0d", border: "1px solid #1f3d1f", borderRadius: 8, padding: 24, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ position: "relative", width: 180, height: 180 }}>
          {[1, 0.7, 0.45].map((scale, i) => (
            <div key={i} style={{ position: "absolute", top: "50%", left: "50%", width: 160 * scale, height: 160 * scale, transform: "translate(-50%,-50%)", borderRadius: "50%", border: `1px solid #22c55e${["33","22","11"][i]}`, background: `#22c55e${["08","04","02"][i]}` }} />
          ))}
          <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", fontSize: 20 }}>📍</div>
          <div style={{ position: "absolute", bottom: -24, left: "50%", transform: "translateX(-50%)", fontSize: 11, color: "#22c55e", whiteSpace: "nowrap" }}>{campaign.radius} mile fence</div>
        </div>
      </div>
    </div>
  );
}

function StepAudience({ campaign, update, toggleInterest, T }) {
  return (
    <div>
      <SectionTitle step={4} title="Define your audience" sub="Layer demographics on top of your geofence for precision targeting." T={T} />
      <div style={{ background: "#0d1a0d", border: "1px solid #1f3d1f", borderRadius: 8, padding: 24, marginBottom: 16 }}>
        <div style={{ fontSize: 11, letterSpacing: 2, color: "#4d7a4d", marginBottom: 16 }}>AGE RANGE: {campaign.ageMin} – {campaign.ageMax}</div>
        <div style={{ display: "flex", gap: 16 }}>
          <input type="range" min={13} max={65} value={campaign.ageMin} onChange={e => update("ageMin", +e.target.value)} style={{ flex: 1, accentColor: "#22c55e" }} />
          <input type="range" min={13} max={65} value={campaign.ageMax} onChange={e => update("ageMax", +e.target.value)} style={{ flex: 1, accentColor: "#22c55e" }} />
        </div>
      </div>
      <div style={{ background: "#0d1a0d", border: "1px solid #1f3d1f", borderRadius: 8, padding: 24, marginBottom: 16 }}>
        <div style={{ fontSize: 11, letterSpacing: 2, color: "#4d7a4d", marginBottom: 12 }}>GENDER</div>
        <div style={{ display: "flex", gap: 10 }}>
          {["all", "male", "female", "nonbinary"].map(g => (
            <div key={g} onClick={() => update("gender", g)}
              style={{ padding: "8px 16px", border: "1px solid", borderColor: campaign.gender === g ? "#22c55e" : "#1f3d1f", borderRadius: 4, cursor: "pointer", fontSize: 12, background: campaign.gender === g ? "#22c55e11" : "transparent", textTransform: "capitalize" }}>{g}</div>
          ))}
        </div>
      </div>
      <div style={{ background: "#0d1a0d", border: "1px solid #1f3d1f", borderRadius: 8, padding: 24 }}>
        <div style={{ fontSize: 11, letterSpacing: 2, color: "#4d7a4d", marginBottom: 12 }}>INTERESTS (select at least one)</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {INTERESTS.map(i => (
            <div key={i} onClick={() => toggleInterest(i)}
              style={{ padding: "8px 16px", border: "1px solid", borderColor: campaign.interests.includes(i) ? "#22c55e" : "#1f3d1f", borderRadius: 20, cursor: "pointer", fontSize: 12, background: campaign.interests.includes(i) ? "#22c55e22" : "transparent", color: campaign.interests.includes(i) ? "#22c55e" : "#e8f5e8", transition: "all 0.15s" }}>{i}</div>
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
      <SectionTitle step={5} title="Create your ad" sub="Write compelling copy or let AI generate it for you." />

      <div style={{ background: "#060c06", border: "1px solid #22c55e55", borderRadius: 8, padding: 20, marginBottom: 20 }}>
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
              style={{ width: "100%", background: "#0d1a0d", border: "1px solid #22c55e33", borderRadius: 4, padding: "10px 12px", color: "#e8f5e8", fontSize: 13, outline: "none", resize: "none", boxSizing: "border-box", marginBottom: 10 }} />
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
          <div style={{ background: "#0d1a0d", border: "1px solid #1f3d1f", borderRadius: 8, padding: 20, marginBottom: 14 }}>
            <label style={{ display: "block", fontSize: 11, letterSpacing: 2, color: "#4d7a4d", marginBottom: 8 }}>CAMPAIGN NAME</label>
            <input value={campaign.name} onChange={e => update("name", e.target.value)} placeholder="e.g. Summer Promo — Downtown"
              style={{ width: "100%", background: "#060c06", border: "1px solid #1f3d1f", borderRadius: 4, padding: "10px 12px", color: "#e8f5e8", fontSize: 13, outline: "none", boxSizing: "border-box" }} />
          </div>
          <div style={{ background: "#0d1a0d", border: "1px solid #1f3d1f", borderRadius: 8, padding: 20, marginBottom: 14 }}>
            <label style={{ display: "block", fontSize: 11, letterSpacing: 2, color: "#4d7a4d", marginBottom: 8 }}>HEADLINE</label>
            <input value={campaign.headline} onChange={e => update("headline", e.target.value)} placeholder="e.g. You're Just Steps Away!" maxLength={60}
              style={{ width: "100%", background: "#060c06", border: "1px solid #1f3d1f", borderRadius: 4, padding: "10px 12px", color: "#e8f5e8", fontSize: 13, outline: "none", boxSizing: "border-box" }} />
            <div style={{ fontSize: 10, color: "#2d4d2d", marginTop: 4, textAlign: "right" }}>{campaign.headline.length}/60</div>
          </div>
          <div style={{ background: "#0d1a0d", border: "1px solid #1f3d1f", borderRadius: 8, padding: 20, marginBottom: 14 }}>
            <label style={{ display: "block", fontSize: 11, letterSpacing: 2, color: "#4d7a4d", marginBottom: 8 }}>BODY TEXT</label>
            <textarea value={campaign.body} onChange={e => update("body", e.target.value)} placeholder="e.g. Get 20% off today when you show this ad in-store." maxLength={150} rows={3}
              style={{ width: "100%", background: "#060c06", border: "1px solid #1f3d1f", borderRadius: 4, padding: "10px 12px", color: "#e8f5e8", fontSize: 13, outline: "none", resize: "none", boxSizing: "border-box" }} />
          </div>
          <div style={{ background: "#0d1a0d", border: "1px solid #1f3d1f", borderRadius: 8, padding: 20 }}>
            <label style={{ display: "block", fontSize: 11, letterSpacing: 2, color: "#4d7a4d", marginBottom: 8 }}>CALL TO ACTION</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {["Visit Us Today", "Get Directions", "Shop Now", "Claim Offer", "Learn More", "Book Now"].map(cta => (
                <div key={cta} onClick={() => update("cta", cta)}
                  style={{ padding: "7px 14px", border: "1px solid", borderColor: campaign.cta === cta ? "#22c55e" : "#1f3d1f", borderRadius: 4, cursor: "pointer", fontSize: 11, background: campaign.cta === cta ? "#22c55e22" : "transparent", color: campaign.cta === cta ? "#22c55e" : "#e8f5e8" }}>{cta}</div>
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
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
        <div style={{ background: "#0d1a0d", border: "1px solid #1f3d1f", borderRadius: 8, padding: 24 }}>
          <label style={{ display: "block", fontSize: 11, letterSpacing: 2, color: "#4d7a4d", marginBottom: 8 }}>DAILY BUDGET</label>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 24, color: "#4d7a4d" }}>$</span>
            <input type="number" value={campaign.dailyBudget} onChange={e => update("dailyBudget", Math.max(10, +e.target.value))} min={10}
              style={{ background: "transparent", border: "none", color: "#22c55e", fontSize: 32, fontWeight: 700, width: 100, outline: "none" }} />
            <span style={{ color: "#4d7a4d", fontSize: 13 }}>/ day</span>
          </div>
          <input type="range" min={10} max={500} value={campaign.dailyBudget} onChange={e => update("dailyBudget", +e.target.value)} style={{ width: "100%", accentColor: "#22c55e", marginTop: 10 }} />
        </div>
        <div style={{ background: "#0d1a0d", border: "1px solid #1f3d1f", borderRadius: 8, padding: 24 }}>
          <label style={{ display: "block", fontSize: 11, letterSpacing: 2, color: "#4d7a4d", marginBottom: 8 }}>DURATION</label>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <input type="number" value={campaign.duration} onChange={e => update("duration", Math.max(1, +e.target.value))} min={1}
              style={{ background: "transparent", border: "none", color: "#22c55e", fontSize: 32, fontWeight: 700, width: 70, outline: "none" }} />
            <span style={{ color: "#4d7a4d", fontSize: 13 }}>days</span>
          </div>
          <input type="range" min={1} max={90} value={campaign.duration} onChange={e => update("duration", +e.target.value)} style={{ width: "100%", accentColor: "#22c55e", marginTop: 10 }} />
        </div>
      </div>
      <div style={{ background: "#0d1a0d", border: "1px solid #22c55e22", borderRadius: 8, padding: 24 }}>
        <div style={{ fontSize: 11, letterSpacing: 2, color: "#4d7a4d", marginBottom: 16 }}>PROJECTED RESULTS</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16 }}>
          {[["TOTAL SPEND", `$${totalBudget.toLocaleString()}`], ["EST. IMPRESSIONS", estImpressions.toLocaleString()], ["EST. CLICKS", estClicks.toLocaleString()]].map(([l, v]) => (
            <div key={l} style={{ textAlign: "center" }}>
              <div style={{ fontSize: 26, fontWeight: 700, color: "#22c55e" }}>{v}</div>
              <div style={{ fontSize: 10, color: "#4d7a4d", letterSpacing: 2, marginTop: 4 }}>{l}</div>
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
      <div style={{ background: "#0d1a0d", border: "1px solid #1f3d1f", borderRadius: 8, overflow: "hidden" }}>
        {rows.map(([label, val], i) => (
          <div key={label} style={{ display: "flex", padding: "14px 22px", borderBottom: i < rows.length - 1 ? "1px solid #111d11" : "none" }}>
            <div style={{ width: 160, fontSize: 11, color: "#4d7a4d", letterSpacing: 1.5, flexShrink: 0 }}>{label.toUpperCase()}</div>
            <div style={{ fontSize: 13 }}>{val || <span style={{ color: "#2d4d2d" }}>—</span>}</div>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 16, padding: "14px 20px", background: "#22c55e11", border: "1px solid #22c55e33", borderRadius: 6, fontSize: 12, color: "#4d7a4d", lineHeight: 1.8 }}>
        ✓ Campaign will be saved to Firebase instantly<br />
        ✓ You can pause or delete anytime from the dashboard<br />
        ✓ Update impression/click data manually as your campaign runs
      </div>
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
