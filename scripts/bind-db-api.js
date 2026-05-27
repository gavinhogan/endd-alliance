#!/usr/bin/env node

/**
 * Cloudflare Pages D1 Binding Utility
 * Programmatically configures database bindings for Preview (Stage) and Production (Live)
 * via the Cloudflare Pages Projects API.
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

// Default Cloudflare values
const DEFAULT_ACCOUNT_ID = "a99b563ac707f6a81924483498093701";
const PROJECT_NAME = "endd-alliance";

// Database UUIDs
const STAGING_DB_ID = "dd0ce1a7-90f5-4032-8058-d049ac850b19";
const PRODUCTION_DB_ID = "0ca3f4ed-acae-4e45-b77a-0cec9382f2fe";

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

async function main() {
    const accountId = getAccountId();
    const token = getAuthToken();

    if (!token) {
        console.error(`❌ [Authentication Error] Could not find an active Cloudflare API Token.
Please set the CLOUDFLARE_API_TOKEN environment variable, or run 'npx wrangler login' to authenticate locally.`);
        process.exit(1);
    }

    console.log(`📡 Linking D1 Databases to Cloudflare Pages Project "${PROJECT_NAME}" via Cloudflare API...`);
    
    const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/pages/projects/${PROJECT_NAME}`;
    
    const payload = {
        deployment_configs: {
            preview: {
                d1_databases: {
                    DB: {
                        id: STAGING_DB_ID
                    }
                }
            },
            production: {
                d1_databases: {
                    DB: {
                        id: PRODUCTION_DB_ID
                    }
                }
            }
        }
    };

    try {
        const response = await fetch(url, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (!data.success) {
            throw new Error(`Cloudflare API Error: ${JSON.stringify(data.errors || data.messages)}`);
        }

        console.log(`\n✨ [Cloudflare Pages Bindings Setup Success!]:`);
        console.log(`-----------------------------------------------`);
        console.log(`✅ Staging Binding (Preview): DB ➔ endd-alliance-db-stage (${STAGING_DB_ID})`);
        console.log(`✅ Live Binding (Production): DB ➔ endd-alliance-db-prod  (${PRODUCTION_DB_ID})`);
        console.log(`-----------------------------------------------`);
        console.log(`🎉 Cloudflare Pages bindings updated! Redeploy your branches on GitHub to activate the new database connections.`);

    } catch (err) {
        console.error(`❌ [API Error] Failed to configure Pages bindings: ${err.message}`);
        process.exit(1);
    }
}

main();
