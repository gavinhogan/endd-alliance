import { isFeatureEnabled } from "./utils/features.js";

export async function onRequestGet(context) {
  const { env } = context;

  // Central list of all feature flags managed in the codebase
  const featureList = [
    "FEATURE_POWER_TRACKER"
  ];

  try {
    const features = {};
    for (const flag of featureList) {
      features[flag] = await isFeatureEnabled(flag, env);
    }

    return Response.json({ success: true, features });
  } catch (err) {
    return Response.json({ error: `Failed to load features: ${err.message}` }, { status: 500 });
  }
}
