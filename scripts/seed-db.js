#!/usr/bin/env node

/**
 * Cloudflare D1 SQL Database Seeder
 * Emulates a daily power snapshot upload for the last 28 days (4 weeks).
 * Generates continuous, non-linear growth culminating exactly in the user's latest values.
 * 
 * Usage:
 *   node scripts/seed-db.js
 */

const { execSync } = require('child_process');
const fs = require('fs');

// Default Fallback Ground-Truth values (Day 28)
const DEFAULT_TARGET = {
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

async function main() {
    console.log(`\n🌱 ALLIANCE DATABASE SEEDING ENGINE`);
    console.log(`===================================`);

    // 1. Fetch the latest snapshot from D1 local SQLite instance to use as target anchoring values
    let targetValues = { ...DEFAULT_TARGET };
    let userId = "local_user";
    let username = "Gavin Hogan - May '21";

    console.log(`📡 Querying local D1 SQLite database for active user snapshot anchoring...`);
    try {
        const queryRes = execSync(
            `npx wrangler d1 execute DB --local --command "SELECT user_id, username, raw_data FROM power_snapshots ORDER BY timestamp DESC LIMIT 1;" --json`,
            { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] }
        );
        
        const parsed = JSON.parse(queryRes);
        if (parsed && parsed[0] && parsed[0].results && parsed[0].results.length > 0) {
            const record = parsed[0].results[0];
            userId = record.user_id;
            username = record.username;
            const parsedData = JSON.parse(record.raw_data);
            
            // Validate that we got some numeric keys
            const numericKeys = Object.keys(parsedData).filter(k => typeof parsedData[k] === 'number');
            if (numericKeys.length > 0) {
                targetValues = parsedData;
                console.log(`✅ Anchor Found! Seeding based on active user: "${username}" (${userId})`);
                console.log(`📊 Anchor Stats: ${numericKeys.length} active metric dimensions.`);
            }
        } else {
            console.log(`ℹ️ No database snapshot found. Seeding with default mock Gavin Hogan anchor...`);
        }
    } catch (err) {
        console.log(`⚠️ Database empty or not initialized. Seeding with default mock Gavin Hogan anchor...`);
    }

    // 2. Wipe the database first to prevent duplicate entries from multiple seeding runs
    console.log(`🧹 Clearing database rows to prepare clean time-series seed...`);
    try {
        execSync(`npx wrangler d1 execute DB --local --command "DELETE FROM power_snapshots;"`, { stdio: 'ignore' });
    } catch (e) {
        // Ignore if D1 initializer hasn't run yet
    }

    // 3. Ensure self-healing database table exists
    console.log(`🔧 Running database schema initializer...`);
    try {
        execSync(`npx wrangler d1 execute DB --local --command "
          CREATE TABLE IF NOT EXISTS power_snapshots (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT NOT NULL,
            username TEXT NOT NULL,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            raw_data TEXT NOT NULL
          );
          CREATE INDEX IF NOT EXISTS idx_power_user_timestamp ON power_snapshots (user_id, timestamp);
        "`, { stdio: 'ignore' });
    } catch (e) {
        console.error("❌ Failed to initialize database tables:", e.message);
        process.exit(1);
    }

    // 4. Generate daily increment steps for non-linear, monotonically increasing growth
    const daysCount = 28;
    const steps = [];
    let cumulativeWeight = 0;
    
    // Create random non-linear positive step ratios
    for (let s = 1; s < daysCount; s++) {
        const weight = Math.pow(s, 1.4) * (0.85 + 0.3 * Math.random());
        steps.push(weight);
        cumulativeWeight += weight;
    }

    console.log(`📅 Generating 28 daily snapshots with continuous non-linear growth...`);
    const insertStatements = [];

    for (let day = 1; day <= daysCount; day++) {
        // Back-calculate timestamp (Day 28 is today, Day 1 is 27 days ago)
        const date = new Date();
        date.setDate(date.getDate() - (daysCount - day));
        
        // Zero-out hours/minutes/seconds to resemble once-a-day upload
        date.setHours(9, 0, 0, 0);
        const isoString = date.toISOString().replace('T', ' ').substring(0, 19);

        // Calculate values for this day
        const dayData = {};
        for (const [key, val] of Object.entries(targetValues)) {
            if (typeof val === 'number') {
                if (day === daysCount) {
                    // Day 28 must match the target value exactly!
                    dayData[key] = val;
                } else {
                    // Day d matches starting base (70%) + portion of growth
                    const basePortion = 0.70;
                    const growthPortion = 0.30;
                    
                    let sumOfWeights = 0;
                    for (let i = 0; i < day - 1; i++) {
                        sumOfWeights += steps[i];
                    }
                    const ratio = basePortion + growthPortion * (sumOfWeights / cumulativeWeight);
                    dayData[key] = Math.round(val * ratio);
                }
            } else {
                // Keep string/metadata values as-is
                dayData[key] = val;
            }
        }

        // Construct SQLite prepared insert statement string
        const escapedJson = JSON.stringify(dayData).replace(/'/g, "''");
        insertStatements.push(`INSERT INTO power_snapshots (user_id, username, timestamp, raw_data) VALUES ('${userId}', '${username.replace(/'/g, "''")}', '${isoString}', '${escapedJson}');`);
    }

    // 5. Execute all inserts in a single transaction execute command for maximum speed
    console.log(`💾 Executing batch transaction on local SQLite database...`);
    try {
        const transactionSql = `BEGIN TRANSACTION;\n${insertStatements.join('\n')}\nCOMMIT;`;
        
        // Write transaction SQL to a temporary file
        const tempSqlPath = './temp_seed.sql';
        fs.writeFileSync(tempSqlPath, transactionSql);
        
        execSync(`npx wrangler d1 execute DB --local --file="${tempSqlPath}"`, { stdio: 'ignore' });
        fs.unlinkSync(tempSqlPath);
        
        console.log(`\n✨ [DATABASE SEED SUCCESSFUL!]:`);
        console.log(`-----------------------------------------------`);
        console.log(`✅ Emulated Daily Uploads : 28 consecutive days`);
        console.log(`✅ Target User            : "${username}"`);
        console.log(`✅ Strictly Monotonic     : Yes (100% non-linear growth)`);
        console.log(`-----------------------------------------------`);
        console.log(`🎉 Seed complete! Refresh your local dashboard to see the beautiful 4-week stacked growth area trends!`);

    } catch (err) {
        console.error(`❌ Failed to execute seed transaction:`, err.message);
        process.exit(1);
    }
}

main();
