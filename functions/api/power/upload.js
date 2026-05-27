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
    let prompt = "You are a strict data extraction tool. Extract all of the power, stats, and level keys along with their numeric values from the image. Output ONLY a valid JSON object with double-quoted keys and raw numeric values (no commas, no slashes, no text explanations, no markdown formatting blocks). Example: { \"Hero Power\": 213124333, \"Hero Level\": 1270 }";
    if (expectedKeys.length > 0) {
      prompt += `\n\nHere are the expected keys for this user's stats: ${JSON.stringify(expectedKeys)}. Please prioritize extracting values for these exact keys. Casing and spelling should match these exactly. If you find new stats that are not in this list, extract those as well.`;
    }

    // 5. Run Llama 3.2 Vision OCR inference via Cloudflare Workers AI
    if (!env.AI) {
      return Response.json({ error: "Configuration Error: AI binding is missing." }, { status: 500 });
    }

    console.log("📡 Calling Workers AI with Llama 3.2 Vision...");
    const aiResult = await env.AI.run("@cf/meta/llama-3.2-11b-vision-instruct", {
      prompt,
      image: imageBytes
    });

    console.log("ℹ️ [Workers AI Result Type]:", typeof aiResult);
    console.log("ℹ️ [Workers AI Result content preview]:", JSON.stringify(aiResult).substring(0, 500));

    // Highly defensive parsing to extract text under any version of Workers AI response schema
    let responseText = "";
    if (typeof aiResult === 'string') {
      responseText = aiResult;
    } else if (aiResult && typeof aiResult === 'object') {
      // 1. Check direct string fields
      if (typeof aiResult.response === 'string') {
        responseText = aiResult.response;
      } else if (typeof aiResult.text === 'string') {
        responseText = aiResult.text;
      }
      // 2. Check if aiResult.response is an object (nested response text structure)
      else if (aiResult.response && typeof aiResult.response === 'object') {
        if (typeof aiResult.response.text === 'string') {
          responseText = aiResult.response.text;
        } else if (typeof aiResult.response.content === 'string') {
          responseText = aiResult.response.content;
        } else if (typeof aiResult.response.response === 'string') {
          responseText = aiResult.response.response;
        } else {
          responseText = JSON.stringify(aiResult.response);
        }
      }
      // 3. Check if aiResult.result is an object
      else if (aiResult.result && typeof aiResult.result === 'object') {
        if (typeof aiResult.result.response === 'string') {
          responseText = aiResult.result.response;
        } else if (typeof aiResult.result.text === 'string') {
          responseText = aiResult.result.text;
        } else {
          responseText = JSON.stringify(aiResult.result);
        }
      } else {
        responseText = JSON.stringify(aiResult);
      }
    } else {
      responseText = String(aiResult || "");
    }

    responseText = responseText.trim();

    // Strip markdown code fences if wrapped by the LLM
    const cleanMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (cleanMatch && cleanMatch[1]) {
      responseText = cleanMatch[1].trim();
    }

    let parsedData = {};
    try {
      parsedData = JSON.parse(responseText);
    } catch (parseErr) {
      throw new Error(`Failed to parse AI output as JSON. Output was: "${responseText}"`);
    }

    // 6. Fuzzy-Key Harmonization & Value Sanitization Layer
    const keyMap = {};
    expectedKeys.forEach(k => {
      keyMap[k.toLowerCase().trim()] = k;
    });

    const cleanedData = {};
    for (const [key, val] of Object.entries(parsedData)) {
      const cleanKey = key.trim();
      const lowerKey = cleanKey.toLowerCase();

      // Clean numeric values (strip commas, units, slashes and convert to numbers)
      let parsedVal = val;
      if (typeof val === 'string') {
        let cleanStr = val.replace(/,/g, '').trim();
        // If there's a slash like '1219/1222' (current/max level), take the current level
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

    // 7. Store time-series entry in D1 Database
    if (env.DB) {
      const rawDataString = JSON.stringify(cleanedData);
      await env.DB.prepare(
        "INSERT INTO power_snapshots (user_id, username, raw_data) VALUES (?, ?, ?)"
      ).bind(userId, username, rawDataString).run();
    } else {
      console.warn("⚠️ [D1 Database] DB binding is missing. Bypassing storage.");
    }

    // 8. Return response to frontend dashboard
    return Response.json({ success: true, data: cleanedData });

  } catch (err) {
    console.error("❌ [API Upload Error] Inference or DB write failed:", err.message);
    return Response.json({ error: `Failed to complete OCR extraction: ${err.message}` }, { status: 500 });
  }
}
