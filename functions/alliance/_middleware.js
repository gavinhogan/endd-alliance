import { verifyJWT } from "../api/auth/jwt.js";

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

export async function onRequest(context) {
  const { request, env, next } = context;
  const url = new URL(request.url);

  // Ensure JWT_SECRET is bound
  const jwtSecret = env.JWT_SECRET;
  if (!jwtSecret) {
    return new Response(
      "Configuration Error: JWT_SECRET environment variable is missing on Cloudflare.",
      { status: 500 }
    );
  }

  const token = getCookie(request, "alliance_session");
  if (!token) {
    // No session cookie, redirect to login
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", url.pathname + url.search);
    return Response.redirect(loginUrl, 302);
  }

  const payload = await verifyJWT(token, jwtSecret);
  if (!payload) {
    // Session is expired or signature is invalid, clear cookie and redirect
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", url.pathname + url.search);
    
    const response = new Response(null, {
      status: 302,
      headers: {
        "Location": loginUrl.toString(),
        "Set-Cookie": "alliance_session=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0"
      }
    });
    return response;
  }

  // User is authenticated! Pass request forward
  return next();
}
