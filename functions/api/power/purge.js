import { verifyJWT } from "../auth/jwt.js";
import { isFeatureEnabled } from "../utils/features.js";

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

export async function onRequestPost(context) {
  const { request, env } = context;

  // 0. Barricade behind dynamic feature flag (locked/disabled by default)
  const isEnabled = await isFeatureEnabled("FEATURE_POWER_TRACKER", env);
  if (!isEnabled) {
    return Response.json(
      { error: "Access Denied: AI Power Tracker module is currently locked/inactive under HQ orders." },
      { status: 403 }
    );
  }

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

  // 2. Wipe the D1 database
  if (!env.DB) {
    return Response.json({ error: "D1 Database binding is missing." }, { status: 500 });
  }

  try {
    await env.DB.prepare("DELETE FROM power_snapshots;").run();
    return Response.json({ success: true, message: "All snapshots successfully purged." });
  } catch (err) {
    return Response.json({ error: `Purge operation failed: ${err.message}` }, { status: 500 });
  }
}
