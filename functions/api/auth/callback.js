import { signJWT } from "./jwt.js";

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);

  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");

  const clientId = env.DISCORD_CLIENT_ID;
  const clientSecret = env.DISCORD_CLIENT_SECRET;
  const redirectUri = env.DISCORD_REDIRECT_URI;
  const guildId = env.DISCORD_GUILD_ID;
  const roleId = env.DISCORD_ROLE_ID;
  const jwtSecret = env.JWT_SECRET;

  // 1. Resolve redirect target from the state payload
  let targetRedirect = "/alliance/";
  if (state) {
    try {
      let base64 = state.replace(/-/g, "+").replace(/_/g, "/");
      while (base64.length % 4) base64 += "=";
      const decodedState = JSON.parse(atob(base64));
      if (decodedState.redirect) {
        targetRedirect = decodedState.redirect;
      }
    } catch (e) {
      console.error("Error decoding state:", e);
    }
  }

  if (!code) {
    return Response.redirect(new URL("/login?error=missing_code", request.url), 302);
  }

  if (!clientId || !clientSecret || !redirectUri || !guildId || !jwtSecret) {
    return new Response(
      "Configuration Error: Missing required environment variables on Cloudflare Pages.",
      { status: 500 }
    );
  }

  try {
    // 2. Exchange authorization code for a Discord access token
    const tokenResponse = await fetch("https://discord.com/api/oauth2/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: "authorization_code",
        code: code,
        redirect_uri: redirectUri,
      }),
    });

    if (!tokenResponse.ok) {
      const errText = await tokenResponse.text();
      console.error("Discord token exchange returned error:", errText);
      return Response.redirect(new URL("/login?error=token_exchange_failed", request.url), 302);
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    // 3. Query Discord API for user's member object in the target Guild (Server)
    const memberResponse = await fetch(
      `https://discord.com/api/v10/users/@me/guilds/${guildId}/member`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (memberResponse.status === 404) {
      // User is not in your Discord server
      return Response.redirect(new URL("/login?error=not_in_guild", request.url), 302);
    }

    if (!memberResponse.ok) {
      const errText = await memberResponse.text();
      console.error("Discord server membership lookup failed:", errText);
      return Response.redirect(new URL("/login?error=member_lookup_failed", request.url), 302);
    }

    const memberData = await memberResponse.json();

    // Log user's roles to the console
    const userRoles = memberData.roles || [];
    console.log(`[AUTH] User '${memberData.user?.username || "Unknown"}' has roles:`, userRoles);

    // 4. Validate roles if DISCORD_ROLE_ID is configured
    if (roleId) {
      const hasRole = userRoles.includes(roleId);
      if (!hasRole) {
        return Response.redirect(new URL("/login?error=unauthorized_role", request.url), 302);
      }
    }

    // 5. Generate secure JWT session payload
    const sessionExpiry = Date.now() + 7 * 24 * 60 * 60 * 1000; // Expires in 7 days
    const sessionPayload = {
      userId: memberData.user.id,
      username: memberData.user.username,
      globalName: memberData.user.global_name || memberData.user.username,
      avatar: memberData.user.avatar,
      roles: memberData.roles || [],
      exp: sessionExpiry,
    };

    const token = await signJWT(sessionPayload, jwtSecret);

    // 6. Set secure session cookie and redirect back to gated contents
    const redirectUrl = new URL(targetRedirect, request.url).toString();
    const response = new Response(null, {
      status: 302,
      headers: {
        "Location": redirectUrl,
        "Set-Cookie": `alliance_session=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=604800`
      }
    });

    return response;
  } catch (error) {
    console.error("Unhandled OAuth callback execution error:", error);
    return Response.redirect(new URL("/login?error=server_error", request.url), 302);
  }
}
