## Givebutter to WordPress Event Sync
A Node.js webhook endpoint that automatically syncs events from Givebutter to WordPress, eliminating duplicate data entry.

### Overview
This serverless API endpoint, deployed on Vercel, bridges Givebutter and WordPress by listening for new event webhooks from Givebutter and automatically creating corresponding events in WordPress via The Events Calendar REST API.

### Purpose
Built for thefatherson.org, this integration streamlines event management for The FatherSon nonprofit. Team members can create events once in Givebutter, and they'll automatically appear on the website—no manual duplication required.

How It Works

- An event is created in Givebutter
- Givebutter sends a webhook to this endpoint
- The endpoint processes the webhook data
- A new event is created in WordPress using The Events Calendar API

### Technical Stack

Runtime: Node.js
Hosting: Vercel (serverless)
Integration: Givebutter Webhooks → The Events Calendar REST API
