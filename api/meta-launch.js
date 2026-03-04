// Creates a Meta Ads campaign via the Marketing API
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { campaign, adAccountId, accessToken } = req.body;
  if (!campaign || !adAccountId || !accessToken) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const accountId = adAccountId.startsWith("act_") ? adAccountId : `act_${adAccountId}`;
  const BASE = `https://graph.facebook.com/v19.0`;

  try {
    // 1. Create Campaign
    const campaignRes = await fetch(`${BASE}/${accountId}/campaigns`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: campaign.name,
        objective: campaign.goal === "retarget" ? "RETARGETING" : "REACH",
        status: "PAUSED",
        access_token: accessToken,
        special_ad_categories: [],
      }),
    });
    const campaignData = await campaignRes.json();
    if (campaignData.error) throw new Error(campaignData.error.message);
    const campaignId = campaignData.id;

    // 2. Create Ad Set with geo targeting
    const startTime = Math.floor(Date.now() / 1000);
    const endTime = startTime + campaign.duration * 86400;
    const dailyBudget = Math.round(campaign.dailyBudget * 100); // cents

    const adSetRes = await fetch(`${BASE}/${accountId}/adsets`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: `${campaign.name} — Ad Set`,
        campaign_id: campaignId,
        daily_budget: dailyBudget,
        billing_event: "IMPRESSIONS",
        optimization_goal: "REACH",
        bid_strategy: "LOWEST_COST_WITHOUT_CAP",
        start_time: startTime,
        end_time: endTime,
        status: "PAUSED",
        targeting: {
          age_min: campaign.ageMin,
          age_max: campaign.ageMax,
          genders: campaign.gender === "male" ? [1] : campaign.gender === "female" ? [2] : [1, 2],
          geo_locations: {
            custom_locations: [{
              address_string: campaign.location,
              radius: campaign.radius,
              distance_unit: "mile",
            }],
          },
          device_platforms: ["mobile"],
          publisher_platforms: ["facebook", "instagram"],
        },
        access_token: accessToken,
      }),
    });
    const adSetData = await adSetRes.json();
    if (adSetData.error) throw new Error(adSetData.error.message);
    const adSetId = adSetData.id;

    // 3. Create Ad Creative
    const creativeRes = await fetch(`${BASE}/${accountId}/adcreatives`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: `${campaign.name} — Creative`,
        object_story_spec: {
          page_id: "me",
          link_data: {
            message: campaign.body,
            name: campaign.headline,
            call_to_action: { type: "LEARN_MORE" },
          },
        },
        access_token: accessToken,
      }),
    });
    const creativeData = await creativeRes.json();
    const creativeId = creativeData.id;

    // 4. Create Ad
    if (creativeId) {
      await fetch(`${BASE}/${accountId}/ads`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: campaign.name,
          adset_id: adSetId,
          creative: { creative_id: creativeId },
          status: "PAUSED",
          access_token: accessToken,
        }),
      });
    }

    res.json({
      success: true,
      campaignId,
      adSetId,
      message: "Campaign created in Meta Ads Manager (paused — review and enable before going live)",
      metaAdsUrl: `https://www.facebook.com/adsmanager/manage/campaigns?act=${adAccountId}`,
    });

  } catch (e) {
    console.error("Meta launch error:", e);
    res.status(500).json({ error: e.message || "Failed to create Meta campaign" });
  }
}
