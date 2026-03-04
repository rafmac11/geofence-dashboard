// Creates a Google Ads campaign via the API
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { campaign, customerId, accessToken } = req.body;

  if (!campaign || !customerId || !accessToken) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const cleanCustomerId = customerId.replace(/-/g, "");
    const budgetAmount = Math.round(campaign.dailyBudget * 1_000_000); // micros

    // 1. Create campaign budget
    const budgetRes = await fetch(
      `https://googleads.googleapis.com/v14/customers/${cleanCustomerId}/campaignBudgets:mutate`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "developer-token": process.env.GOOGLE_ADS_DEVELOPER_TOKEN,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          operations: [{
            create: {
              name: `${campaign.name} Budget`,
              amountMicros: budgetAmount,
              deliveryMethod: "STANDARD",
            },
          }],
        }),
      }
    );
    const budgetData = await budgetRes.json();
    if (!budgetRes.ok) throw new Error(JSON.stringify(budgetData));
    const budgetResourceName = budgetData.results[0].resourceName;

    // 2. Create campaign
    const startDate = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const endDate = new Date(Date.now() + campaign.duration * 86400000)
      .toISOString().slice(0, 10).replace(/-/g, "");

    const campaignRes = await fetch(
      `https://googleads.googleapis.com/v14/customers/${cleanCustomerId}/campaigns:mutate`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "developer-token": process.env.GOOGLE_ADS_DEVELOPER_TOKEN,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          operations: [{
            create: {
              name: campaign.name,
              advertisingChannelType: "DISPLAY",
              status: "PAUSED", // Start paused so user can review before going live
              campaignBudget: budgetResourceName,
              startDate,
              endDate,
              targetSpend: {},
              geoTargetTypeSetting: {
                positiveGeoTargetType: "PRESENCE",
              },
            },
          }],
        }),
      }
    );
    const campaignData = await campaignRes.json();
    if (!campaignRes.ok) throw new Error(JSON.stringify(campaignData));
    const campaignResourceName = campaignData.results[0].resourceName;

    res.json({
      success: true,
      campaignResourceName,
      message: "Campaign created in Google Ads (paused — review and enable in Google Ads dashboard)",
      googleAdsUrl: `https://ads.google.com/aw/campaigns?customerId=${cleanCustomerId}`,
    });

  } catch (e) {
    console.error("Google Ads launch error:", e);
    res.status(500).json({ error: e.message || "Failed to create Google Ads campaign" });
  }
}
