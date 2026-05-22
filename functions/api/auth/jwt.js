// Native Web Crypto API helper for signing and verifying HS256 JWTs at the edge.

function base64urlEncode(str) {
  const binaryString = String.fromCharCode(...new TextEncoder().encode(str));
  return btoa(binaryString)
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function base64urlDecode(str) {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return new TextDecoder().decode(bytes);
}

export async function signJWT(payload, secret) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const encodedHeader = base64urlEncode(JSON.stringify(header));
  const encodedPayload = base64urlEncode(JSON.stringify(payload));
  const dataToSign = `${encodedHeader}.${encodedPayload}`;

  const encoder = new TextEncoder();
  const secretKeyData = encoder.encode(secret);

  const key = await crypto.subtle.importKey(
    'raw',
    secretKeyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    encoder.encode(dataToSign)
  );

  const signatureBytes = new Uint8Array(signature);
  const binaryString = String.fromCharCode(...signatureBytes);
  const encodedSignature = btoa(binaryString)
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

  return `${dataToSign}.${encodedSignature}`;
}

export async function verifyJWT(token, secret) {
  const parts = token.split('.');
  if (parts.length !== 3) return null;

  const [encodedHeader, encodedPayload, encodedSignature] = parts;
  const dataToVerify = `${encodedHeader}.${encodedPayload}`;

  const encoder = new TextEncoder();
  const secretKeyData = encoder.encode(secret);

  const key = await crypto.subtle.importKey(
    'raw',
    secretKeyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['verify']
  );

  // Decode signature to binary bytes
  let base64Sig = encodedSignature.replace(/-/g, '+').replace(/_/g, '/');
  while (base64Sig.length % 4) {
    base64Sig += '=';
  }
  const binaryString = atob(base64Sig);
  const sigBytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    sigBytes[i] = binaryString.charCodeAt(i);
  }

  const isValid = await crypto.subtle.verify(
    'HMAC',
    key,
    sigBytes,
    encoder.encode(dataToVerify)
  );

  if (!isValid) return null;

  try {
    const payload = JSON.parse(base64urlDecode(encodedPayload));
    
    // Validate expiration
    if (payload.exp && Date.now() > payload.exp) {
      return null;
    }
    
    return payload;
  } catch (e) {
    return null;
  }
}
