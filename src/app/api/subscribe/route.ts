export async function POST(request: Request) {
  try {
    const { email } = await request.json();
    const isValidEmail = typeof email === "string" && /^\S+@\S+\.\S+$/.test(email);
    if (!isValidEmail) {
      return Response.json({ error: "Invalid email" }, { status: 400 });
    }

    const apiKey = process.env.BUTTONDOWN_API_KEY;
    if (!apiKey) {
      return Response.json({ error: "Server not configured" }, { status: 500 });
    }

    const upstream = await fetch("https://api.buttondown.email/v1/subscribers", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Token ${apiKey}`,
      },
      body: JSON.stringify({
        email,
        notes: "metascienceobservatory.org",
      }),
      // Buttondown is reliable; keep conservative timeout via AbortController if desired later
    });

    if (!upstream.ok) {
      const detail = await upstream.text();
      return Response.json(
        { error: "Subscribe failed", detail: detail?.slice(0, 500) },
        { status: 400 }
      );
    }

    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ error: "Unexpected error" }, { status: 500 });
  }
}


