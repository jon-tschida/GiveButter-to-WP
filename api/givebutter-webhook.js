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

    console.log("=== GIVEBUTTER WEBHOOK RECEIVED ===");
    console.log("Timestamp:", new Date().toISOString());
    console.log("Full payload:", JSON.stringify(webhookData, null, 2));
    console.log("===================================");

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
