import crypto from "crypto";

export default async function handler(req, res) {
  // Only accept POST requests
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Get the webhook secret from environment variables
    const webhookSecret = process.env.GIVEBUTTER_WEBHOOK_SECRET;

    if (!webhookSecret) {
      console.error("GIVEBUTTER_WEBHOOK_SECRET not configured");
      return res.status(500).json({ error: "Server configuration error" });
    }

    // Verify webhook signature
    const signature =
      req.headers["x-givebutter-signature"] ||
      req.headers["x-hub-signature-256"];

    if (!signature) {
      console.error("No signature found in request headers");
      return res.status(401).json({ error: "Missing signature" });
    }

    // Verify the signature matches
    const payload = JSON.stringify(req.body);
    const expectedSignature = crypto
      .createHmac("sha256", webhookSecret)
      .update(payload)
      .digest("hex");

    const isValid = crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(`sha256=${expectedSignature}`),
    );

    if (!isValid) {
      console.error("Invalid webhook signature");
      return res.status(401).json({ error: "Invalid signature" });
    }

    // Parse the webhook data
    const webhookData = req.body;

    console.log("Webhook received:", {
      type: webhookData.type,
      timestamp: new Date().toISOString(),
    });

    // Extract campaign data
    const campaign = webhookData.data || webhookData.campaign;

    if (!campaign) {
      console.error("No campaign data in webhook");
      return res.status(400).json({ error: "Missing campaign data" });
    }

    console.log("Campaign data:", {
      id: campaign.id,
      title: campaign.title || campaign.name,
      status: campaign.status,
    });

    // TODO: Transform campaign data for WordPress
    const eventData = transformCampaignToEvent(campaign);

    // TODO: Send to WordPress
    await createWordPressEvent(eventData);

    // Return success to Givebutter
    return res.status(200).json({
      success: true,
      message: "Webhook processed successfully",
    });
  } catch (error) {
    console.error("Error processing webhook:", error);
    return res.status(500).json({
      error: "Internal server error",
      message: error.message,
    });
  }
}

// Transform Givebutter campaign data to WordPress event format
function transformCampaignToEvent(campaign) {
  return {
    title: campaign.title || campaign.name,
    content: campaign.description || "",
    status: "publish",
    // Map other fields as needed based on your WordPress event structure
    meta: {
      givebutter_campaign_id: campaign.id,
      campaign_goal: campaign.goal_amount,
      campaign_url: campaign.url,
    },
  };
}

// Send event data to WordPress REST API
async function createWordPressEvent(eventData) {
  const wpUrl = process.env.WORDPRESS_URL;
  const wpUser = process.env.WORDPRESS_USERNAME;
  const wpPassword = process.env.WORDPRESS_APP_PASSWORD;

  if (!wpUrl || !wpUser || !wpPassword) {
    throw new Error("WordPress credentials not configured");
  }

  // Create Basic Auth header
  const authHeader = Buffer.from(`${wpUser}:${wpPassword}`).toString("base64");

  const response = await fetch(`${wpUrl}/wp-json/wp/v2/posts`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${authHeader}`,
    },
    body: JSON.stringify(eventData),
  });

  if (!response.ok) {
    const errorData = await response.text();
    throw new Error(`WordPress API error: ${response.status} - ${errorData}`);
  }

  const result = await response.json();
  console.log("WordPress event created:", result.id);

  return result;
}
