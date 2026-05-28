import { verifyJWT } from "../auth/jwt.js";
import { isFeatureEnabled } from "../utils/features.js";

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

  // 0. Barricade behind dynamic feature flag (locked/disabled by default)
  const isEnabled = await isFeatureEnabled("FEATURE_POWER_TRACKER", env);
  if (!isEnabled) {
    return Response.json(
      { error: "Access Denied: AI Power Tracker module is currently locked/inactive under HQ orders." },
      { status: 403 }
    );
  }

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
    let prompt = `Extract all of the power stats, details, and level values from the image.
Output them using 4 spaces of indentation for nested properties under their parent categories, exactly like this structure:

Hero Power
    Hero Level: [value]
    Decorations & Building Stats: [value]
    Gear: [value]
    Hero Skill: [value]
    Hero Tier: [value]
    Wall of Honor: [value]
Drone Power
    Drone Level: [value]
    Drone Component: [value]
    Skill Chip: [value]
Building Power
    Buildings: [value]
    Survivor: [value]

⚠️ CRITICAL FONT & DIGIT OCR GUIDE:
- The game font is highly stylized. Look extremely closely at the shapes to distinguish:
  * "3" vs "8": The digit "8" has a narrow waist/middle. The digit "3" is open on the left. E.g., Drone Level is 2,589,455 (not 2,539,455).
  * "3" vs "9": The digit "9" has a closed loop at the top and a curved bottom. The digit "3" is open. E.g., Hero Tier is 1,891,427 (not 1,831,427).
  * "8" vs "9": Double-check the top loop and waist.
- Double-check all digits for accuracy before outputting.
- Output ONLY the indented structured text. Do not write any conversational introductions or summaries.`;

    if (expectedKeys.length > 0) {
      prompt += `\n\n💡 HISTORICAL USER SCHEMA TRACKING ANCHOR:\nHere are the expected historical keys from your previous uploads: ${JSON.stringify(expectedKeys)}.\nPlease prioritize matching the capitalization and names of these exact keys if they map to the categories/elements extracted above.`;
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

    // 6. Indentation-Aware Dotted-Path Context Parser
    const parsedData = {};
    const lines = result.text.split('\n');
    const contextStack = []; // Holds active parent categories with their indentation depth [{ key, depth }]

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed === '') continue;

      // A. Calculate line indentation depth (normalize tabs to 4 spaces)
      const leadingWhitespace = line.match(/^([ \t]*)/)[0];
      const depth = leadingWhitespace.replace(/\t/g, '    ').length;

      // B. Clean formatting asterisks/markdown symbols from the text line
      const cleanLine = line.replace(/[*_#`]+/g, '').trim();

      let key = "";
      let valStr = "";

      // C. Split Key and Value on colon
      const colonIndex = cleanLine.indexOf(':');
      if (colonIndex !== -1) {
        key = cleanLine.substring(0, colonIndex).replace(/^[\s\-\+•]*/, '').trim();
        valStr = cleanLine.substring(colonIndex + 1).trim();
      } else {
        // No colon: This is a pure category header block!
        key = cleanLine.replace(/^[\s\-\+•]*/, '').trim();
        valStr = "";
      }

      if (!key) continue;

      // D. Pop parent contexts from stack that are at a greater or equal depth
      while (contextStack.length > 0 && contextStack[contextStack.length - 1].depth >= depth) {
        contextStack.pop();
      }

      // E. Clean numeric value parameters
      let cleanStr = valStr.replace(/,/g, '').trim();
      if (cleanStr === '') {
        // Category Header (empty value): Push to parenting stack context
        contextStack.push({ key, depth });
      } else {
        // Value Key: Assemble namespaces
        let fullKey = key;
        if (contextStack.length > 0) {
          fullKey = contextStack.map(c => c.key).join('.') + '.' + key;
        }

        if (cleanStr.includes('/')) {
          cleanStr = cleanStr.split('/')[0].trim();
        }

        // Strip quotes
        cleanStr = cleanStr.replace(/^["']|["']$/g, '');

        const num = Number(cleanStr);
        if (!isNaN(num)) {
          parsedData[fullKey] = num;
        } else {
          parsedData[fullKey] = cleanStr;
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
