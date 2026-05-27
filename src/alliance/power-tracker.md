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

<div id="tracker-active-dashboard" style="display: none;">
    <!-- Profile Visual Block -->
    <div class="profile-header-card" style="display: flex; gap: 20px; align-items: center; background: rgba(0, 157, 255, 0.04); border: 1px solid var(--border-color); padding: 20px; border-radius: 12px; margin-bottom: 30px;">
        <img id="user-hud-avatar" src="" alt="Avatar" style="width: 50px; height: 50px; border-radius: 50%; border: 2px solid var(--accent-primary); object-fit: cover;">
        <div style="text-align: left;">
            <span style="font-size: 0.8rem; color: var(--text-secondary); font-family: var(--font-heading); font-weight: bold;">ALLIANCE COMMANDER</span>
            <h3 id="user-hud-username" style="margin: 0; color: var(--text-header); font-family: var(--font-heading); font-size: 1.3rem;"></h3>
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
            Resizing image to 400px via canvas to optimize transfer speed...
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
        <span class="section-title">2. Tactical Time-Series Analytics</span>
        <p style="font-size: 0.95rem; color: var(--text-secondary); margin-bottom: 20px;">
            Select a tracked stat below to render your historical growth trend in real-time.
        </p>

        <!-- Dynamic dropdown selector for graph keys -->
        <div style="display: flex; gap: 15px; align-items: center; margin-bottom: 20px;">
            <label for="stat-select" style="font-family: var(--font-heading); font-weight: bold; color: var(--text-header); font-size: 0.9rem;">SELECT METRIC:</label>
            <select id="stat-select" class="share-intel" style="padding: 8px 16px; background: var(--bg-primary); border: 1px solid var(--border-color); color: var(--text-header); font-family: var(--font-heading); font-weight: 800; border-radius: 6px; font-size: 0.9rem; cursor: pointer; outline: none;">
                <!-- Populated dynamically -->
            </select>
        </div>

        <!-- Glowing Neon Chart.js Canvas -->
        <div style="background: rgba(18, 22, 28, 0.4); border: 1px solid var(--border-color); border-radius: 12px; padding: 20px; box-shadow: var(--card-shadow);">
            <canvas id="timeSeriesChart" style="width: 100%; height: 320px;"></canvas>
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

        // Check authentication session
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

    // Client-side canvas optimization resizer
    function processAndUpload(file) {
        const dropzone = document.getElementById('screenshot-dropzone');
        const loader = document.getElementById('scanning-loader');
        const statusText = document.getElementById('scanning-status-text');
        const resultsPanel = document.getElementById('scan-results-panel');

        dropzone.style.display = 'none';
        resultsPanel.style.display = 'none';
        loader.style.display = 'block';
        statusText.textContent = "Canvas loading image context...";

        const img = new Image();
        img.onload = () => {
            statusText.textContent = "Optimizing dimension bounds to max 400px...";
            const canvas = document.createElement('canvas');
            const max_size = 400;
            let width = img.width;
            let height = img.height;

            if (width > height) {
                if (width > max_size) {
                    height *= max_size / width;
                    width = max_size;
                }
            } else {
                if (height > max_size) {
                    width *= max_size / height;
                    height = max_size;
                }
            }

            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);

            statusText.textContent = "Downsampling byte compression array (PNG)...";
            canvas.toBlob(async (blob) => {
                statusText.textContent = "Deploying bytes to Cloudflare LLM Vision OCR...";
                try {
                    const response = await fetch('/api/power/upload', {
                        method: 'POST',
                        body: blob
                    });
                    const resData = await response.json();

                    if (!response.ok || resData.error) {
                        throw new Error(resData.error || "Failed to scan image.");
                    }

                    // Display results
                    displayResults(resData.data);
                    
                    // Reload time-series graph
                    await loadHistory();

                } catch (err) {
                    alert(`❌ OCR Scan Failed: ${err.message}`);
                } finally {
                    loader.style.display = 'none';
                    dropzone.style.display = 'block';
                }
            }, 'image/png');
        };

        img.onerror = () => {
            alert("❌ Failed to read image file context.");
            loader.style.display = 'none';
            dropzone.style.display = 'block';
        };

        img.src = URL.createObjectURL(file);
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

    // Load D1 history
    async function loadHistory() {
        try {
            const response = await fetch('/api/power/history');
            const data = await response.json();

            if (data.success && data.history && data.history.length > 0) {
                rawHistoryData = data.history;
                
                // Show analytics division
                document.getElementById('analytics-section').style.display = 'block';
                
                // Build dynamic dropdown select metrics
                populateDropdown();
                
                // Initial Chart render
                renderChart();
            }
        } catch (err) {
            console.error('Failed to load history metrics:', err);
        }
    }

    // Extract dynamic keys across all historical entries
    function populateDropdown() {
        const selector = document.getElementById('stat-select');
        const previousSelection = selector.value;
        selector.innerHTML = '';

        const discoveredKeys = new Set();
        rawHistoryData.forEach(entry => {
            if (entry.data) {
                Object.keys(entry.data).forEach(k => {
                    if (typeof entry.data[k] === 'number') {
                        discoveredKeys.add(k);
                    }
                });
            }
        });

        if (discoveredKeys.size === 0) {
            document.getElementById('analytics-section').style.display = 'none';
            return;
        }

        const sortedKeys = Array.from(discoveredKeys).sort();
        sortedKeys.forEach(k => {
            const opt = document.createElement('option');
            opt.value = k;
            opt.textContent = k.toUpperCase();
            selector.appendChild(opt);
        });

        // Set previous or smart default ("Hero Power" or first)
        if (previousSelection && discoveredKeys.has(previousSelection)) {
            selector.value = previousSelection;
        } else if (discoveredKeys.has("Hero Power")) {
            selector.value = "Hero Power";
        } else if (discoveredKeys.has("Hero Skill")) {
            selector.value = "Hero Skill";
        } else {
            selector.value = sortedKeys[0];
        }

        // Add event listener to redraw on selection changes
        selector.onchange = () => renderChart();
    }

    // Draw glowing neon line chart using Chart.js
    function renderChart() {
        const selector = document.getElementById('stat-select');
        const selectedMetric = selector.value;
        if (!selectedMetric) return;

        const ctx = document.getElementById('timeSeriesChart').getContext('2d');
        
        // Extract chronological labels & values
        const chartLabels = [];
        const chartValues = [];

        rawHistoryData.forEach(entry => {
            if (entry.data && entry.data[selectedMetric] !== undefined) {
                const date = new Date(entry.timestamp);
                chartLabels.push(date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
                chartValues.push(entry.data[selectedMetric]);
            }
        });

        // Destroy old Chart instance if exists to avoid hover overlaps
        if (chartInstance) {
            chartInstance.destroy();
        }

        // Render Chart.js line graph
        chartInstance = new Chart(ctx, {
            type: 'line',
            data: {
                labels: chartLabels,
                datasets: [{
                    label: selectedMetric.toUpperCase() + ' TREND',
                    data: chartValues,
                    borderColor: '#009dff',
                    borderWidth: 3,
                    backgroundColor: 'rgba(0, 157, 255, 0.05)',
                    fill: true,
                    tension: 0.3,
                    pointBackgroundColor: '#009dff',
                    pointBorderColor: '#ffffff',
                    pointBorderWidth: 2,
                    pointRadius: 5,
                    pointHoverRadius: 7,
                    shadowColor: 'rgba(0, 157, 255, 0.5)',
                    shadowBlur: 10
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        labels: {
                            color: '#ffffff',
                            font: { family: 'Inter', weight: 'bold' }
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return context.raw.toLocaleString();
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
    }
</script>
