#!/usr/bin/env node

/**
 * Cloudflare Workers AI Vision CLI Tool using Vercel AI SDK
 * Describes and extracts structured stats from images (PNG, JPEG, HEIF/HEIC).
 * 
 * Usage:
 *   node scripts/describe-image.js <path-to-image>
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');

// Hardcoded workspace default Account ID, overridden by environment variable
const DEFAULT_ACCOUNT_ID = "a99b563ac707f6a81924483498093701";

// 1. Get Cloudflare Account ID
function getAccountId() {
    return process.env.CLOUDFLARE_ACCOUNT_ID || DEFAULT_ACCOUNT_ID;
}

// 2. Get Cloudflare API Token (checks env, then falls back to Wrangler credentials)
function getAuthToken() {
    if (process.env.CLOUDFLARE_API_TOKEN) return process.env.CLOUDFLARE_API_TOKEN;
    if (process.env.CLOUDFLARE_AUTH_TOKEN) return process.env.CLOUDFLARE_AUTH_TOKEN;

    // Fall back to Wrangler active user credentials
    const wranglerConfigPath = path.join(os.homedir(), 'Library/Preferences/.wrangler/config/default.toml');
    if (fs.existsSync(wranglerConfigPath)) {
        try {
            const content = fs.readFileSync(wranglerConfigPath, 'utf8');
            const tokenMatch = content.match(/oauth_token\s*=\s*"([^"]+)"/);
            if (tokenMatch && tokenMatch[1]) {
                return tokenMatch[1];
            }
        } catch (err) {
            console.warn(`⚠️ [Wrangler Config] Failed to read local Wrangler config: ${err.message}`);
        }
    }
    return null;
}

// 3. Process image, convert HEIC/HEIF, and downsample to fit API context limits via macOS sips
// Returns a Buffer representing the image data.
function processImage(filePath) {
    if (!fs.existsSync(filePath)) {
        throw new Error(`File does not exist: "${filePath}"`);
    }

    const ext = path.extname(filePath).toLowerCase();
    let targetPath = filePath;
    let tempPngPath = null;
    let needsCleanup = false;

    const isHeic = ext === '.heic' || ext === '.heif';
    
    // We downsample all images to a max of 1000px width/height to easily fit Cloudflare's context limit
    // and keep text and numbers sharp. Sips is built into macOS and handles this natively.
    console.log(`⚙️ [sips] Optimizing and resizing image dimension to max 1000px for API efficiency...`);
    tempPngPath = path.join(path.dirname(filePath), `temp_optimized_${Date.now()}.png`);
    
    try {
        if (isHeic) {
            // Convert HEIC and resize at the same time
            execSync(`sips -s format png -Z 1000 "${filePath}" --out "${tempPngPath}"`, { stdio: 'ignore' });
        } else {
            // Resize PNG/JPEG
            execSync(`sips -Z 1000 "${filePath}" --out "${tempPngPath}"`, { stdio: 'ignore' });
        }
        targetPath = tempPngPath;
        needsCleanup = true;
    } catch (err) {
        if (isHeic) {
            throw new Error(`Failed to process HEIF/HEIC image using macOS 'sips'. Make sure you are on macOS.`);
        } else {
            console.warn(`⚠️ [sips] Warning: Failed to resize image via sips. Sending raw image instead (might exceed API limits).`);
            targetPath = filePath;
            needsCleanup = false;
        }
    }

    const buffer = fs.readFileSync(targetPath);

    // Clean up temporary optimized file
    if (needsCleanup && tempPngPath && fs.existsSync(tempPngPath)) {
        try {
            fs.unlinkSync(tempPngPath);
        } catch (err) {
            // Ignore clean-up issues
        }
    }

    return buffer;
}

// Main execution function
async function main() {
    const args = process.argv.slice(2);
    
    if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
        console.log(`
🔮 Cloudflare Workers AI Vision CLI (Vercel AI SDK Edition)
===========================================================
Extract structured power stats from screenshots using Vercel AI SDK and Llama 3.2 Vision.

Usage:
  node scripts/describe-image.js <path-to-image>
`);
        process.exit(0);
    }

    const imagePath = args[0];

    console.log(`🔄 Reading and preparing image: "${imagePath}"...`);
    let imageBuffer;
    try {
        imageBuffer = processImage(imagePath);
    } catch (err) {
        console.error(`❌ [Error] ${err.message}`);
        process.exit(1);
    }

    const accountId = getAccountId();
    const apiKey = getAuthToken();

    if (!apiKey) {
        console.error(`❌ [Authentication Error] Could not find an active Cloudflare API Token.
Please set the CLOUDFLARE_API_TOKEN environment variable, or run 'npx wrangler login' to authenticate locally.`);
        process.exit(1);
    }

    console.log(`📡 Dynamically loading Vercel AI SDK and Workers AI community provider...`);
    
    // Dynamic import to support ESM inside CommonJS
    const { generateText } = await import('ai');
    const { createWorkersAI } = await import('workers-ai-provider');

    console.log(`📡 Initializing Vercel AI SDK with Cloudflare REST credentials...`);
    const workersai = createWorkersAI({
        accountId,
        apiKey
    });

    console.log(`📡 Executing generateText scan via Llama 3.2 Vision...`);
    try {
        const result = await generateText({
            model: workersai('@cf/meta/llama-3.2-11b-vision-instruct'),
            messages: [
                {
                    role: 'user',
                    content: [
                        {
                            type: 'text',
                            text: 'Extract all of the power stats, details, and level values from the image.\nOutput them using 4 spaces of indentation for nested properties under their parent categories, exactly like this structure:\n\nHero Power\n    Hero Level: [value]\n    Decorations & Building Stats: [value]\n    Gear: [value]\n    Hero Skill: [value]\n    Hero Tier: [value]\n    Wall of Honor: [value]\nDrone Power\n    Drone Level: [value]\n    Drone Component: [value]\n    Skill Chip: [value]\nBuilding Power\n    Buildings: [value]\n    Survivor: [value]\n\n⚠️ CRITICAL FONT & DIGIT OCR GUIDE:\n- The game font is highly stylized. Look extremely closely at the shapes to distinguish:\n  * "3" vs "8": The digit "8" has a narrow waist/middle. The digit "3" is open on the left. E.g., Drone Level is 2,589,455 (not 2,539,455).\n  * "3" vs "9": The digit "9" has a closed loop at the top and a curved bottom. The digit "3" is open. E.g., Hero Tier is 1,891,427 (not 1,831,427).\n  * "8" vs "9": Double-check the top loop and waist.\n- Double-check all digits for accuracy before outputting.\n- Output ONLY the indented structured text. Do not write any conversational introductions or summaries.'
                        },
                        {
                            type: 'image',
                            image: imageBuffer
                        }
                    ]
                }
            ]
        });

        console.log("ℹ️ [Workers AI Raw Text]:", result.text);

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

        console.log(`\n✨ [Vercel AI SDK Structured JSON Output]:`);
        console.log(`--------------------------------------`);
        console.log(JSON.stringify(parsedData, null, 2));
        console.log(`--------------------------------------`);
        console.log(`✅ Success! Extracted ${Object.keys(parsedData).length} stats dynamically.`);

    } catch (err) {
        console.error(`❌ [API Error] Failed to complete structured vision inference: ${err.message}`);
        process.exit(1);
    }
}

main();
