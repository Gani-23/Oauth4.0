const express = require('express');

const router = express.Router();

router.get('/3vc17cs006', (_req, res) => {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(`<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>OAuth 4.0 & AgentBuddy Admin Console</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    input, select, textarea { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; }
  </style>
</head>
<body class="min-h-screen bg-slate-950 text-slate-100 antialiased selection:bg-cyan-500 selection:text-slate-950">
  <div class="max-w-7xl mx-auto px-4 py-8">
    <!-- Top Header -->
    <header class="flex flex-wrap items-center justify-between gap-4 mb-6 pb-6 border-b border-slate-800">
      <div>
        <div class="flex items-center gap-2">
          <span class="inline-block w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
          <p class="text-xs font-semibold tracking-widest uppercase text-cyan-400">OAuth 4.0 Platform</p>
        </div>
        <h1 class="text-3xl font-extrabold tracking-tight mt-1">Admin Console</h1>
        <p class="text-slate-400 text-sm mt-1">Secret Route: <code class="bg-slate-900 text-cyan-300 px-1.5 py-0.5 rounded border border-slate-800">/3vc17cs006</code></p>
      </div>
      <div class="flex items-center gap-2">
        <button id="refreshBtn" class="bg-cyan-500 hover:bg-cyan-400 text-slate-950 px-4 py-2 rounded-lg font-semibold text-sm transition-colors shadow-sm">Refresh Dashboard</button>
        <button id="disconnectBtn" class="bg-slate-800 hover:bg-rose-900/50 text-slate-300 hover:text-rose-300 px-3 py-2 rounded-lg font-medium text-sm transition-colors border border-slate-700">Clear Session</button>
      </div>
    </header>

    <!-- Authentication & Token Card -->
    <section class="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 mb-6 shadow-xl backdrop-blur">
      <div class="flex items-center justify-between gap-4 mb-4">
        <div class="flex items-center gap-3">
          <h2 class="font-bold text-base text-slate-200">Admin Authentication</h2>
          <span id="connBadge" class="text-xs px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-800 font-medium">Disconnected</span>
        </div>
        <div class="flex gap-2">
          <button id="tabLoginBtn" type="button" class="text-xs px-3 py-1.5 rounded-lg bg-cyan-600 text-white font-semibold">1-Click Sign-In</button>
          <button id="tabTokenBtn" type="button" class="text-xs px-3 py-1.5 rounded-lg bg-slate-800 text-slate-400 font-medium">Bearer Token</button>
        </div>
      </div>

      <!-- Quick Login Panel -->
      <div id="quickLoginPanel" class="grid grid-cols-1 md:grid-cols-3 gap-3">
        <input id="loginEmail" type="text" placeholder="Admin Email / Username" class="bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm outline-none focus:border-cyan-400 transition-colors" />
        <input id="loginPassword" type="password" placeholder="Password" class="bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm outline-none focus:border-cyan-400 transition-colors" />
        <button id="quickSignInBtn" type="button" class="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold py-2 px-4 rounded-lg text-sm transition-colors shadow">Sign In & Connect</button>
      </div>

      <!-- Raw Token Panel (Hidden by default) -->
      <div id="rawTokenPanel" class="hidden space-y-3">
        <div class="flex flex-col md:flex-row gap-3">
          <input id="tokenInput" type="password" placeholder="Paste Bearer Token or Personal Admin Token (PAT)" class="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm outline-none focus:border-cyan-400 transition-colors" />
          <button id="connectBtn" type="button" class="bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-5 py-2 rounded-lg font-bold text-sm transition-colors">Connect Token</button>
        </div>
      </div>

      <!-- Advanced / Break-Glass Options -->
      <details class="mt-3 text-xs text-slate-400">
        <summary class="cursor-pointer hover:text-slate-300 select-none py-1">Advanced Options (Break-glass & Token Rotation)</summary>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-3 mt-2 pt-2 border-t border-slate-800">
          <input id="breakGlassInput" type="password" placeholder="Optional break-glass token" class="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 outline-none focus:border-cyan-400 text-xs" />
          <input id="testRunIdInput" type="text" placeholder="Optional test run id" class="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 outline-none focus:border-cyan-400 text-xs" />
          <button id="rotatePatBtn" type="button" class="bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-1.5 px-3 rounded-lg text-xs transition-colors">Rotate Persistent Admin Token</button>
        </div>
      </details>

      <p id="statusText" class="text-xs text-slate-400 mt-2 font-mono">Not connected. Sign in above or paste an admin token.</p>
    </section>

    <!-- Metrics Stats Counters -->
    <section class="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
      <article class="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5">
        <p class="text-xs text-slate-400 font-medium">Total Users</p>
        <p id="totalUsers" class="text-2xl font-bold mt-1 text-slate-100">-</p>
      </article>
      <article class="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5">
        <p class="text-xs text-slate-400 font-medium">Admin Accounts</p>
        <p id="adminUsers" class="text-2xl font-bold mt-1 text-violet-400">-</p>
      </article>
      <article class="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5">
        <p class="text-xs text-slate-400 font-medium">Total Apps</p>
        <p id="totalApps" class="text-2xl font-bold mt-1 text-cyan-400">-</p>
      </article>
      <article class="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5">
        <p class="text-xs text-slate-400 font-medium">Active Apps</p>
        <p id="activeApps" class="text-2xl font-bold mt-1 text-emerald-400">-</p>
      </article>
      <article class="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5 col-span-2 md:col-span-1">
        <p class="text-xs text-slate-400 font-medium">Inactive Apps</p>
        <p id="inactiveApps" class="text-2xl font-bold mt-1 text-slate-500">-</p>
      </article>
    </section>

    <!-- MAIN TWO-COLUMN WORKSPACE -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
      
      <!-- LEFT COLUMN: LICENSE GENERATOR & CREATE APP (7 cols) -->
      <div class="lg:col-span-7 space-y-6">

        <!-- 🔑 LICENSE GENERATOR TOOL -->
        <section class="bg-gradient-to-b from-slate-900 to-slate-900/80 border-2 border-cyan-500/40 rounded-2xl p-5 shadow-2xl">
          <div class="flex items-center justify-between mb-4">
            <div class="flex items-center gap-2">
              <span class="text-xl">🔑</span>
              <div>
                <h2 class="font-bold text-lg text-cyan-300">Generate App License</h2>
                <p class="text-xs text-slate-400">Mint signed JWT licenses with custom expiration for AgentBuddy or any app</p>
              </div>
            </div>
            <span class="text-xs bg-cyan-950 text-cyan-400 px-2 py-1 rounded border border-cyan-800 font-mono">JWT v4</span>
          </div>

          <div class="space-y-4">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-semibold text-slate-300 mb-1">Target User</label>
                <select id="genLicenseUserSelect" class="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm outline-none focus:border-cyan-400">
                  <option value="">-- Select Loaded User --</option>
                </select>
                <input id="genLicenseUserCustom" type="text" placeholder="or type custom username" class="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs outline-none focus:border-cyan-400 mt-1.5" />
              </div>

              <div>
                <label class="block text-xs font-semibold text-slate-300 mb-1">Target App</label>
                <select id="genLicenseAppSelect" class="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm outline-none focus:border-cyan-400">
                  <option value="agentbuddy">agentbuddy (AgentBuddy)</option>
                  <option value="*">* (All Active Apps)</option>
                </select>
                <input id="genLicenseAppCustom" type="text" placeholder="or type custom appId" class="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs outline-none focus:border-cyan-400 mt-1.5" />
              </div>
            </div>

            <!-- Duration Selector -->
            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-1">License Duration (Days)</label>
              <div class="flex flex-wrap gap-2 mb-2">
                <button type="button" class="license-preset-btn px-2.5 py-1 text-xs rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium" data-days="30">30 Days</button>
                <button type="button" class="license-preset-btn px-2.5 py-1 text-xs rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium" data-days="90">90 Days</button>
                <button type="button" class="license-preset-btn px-2.5 py-1 text-xs rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium" data-days="365">1 Year (365d)</button>
                <button type="button" class="license-preset-btn px-2.5 py-1 text-xs rounded-md bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-bold" data-days="lifetime">✨ Lifetime (Year 2099)</button>
              </div>
              <div class="flex items-center gap-2">
                <input id="genLicenseDays" type="text" value="lifetime" placeholder="e.g. 30, 90, 365, or lifetime" class="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm outline-none focus:border-cyan-400" />
                <span class="text-xs text-slate-400">days</span>
              </div>
            </div>

            <button id="generateLicenseBtn" type="button" class="w-full bg-gradient-to-r from-cyan-500 via-teal-400 to-emerald-400 hover:from-cyan-400 hover:to-emerald-300 text-slate-950 font-extrabold py-2.5 px-4 rounded-xl text-sm transition-all shadow-lg hover:shadow-cyan-500/20">
              Generate License Token
            </button>

            <!-- Output Box -->
            <div id="licenseResultBox" class="hidden pt-3 border-t border-slate-800 space-y-2">
              <div class="flex items-center justify-between text-xs">
                <span id="licenseExpiryBadge" class="text-emerald-400 font-semibold">Valid until: 2099-12-31</span>
                <button id="copyLicenseBtn" type="button" class="bg-slate-800 hover:bg-cyan-600 hover:text-white text-slate-300 px-3 py-1 rounded font-semibold transition-colors">Copy License Token</button>
              </div>
              <textarea id="licenseOutputToken" readonly rows="4" class="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-cyan-300 font-mono select-all focus:outline-none focus:border-cyan-500"></textarea>
              <p class="text-xs text-slate-500">Paste directly into AgentBuddy or use via <code class="text-slate-400">Authorization: Bearer &lt;token&gt;</code>.</p>
            </div>
          </div>
        </section>

        <!-- 🚀 CREATE APP WITH PRESETS -->
        <section class="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <div class="flex items-center justify-between mb-3">
            <h2 class="font-bold text-base text-slate-200">Register New App</h2>
            <div class="flex gap-1.5">
              <button type="button" id="presetAgentBuddyBtn" class="text-xs bg-slate-800 hover:bg-slate-700 text-cyan-300 px-2 py-1 rounded">Preset: AgentBuddy</button>
              <button type="button" id="presetClearBtn" class="text-xs bg-slate-800 hover:bg-slate-700 text-slate-400 px-2 py-1 rounded">Clear</button>
            </div>
          </div>
          <div class="space-y-3">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input id="createAppId" type="text" placeholder="appId (e.g. agentbuddy)" class="bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm outline-none focus:border-cyan-400" />
              <input id="createAppName" type="text" placeholder="Display Name (e.g. AgentBuddy)" class="bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm outline-none focus:border-cyan-400" />
            </div>
            <input id="createAppUrl" type="text" placeholder="Application URL (e.g. https://app.example.com)" class="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm outline-none focus:border-cyan-400" />
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <input id="createAppDescription" type="text" placeholder="Description (optional)" class="sm:col-span-2 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm outline-none focus:border-cyan-400" />
              <select id="createAppStatus" class="bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm outline-none focus:border-cyan-400">
                <option value="active">Status: active</option>
                <option value="inactive">Status: inactive</option>
              </select>
            </div>
            <button id="createAppBtn" type="button" class="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold py-2.5 px-4 rounded-xl text-sm transition-colors shadow">
              Register App
            </button>
          </div>
        </section>

        <!-- 👥 USERS DIRECTORY TABLE -->
        <section class="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <div class="flex items-center justify-between mb-3">
            <h2 class="font-bold text-base text-slate-200">Users Directory</h2>
            <span id="usersCountBadge" class="text-xs text-slate-400 font-mono">0 users</span>
          </div>
          <div class="overflow-auto max-h-80 border border-slate-800 rounded-xl">
            <table class="w-full text-xs">
              <thead class="bg-slate-950 text-slate-400 sticky top-0 border-b border-slate-800">
                <tr>
                  <th class="text-left p-2.5">Username</th>
                  <th class="text-left p-2.5">Email</th>
                  <th class="text-left p-2.5">Role</th>
                  <th class="text-left p-2.5">Apps</th>
                  <th class="text-right p-2.5">Action</th>
                </tr>
              </thead>
              <tbody id="usersTable" class="divide-y divide-slate-800/60 font-mono"></tbody>
            </table>
          </div>
        </section>
      </div>

      <!-- RIGHT COLUMN: APPS LIST & ACCESS MANAGEMENT (5 cols) -->
      <div class="lg:col-span-5 space-y-6">

        <!-- 📱 REGISTERED APPS LIST -->
        <section class="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <div class="flex items-center justify-between mb-3">
            <h2 class="font-bold text-base text-slate-200">Registered Applications</h2>
            <span id="appsCountBadge" class="text-xs text-slate-400 font-mono">0 apps</span>
          </div>
          <ul id="appsList" class="space-y-2.5 max-h-96 overflow-auto pr-1"></ul>
        </section>

        <!-- 🛡️ USER APP ACCESS EDITOR -->
        <section class="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <h2 class="font-bold text-base text-slate-200 mb-1">Manage User App Permissions</h2>
          <p id="manageHint" class="text-xs text-slate-400 mb-3">Select a user to grant or revoke specific app permissions.</p>
          <div class="flex gap-2 mb-3">
            <input id="manageUsername" type="text" placeholder="username" class="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm outline-none focus:border-cyan-400" />
            <button id="loadUserAppsBtn" type="button" class="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold px-4 py-2 rounded-lg text-sm">Load</button>
          </div>
          <div id="userAppsEditor" class="max-h-48 overflow-auto border border-slate-800 rounded-xl p-3 space-y-2 bg-slate-950">
            <p class="text-xs text-slate-500">No user selected. Click "Manage" next to any user above.</p>
          </div>
          <button id="saveUserAppsBtn" type="button" class="w-full mt-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-2 px-4 rounded-xl text-sm transition-colors shadow">
            Save App Permissions
          </button>
        </section>

        <!-- 👑 ROLE MANAGEMENT -->
        <section class="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <h2 class="font-bold text-base text-slate-200 mb-2">Change User Role</h2>
          <div class="space-y-3">
            <div class="flex gap-2">
              <input id="roleUsername" type="text" placeholder="Target username" class="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm outline-none focus:border-cyan-400" />
              <select id="roleValue" class="bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm outline-none focus:border-cyan-400">
                <option value="user">user</option>
                <option value="admin">admin</option>
              </select>
            </div>
            <button id="roleBtn" type="button" class="w-full bg-violet-600 hover:bg-violet-500 text-white font-bold py-2 px-4 rounded-xl text-sm transition-colors">
              Update Role
            </button>
          </div>
        </section>

      </div>
    </div>
  </div>

  <script>
    const STORAGE_KEY = 'oauth_admin_token';
    const tokenInput = document.getElementById('tokenInput');
    const loginEmail = document.getElementById('loginEmail');
    const loginPassword = document.getElementById('loginPassword');
    const breakGlassInput = document.getElementById('breakGlassInput');
    const testRunIdInput = document.getElementById('testRunIdInput');
    const statusText = document.getElementById('statusText');
    const connBadge = document.getElementById('connBadge');

    const quickLoginPanel = document.getElementById('quickLoginPanel');
    const rawTokenPanel = document.getElementById('rawTokenPanel');
    const tabLoginBtn = document.getElementById('tabLoginBtn');
    const tabTokenBtn = document.getElementById('tabTokenBtn');

    const totalUsers = document.getElementById('totalUsers');
    const adminUsers = document.getElementById('adminUsers');
    const totalApps = document.getElementById('totalApps');
    const activeApps = document.getElementById('activeApps');
    const inactiveApps = document.getElementById('inactiveApps');
    const usersCountBadge = document.getElementById('usersCountBadge');
    const appsCountBadge = document.getElementById('appsCountBadge');

    const usersTable = document.getElementById('usersTable');
    const appsList = document.getElementById('appsList');
    const userAppsEditor = document.getElementById('userAppsEditor');
    const manageHint = document.getElementById('manageHint');
    const manageUsernameInput = document.getElementById('manageUsername');

    const genLicenseUserSelect = document.getElementById('genLicenseUserSelect');
    const genLicenseUserCustom = document.getElementById('genLicenseUserCustom');
    const genLicenseAppSelect = document.getElementById('genLicenseAppSelect');
    const genLicenseAppCustom = document.getElementById('genLicenseAppCustom');
    const genLicenseDays = document.getElementById('genLicenseDays');
    const generateLicenseBtn = document.getElementById('generateLicenseBtn');
    const licenseResultBox = document.getElementById('licenseResultBox');
    const licenseOutputToken = document.getElementById('licenseOutputToken');
    const licenseExpiryBadge = document.getElementById('licenseExpiryBadge');
    const copyLicenseBtn = document.getElementById('copyLicenseBtn');

    const state = {
      apps: [],
      users: [],
      selectedUsername: '',
      selectedUserApps: [],
    };

    function escapeHtml(value) {
      return String(value || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    }

    function setAuthBadge(connected) {
      if (connected) {
        connBadge.className = 'text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-800 font-medium';
        connBadge.textContent = 'Connected';
      } else {
        connBadge.className = 'text-xs px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-800 font-medium';
        connBadge.textContent = 'Disconnected';
      }
    }

    function getHeaders() {
      const bearer = tokenInput.value.trim();
      const result = { 'Content-Type': 'application/json' };
      if (bearer) {
        result.Authorization = 'Bearer ' + bearer;
      }
      if (breakGlassInput.value.trim()) {
        result['X-Break-Glass-Token'] = breakGlassInput.value.trim();
      }
      if (testRunIdInput.value.trim()) {
        result['X-Test-Run-Id'] = testRunIdInput.value.trim();
      }
      return result;
    }

    async function api(url, options) {
      const response = await fetch(url, {
        ...(options || {}),
        headers: {
          ...getHeaders(),
          ...((options && options.headers) || {}),
        },
      });

      const payload = await response.json().catch(function () { return {}; });
      if (!response.ok) {
        throw new Error(payload.message || ('Request failed: ' + response.status));
      }
      return payload;
    }

    async function loadDashboard() {
      const token = tokenInput.value.trim();
      if (!token) {
        statusText.textContent = 'Please sign in or enter a bearer token.';
        setAuthBadge(false);
        return;
      }

      statusText.textContent = 'Loading dashboard...';
      try {
        const [summary, users, apps] = await Promise.all([
          api('/api/users/admin/summary'),
          api('/api/users/admin/users?limit=300'),
          api('/api/users/apps'),
        ]);

        totalUsers.textContent = summary.totalUsers || 0;
        adminUsers.textContent = summary.adminUsers || 0;
        totalApps.textContent = summary.totalApps || 0;
        activeApps.textContent = summary.activeApps || 0;
        inactiveApps.textContent = summary.inactiveApps || 0;

        state.users = users.users || [];
        state.apps = apps.apps || [];

        usersCountBadge.textContent = state.users.length + ' users';
        appsCountBadge.textContent = state.apps.length + ' apps';

        renderUsers();
        renderApps();
        populateLicenseSelectors();
        renderUserAppsEditor();

        setAuthBadge(true);
        statusText.textContent = 'Connected as admin. All services operational.';
        localStorage.setItem(STORAGE_KEY, token);
      } catch (error) {
        setAuthBadge(false);
        statusText.textContent = 'Connection error: ' + error.message;
      }
    }

    // 1-Click Admin Sign-In
    document.getElementById('quickSignInBtn').addEventListener('click', async function () {
      const identifier = loginEmail.value.trim();
      const password = loginPassword.value.trim();
      if (!identifier || !password) {
        statusText.textContent = 'Email/username and password are required.';
        return;
      }

      statusText.textContent = 'Authenticating...';
      try {
        const payload = await fetch('/api/users/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: identifier, password: password, appId: 'admin-console' }),
        });

        const data = await payload.json().catch(function () { return {}; });
        if (!payload.ok || !data.accessToken) {
          throw new Error(data.message || 'Login failed.');
        }

        tokenInput.value = data.accessToken;
        localStorage.setItem(STORAGE_KEY, data.accessToken);
        loginPassword.value = '';
        await loadDashboard();
      } catch (err) {
        statusText.textContent = 'Sign-in error: ' + err.message;
      }
    });

    // Rotate PAT
    document.getElementById('rotatePatBtn').addEventListener('click', async function () {
      if (!confirm('Issue a new persistent admin token and revoke existing ones?')) return;
      try {
        const res = await api('/api/users/admin/personal-token/rotate', {
          method: 'POST',
          body: JSON.stringify({ label: 'admin-console-pat' }),
        });
        if (res.adminToken) {
          tokenInput.value = res.adminToken;
          localStorage.setItem(STORAGE_KEY, res.adminToken);
          alert('New Persistent Admin Token issued and saved!\\nToken: ' + res.adminToken);
          await loadDashboard();
        }
      } catch (err) {
        alert('Rotation error: ' + err.message);
      }
    });

    function renderUsers() {
      usersTable.innerHTML = state.users.map(function (u) {
        const rolePill = u.role === 'admin'
          ? 'bg-violet-500/20 text-violet-300 border border-violet-800'
          : 'bg-slate-800 text-slate-300';
        return (
          '<tr class="hover:bg-slate-900/60 transition-colors">' +
            '<td class="p-2.5 font-semibold text-slate-200">' + escapeHtml(u.username) + '</td>' +
            '<td class="p-2.5 text-slate-400 font-sans">' + escapeHtml(u.email) + '</td>' +
            '<td class="p-2.5"><span class="px-2 py-0.5 rounded text-[11px] ' + rolePill + '">' + escapeHtml(u.role) + '</span></td>' +
            '<td class="p-2.5 text-cyan-300 text-[11px]">' + escapeHtml((u.projects || []).join(', ') || '-') + '</td>' +
            '<td class="p-2.5 text-right">' +
              '<button class="px-2.5 py-1 rounded bg-slate-800 hover:bg-cyan-600 hover:text-white text-slate-300 text-xs font-semibold transition-colors" data-action="manage-user" data-username="' + escapeHtml(u.username) + '">Manage</button>' +
            '</td>' +
          '</tr>'
        );
      }).join('');
    }

    function renderApps() {
      appsList.innerHTML = state.apps.map(function (app) {
        const nextStatus = app.status === 'active' ? 'inactive' : 'active';
        const pill = app.status === 'active'
          ? 'text-emerald-300 bg-emerald-950/60 border-emerald-800'
          : 'text-rose-300 bg-rose-950/60 border-rose-800';
        const buttonClass = app.status === 'active'
          ? 'bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-800'
          : 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-800';

        return (
          '<li class="p-3.5 rounded-xl border border-slate-800 bg-slate-950 hover:border-slate-700 transition-colors">' +
            '<div class="flex items-start justify-between gap-3">' +
              '<div>' +
                '<p class="font-bold text-sm text-slate-200 font-mono">' + escapeHtml(app.appId) + '</p>' +
                '<p class="text-slate-400 text-xs mt-0.5">' + escapeHtml(app.name) + '</p>' +
                (app.appUrl ? '<a href="' + escapeHtml(app.appUrl) + '" target="_blank" class="text-cyan-400 hover:underline text-[11px] mt-1 block truncate max-w-xs">' + escapeHtml(app.appUrl) + '</a>' : '') +
              '</div>' +
              '<div class="text-right shrink-0">' +
                '<span class="inline-block px-2 py-0.5 border rounded text-[11px] font-semibold uppercase ' + pill + '">' + escapeHtml(app.status) + '</span>' +
                '<div class="mt-2">' +
                  '<button class="px-2.5 py-1 rounded text-xs font-semibold transition-colors ' + buttonClass + '" data-action="toggle-app" data-app-id="' + escapeHtml(app.appId) + '" data-next-status="' + nextStatus + '">Set ' + nextStatus + '</button>' +
                '</div>' +
              '</div>' +
            '</div>' +
          '</li>'
        );
      }).join('');
    }

    function populateLicenseSelectors() {
      const curUser = genLicenseUserSelect.value;
      genLicenseUserSelect.innerHTML = '<option value="">-- Choose User --</option>' +
        state.users.map(function (u) {
          return '<option value="' + escapeHtml(u.username) + '">' + escapeHtml(u.username) + ' (' + escapeHtml(u.email) + ')</option>';
        }).join('');
      if (curUser) genLicenseUserSelect.value = curUser;

      const curApp = genLicenseAppSelect.value;
      genLicenseAppSelect.innerHTML = '<option value="agentbuddy">agentbuddy (AgentBuddy)</option>' +
        '<option value="*">* (All Apps)</option>' +
        state.apps.map(function (a) {
          return '<option value="' + escapeHtml(a.appId) + '">' + escapeHtml(a.appId) + ' (' + escapeHtml(a.name) + ')</option>';
        }).join('');
      if (curApp) genLicenseAppSelect.value = curApp;
    }

    // License Generator Logic
    document.querySelectorAll('.license-preset-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        genLicenseDays.value = this.getAttribute('data-days');
      });
    });

    generateLicenseBtn.addEventListener('click', async function () {
      const username = genLicenseUserCustom.value.trim() || genLicenseUserSelect.value;
      const appId = genLicenseAppCustom.value.trim() || genLicenseAppSelect.value;
      const days = genLicenseDays.value.trim();

      if (!username || !appId) {
        alert('Please select or enter both a Target User and Target App.');
        return;
      }

      generateLicenseBtn.disabled = true;
      generateLicenseBtn.textContent = 'Generating...';

      try {
        const result = await api('/api/users/admin/licenses/generate', {
          method: 'POST',
          body: JSON.stringify({ username: username, appId: appId, days: days }),
        });

        licenseOutputToken.value = result.licenseToken;
        licenseExpiryBadge.textContent = 'Scope: ' + result.appId + ' | Expires: ' + (result.expiresAtUtc || result.expiresAt);
        licenseResultBox.classList.remove('hidden');
        statusText.textContent = 'License generated successfully for ' + result.username + ' (' + result.appId + ').';
        await loadDashboard();
      } catch (err) {
        alert('License Generation Failed: ' + err.message);
      } finally {
        generateLicenseBtn.disabled = false;
        generateLicenseBtn.textContent = 'Generate License Token';
      }
    });

    copyLicenseBtn.addEventListener('click', async function () {
      const token = licenseOutputToken.value.trim();
      if (!token) return;
      try {
        await navigator.clipboard.writeText(token);
        copyLicenseBtn.textContent = 'Copied!';
        copyLicenseBtn.classList.add('bg-emerald-600', 'text-white');
        setTimeout(function () {
          copyLicenseBtn.textContent = 'Copy License Token';
          copyLicenseBtn.classList.remove('bg-emerald-600', 'text-white');
        }, 1500);
      } catch {
        licenseOutputToken.select();
      }
    });

    // Create App Form & Presets
    document.getElementById('presetAgentBuddyBtn').addEventListener('click', function () {
      document.getElementById('createAppId').value = 'agentbuddy';
      document.getElementById('createAppName').value = 'AgentBuddy';
      document.getElementById('createAppUrl').value = 'https://saiganesh-eta.vercel.app';
      document.getElementById('createAppDescription').value = 'Desktop and web agent dashboard';
      document.getElementById('createAppStatus').value = 'active';
    });

    document.getElementById('presetClearBtn').addEventListener('click', function () {
      document.getElementById('createAppId').value = '';
      document.getElementById('createAppName').value = '';
      document.getElementById('createAppUrl').value = '';
      document.getElementById('createAppDescription').value = '';
      document.getElementById('createAppStatus').value = 'active';
    });

    document.getElementById('createAppBtn').addEventListener('click', async function () {
      const appId = document.getElementById('createAppId').value.trim();
      const name = document.getElementById('createAppName').value.trim();
      const appUrl = document.getElementById('createAppUrl').value.trim();
      const description = document.getElementById('createAppDescription').value.trim();
      const status = document.getElementById('createAppStatus').value;

      if (!appId || !name || !appUrl) {
        alert('appId, name, and appUrl are required.');
        return;
      }

      try {
        await api('/api/users/apps', {
          method: 'POST',
          body: JSON.stringify({ appId, name, appUrl, description, status }),
        });
        statusText.textContent = 'App "' + appId + '" registered successfully.';
        document.getElementById('presetClearBtn').click();
        await loadDashboard();
      } catch (err) {
        alert('App creation error: ' + err.message);
      }
    });

    // User App Access Editor
    function renderUserAppsEditor() {
      if (!state.selectedUsername) {
        userAppsEditor.innerHTML = '<p class="text-slate-500 text-xs">No user selected. Click "Manage" next to any user.</p>';
        return;
      }

      const selectedSet = new Set(state.selectedUserApps);
      userAppsEditor.innerHTML = state.apps.map(function (app) {
        const checked = selectedSet.has(app.appId) ? 'checked' : '';
        return (
          '<label class="flex items-center gap-2.5 text-xs text-slate-300 hover:text-white cursor-pointer select-none">' +
            '<input type="checkbox" class="accent-cyan-500 rounded" value="' + escapeHtml(app.appId) + '" ' + checked + ' />' +
            '<span class="font-mono font-medium">' + escapeHtml(app.appId) + '</span>' +
            '<span class="text-slate-500">(' + escapeHtml(app.name) + ')</span>' +
          '</label>'
        );
      }).join('');
    }

    async function loadUserApps(username) {
      const normalized = String(username || '').trim().toLowerCase();
      if (!normalized) return;
      statusText.textContent = 'Loading apps for ' + normalized + '...';
      try {
        const payload = await api('/api/users/admin/users/' + encodeURIComponent(normalized) + '/apps');
        state.selectedUsername = payload.user.username;
        state.selectedUserApps = payload.assignedApps || [];
        manageUsernameInput.value = state.selectedUsername;
        manageHint.textContent = 'Editing app access for: ' + state.selectedUsername;
        renderUserAppsEditor();
        statusText.textContent = 'Permissions loaded for ' + state.selectedUsername;
      } catch (err) {
        alert('Error: ' + err.message);
      }
    }

    async function saveUserApps() {
      if (!state.selectedUsername) {
        alert('Select a user first.');
        return;
      }
      const selectedApps = Array.from(userAppsEditor.querySelectorAll('input[type="checkbox"]:checked'))
        .map(function (cb) { return cb.value; });

      try {
        await api('/api/users/admin/users/' + encodeURIComponent(state.selectedUsername) + '/apps', {
          method: 'PUT',
          body: JSON.stringify({ apps: selectedApps }),
        });
        statusText.textContent = 'App access saved for ' + state.selectedUsername;
        await loadDashboard();
      } catch (err) {
        alert('Save error: ' + err.message);
      }
    }

    // Role Update
    document.getElementById('roleBtn').addEventListener('click', async function () {
      const username = document.getElementById('roleUsername').value.trim();
      const role = document.getElementById('roleValue').value;
      if (!username) {
        alert('Username is required.');
        return;
      }
      try {
        await api('/api/users/admin/role/' + encodeURIComponent(username), {
          method: 'PUT',
          body: JSON.stringify({ role: role }),
        });
        statusText.textContent = 'Role updated for ' + username + ' to ' + role;
        document.getElementById('roleUsername').value = '';
        await loadDashboard();
      } catch (err) {
        alert('Role update error: ' + err.message);
      }
    });

    // Event Listeners
    document.getElementById('connectBtn').addEventListener('click', loadDashboard);
    document.getElementById('refreshBtn').addEventListener('click', loadDashboard);
    document.getElementById('loadUserAppsBtn').addEventListener('click', function () {
      loadUserApps(manageUsernameInput.value);
    });
    document.getElementById('saveUserAppsBtn').addEventListener('click', saveUserApps);

    document.getElementById('disconnectBtn').addEventListener('click', function () {
      localStorage.removeItem(STORAGE_KEY);
      tokenInput.value = '';
      setAuthBadge(false);
      statusText.textContent = 'Session cleared. Sign in to reconnect.';
    });

    // Tab switcher
    tabLoginBtn.addEventListener('click', function () {
      quickLoginPanel.classList.remove('hidden');
      rawTokenPanel.classList.add('hidden');
      tabLoginBtn.className = 'text-xs px-3 py-1.5 rounded-lg bg-cyan-600 text-white font-semibold';
      tabTokenBtn.className = 'text-xs px-3 py-1.5 rounded-lg bg-slate-800 text-slate-400 font-medium';
    });
    tabTokenBtn.addEventListener('click', function () {
      rawTokenPanel.classList.remove('hidden');
      quickLoginPanel.classList.add('hidden');
      tabTokenBtn.className = 'text-xs px-3 py-1.5 rounded-lg bg-cyan-600 text-white font-semibold';
      tabLoginBtn.className = 'text-xs px-3 py-1.5 rounded-lg bg-slate-800 text-slate-400 font-medium';
    });

    usersTable.addEventListener('click', function (e) {
      const btn = e.target.closest('button[data-action="manage-user"]');
      if (btn) loadUserApps(btn.getAttribute('data-username'));
    });

    appsList.addEventListener('click', async function (e) {
      const btn = e.target.closest('button[data-action="toggle-app"]');
      if (!btn) return;
      const appId = btn.getAttribute('data-app-id');
      const nextStatus = btn.getAttribute('data-next-status');
      try {
        await api('/api/users/apps/' + encodeURIComponent(appId) + '/status', {
          method: 'PUT',
          body: JSON.stringify({ status: nextStatus }),
        });
        await loadDashboard();
      } catch (err) {
        alert('Toggle error: ' + err.message);
      }
    });

    // Auto-Connect on page load if token is stored
    window.addEventListener('DOMContentLoaded', function () {
      const savedToken = localStorage.getItem(STORAGE_KEY);
      if (savedToken) {
        tokenInput.value = savedToken;
        loadDashboard();
      }
    });
  </script>
</body>
</html>`);
});

module.exports = router;
