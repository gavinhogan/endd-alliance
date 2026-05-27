import { verifyJWT } from "../auth/jwt.js";

function getCookie(request, name) {
  const cookieHeader = request.headers.get("Cookie") || "";
  const cookies = cookieHeader.split(";");
  for (let cookie of cookies) {
    const [key, val] = cookie.trim().split("=");
    if (key === name) {
      return decodeURIComponent(val);
    }
  }
  return null;
}

export async function onRequestGet(context) {
  const { request, env } = context;

  // 1. Authenticate user session
  const jwtSecret = env.JWT_SECRET;
  if (!jwtSecret) {
    return Response.json({ error: "Configuration Error: JWT_SECRET is missing." }, { status: 500 });
  }

  const token = getCookie(request, "alliance_session");
  if (!token) {
    return Response.json({ error: "Unauthenticated session." }, { status: 419 });
  }

  const payload = await verifyJWT(token, jwtSecret);
  if (!payload) {
    return Response.json({ error: "Invalid or expired session." }, { status: 419 });
  }

  const userId = payload.userId;

  // 2. Query historical power tracking time-series logs
  if (!env.DB) {
    return Response.json({ error: "Configuration Error: D1 DB binding is missing." }, { status: 500 });
  }

  try {
    const { results } = await env.DB.prepare(
      "SELECT id, timestamp, raw_data FROM power_snapshots WHERE user_id = ? ORDER BY timestamp ASC"
    ).bind(userId).all();

    const formattedHistory = results.map(row => {
      let parsedData = {};
      try {
        parsedData = JSON.parse(row.raw_data);
      } catch (err) {
        console.error(`⚠️ Failed to parse raw_data JSON for record ID ${row.id}:`, err.message);
      }

      return {
        id: row.id,
        timestamp: row.timestamp,
        data: parsedData
      };
    });

    return Response.json({ success: true, history: formattedHistory });

  } catch (err) {
    console.error("❌ [API History Error] D1 Query failed:", err.message);
    return Response.json({ error: `Failed to query historical log: ${err.message}` }, { status: 500 });
  }
}
