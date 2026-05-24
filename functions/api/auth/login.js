export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);

  const clientId = env.DISCORD_CLIENT_ID;
  const redirectUri = env.DISCORD_REDIRECT_URI;

  if (!clientId || !redirectUri) {
    return new Response(
      "Configuration Error: DISCORD_CLIENT_ID or DISCORD_REDIRECT_URI is missing from environment variables.",
      { status: 500 }
    );
  }

  // Preserve the redirect path using base64-encoded state parameter
  const targetRedirect = url.searchParams.get("redirect") || "/alliance/";
  const stateObj = { redirect: targetRedirect };
  const state = btoa(JSON.stringify(stateObj))
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

  const oauthUrl = new URL("https://discord.com/api/oauth2/authorize");
  oauthUrl.searchParams.set("client_id", clientId);
  oauthUrl.searchParams.set("redirect_uri", redirectUri);
  oauthUrl.searchParams.set("response_type", "code");
  // Requesting basic identity and the specific guild membership read (without full guilds access)
  oauthUrl.searchParams.set("scope", "identify guilds.members.read");
  oauthUrl.searchParams.set("state", state);
  oauthUrl.searchParams.set("prompt", "consent");

  return Response.redirect(oauthUrl.toString(), 302);
}
