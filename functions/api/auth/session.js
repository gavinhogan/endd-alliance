import { verifyJWT } from "./jwt.js";

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

  const jwtSecret = env.JWT_SECRET;
  if (!jwtSecret) {
    return Response.json(
      { error: "Configuration Error: JWT_SECRET environment variable is missing on Cloudflare." },
      { status: 500 }
    );
  }

  const token = getCookie(request, "alliance_session");
  if (!token) {
    return Response.json({ authenticated: false });
  }

  const payload = await verifyJWT(token, jwtSecret);
  if (!payload) {
    return Response.json({ authenticated: false });
  }

  // Session is active and verified! Return safe public profile data
  return Response.json({
    authenticated: true,
    user: {
      id: payload.userId,
      username: payload.username,
      globalName: payload.globalName,
      avatar: payload.avatar,
    },
    roles: payload.roles,
    expiresAt: payload.exp,
  });
}
