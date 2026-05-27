#!/usr/bin/env node

/**
 * Cloudflare D1 Database Cleanup Utility
 * Wipes the power_snapshots time-series logs table clean.
 * 
 * Usage:
 *   node scripts/clear-db.js            # Clears local SQLite database
 *   node scripts/clear-db.js --remote   # Clears remote staging database (once bound)
 */

const { execSync } = require('child_process');

const args = process.argv.slice(2);
const isRemote = args.includes('--remote');

const targetName = isRemote ? 'REMOTE STAGING' : 'LOCAL DEV';
const command = isRemote 
    ? 'npx wrangler d1 execute DB --remote --command "DELETE FROM power_snapshots;"'
    : 'npx wrangler d1 execute DB --local --command "DELETE FROM power_snapshots;"';

console.log(`🧹 Wiping all rows from ${targetName} database (power_snapshots)...`);

try {
    const output = execSync(command, { encoding: 'utf8' });
    console.log(output);
    console.log(`✅ Success! ${targetName} database has been completely emptied.`);
} catch (err) {
    console.error(`❌ Failed to clear ${targetName} database:`, err.message);
    if (isRemote) {
        console.log(`\nℹ️ Note: If D1 is not yet bound in your Cloudflare pages dashboard, the remote clean will return database not found.`);
    }
}
