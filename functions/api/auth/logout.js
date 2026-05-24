export async function onRequest(context) {
  const { request } = context;
  
  const redirectUrl = new URL("/", request.url).toString();
  return new Response(null, {
    status: 302,
    headers: {
      "Location": redirectUrl,
      "Set-Cookie": "alliance_session=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0"
    }
  });
}
