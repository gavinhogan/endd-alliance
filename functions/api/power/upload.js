import { verifyJWT } from "../auth/jwt.js";

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

export async function onRequestPost(context) {
  const { request, env } = context;

  // 1. Authenticate user session
  const jwtSecret = env.JWT_SECRET;
  if (!jwtSecret) {
    return Response.json({ error: "Configuration Error: JWT_SECRET is missing." }, { status: 500 });
  }

  const token = getCookie(request, "alliance_session");
  if (!token) {
    return Response.json({ error: "Unauthenticated session." }, { status: 419 });
  }

  const payload = await verifyJWT(token, jwtSecret);
  if (!payload) {
    return Response.json({ error: "Invalid or expired session." }, { status: 419 });
  }

  const userId = payload.userId;
  const username = payload.username || payload.globalName;

  try {
    // 2. Query the D1 database for the user's latest snapshot keys to anchor the LLM
    let expectedKeys = [];
    if (env.DB) {
      try {
        // Ensure table and index exist (Self-healing DB Initializer using robust individual prepare statements)
        await env.DB.prepare(`
          CREATE TABLE IF NOT EXISTS power_snapshots (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT NOT NULL,
            username TEXT NOT NULL,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            raw_data TEXT NOT NULL
          )
        `).run();
        
        await env.DB.prepare(`
          CREATE INDEX IF NOT EXISTS idx_power_user_timestamp ON power_snapshots (user_id, timestamp)
        `).run();

        const { results } = await env.DB.prepare(
          "SELECT raw_data FROM power_snapshots WHERE user_id = ? ORDER BY timestamp DESC LIMIT 1"
        ).bind(userId).all();
        
        if (results && results.length > 0) {
          const lastData = JSON.parse(results[0].raw_data);
          expectedKeys = Object.keys(lastData);
        }
      } catch (dbErr) {
        console.error("⚠️ [D1 Read error] Failed to query latest expected keys:", dbErr.message);
      }
    }

    // 3. Read image binary buffer from the request body
    const imageBuffer = await request.arrayBuffer();
    if (!imageBuffer || imageBuffer.byteLength === 0) {
      return Response.json({ error: "No image payload received." }, { status: 400 });
    }
    const imageBytes = Array.from(new Uint8Array(imageBuffer));

    // 4. Construct LLM prompt, integrating Dynamic Schema Anchor Prompting if past keys exist
    let prompt = "You are an automated stats extraction tool. Extract all of the power details, stats, levels, and numeric values from the image. Output them in a clean, flat list of Key: Value format (e.g. Hero Power: 2314333, Hero Level: 12). Do NOT use bullet points, do NOT add conversational introductions, and do NOT include unit slashes.";
    if (expectedKeys.length > 0) {
      prompt += `\n\nHere are the expected keys for this user's stats: ${JSON.stringify(expectedKeys)}. Please prioritize extracting values for these exact keys. Casing and spelling should match these exactly.`;
    }

    // 5. Run Llama 3.2 Vision OCR inference via Vercel AI SDK using Cloudflare Workers AI provider
    if (!env.AI) {
      return Response.json({ error: "Configuration Error: AI binding is missing." }, { status: 500 });
    }

    console.log("📡 Dynamically loading Vercel AI SDK and Workers AI community provider...");
    const { generateText } = await import('ai');
    const { createWorkersAI } = await import('workers-ai-provider');

    console.log("📡 Initializing Vercel AI SDK with Cloudflare env.AI binding...");
    const workersai = createWorkersAI({
      binding: env.AI
    });

    console.log("📡 Calling Workers AI via Vercel AI SDK...");
    const result = await generateText({
      model: workersai('@cf/meta/llama-3.2-11b-vision-instruct'),
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: prompt
            },
            {
              type: 'image',
              image: new Uint8Array(imageBuffer)
            }
          ]
        }
      ]
    });

    console.log("ℹ️ [Vercel AI SDK Raw Text Output]:", result.text.substring(0, 500));

    // 6. Robust line-by-line Key-Value list parsing
    const parsedData = {};
    const lines = result.text.split('\n');
    
    for (const line of lines) {
      // Match line containing "Key: Value" (supporting leading bullet points, bold asterisks, and numbers)
      const match = line.match(/^[\s*\-\+•]*([a-zA-Z0-9_\s\-&'’]+)\s*:\s*(.+)$/);
      if (match) {
        // Strip markdown formatting symbols
        const key = match[1].replace(/[*_#`\s]+/g, ' ').trim();
        let valStr = match[2].replace(/[*_#`\s]+/g, ' ').trim();

        if (!key || valStr === '{' || valStr === '}' || valStr === '[object Object]') continue;

        // Clean numeric values (strip commas, units, slashes and convert to numbers)
        let cleanStr = valStr.replace(/,/g, '').trim();
        if (cleanStr.includes('/')) {
          cleanStr = cleanStr.split('/')[0].trim();
        }

        // Strip outer quotes if present
        cleanStr = cleanStr.replace(/^["']|["']$/g, '');

        const num = Number(cleanStr);
        if (!isNaN(num)) {
          parsedData[key] = num;
        } else {
          parsedData[key] = cleanStr;
        }
      }
    }

    // 7. Fuzzy-Key Harmonization & Value Sanitization Layer
    const keyMap = {};
    expectedKeys.forEach(k => {
      keyMap[k.toLowerCase().trim()] = k;
    });

    const cleanedData = {};
    for (const [key, val] of Object.entries(parsedData)) {
      const cleanKey = key.trim();
      const lowerKey = cleanKey.toLowerCase();

      // Clean numeric values (double check parsing)
      let parsedVal = val;
      if (typeof val === 'string') {
        let cleanStr = val.replace(/,/g, '').trim();
        if (cleanStr.includes('/')) {
          cleanStr = cleanStr.split('/')[0].trim();
        }
        const num = Number(cleanStr);
        if (!isNaN(num)) {
          parsedVal = num;
        }
      }

      if (keyMap[lowerKey]) {
        // Harmonize with historical casing and name!
        cleanedData[keyMap[lowerKey]] = parsedVal;
      } else {
        // Keep new key as-is
        cleanedData[cleanKey] = parsedVal;
      }
    }

    // 8. Store time-series entry in D1 Database
    if (env.DB) {
      const rawDataString = JSON.stringify(cleanedData);
      await env.DB.prepare(
        "INSERT INTO power_snapshots (user_id, username, raw_data) VALUES (?, ?, ?)"
      ).bind(userId, username, rawDataString).run();
    } else {
      console.warn("⚠️ [D1 Database] DB binding is missing. Bypassing storage.");
    }

    // 9. Return response to frontend dashboard
    return Response.json({ success: true, data: cleanedData });

  } catch (err) {
    console.error("❌ [API Upload Error] Inference or DB write failed:", err.message);
    return Response.json({ error: `Failed to complete OCR extraction: ${err.message}` }, { status: 500 });
  }
}
