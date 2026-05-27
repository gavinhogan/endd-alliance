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
    
    console.log(`⚙️ [sips] Optimizing and resizing image dimension to max 400px for API efficiency...`);
    tempPngPath = path.join(path.dirname(filePath), `temp_optimized_${Date.now()}.png`);
    
    try {
        if (isHeic) {
            execSync(`sips -s format png -Z 400 "${filePath}" --out "${tempPngPath}"`, { stdio: 'ignore' });
        } else {
            execSync(`sips -Z 400 "${filePath}" --out "${tempPngPath}"`, { stdio: 'ignore' });
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
                            text: 'Extract all of the power stats, details, and level values from the image. Output them in a clean, flat list of Key: Value format.'
                        },
                        {
                            type: 'image',
                            image: imageBuffer
                        }
                    ]
                }
            ]
        });

        // 6. Robust line-by-line Key-Value list parsing
        const parsedData = {};
        const lines = result.text.split('\n');
        
        for (const line of lines) {
            // Match line containing "Key: Value" (supporting leading bullet points, bold asterisks, and numbers)
            const match = line.match(/^[\s*\-\+•]*([a-zA-Z0-9_\s\-&'’]+)\s*:\s*(.+)$/);
            if (match) {
                // Strip markdown formatting symbols like asterisks or bullet signs
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

        console.log(`\n✨ [Vercel AI SDK Structured JSON Output]:`);
        console.log(`--------------------------------------`);
        console.log(JSON.stringify(parsedData, null, 2));
        console.log(`--------------------------------------`);
        console.log(`✅ Success! Extracted ${Object.keys(parsedData).length} stats dynamically.`);

    } catch (err) {
        console.error(`❌ [API Error] Failed to complete vision inference: ${err.message}`);
        process.exit(1);
    }
}

main();
