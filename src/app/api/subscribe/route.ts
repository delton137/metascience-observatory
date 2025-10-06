export const runtime = 'nodejs';

import { createHash } from "crypto";

export async function POST(request: Request) {
  try {
    const { email } = await request.json();
    const isValidEmail = typeof email === "string" && /^\S+@\S+\.\S+$/.test(email);
    if (!isValidEmail) {
      return Response.json({ error: "Invalid email" }, { status: 400 });
    }

    const apiKey = process.env.MAILCHIMP_API_KEY;
    const listId = process.env.MAILCHIMP_LIST_ID;
    let serverPrefix = process.env.MAILCHIMP_SERVER_PREFIX;

    if (!apiKey) {
      return Response.json({ error: "Missing MAILCHIMP_API_KEY" }, { status: 500 });
    }
    if (!listId) {
      return Response.json({ error: "Missing MAILCHIMP_LIST_ID" }, { status: 500 });
    }

    if (!serverPrefix) {
      const suffix = apiKey.split("-").pop();
      if (suffix && /^[a-z]{2,}\d+$/i.test(suffix)) {
        serverPrefix = suffix;
      } else {
        return Response.json({ error: "Missing MAILCHIMP_SERVER_PREFIX (and could not derive from MAILCHIMP_API_KEY)" }, { status: 500 });
      }
    }

    const subscriberHash = createHash("md5").update(email.toLowerCase()).digest("hex");
    const url = `https://${serverPrefix}.api.mailchimp.com/3.0/lists/${listId}/members/${subscriberHash}`;
    const basicAuth = Buffer.from(`anystring:${apiKey}`).toString("base64");

    const upstream = await fetch(url, {
      method: "PUT", // idempotent create/update
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Basic ${basicAuth}`,
      },
      body: JSON.stringify({
        email_address: email,
        status_if_new: "pending", // send confirmation email for new subscribers
        status: "pending", // re-initiate confirmation if previously unsubscribed
      }),
    });

    if (!upstream.ok) {
      const detailText = await upstream.text();
      return Response.json({ error: "Subscribe failed", detail: detailText?.slice(0, 500) }, { status: 400 });
    }

    return Response.json({ ok: true });
  } catch {
    return Response.json({ error: "Unexpected error" }, { status: 500 });
  }
}



