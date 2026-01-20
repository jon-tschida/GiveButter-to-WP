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
    const signature = req.headers["signature"] || req.headers["Signature"];

    if (!signature) {
      console.error("No signature found in request headers");
      return res.status(401).json({ error: "Missing signature" });
    }

    // Verify the signature matches the webhook secret
    if (signature !== webhookSecret) {
      console.error("Invalid webhook signature");
      return res.status(401).json({ error: "Invalid signature" });
    }

    // Parse and log the webhook data
    const webhookData = req.body;

    // Get campaign details from GB webhook
    const campaignData = webhookData.data;
    const campaignDetails = webhookData.data.event;

    const eventDetails = {
      title: campaignDetails.title,
      description: campaignData.description,
      start_date: campaignDetails.start_at,
      end_date: campaignDetails.end_at,
      status: "publish",
      show_map: true,
      show_map_link: true,
      website: campaignData.url,
      timezone: campaignDetails.timezone,
    };

    try {
      // Check if campaign type is 'event' and status is 'published'
      if (campaignData.type !== "event") {
        console.log("Event not published on website, type is not an event");
        return res.status(200).json({
          success: true,
          message: "Webhook received but skipped (campaign not an event)",
        });
      }

      if (campaignData.status !== "active") {
        console.log(
          "Event not published on website, campaign is not published",
        );
        return res.status(200).json({
          success: true,
          message: "webhook received but skipped (campaign is not published)",
        });
      }
      const response = await fetch(
        "https://thefatherson.org/wp-json/tribe/events/v1/events",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "basic " + process.env.WP_REST_AUTH,
          },
          body: JSON.stringify(eventDetails),
        },
      );

      const responseData = await response.json();
      console.log(responseData);
    } catch (error) {
      console.log(error);
    }

    // Return success to Givebutter
    return res.status(200).json({
      success: true,
      message: "Webhook received and logged",
    });
  } catch (error) {
    console.error("Error processing webhook:", error);
    return res.status(500).json({
      error: "Internal server error",
      message: error.message,
    });
  }
}
