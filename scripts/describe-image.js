#!/usr/bin/env node

/**
 * Cloudflare Workers AI Vision CLI Tool
 * Describes images (PNG, JPEG, HEIF/HEIC) using Meta's Llama 3.2 Vision Model.
 * 
 * Usage:
 *   node scripts/describe-image.js <path-to-image> ["custom prompt"]
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
// Returns an array of integers (bytes) representing the image data.
function processImage(filePath) {
    if (!fs.existsSync(filePath)) {
        throw new Error(`File does not exist: "${filePath}"`);
    }

    const ext = path.extname(filePath).toLowerCase();
    let targetPath = filePath;
    let tempPngPath = null;
    let needsCleanup = false;

    // A. Handle HEIF/HEIC conversion or resizing
    const isHeic = ext === '.heic' || ext === '.heif';
    
    // We downsample all images to a max of 400px width/height to easily fit Cloudflare's context limit
    // and speed up transfer. Sips is built into macOS and handles this natively.
    console.log(`⚙️ [sips] Optimizing and resizing image dimension to max 400px for API efficiency...`);
    tempPngPath = path.join(path.dirname(filePath), `temp_optimized_${Date.now()}.png`);
    
    try {
        if (isHeic) {
            // Convert HEIC and resize at the same time
            execSync(`sips -s format png -Z 400 "${filePath}" --out "${tempPngPath}"`, { stdio: 'ignore' });
        } else {
            // Resize PNG/JPEG
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
    const byteArray = Array.from(buffer);

    // Clean up temporary optimized file
    if (needsCleanup && tempPngPath && fs.existsSync(tempPngPath)) {
        try {
            fs.unlinkSync(tempPngPath);
        } catch (err) {
            // Ignore clean-up issues
        }
    }

    return byteArray;
}

// Main execution function
async function main() {
    const args = process.argv.slice(2);
    
    if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
        console.log(`
🔮 Cloudflare Workers AI Vision CLI
==================================
Describe and analyze images using Meta's Llama 3.2 Vision model.

Usage:
  node scripts/describe-image.js <path-to-image> ["custom prompt"]

Examples:
  node scripts/describe-image.js my-screenshot.png
  node scripts/describe-image.js docs/power_level.heic "Extract all player names and power levels in a clean table"
`);
        process.exit(0);
    }

    const imagePath = args[0];
    const promptText = args[1] || "Describe this image in detail, including any text, characters, colors, and layout structure you see.";

    console.log(`🔄 Reading and preparing image: "${imagePath}"...`);
    let imageBytes;
    try {
        imageBytes = processImage(imagePath);
    } catch (err) {
        console.error(`❌ [Error] ${err.message}`);
        process.exit(1);
    }

    const accountId = getAccountId();
    const token = getAuthToken();

    if (!token) {
        console.error(`❌ [Authentication Error] Could not find an active Cloudflare API Token.
Please set the CLOUDFLARE_API_TOKEN environment variable, or run 'npx wrangler login' to authenticate locally.`);
        process.exit(1);
    }

    console.log(`📡 Connecting to Cloudflare Workers AI (Llama 3.2 Vision)...`);
    const model = "@cf/meta/llama-3.2-11b-vision-instruct";
    const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/${model}`;
    
    const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    };
    
    // Using the native Cloudflare Workers AI schema for Vision (top-level prompt and image)
    const payload = {
        prompt: promptText,
        image: imageBytes
    };

    try {
        let response = await fetch(url, {
            method: 'POST',
            headers,
            body: JSON.stringify(payload)
        });

        let data = await response.json();

        // 4. Handle gated license terms agreement automatically if needed
        if (!data.success) {
            const isGatedError = data.errors && data.errors.some(
                e => e.message.toLowerCase().includes('terms') || 
                     e.message.toLowerCase().includes('gated') || 
                     e.message.toLowerCase().includes('license') || 
                     e.code === 7009
            );

            if (isGatedError) {
                console.log(`✍️ [Cloudflare] Gated model license terms detected. Agreeing to Meta Llama 3.2 license...`);
                const agreeResponse = await fetch(url, {
                    method: 'POST',
                    headers,
                    body: JSON.stringify({ prompt: 'agree' })
                });
                
                const agreeData = await agreeResponse.json();
                const isAgreeSuccess = agreeData.success || (agreeData.errors && agreeData.errors.some(
                    e => e.code === 5016 || e.message.toLowerCase().includes('thank you for agreeing')
                ));

                if (isAgreeSuccess) {
                    console.log(`✅ [Cloudflare] License accepted successfully! Retrying image description request...`);
                    response = await fetch(url, {
                        method: 'POST',
                        headers,
                        body: JSON.stringify(payload)
                    });
                    data = await response.json();
                } else {
                    throw new Error(`Failed to accept Llama 3.2 license: ${JSON.stringify(agreeData.errors)}`);
                }
            }
        }

        if (!data.success) {
            throw new Error(`Cloudflare API Error: ${JSON.stringify(data.errors || data.messages)}`);
        }

        console.log(`\n✨ [Llama 3.2 Vision Description]:`);
        console.log(`-----------------------------------`);
        console.log(data.result.response || data.result.text);
        console.log(`-----------------------------------`);

    } catch (err) {
        console.error(`❌ [API Error] Failed to complete vision inference: ${err.message}`);
        process.exit(1);
    }
}

main();
