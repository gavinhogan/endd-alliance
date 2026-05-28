---
layout: base.njk
title: "📈 AI Power Tracker"
description: "Track and visualize your power levels over time using AI-powered OCR screenshot analysis."
emoji: "📈"
tags: tutorial
backLink: true
---
<article class="tutorial-content">

<div style="text-align: center; border-bottom: 1px solid var(--border-color); margin-bottom: 30px; padding-bottom: 20px;">
    <h1 style="margin: 0; color: #009dff;">📈 ALLIANCE POWER TRACKER 📈</h1>
    <p style="color: var(--accent-primary); font-family: var(--font-heading); font-size: 0.9rem; text-transform: uppercase; font-weight: bold; letter-spacing: 1px;">
        🔍 AI-Powered OCR Scanning & Time-Series Analytics 🔍</p>
</div>

<!-- 1. Authentication Check Wrapper -->
<div id="tracker-auth-loader" style="text-align: center; padding: 40px 0;">
    <div class="pulse-active" style="font-size: 1.2rem; font-family: var(--font-heading); color: var(--accent-primary); font-weight: bold;">
        🔄 INITIATING TACTICAL TRACKER LINK...
    </div>
</div>

<div id="tracker-locked-container" style="display: none; text-align: center; padding: 60px 40px;">
    <div style="font-size: 3rem; margin-bottom: 20px;">🔒</div>
    <h1 style="color: var(--text-header); font-family: var(--font-heading); margin-bottom: 10px;">ACCESS RESTRICTED</h1>
    <p style="color: var(--season-primary); font-family: var(--font-heading); font-size: 0.9rem; text-transform: uppercase; font-weight: bold; letter-spacing: 1px; margin-bottom: 25px;">
        ⚠️ Secure Authentication Required • ConfuzedCorp Protocol ⚠️</p>
    <p style="max-width: 500px; margin: 0 auto 30px auto; color: var(--text-secondary); line-height: 1.6; font-size: 1rem;">
        You must authenticate your Discord identity with the alliance repository to scan your power screenshots and log time-series metrics.
    </p>
    <a href="/login/" class="hud-btn login-btn" style="text-decoration: none; padding: 12px 24px; font-weight: 800; font-family: var(--font-heading); font-size: 1rem; border-radius: 6px;">🔒 AUTHENTICATE NOW</a>
</div>

<div id="tracker-locked-feature-flag" style="display: none; text-align: center; padding: 60px 40px;">
    <div style="font-size: 3rem; margin-bottom: 20px;">🛡️</div>
    <h1 style="color: var(--text-header); font-family: var(--font-heading); margin-bottom: 10px;">MODULE DEACTIVATED</h1>
    <p style="color: #ffc107; font-family: var(--font-heading); font-size: 0.9rem; text-transform: uppercase; font-weight: bold; letter-spacing: 1px; margin-bottom: 25px;">
        ⚠️ PROTOCOL L-4 SECURED • ACCESS SUSPENDED ⚠️</p>
    <p style="max-width: 500px; margin: 0 auto 30px auto; color: var(--text-secondary); line-height: 1.6; font-size: 1rem;">
        The AI Power Tracker module is currently deactivated under High Command feature toggle directives. Contact your Alliance Commander for clearance authorizations.
    </p>
</div>

<div id="tracker-active-dashboard" style="display: none;">
    <!-- Profile Visual Block -->
    <div class="profile-header-card" style="display: flex; gap: 20px; align-items: center; background: rgba(0, 157, 255, 0.04); border: 1px solid var(--border-color); padding: 20px; border-radius: 12px; margin-bottom: 30px;">
        <img id="user-hud-avatar" src="" alt="Avatar" style="width: 50px; height: 50px; border-radius: 50%; border: 2px solid var(--accent-primary); object-fit: cover;">
        <div style="text-align: left;">
            <span style="font-size: 0.8rem; color: var(--text-secondary); font-family: var(--font-heading); font-weight: bold;">ALLIANCE COMMANDER</span>
            <h3 id="user-hud-username" style="margin: 0; color: var(--text-header); font-family: var(--font-heading); font-size: 1.3rem;"></h3>
        </div>
    </div>

    <!-- 🎛️ Diagnostic DB Connection Status Panel -->
    <div id="db-diagnostic-card" style="background: rgba(255, 193, 7, 0.03); border: 1px dashed rgba(255, 193, 7, 0.3); padding: 18px 20px; border-radius: 12px; margin-bottom: 30px; display: flex; flex-direction: column; gap: 8px;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
            <div style="display: flex; align-items: center; gap: 8px;">
                <span style="font-size: 1.1rem;">🎛️</span>
                <span style="font-family: var(--font-heading); font-weight: bold; font-size: 0.9rem; color: #ffc107; letter-spacing: 0.5px;">DATABASE DIAGNOSTIC PANEL</span>
            </div>
            <div style="display: flex; gap: 10px; align-items: center;">
                <button id="db-purge-btn" style="display: none; padding: 4px 10px; background: #dc3545; color: #fff; border: 1px solid rgba(255,255,255,0.2); border-radius: 4px; font-family: var(--font-heading); font-weight: 800; font-size: 0.7rem; cursor: pointer; text-transform: uppercase;">💣 WIPE DB</button>
                <span id="db-status-badge" style="font-size: 0.7rem; font-weight: bold; text-transform: uppercase; background: rgba(255,193,7,0.15); color: #ffc107; padding: 2px 8px; border-radius: 20px; border: 1px solid rgba(255,193,7,0.3);">🔄 DIAGNOSING...</span>
            </div>
        </div>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 15px; margin-top: 5px; font-family: monospace; font-size: 0.8rem; color: var(--text-secondary);">
            <div>🔌 Connection: <span id="db-diagnostic-type" style="color: var(--text-header); font-weight: bold;">...</span></div>
            <div>📁 Binding Name: <span id="db-diagnostic-binding" style="color: var(--text-header); font-weight: bold;">env.DB</span></div>
            <div>🔢 Snapshots Logged: <span id="db-diagnostic-rows" style="color: var(--text-header); font-weight: bold;">...</span></div>
            <div>⚙️ SQLite Engine: <span id="db-diagnostic-ver" style="color: var(--text-header); font-weight: bold;">...</span></div>
        </div>
        <div id="db-diagnostic-error-block" style="display: none; background: rgba(220, 53, 69, 0.08); border: 1px solid rgba(220, 53, 69, 0.2); border-radius: 6px; padding: 10px; margin-top: 8px; font-size: 0.75rem; line-height: 1.4; color: #ff4d4d; font-family: monospace;">
            ⚠️ <strong>ERROR:</strong> <span id="db-diagnostic-error-text">...</span><br>
            📡 <strong>Available Bindings:</strong> <span id="db-diagnostic-bindings-list">None</span>
        </div>
        <div id="db-local-sqlite-alert" style="display: none; background: rgba(0, 157, 255, 0.08); border: 1px solid rgba(0, 157, 255, 0.2); border-radius: 6px; padding: 10px; margin-top: 8px; font-size: 0.75rem; line-height: 1.4; color: var(--text-secondary);">
            💡 <strong>LOCAL DEV TIP:</strong> Miniflare emulates D1 using local SQLite files under <code style="color: var(--accent-primary); background: rgba(0,0,0,0.2); padding: 1px 4px; border-radius: 3px;">.wrangler/state/v3/d1/miniflare-D1DatabaseObject/</code>. Query the SQLite file containing rows directly using your database uuid via:
            <pre style="margin: 6px 0 0 0; background: #000; padding: 8px; border-radius: 4px; color: #28a745; overflow-x: auto;">sqlite3 .wrangler/state/v3/d1/miniflare-D1DatabaseObject/e7352547963de7050bd7d94658afc4fe78b61811b7815da12d90be8e863abf4d.sqlite "SELECT * FROM power_snapshots;"</pre>
        </div>
    </div>

    <!-- 2. Screenshot Scanner Uploader -->
    <span class="section-title">1. Deploy Tactical Screenshot Scan</span>
    <p style="font-size: 0.95rem; color: var(--text-secondary); margin-bottom: 20px;">
        Upload a screenshot of your in-game power details screen (like the example `power.png` in the HQ). Our edge-hosted **Llama 3.2 Vision** model will automatically extract your stats and log them securely.
    </p>

    <!-- Drag & Drop Dropzone -->
    <div id="screenshot-dropzone" style="border: 2px dashed var(--accent-primary); background: rgba(0, 157, 255, 0.02); border-radius: 12px; padding: 40px 20px; text-align: center; cursor: pointer; transition: all 0.3s ease; margin-bottom: 30px; position: relative;">
        <input type="file" id="screenshot-input-file" accept="image/png, image/jpeg" style="display: none;">
        <div style="font-size: 2.5rem; margin-bottom: 10px;">📸</div>
        <h4 style="margin: 0 0 5px 0; font-family: var(--font-heading); color: var(--text-header); font-size: 1.1rem;">DRAG & DROP SCREENSHOT HERE</h4>
        <p style="margin: 0; font-size: 0.85rem; color: var(--text-secondary);">or click to browse local files (Supports PNG, JPEG)</p>
    </div>

    <!-- Active Loading Inference Indicator -->
    <div id="scanning-loader" style="display: none; text-align: center; border: 1px solid var(--accent-primary); background: rgba(0, 157, 255, 0.05); padding: 30px; border-radius: 12px; margin-bottom: 30px; box-shadow: 0 0 15px rgba(0, 157, 255, 0.15);">
        <div class="pulse-active" style="font-size: 1.2rem; font-family: var(--font-heading); color: var(--accent-primary); font-weight: bold; margin-bottom: 15px;">
            ⚡ ENGAGING LLAMA 3.2 VISION INFERENCE...
        </div>
        <p id="scanning-status-text" style="font-size: 0.9rem; color: var(--text-secondary); margin: 0; font-style: italic;">
            Resizing image to 1000px via canvas to optimize transfer speed...
        </p>
    </div>

    <!-- Scan Results Panel -->
    <div id="scan-results-panel" style="display: none; background: rgba(40, 167, 69, 0.03); border: 1px solid #28a745; padding: 25px; border-radius: 12px; margin-bottom: 40px; box-shadow: 0 4px 15px rgba(40, 167, 69, 0.05);">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; border-bottom: 1px solid rgba(40, 167, 69, 0.2); padding-bottom: 10px;">
            <h3 style="margin: 0; color: #28a745; font-family: var(--font-heading); font-size: 1.3rem;">✅ SCAN EXTRACTION COMPLETE</h3>
            <span style="font-size: 0.75rem; background: #28a745; color: #ffffff; padding: 2px 8px; border-radius: 20px; font-weight: 800;">D1 LOGGED</span>
        </div>
        <div class="table-container">
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 0;">
                <thead>
                    <tr>
                        <th style="border-bottom: 2px solid #28a745;">Extracted Stat Element</th>
                        <th style="border-bottom: 2px solid #28a745; text-align: right;">Extracted Value</th>
                    </tr>
                </thead>
                <tbody id="scan-table-body">
                    <!-- Populated dynamically -->
                </tbody>
            </table>
        </div>
    </div>

    <!-- 3. Time-Series Graph Analytics -->
    <div id="analytics-section" style="display: none; margin-bottom: 40px;">
        <span class="section-title">2. Tactical Time-Series Group Analytics</span>
        <p style="font-size: 0.95rem; color: var(--text-secondary); margin-bottom: 25px;">
            Your historical growth trend visualized across all tactical subgroups. Sub-elements are presented as stacked areas to illustrate their cumulative contribution.
        </p>

        <!-- Dynamic Grid of Stacked Area Charts -->
        <div id="charts-grid-container" style="display: flex; flex-direction: column; gap: 35px;">
            <!-- Populated dynamically with grouped canvas cards -->
        </div>
    </div>
</div>

</article>

<!-- Include Chart.js via CDN -->
<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>

<script>
    let rawHistoryData = [];
    let chartInstance = null;

    document.addEventListener('DOMContentLoaded', async () => {
        const authLoader = document.getElementById('tracker-auth-loader');
        const lockedContainer = document.getElementById('tracker-locked-container');
        const activeDashboard = document.getElementById('tracker-active-dashboard');
        const featureLockedContainer = document.getElementById('tracker-locked-feature-flag');

        // 1. Resolve dynamic feature flag clearances (Default: Off)
        try {
            const fResponse = await fetch('/api/features');
            const fData = await fResponse.json();
            
            if (fData.success && !fData.features.FEATURE_POWER_TRACKER) {
                authLoader.style.display = 'none';
                featureLockedContainer.style.display = 'block';
                return; // Cease loading sequence under HQ orders!
            }
        } catch (err) {
            console.error('Failed to load dynamic feature flag clearances:', err);
        }

        // 2. Check authentication session
        try {
            const response = await fetch('/api/auth/session');
            const session = await response.json();

            if (session.authenticated && session.user) {
                authLoader.style.display = 'none';
                activeDashboard.style.display = 'block';

                // Display profile header info
                const displayName = session.user.globalName || session.user.username;
                document.getElementById('user-hud-username').textContent = displayName;

                let avatarUrl;
                if (session.user.avatar) {
                    avatarUrl = `https://cdn.discordapp.com/avatars/${session.user.id}/${session.user.avatar}.png?size=128`;
                } else {
                    const defaultIdx = Number(BigInt(session.user.id) >> 22n) % 6;
                    avatarUrl = `https://cdn.discordapp.com/embed/avatars/${defaultIdx}.png`;
                }
                document.getElementById('user-hud-avatar').src = avatarUrl;

                // Load time-series history
                await loadHistory();
                setupUploader();
                await fetchDbDiagnostics();

            } else {
                authLoader.style.display = 'none';
                lockedContainer.style.display = 'block';
            }
        } catch (err) {
            console.error('Session verification error:', err);
            authLoader.style.display = 'none';
            lockedContainer.style.display = 'block';
        }
    });

    // Uploader integration
    function setupUploader() {
        const dropzone = document.getElementById('screenshot-dropzone');
        const fileInput = document.getElementById('screenshot-input-file');

        dropzone.addEventListener('click', () => fileInput.click());

        // Drag & drop highlights
        dropzone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropzone.style.background = 'rgba(0, 157, 255, 0.08)';
            dropzone.style.borderColor = 'var(--text-header)';
        });

        dropzone.addEventListener('dragleave', () => {
            dropzone.style.background = 'rgba(0, 157, 255, 0.02)';
            dropzone.style.borderColor = 'var(--accent-primary)';
        });

        dropzone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropzone.style.background = 'rgba(0, 157, 255, 0.02)';
            dropzone.style.borderColor = 'var(--accent-primary)';
            if (e.dataTransfer.files.length > 0) {
                processAndUpload(e.dataTransfer.files[0]);
            }
        });

        fileInput.addEventListener('change', (e) => {
            if (fileInput.files.length > 0) {
                processAndUpload(fileInput.files[0]);
            }
        });
    }

    // Diagnostics db connection status fetcher
    async function fetchDbDiagnostics() {
        const badge = document.getElementById('db-status-badge');
        const typeEl = document.getElementById('db-diagnostic-type');
        const rowsEl = document.getElementById('db-diagnostic-rows');
        const verEl = document.getElementById('db-diagnostic-ver');
        const tipEl = document.getElementById('db-local-sqlite-alert');
        const errorBlock = document.getElementById('db-diagnostic-error-block');
        const errorText = document.getElementById('db-diagnostic-error-text');
        const bindingsList = document.getElementById('db-diagnostic-bindings-list');
        const purgeBtn = document.getElementById('db-purge-btn');

        // Bind purge click listener
        purgeBtn.onclick = async () => {
            if (!confirm("⚠️ TACTICAL PURGE NOTICE:\nAre you absolutely sure you want to permanently delete all tracked power snapshots from the database? This cannot be undone.")) {
                return;
            }
            purgeBtn.disabled = true;
            purgeBtn.textContent = "💥 PURGING...";
            try {
                const res = await fetch('/api/power/purge', { method: 'POST' });
                const resData = await res.json();
                if (resData.success) {
                    alert("✅ Success! Database successfully wiped.");
                    // Reload UI stats and diagnostics
                    window.location.reload();
                } else {
                    throw new Error(resData.error || "Wipe failed.");
                }
            } catch (err) {
                alert("❌ Database Purge Failed: " + err.message);
            } finally {
                purgeBtn.disabled = false;
                purgeBtn.textContent = "💣 WIPE DB";
            }
        };

        try {
            const response = await fetch('/api/power/db-status');
            const data = await response.json();

            if (data.connected) {
                badge.textContent = "🟢 CONNECTED";
                badge.style.color = "#28a745";
                badge.style.borderColor = "rgba(40,167,69,0.3)";
                badge.style.background = "rgba(40,167,69,0.15)";
                
                typeEl.textContent = data.type;
                rowsEl.textContent = data.rowCount.toLocaleString() + " rows";
                verEl.textContent = "v" + data.version;

                errorBlock.style.display = "none";
                purgeBtn.style.display = data.rowCount > 0 ? "inline-block" : "none";

                if (data.type.includes("Local")) {
                    tipEl.style.display = "block";
                } else {
                    tipEl.style.display = "none";
                }
            } else {
                badge.textContent = "🔴 ERROR";
                badge.style.color = "#dc3545";
                badge.style.borderColor = "rgba(220,53,69,0.3)";
                badge.style.background = "rgba(220,53,69,0.15)";
                typeEl.textContent = "Disconnected";
                rowsEl.textContent = "N/A";
                verEl.textContent = "N/A";
                tipEl.style.display = "none";
                purgeBtn.style.display = "none";

                // Render error details
                errorBlock.style.display = "block";
                errorText.textContent = data.error || "Database context binding env.DB is undefined.";
                bindingsList.textContent = data.availableBindings && data.availableBindings.length > 0 
                    ? data.availableBindings.join(", ") 
                    : "No bindings available";
            }
        } catch (err) {
            console.error('Failed to load DB diagnostics:', err);
            badge.textContent = "🔴 OFFLINE";
            badge.style.color = "#dc3545";
            badge.style.borderColor = "rgba(220,53,69,0.3)";
            badge.style.background = "rgba(220,53,69,0.15)";
            typeEl.textContent = "Offline/Error";
            rowsEl.textContent = "N/A";
            verEl.textContent = "N/A";
            tipEl.style.display = "none";
            purgeBtn.style.display = "none";
            
            errorBlock.style.display = "block";
            errorText.textContent = err.message;
            bindingsList.textContent = "Unknown";
        }
    }

    // Direct raw high-resolution upload
    async function processAndUpload(file) {
        const dropzone = document.getElementById('screenshot-dropzone');
        const loader = document.getElementById('scanning-loader');
        const statusText = document.getElementById('scanning-status-text');
        const resultsPanel = document.getElementById('scan-results-panel');

        dropzone.style.display = 'none';
        resultsPanel.style.display = 'none';
        loader.style.display = 'block';
        statusText.textContent = "Deploying high-resolution screenshot to Cloudflare LLM Vision OCR...";

        try {
            const response = await fetch('/api/power/upload', {
                method: 'POST',
                headers: {
                    'Content-Type': file.type
                },
                body: file
            });
            const resData = await response.json();

            if (!response.ok || resData.error) {
                throw new Error(resData.error || "Failed to scan image.");
            }

            // Display results
            displayResults(resData.data);
            
            // Reload time-series graph
            await loadHistory();
            await fetchDbDiagnostics();

        } catch (err) {
            alert(`❌ OCR Scan Failed: ${err.message}`);
        } finally {
            loader.style.display = 'none';
            dropzone.style.display = 'block';
        }
    }

    function displayResults(data) {
        const resultsPanel = document.getElementById('scan-results-panel');
        const tbody = document.getElementById('scan-table-body');
        tbody.innerHTML = '';

        for (const [key, val] of Object.entries(data)) {
            const row = document.createElement('tr');
            const keyCol = document.createElement('td');
            keyCol.innerHTML = `<strong>${key}</strong>`;
            
            const valCol = document.createElement('td');
            valCol.style.textAlign = 'right';
            valCol.style.fontFamily = 'monospace';
            valCol.style.fontWeight = 'bold';
            valCol.style.color = '#28a745';
            valCol.textContent = typeof val === 'number' ? val.toLocaleString() : val;

            row.appendChild(keyCol);
            row.appendChild(valCol);
            tbody.appendChild(row);
        }
        resultsPanel.style.display = 'block';
    }

    let activeChartInstances = [];

    // Load D1 history
    async function loadHistory() {
        try {
            const response = await fetch('/api/power/history');
            const data = await response.json();

            if (data.success && data.history && data.history.length > 0) {
                rawHistoryData = data.history;
                
                // Show analytics division
                document.getElementById('analytics-section').style.display = 'block';
                
                // Render stacked group charts dynamically
                renderGroupedCharts();
            }
        } catch (err) {
            console.error('Failed to load history metrics:', err);
        }
    }

    // Render stacked area charts dynamically grouped by parent namespaces
    function renderGroupedCharts() {
        // Destroy all existing chart instances to avoid canvas reuse / hover memory leaks
        activeChartInstances.forEach(inst => inst.destroy());
        activeChartInstances = [];

        const container = document.getElementById('charts-grid-container');
        container.innerHTML = '';

        // A. Dynamic Namespace & Subkey Discovery
        const groupsMap = {}; // { groupName: { subKeyName: [values...] } }
        const timestamps = [];

        // Sort raw history chronologically by timestamp
        const sortedHistory = [...rawHistoryData].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

        sortedHistory.forEach(entry => {
            const date = new Date(entry.timestamp);
            const formattedTime = date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            timestamps.push(formattedTime);
        });

        // Discover all unique dotted-path subkeys present across ALL records
        const allKeys = new Set();
        sortedHistory.forEach(entry => {
            if (entry.data) {
                Object.keys(entry.data).forEach(k => allKeys.add(k));
            }
        });

        // Initialize lists in groupsMap with empty arrays of 0s corresponding to sortedHistory
        allKeys.forEach(fullKey => {
            const parts = fullKey.split('.');
            let group = "General Power";
            let subKey = fullKey;

            if (parts.length > 1) {
                group = parts[0];
                subKey = parts.slice(1).join('.');
            }

            if (!groupsMap[group]) {
                groupsMap[group] = {};
            }
            if (!groupsMap[group][subKey]) {
                groupsMap[group][subKey] = new Array(sortedHistory.length).fill(0);
            }
        });

        // B. Populate values chronologically
        sortedHistory.forEach((entry, idx) => {
            if (entry.data) {
                Object.entries(entry.data).forEach(([fullKey, val]) => {
                    if (typeof val === 'number') {
                        const parts = fullKey.split('.');
                        let group = "General Power";
                        let subKey = fullKey;

                        if (parts.length > 1) {
                            group = parts[0];
                            subKey = parts.slice(1).join('.');
                        }

                        if (groupsMap[group] && groupsMap[group][subKey]) {
                            groupsMap[group][subKey][idx] = val;
                        }
                    }
                });
            }
        });

        // C. Define premium glowing color palettes for area fills and borders
        const PALETTES = {
            "hero power": [
                "rgba(0, 157, 255, 0.15)",  // Cyber blue
                "rgba(111, 66, 193, 0.15)",  // Deep violet
                "rgba(0, 229, 255, 0.15)",   // Cyan teal
                "rgba(156, 39, 176, 0.15)",  // Purple
                "rgba(33, 150, 243, 0.15)",  // Dodger blue
                "rgba(103, 58, 183, 0.15)"   // Deep purple
            ],
            "drone power": [
                "rgba(253, 126, 20, 0.15)",  // Neon orange
                "rgba(255, 193, 7, 0.15)",   // Gold yellow
                "rgba(233, 30, 99, 0.15)",   // Hot pink
                "rgba(255, 87, 34, 0.15)",   // Coral
                "rgba(255, 235, 59, 0.15)",  // Yellow
                "rgba(244, 67, 54, 0.15)"    // Crimson red
            ],
            "building power": [
                "rgba(40, 167, 69, 0.15)",   // Neon green
                "rgba(32, 201, 151, 0.15)",  // Mint teal
                "rgba(76, 175, 80, 0.15)",   // Emerald
                "rgba(139, 195, 74, 0.15)",  // Lime
                "rgba(0, 150, 136, 0.15)",   // Dark teal
                "rgba(205, 220, 57, 0.15)"   // Citron
            ]
        };

        const BORDERS = {
            "hero power": ["#009dff", "#6f42c1", "#00e5ff", "#9c27b0", "#2196f3", "#673ab8"],
            "drone power": ["#fd7e14", "#ffc107", "#e91e63", "#ff5722", "#ffeb3b", "#f44336"],
            "building power": ["#28a745", "#20c997", "#4caf50", "#8bc34a", "#009688", "#cddc39"]
        };

        const DEFAULT_PALETTE = ["rgba(0, 123, 255, 0.15)", "rgba(40, 167, 69, 0.15)", "rgba(23, 162, 184, 0.15)", "rgba(255, 193, 7, 0.15)", "rgba(220, 53, 69, 0.15)"];
        const DEFAULT_BORDERS = ["#007bff", "#28a745", "#17a2b8", "#ffc107", "#dc3545"];

        // D. Create stacked area graphs chronologically
        Object.entries(groupsMap).forEach(([groupName, subKeysData]) => {
            const groupId = groupName.toLowerCase().replace(/[^a-z0-9]/g, '-');
            
            // Assemble chart container card markup
            const card = document.createElement('div');
            card.style.background = "rgba(18, 22, 28, 0.4)";
            card.style.border = "1px solid var(--border-color)";
            card.style.borderRadius = "12px";
            card.style.padding = "25px";
            card.style.boxShadow = "var(--card-shadow)";
            card.style.display = "flex";
            card.style.flexDirection = "column";
            card.style.gap = "15px";

            // Glowing bullet theme color based on group category name
            let bulletColor = "#009dff";
            if (groupName.toLowerCase().includes("drone")) bulletColor = "#fd7e14";
            if (groupName.toLowerCase().includes("building")) bulletColor = "#28a745";

            card.innerHTML = `
                <div style="display: flex; align-items: center; gap: 10px; border-bottom: 1px solid var(--border-color); padding-bottom: 12px;">
                    <span style="display: inline-block; width: 10px; height: 10px; border-radius: 50%; background: ${bulletColor}; box-shadow: 0 0 8px ${bulletColor};"></span>
                    <h3 style="margin: 0; font-family: var(--font-heading); color: var(--text-header); font-size: 1.1rem; text-transform: uppercase; letter-spacing: 0.5px;">
                        ${groupName} Stacked Area Growth
                    </h3>
                </div>
                <div style="position: relative; height: 320px; width: 100%;">
                     <canvas id="chart-canvas-${groupId}"></canvas>
                </div>
            `;

            container.appendChild(card);

            const ctx = document.getElementById(`chart-canvas-${groupId}`).getContext('2d');

            // Select color sets
            const keyLower = groupName.toLowerCase();
            const palette = PALETTES[keyLower] || DEFAULT_PALETTE;
            const borders = BORDERS[keyLower] || DEFAULT_BORDERS;

            // Assemble stacked area datasets
            const datasets = Object.entries(subKeysData).map(([subKey, values], colorIdx) => {
                const border = borders[colorIdx % borders.length];
                const bg = palette[colorIdx % palette.length];

                return {
                    label: subKey,
                    data: values,
                    borderColor: border,
                    borderWidth: 2.5,
                    backgroundColor: bg,
                    fill: 'stack', // Stacked area chart configuration
                    tension: 0.2,
                    pointBackgroundColor: border,
                    pointBorderColor: '#ffffff',
                    pointBorderWidth: 1.5,
                    pointRadius: 4,
                    pointHoverRadius: 6,
                    shadowColor: border + '80',
                    shadowBlur: 6
                };
            });

            // Initialize Chart.js stacked line area chart
            const chart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: timestamps,
                    datasets: datasets
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    interaction: {
                        mode: 'index',
                        intersect: false
                    },
                    plugins: {
                        legend: {
                            position: 'top',
                            labels: {
                                color: '#ffffff',
                                font: { family: 'Inter', weight: 'bold', size: 10 }
                            }
                        },
                        tooltip: {
                            backgroundColor: 'rgba(18, 22, 28, 0.95)',
                            titleFont: { family: 'Inter', weight: 'bold' },
                            bodyFont: { family: 'monospace' },
                            borderColor: bulletColor,
                            borderWidth: 1,
                            callbacks: {
                                label: function(context) {
                                    return ` ${context.dataset.label.padEnd(28)} : ${context.raw.toLocaleString()}`;
                                }
                             }
                        }
                    },
                    scales: {
                        x: {
                            grid: { color: 'rgba(255, 255, 255, 0.05)' },
                            ticks: { color: 'rgba(255, 255, 255, 0.7)', font: { size: 9 } }
                        },
                        y: {
                            stacked: true, // Enable Y scale area stacking
                            grid: { color: 'rgba(255, 255, 255, 0.05)' },
                            ticks: { 
                                color: 'rgba(255, 255, 255, 0.7)',
                                callback: function(value) {
                                    return value.toLocaleString();
                                }
                            }
                        }
                    }
                }
            });

            activeChartInstances.push(chart);
        });
    }
</script>
