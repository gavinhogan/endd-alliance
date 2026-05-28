---
layout: base.njk
title: "👤 Discord Profile Info"
description: "Real-time session information and metadata retrieved from your Discord login."
emoji: "👤"
tags: tutorial
backLink: true
inactive: true
---
<article class="tutorial-content">

<div style="text-align: center; border-bottom: 1px solid var(--border-color); margin-bottom: 30px; padding-bottom: 20px;">
    <h1 style="margin: 0; color: var(--text-header);">👤 DISCORD PROFILE METADATA 👤</h1>
    <p style="color: var(--text-secondary); font-family: var(--font-heading); font-size: 0.9rem; text-transform: uppercase; font-weight: bold; letter-spacing: 1px;">
        🔍 Live Session Payload & Discord OAuth2 Diagnostics 🔍</p>
</div>

<style>
.copy-raw-btn::after {
    content: 'COPY RAW DATA' !important;
}
.copy-raw-btn.is-copied::after {
    content: 'COPIED' !important;
}
</style>

<div id="session-loader" style="text-align: center; padding: 40px 0;">
    <div class="pulse-active" style="font-size: 1.2rem; font-family: var(--font-heading); color: var(--accent-primary); font-weight: bold;">
        🔄 FETCHING LIVE DISCORD INTEL...
    </div>
</div>

<div id="session-profile-card" style="display: none;">
    <!-- Profile Visual block -->
    <div class="profile-header-card" style="display: flex; gap: 25px; align-items: center; background: rgba(0, 157, 255, 0.04); border: 1px solid var(--border-color); padding: 25px; border-radius: 12px; margin-bottom: 30px;">
        <img id="user-large-avatar" src="" alt="Avatar" style="width: 100px; height: 100px; border-radius: 50%; border: 4px solid var(--accent-primary); box-shadow: var(--card-shadow); object-fit: cover;">
        <div style="flex-grow: 1; text-align: left;">
            <h2 id="user-global-name" style="margin: 0; color: var(--text-header); font-family: var(--font-heading); font-size: 1.8rem;"></h2>
            <p id="user-username-handle" style="margin: 3px 0 10px 0; color: var(--text-secondary); font-family: var(--font-heading); font-weight: bold; font-size: 1rem;"></p>
            <span id="user-id-badge" style="background: var(--bg-primary); border: 1px solid var(--border-color); color: var(--text-header); padding: 4px 12px; border-radius: 20px; font-size: 0.8rem; font-family: monospace; font-weight: bold; display: inline-block;"></span>
        </div>
    </div>

    <!-- Status list / details -->
    <span class="section-title">Session Metadata Parameters</span>
    <div class="table-container">
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 0;">
            <thead>
                <tr>
                    <th>Attribute</th>
                    <th>Resolved Live Value</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td><strong>Authentication Provider</strong></td>
                    <td style="white-space: normal;">Discord OAuth2 (Guild/Member Gated)</td>
                </tr>
                <tr>
                    <td><strong>Session Token Cookie</strong></td>
                    <td style="white-space: normal;"><span style="font-family: monospace; color: #28a745; font-weight: bold;">alliance_session (Verified JWT)</span></td>
                </tr>
                <tr>
                    <td><strong>Token Expiry Time</strong></td>
                    <td id="session-expiry-val" style="font-family: monospace; white-space: normal;"></td>
                </tr>
                <tr>
                    <td><strong>Target Server (Guild ID)</strong></td>
                    <td style="font-family: monospace; white-space: normal;">1075074106980061184 (ENDD Alliance)</td>
                </tr>
                <tr>
                    <td><strong>User Roles Array Count</strong></td>
                    <td id="session-roles-count" style="white-space: normal;"></td>
                </tr>
            </tbody>
        </table>
    </div>

    <!-- Roles -->
    <span class="section-title">Discord Server Roles</span>
    <div id="roles-list-container" style="display: flex; flex-wrap: wrap; gap: 10px; margin: 20px 0 35px 0;">
        <!-- Filled by JS -->
    </div>

    <!-- Raw Data -->
    <span class="section-title">Raw JSON Session Payload</span>
    <div style="position: relative; margin-top: 20px;">
        <button class="share-intel copy-raw-btn" onclick="copyRawJson()" style="position: absolute; right: 15px; top: 15px; z-index: 10; font-size: 0.65rem;"></button>
        <pre id="raw-json-block" style="background: #1e293b; color: #f8fafc; padding: 25px; border-radius: 8px; font-family: 'Courier New', Courier, monospace; font-size: 0.85rem; overflow-x: auto; max-height: 450px; border: 1px solid #334155; margin-bottom: 0; box-shadow: inset 0 2px 8px rgba(0,0,0,0.5); text-align: left; line-height: 1.5;"></pre>
    </div>
</div>

</article>

<script>
    async function loadDiscordProfile() {
        try {
            const response = await fetch('/api/auth/session');
            const data = await response.json();
            
            if (!data.authenticated || !data.user) {
                document.getElementById('session-loader').innerHTML = `
                    <div style="padding: 30px; border: 1px solid #c53030; background: rgba(197, 48, 48, 0.04); border-radius: 12px; text-align: center; margin: 20px 0;">
                        <h3 style="color: #c53030; font-family: var(--font-heading); margin: 0 0 10px 0; font-size: 1.3rem;">⚠️ Unauthenticated Session</h3>
                        <p style="font-size: 0.95rem; margin-bottom: 20px; color: var(--text-secondary);">Your session is missing or has expired. Please authenticate to view your profile details.</p>
                        <a href="/login/" class="hud-btn login-btn" style="background: var(--accent-primary); border-color: var(--accent-primary); color: #ffffff; padding: 8px 16px;">🔒 LOGIN WITH DISCORD</a>
                    </div>
                `;
                return;
            }

            const user = data.user;
            const roles = data.roles || [];
            
            // Set large avatar
            let avatarUrl;
            if (user.avatar) {
                avatarUrl = `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=256`;
            } else {
                const defaultIdx = Number(BigInt(user.id) >> 22n) % 6;
                avatarUrl = `https://cdn.discordapp.com/embed/avatars/${defaultIdx}.png`;
            }
            document.getElementById('user-large-avatar').src = avatarUrl;
            
            // Set basic info
            document.getElementById('user-global-name').textContent = user.globalName || user.username;
            document.getElementById('user-username-handle').textContent = '@' + user.username;
            document.getElementById('user-id-badge').textContent = 'USER ID: ' + user.id;
            
            // Expiry
            if (data.expiresAt) {
                const expiryDate = new Date(data.expiresAt);
                document.getElementById('session-expiry-val').textContent = expiryDate.toLocaleString() + ' (' + expiryDate.toUTCString() + ')';
            } else {
                document.getElementById('session-expiry-val').textContent = 'N/A';
            }

            // Roles count
            document.getElementById('session-roles-count').textContent = roles.length + ' role(s)';

            // Render roles list
            const rolesContainer = document.getElementById('roles-list-container');
            rolesContainer.innerHTML = '';
            
            if (roles.length === 0) {
                rolesContainer.innerHTML = '<span style="color: var(--text-secondary); font-style: italic;">No roles detected on this server.</span>';
            } else {
                const LEADERSHIP_ROLE_ID = "1075074106980061184";
                roles.forEach(roleId => {
                    const badge = document.createElement('span');
                    badge.style.fontFamily = 'var(--font-heading)';
                    badge.style.fontSize = '0.75rem';
                    badge.style.fontWeight = '800';
                    badge.style.padding = '6px 12px';
                    badge.style.borderRadius = '6px';
                    badge.style.border = '1px solid';
                    badge.style.letterSpacing = '0.5px';
                    
                    if (roleId === LEADERSHIP_ROLE_ID) {
                        badge.textContent = '🛡️ R4 / LEADERSHIP (' + roleId + ')';
                        badge.style.background = 'rgba(247, 181, 0, 0.1)';
                        badge.style.color = '#b27a00';
                        badge.style.borderColor = 'rgba(247, 181, 0, 0.35)';
                    } else {
                        badge.textContent = '⚔️ ROLE: ' + roleId;
                        badge.style.background = 'rgba(0, 157, 255, 0.08)';
                        badge.style.color = 'var(--accent-primary)';
                        badge.style.borderColor = 'rgba(0, 157, 255, 0.25)';
                    }
                    rolesContainer.appendChild(badge);
                });
            }

            // Render raw JSON
            const rawJsonBlock = document.getElementById('raw-json-block');
            rawJsonBlock.textContent = JSON.stringify(data, null, 2);

            // Show profile & hide loader
            document.getElementById('session-loader').style.display = 'none';
            document.getElementById('session-profile-card').style.display = 'block';

        } catch (error) {
            console.error('Error fetching session data:', error);
            document.getElementById('session-loader').innerHTML = `
                <div style="padding: 20px; border: 1px solid #c53030; background: rgba(197, 48, 48, 0.05); border-radius: 8px; color: #c53030;">
                    <strong>Failed to load profile intelligence:</strong> ${error.message}
                </div>
            `;
        }
    }

    function copyRawJson() {
        const text = document.getElementById('raw-json-block').textContent;
        navigator.clipboard.writeText(text);
        const btn = document.querySelector('.copy-raw-btn');
        btn.classList.add('is-copied');
        setTimeout(() => btn.classList.remove('is-copied'), 2000);
    }

    // Run on load
    document.addEventListener('DOMContentLoaded', loadDiscordProfile);
</script>
