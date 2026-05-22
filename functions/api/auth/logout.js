export async function onRequest(context) {
  const { request } = context;
  
  // Set the session cookie with Max-Age=0 to invalidate it instantly
  const response = Response.redirect(new URL("/", request.url), 302);
  response.headers.set(
    "Set-Cookie",
    "alliance_session=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0"
  );
  
  return response;
}
