/**
 * Unified Feature Flag Resolution Engine
 * Handles static environment variable flags and dynamic D1 SQL overrides
 * allowing real-time runtime toggling in production without server redeployment!
 */

export async function isFeatureEnabled(featureName, env) {
  // 1. Static environment variable (default: off/false unless explicitly set to "true")
  let isEnabled = env[featureName] === "true" || env[featureName] === true;

  // 2. Dynamic D1 SQLite database override (enables toggling without redeploy!)
  if (env.DB) {
    try {
      // Self-healing feature_flags table initializer
      await env.DB.prepare(`
        CREATE TABLE IF NOT EXISTS feature_flags (
          name TEXT PRIMARY KEY,
          value TEXT NOT NULL,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `).run();

      const res = await env.DB.prepare(
        "SELECT value FROM feature_flags WHERE name = ?"
      ).bind(featureName).first();

      if (res) {
        isEnabled = res.value === "true";
      }
    } catch (err) {
      console.warn(`⚠️ [Feature Flags] Failed to resolve dynamic D1 override for ${featureName}:`, err.message);
    }
  }

  return isEnabled;
}
