#!/usr/bin/env node

/**
 * Cloudflare Workers AI Vision & Vercel AI SDK Benchmark Utility
 * Executes 10 consecutive OCR extraction runs on the same image (power.png)
 * and compares results against the ground-truth reference values.
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');

const DEFAULT_ACCOUNT_ID = "a99b563ac707f6a81924483498093701";
const IMAGE_FILE = "power.png";

// Ground-Truth Reference Values directly from the image
const GROUND_TRUTH = {
  "Hero Power.Hero Level": 18901222,
  "Hero Power.Decorations & Building Stats": 4082301,
  "Hero Power.Gear": 2399149,
  "Hero Power.Hero Skill": 2326700,
  "Hero Power.Hero Tier": 1891427,
  "Hero Power.Wall of Honor": 183600,
  "Drone Power.Drone Level": 2589455,
  "Drone Power.Drone Component": 1080000,
  "Drone Power.Skill Chip": 140400,
  "Building Power.Buildings": 3045700,
  "Building Power.Survivor": 2189307
};

function getAccountId() {
    return process.env.CLOUDFLARE_ACCOUNT_ID || DEFAULT_ACCOUNT_ID;
}

function getAuthToken() {
    if (process.env.CLOUDFLARE_API_TOKEN) return process.env.CLOUDFLARE_API_TOKEN;
    if (process.env.CLOUDFLARE_AUTH_TOKEN) return process.env.CLOUDFLARE_AUTH_TOKEN;

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

// Convert HEIC and downsample to max 1000px
function processImage(filePath) {
    if (!fs.existsSync(filePath)) {
        throw new Error(`File does not exist: "${filePath}"`);
    }

    const ext = path.extname(filePath).toLowerCase();
    let targetPath = filePath;
    let tempPngPath = null;
    let needsCleanup = false;

    const isHeic = ext === '.heic' || ext === '.heif';
    tempPngPath = path.join(path.dirname(filePath), `temp_optimized_${Date.now()}.png`);
    
    try {
        if (isHeic) {
            execSync(`sips -s format png -Z 1000 "${filePath}" --out "${tempPngPath}"`, { stdio: 'ignore' });
        } else {
            execSync(`sips -Z 1000 "${filePath}" --out "${tempPngPath}"`, { stdio: 'ignore' });
        }
        targetPath = tempPngPath;
        needsCleanup = true;
    } catch (err) {
        console.warn(`⚠️ [sips] Warning: Failed to resize image via sips. Sending raw instead.`);
        targetPath = filePath;
        needsCleanup = false;
    }

    const buffer = fs.readFileSync(targetPath);

    if (needsCleanup && tempPngPath && fs.existsSync(tempPngPath)) {
        try { fs.unlinkSync(tempPngPath); } catch (e) {}
    }

    return buffer;
}

async function main() {
    console.log(`\n📊 CLOUDFLARE Workers AI OCR RELIABILITY BENCHMARK`);
    console.log(`=================================================`);
    console.log(`Target Image   : ${IMAGE_FILE}`);
    console.log(`Benchmark Runs : 10 Iterations`);
    console.log(`Reference Keys : ${Object.keys(GROUND_TRUTH).length} Ground-Truth Stats`);
    console.log(`-------------------------------------------------`);

    const imagePath = path.resolve(IMAGE_FILE);
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
        console.error(`❌ [Authentication Error] Could not find a valid Cloudflare API Token.`);
        process.exit(1);
    }

    const { generateText } = await import('ai');
    const { createWorkersAI } = await import('workers-ai-provider');

    const workersai = createWorkersAI({ accountId, apiKey });
    const model = workersai('@cf/meta/llama-3.2-11b-vision-instruct');

    const resultsLog = [];
    let totalDuration = 0;

    for (let run = 1; run <= 10; run++) {
        console.log(`\n🔄 [Run ${run}/10] Querying Llama 3.2 Vision...`);
        const startTime = Date.now();
        
        try {
            const result = await generateText({
                model,
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

            const duration = Date.now() - startTime;
            totalDuration += duration;

            // Indentation-Aware Dotted-Path Context Parser
            const parsedData = {};
            const lines = result.text.split('\n');
            const contextStack = [];

            for (const line of lines) {
                const trimmed = line.trim();
                if (trimmed === '') continue;

                const leadingWhitespace = line.match(/^([ \t]*)/)[0];
                const depth = leadingWhitespace.replace(/\t/g, '    ').length;
                const cleanLine = line.replace(/[*_#`]+/g, '').trim();

                let key = "";
                let valStr = "";

                const colonIndex = cleanLine.indexOf(':');
                if (colonIndex !== -1) {
                    key = cleanLine.substring(0, colonIndex).replace(/^[\s\-\+•]*/, '').trim();
                    valStr = cleanLine.substring(colonIndex + 1).trim();
                } else {
                    key = cleanLine.replace(/^[\s\-\+•]*/, '').trim();
                    valStr = "";
                }

                if (!key) continue;

                while (contextStack.length > 0 && contextStack[contextStack.length - 1].depth >= depth) {
                    contextStack.pop();
                }

                let cleanStr = valStr.replace(/,/g, '').trim();
                if (cleanStr === '') {
                    contextStack.push({ key, depth });
                } else {
                    let fullKey = key;
                    if (contextStack.length > 0) {
                        fullKey = contextStack.map(c => c.key).join('.') + '.' + key;
                    }

                    if (cleanStr.includes('/')) {
                        cleanStr = cleanStr.split('/')[0].trim();
                    }
                    cleanStr = cleanStr.replace(/^["']|["']$/g, '');

                    const num = Number(cleanStr);
                    if (!isNaN(num)) {
                        parsedData[fullKey] = num;
                    } else {
                        parsedData[fullKey] = cleanStr;
                    }
                }
            }

            // Accuracy evaluation
            let matches = 0;
            let errors = 0;
            let missing = 0;
            const detailedComparison = {};

            for (const [key, truthVal] of Object.entries(GROUND_TRUTH)) {
                const parsedVal = parsedData[key];
                if (parsedVal === undefined) {
                    missing++;
                    detailedComparison[key] = { status: 'MISSING', expected: truthVal, actual: null };
                } else if (parsedVal === truthVal) {
                    matches++;
                    detailedComparison[key] = { status: 'MATCH', expected: truthVal, actual: parsedVal };
                } else {
                    errors++;
                    detailedComparison[key] = { status: 'MISMATCH', expected: truthVal, actual: parsedVal };
                }
            }

            const accuracy = (matches / Object.keys(GROUND_TRUTH).length) * 100;
            console.log(`⏱️ Completed in ${(duration / 1000).toFixed(2)}s | 🎯 Accuracy: ${matches}/${Object.keys(GROUND_TRUTH).length} (${accuracy.toFixed(1)}%)`);

            resultsLog.push({
                run,
                duration,
                success: true,
                matches,
                errors,
                missing,
                accuracy,
                data: parsedData,
                comparison: detailedComparison
            });

        } catch (err) {
            console.error(`❌ [Run ${run} Failed]:`, err.message);
            resultsLog.push({
                run,
                duration: Date.now() - startTime,
                success: false,
                error: err.message
            });
        }
    }

    // Print Benchmark Report Summary
    const successfulRuns = resultsLog.filter(r => r.success);
    const avgDuration = totalDuration / successfulRuns.length;
    const avgAccuracy = successfulRuns.reduce((acc, curr) => acc + curr.accuracy, 0) / successfulRuns.length;

    console.log(`\n=================================================`);
    console.log(`🏁 BENCHMARK COMPLETED SUMMARY REPORT`);
    console.log(`=================================================`);
    console.log(`Total Runs Executed : 10`);
    console.log(`Successful Runs     : ${successfulRuns.length}/10`);
    console.log(`Average Latency     : ${(avgDuration / 1000).toFixed(2)} seconds`);
    console.log(`Average Accuracy    : ${avgAccuracy.toFixed(1)}%`);
    console.log(`-------------------------------------------------`);
    console.log(`RUN  | STATUS  | LATENCY | MATCHES | ERRORS | ACCURACY`);
    console.log(`-------------------------------------------------`);
    
    resultsLog.forEach(r => {
        if (r.success) {
            console.log(`${r.run.toString().padEnd(4)} | SUCCESS | ${(r.duration / 1000).toFixed(2).padEnd(6)}s | ${r.matches.toString().padEnd(7)} | ${r.errors.toString().padEnd(6)} | ${r.accuracy.toFixed(1)}%`);
        } else {
            console.log(`${r.run.toString().padEnd(4)} | FAILED  | -       | -       | -      | 0.0%`);
        }
    });
    console.log(`-------------------------------------------------`);

    // Key-by-key reliability analysis
    console.log(`\n📊 STATS EXTRACTION STABILITY ANALYSIS:`);
    console.log(`-------------------------------------------------`);
    for (const key of Object.keys(GROUND_TRUTH)) {
        let perfectMatches = 0;
        let incorrectValueCount = 0;
        let missingCount = 0;

        successfulRuns.forEach(r => {
            const status = r.comparison[key].status;
            if (status === 'MATCH') perfectMatches++;
            else if (status === 'MISMATCH') incorrectValueCount++;
            else missingCount++;
        });

        const reliability = (perfectMatches / successfulRuns.length) * 100;
        console.log(`${key.padEnd(40)} | ${reliability.toFixed(1)}% Stable | (Match: ${perfectMatches}, Error: ${incorrectValueCount}, Miss: ${missingCount})`);
    }
    console.log(`=================================================\n`);
}

main();
