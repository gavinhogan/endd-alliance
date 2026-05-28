import { isFeatureEnabled } from "../utils/features.js";

export async function onRequestGet(context) {
  const { env, request } = context;

  // 0. Barricade behind dynamic feature flag (locked/disabled by default)
  const isEnabled = await isFeatureEnabled("FEATURE_POWER_TRACKER", env);
  if (!isEnabled) {
    return Response.json(
      { error: "Access Denied: AI Power Tracker module is currently locked/inactive under HQ orders." },
      { status: 403 }
    );
  }

  if (!env.DB) {
    return Response.json({
      connected: false,
      type: "Disconnected",
      error: "D1 DB binding is missing in wrangler.toml or Cloudflare Dashboard bindings.",
      availableBindings: Object.keys(env || {})
    });
  }

  try {
    let rowCount = 0;
    let tableExists = false;
    try {
      const countRes = await env.DB.prepare("SELECT COUNT(*) as cnt FROM power_snapshots;").all();
      rowCount = countRes.results[0].cnt;
      tableExists = true;
    } catch (err) {
      // Table doesn't exist yet or is empty
    }

    // Determine if running locally or remotely
    const host = request.headers.get("host") || "";
    const isLocal = host.includes("localhost") || host.includes("127.0.0.1") || host.includes("8788");

    return Response.json({
      connected: true,
      type: isLocal ? "Local SQLite Emulation (Miniflare)" : "Cloudflare D1 Edge-SQL Remote D1",
      version: "D1 Sandbox SQLite",
      rowCount,
      tableExists,
      host,
      availableBindings: Object.keys(env || {})
    });
  } catch (err) {
    return Response.json({
      connected: false,
      type: "Error",
      error: err.message,
      availableBindings: Object.keys(env || {})
    });
  }
}
