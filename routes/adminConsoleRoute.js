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
  <div class="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
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

    <!-- 🧭 TOP NAVIGATION TABS -->
    <div class="mb-6 border-b border-slate-800 pb-4">
      <div class="flex flex-wrap items-center justify-between gap-4">
        <nav class="flex items-center gap-2 bg-slate-900/90 p-1.5 rounded-2xl border border-slate-800 shadow-inner">
          <button id="tabNavUsers" type="button" class="tab-nav-btn px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20">
            <span>👥 Users Directory & Access</span>
            <span id="usersCountBadge" class="text-[11px] px-2 py-0.5 rounded-full bg-slate-950/20 text-slate-950 font-mono font-bold">0 users</span>
          </button>
          <button id="tabNavApps" type="button" class="tab-nav-btn px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800/70">
            <span>🚀 Applications</span>
            <span id="appsCountBadge" class="text-[11px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-mono font-bold">0 apps</span>
          </button>
          <button id="tabNavLicenses" type="button" class="tab-nav-btn px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800/70">
            <span>🔑 Mint License Token</span>
          </button>
        </nav>
        <div class="text-xs text-slate-400 font-mono hidden sm:flex items-center gap-2">
          <span class="w-2 h-2 rounded-full bg-emerald-400"></span>
          <span>Endpoint: <code class="text-cyan-400">/3vc17cs006</code></span>
        </div>
      </div>
    </div>

    <!-- 👥 TAB PANE: USERS DIRECTORY -->
    <div id="paneUsers" class="tab-content-pane space-y-4">
      <!-- Toolbar: Search, Direct Lookup, Add User -->
      <div class="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-lg">
        <div class="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div class="flex-1 flex flex-wrap items-center gap-3">
            <!-- Realtime Search bar -->
            <div class="relative flex-1 min-w-[220px]">
              <span class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500 text-sm">🔍</span>
              <input id="searchUsersInput" type="text" placeholder="Search by username, email, role, or app..." class="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-700/80 rounded-xl text-xs sm:text-sm text-slate-200 placeholder-slate-500 outline-none focus:border-cyan-400 font-sans" />
            </div>
            <!-- Quick identifier inspect input -->
            <div class="flex items-center gap-1.5">
              <input id="manageUsername" type="text" placeholder="Inspect user/email..." class="w-44 sm:w-56 px-3 py-2 bg-slate-950 border border-slate-700/80 rounded-xl text-xs text-slate-200 placeholder-slate-500 outline-none focus:border-cyan-400" />
              <button id="loadUserAppsBtn" type="button" class="bg-slate-800 hover:bg-slate-700 text-cyan-300 font-semibold px-3 py-2 rounded-xl text-xs border border-slate-700 transition-colors">Inspect</button>
            </div>
          </div>
          <!-- Add User button -->
          <button type="button" id="toggleAddUserBtn" class="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-teal-500 hover:from-cyan-500 hover:to-teal-400 text-slate-950 font-bold text-xs sm:text-sm transition-all shadow-md shadow-cyan-500/10 flex items-center justify-center gap-1.5 shrink-0">
            <span>➕ Add User</span>
          </button>
        </div>

        <!-- Collapsible Add User Panel -->
        <div id="addUserPanel" class="hidden mt-4 pt-4 border-t border-slate-800 p-4 bg-slate-950/80 border border-cyan-800/40 rounded-xl space-y-3">
          <div class="flex items-center justify-between">
            <h3 class="text-xs font-bold text-cyan-300 uppercase tracking-wider">Create New User Account</h3>
            <span class="text-[10px] text-slate-500">Admin Privileged</span>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input id="newUserName" type="text" placeholder="Full Name (e.g. John Doe)" class="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs outline-none focus:border-cyan-400" />
            <input id="newUserUsername" type="text" placeholder="Username (e.g. johndoe)" class="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs outline-none focus:border-cyan-400 font-mono" />
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input id="newUserEmail" type="email" placeholder="Email address" class="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs outline-none focus:border-cyan-400" />
            <input id="newUserPassword" type="password" placeholder="Password (6+ chars)" class="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs outline-none focus:border-cyan-400" />
          </div>
          <div class="flex flex-col sm:flex-row sm:items-center gap-3">
            <div class="flex items-center gap-2">
              <label class="text-xs text-slate-400 shrink-0">Role:</label>
              <select id="newUserRole" class="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 outline-none focus:border-cyan-400">
                <option value="user">user</option>
                <option value="admin">admin</option>
              </select>
            </div>
            <input id="newUserAppsInput" type="text" placeholder="Initial apps (e.g. agentbuddy, krushigowrava)" class="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs outline-none focus:border-cyan-400 font-mono" />
          </div>
          <div class="flex gap-2 justify-end pt-1">
            <button type="button" id="cancelAddUserBtn" class="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 text-xs font-medium">Cancel</button>
            <button type="button" id="submitCreateUserBtn" class="px-4 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition-colors">Create User</button>
          </div>
        </div>
      </div>

      <!-- Full-Width Responsive Users Table -->
      <div class="bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse">
            <thead class="bg-slate-950/80 text-slate-400 text-xs uppercase tracking-wider border-b border-slate-800 select-none">
              <tr>
                <th class="py-3.5 px-4 font-semibold">User</th>
                <th class="py-3.5 px-4 font-semibold">Email</th>
                <th class="py-3.5 px-4 font-semibold">Role</th>
                <th class="py-3.5 px-4 font-semibold">Redeemed Trial / License</th>
                <th class="py-3.5 px-4 font-semibold">Assigned Apps</th>
                <th class="py-3.5 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody id="usersTable" class="divide-y divide-slate-800/60 font-sans text-xs sm:text-sm"></tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- 🔑 DEDICATED PASSWORD RESET MODAL -->
    <div id="passwordModalBackdrop" class="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 hidden transition-opacity items-center justify-center p-4">
      <div id="passwordModalCard" class="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 transform transition-all">
        <div class="flex items-center justify-between pb-3 border-b border-slate-800">
          <div class="flex items-center gap-2.5">
            <span class="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-lg">🔑</span>
            <div>
              <h3 class="font-bold text-slate-100 text-base">Reset User Password</h3>
              <p class="text-xs text-slate-400">Admin Privileged Override</p>
            </div>
          </div>
          <button id="closePasswordModalBtn" type="button" class="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors" title="Close">✕</button>
        </div>

        <div class="bg-slate-950 p-3 rounded-xl border border-slate-800/80 space-y-1">
          <div class="flex items-center justify-between text-xs">
            <span class="text-slate-400">Target User:</span>
            <span id="modalTargetUsername" class="font-mono font-bold text-cyan-300">-</span>
          </div>
          <div class="flex items-center justify-between text-xs">
            <span class="text-slate-400">Email:</span>
            <span id="modalTargetEmail" class="text-slate-300 font-sans truncate max-w-[240px]">-</span>
          </div>
        </div>

        <div class="space-y-2">
          <div class="flex items-center justify-between">
            <label class="text-xs font-semibold text-slate-300">New Password</label>
            <div class="flex items-center gap-2">
              <button id="modalGenPasswordBtn" type="button" class="text-[11px] text-cyan-400 hover:text-cyan-300 font-medium hover:underline flex items-center gap-1">
                <span>🎲 Generate Strong</span>
              </button>
              <button id="modalCopyPasswordBtn" type="button" class="text-[11px] text-slate-400 hover:text-slate-200 font-medium hover:underline items-center gap-1 hidden">
                <span>📋 Copy</span>
              </button>
            </div>
          </div>
          <div class="relative">
            <input id="modalNewPasswordInput" type="password" placeholder="Enter or generate new password (min 6 chars)" class="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 pr-10 text-xs text-slate-200 font-mono outline-none focus:border-cyan-400 placeholder:font-sans" />
            <button id="modalTogglePasswordBtn" type="button" class="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 text-sm p-1" title="Toggle visibility">
              👁️
            </button>
          </div>
          <p class="text-[11px] text-slate-500">Must be at least 6 characters. Current password is not required when logged in with an admin bearer token.</p>
        </div>

        <div id="modalPasswordAlert" class="hidden p-3 rounded-xl text-xs"></div>

        <div class="flex gap-2.5 justify-end pt-2 border-t border-slate-800">
          <button id="modalCancelPasswordBtn" type="button" class="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors">Cancel</button>
          <button id="modalSubmitPasswordBtn" type="button" class="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-bold transition-all shadow-md shadow-amber-500/20 flex items-center gap-1.5">
            <span>Update Password</span>
          </button>
        </div>
      </div>
    </div>

    <!-- 🪟 USER MANAGEMENT SLIDE-OVER DRAWER -->
    <div id="drawerBackdrop" class="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-40 hidden transition-opacity"></div>
    <aside id="userDrawer" class="fixed inset-y-0 right-0 z-50 w-full max-w-lg sm:max-w-xl bg-slate-900 border-l border-slate-800 shadow-2xl overflow-y-auto transform translate-x-full transition-transform duration-300 ease-in-out">
      <div class="p-6 space-y-5">
        <!-- Drawer Top Bar -->
        <div class="flex items-start justify-between pb-4 border-b border-slate-800">
          <div>
            <div class="flex items-center gap-2 mb-1">
              <span class="text-xl">🛡️</span>
              <h2 class="font-bold text-lg text-slate-100">User Access & License</h2>
            </div>
            <div class="flex items-center gap-2">
              <span id="manageUserBadge" class="text-xs px-2.5 py-0.5 rounded-md font-mono text-cyan-300 bg-cyan-950/80 border border-cyan-800 font-bold hidden"></span>
              <p id="manageHint" class="text-xs text-slate-400">Manage trial days, license validity, and permissions.</p>
            </div>
          </div>
          <button id="closeDrawerBtn" type="button" class="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors" title="Close Drawer (Esc)">
            ✕
          </button>
        </div>

        <!-- 1. Redeemed Trial Status -->
        <div id="licenseStatusCard" class="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-3">
          <div class="flex items-center justify-between">
            <span class="text-xs font-semibold text-slate-400 uppercase tracking-wider">Redeemed Trial Status</span>
            <span id="activeGrantStatusBadge" class="text-xs px-2.5 py-0.5 rounded-full font-bold bg-slate-800 text-slate-400">No user selected</span>
          </div>
          <div id="activeGrantDetails" class="hidden space-y-2.5 text-xs pt-1">
            <div class="grid grid-cols-2 gap-3 bg-slate-900/90 p-3 rounded-xl border border-slate-800">
              <div>
                <p class="text-slate-400 text-[11px]">Remaining Period</p>
                <p id="grantRemainingDaysText" class="text-base font-bold text-cyan-400 font-mono">-</p>
              </div>
              <div class="text-right">
                <p class="text-slate-400 text-[11px]">Expiration Date</p>
                <p id="grantExpiresAtText" class="text-slate-200 font-mono text-xs truncate">-</p>
              </div>
            </div>
            <div class="flex items-center justify-between text-xs text-slate-400 px-1 pt-1 border-t border-slate-900">
              <span>Source: <strong id="grantSourceText" class="text-slate-300 font-mono">-</strong></span>
              <span>Active Apps: <strong id="grantAppsText" class="text-cyan-300 font-mono">-</strong></span>
            </div>
          </div>
        </div>

        <!-- 2. Extend License Validity -->
        <div id="extendLicenseCard" class="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-3">
          <div class="flex items-center justify-between">
            <span class="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <span>⚡ Extend License / Trial Period</span>
            </span>
            <span class="text-[10px] text-slate-500">Adds onto existing days</span>
          </div>
          <div>
            <label class="text-[10px] text-slate-400 block mb-1">Quick Presets</label>
            <div class="grid grid-cols-6 gap-1.5">
              <button type="button" class="preset-extend-btn px-1.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-cyan-500 hover:text-cyan-300 text-xs font-mono font-semibold text-slate-300 transition-colors" data-days="7">+7d</button>
              <button type="button" class="preset-extend-btn px-1.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-cyan-500 hover:text-cyan-300 text-xs font-mono font-semibold text-slate-300 transition-colors" data-days="14">+14d</button>
              <button type="button" class="preset-extend-btn px-1.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-cyan-500 hover:text-cyan-300 text-xs font-mono font-semibold text-slate-300 transition-colors" data-days="30">+30d</button>
              <button type="button" class="preset-extend-btn px-1.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-cyan-500 hover:text-cyan-300 text-xs font-mono font-semibold text-slate-300 transition-colors" data-days="60">+60d</button>
              <button type="button" class="preset-extend-btn px-1.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-cyan-500 hover:text-cyan-300 text-xs font-mono font-semibold text-slate-300 transition-colors" data-days="90">+90d</button>
              <button type="button" class="preset-extend-btn px-1.5 py-1.5 rounded-lg bg-emerald-950/80 border border-emerald-700 hover:border-emerald-400 text-emerald-300 text-xs font-mono font-bold transition-colors" data-days="lifetime">✨ Life</button>
            </div>
          </div>
          <div class="grid grid-cols-2 gap-2.5">
            <div>
              <label class="text-[10px] text-slate-400 block mb-1">Target App</label>
              <select id="extendAppId" class="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-2 text-xs text-slate-200 outline-none focus:border-cyan-400">
                <option value="agentbuddy">agentbuddy</option>
                <option value="*">* (All Apps)</option>
              </select>
            </div>
            <div>
              <label class="text-[10px] text-slate-400 block mb-1">Days to Add</label>
              <input id="extendDaysInput" type="text" placeholder="30 or lifetime" value="30" class="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-2 text-xs text-slate-200 outline-none focus:border-cyan-400 font-mono" />
            </div>
          </div>
          <button id="extendLicenseBtn" type="button" class="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-slate-950 font-bold py-2.5 px-3 rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 shadow-md shadow-cyan-500/10">
            <span>⚡ Extend License Validity</span>
          </button>
          <div id="extendResultBox" class="hidden p-3 rounded-xl bg-slate-900 border border-cyan-800/60 text-xs space-y-2">
            <p id="extendResultMsg" class="text-cyan-300 font-medium"></p>
            <div>
              <div class="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                <span>Extended License Token:</span>
                <button id="copyExtendedTokenBtn" type="button" class="text-cyan-400 hover:underline">Copy Token</button>
              </div>
              <input id="extendedTokenInput" readonly class="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-[10px] font-mono text-slate-300 select-all outline-none" />
            </div>
          </div>
        </div>

        <!-- 3. Application Access Permissions -->
        <div class="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-3">
          <span class="text-xs font-semibold text-slate-300 block">Application Access Permissions</span>
          <div id="userAppsEditor" class="max-h-44 overflow-auto border border-slate-800/90 rounded-xl p-3 space-y-2 bg-slate-900/60">
            <p class="text-xs text-slate-500">No user selected. Click "Manage" next to any user.</p>
          </div>
          <button id="saveUserAppsBtn" type="button" class="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-2.5 px-4 rounded-xl text-xs sm:text-sm transition-colors shadow">
            Save App Permissions
          </button>
        </div>

        <!-- 4. User Account Management (Role, Password, Delete) -->
        <div id="userAccountSettings" class="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-3">
          <div class="flex items-center justify-between">
            <span class="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <span>🛡️ Security & Role Control</span>
            </span>
            <span class="text-[10px] text-amber-400 font-mono font-medium">Admin Override</span>
          </div>

          <!-- Role -->
          <div>
            <label class="text-[10px] text-slate-400 block mb-1">Account Role</label>
            <div class="flex gap-2">
              <select id="manageUserRoleSelect" class="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none focus:border-cyan-400">
                <option value="user">user</option>
                <option value="admin">admin</option>
              </select>
              <button id="saveUserRoleBtn" type="button" class="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white font-semibold rounded-xl text-xs transition-colors">Save Role</button>
            </div>
          </div>

          <!-- Password Reset Box -->
          <div class="p-3.5 bg-slate-900/90 border border-slate-800 rounded-xl space-y-2">
            <div class="flex items-center justify-between">
              <label class="text-[11px] font-semibold text-slate-300 flex items-center gap-1">
                <span>🔑 Change Password</span>
              </label>
              <div class="flex items-center gap-2">
                <button id="drawerGenPasswordBtn" type="button" class="text-[10px] text-cyan-400 hover:text-cyan-300 hover:underline">🎲 Generate</button>
                <button id="drawerCopyPasswordBtn" type="button" class="text-[10px] text-slate-400 hover:text-slate-200 hover:underline hidden">📋 Copy</button>
              </div>
            </div>
            <div class="flex gap-1.5">
              <div class="relative flex-1">
                <input id="manageUserPasswordInput" type="password" placeholder="New password (min 6 chars)" class="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 pr-9 text-xs text-slate-200 font-mono outline-none focus:border-cyan-400 placeholder:font-sans" />
                <button id="drawerTogglePasswordBtn" type="button" class="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 text-xs p-0.5" title="Toggle visibility">👁️</button>
              </div>
              <button id="saveUserPasswordBtn" type="button" class="px-3.5 py-2 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 font-bold rounded-xl text-xs transition-colors whitespace-nowrap shadow">Update</button>
            </div>
            <p id="drawerPasswordFeedback" class="text-[11px] text-emerald-400 font-medium hidden"></p>
          </div>

          <div class="pt-2 flex justify-end border-t border-slate-900">
            <button id="deleteManageUserBtn" type="button" class="text-xs text-rose-400 hover:text-rose-300 hover:underline flex items-center gap-1">
              <span>🗑️ Permanently Delete User Account</span>
            </button>
          </div>
        </div>
      </div>
    </aside>

    <!-- 🚀 TAB PANE: APPLICATIONS -->
    <div id="paneApps" class="tab-content-pane hidden">
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <!-- Apps Directory (7 cols) -->
        <div class="lg:col-span-7 space-y-4">
          <div class="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl">
            <div class="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
              <div>
                <h2 class="font-bold text-lg text-slate-100">Registered Applications</h2>
                <p class="text-xs text-slate-400">Applications authenticated to connect to OAuth 4.0</p>
              </div>
              <span class="text-xs text-slate-400 font-mono bg-slate-950 px-3 py-1 rounded-lg border border-slate-800">Direct Access</span>
            </div>
            <ul id="appsList" class="space-y-3"></ul>
          </div>
        </div>

        <!-- Register / Edit Application Form (5 cols) -->
        <div class="lg:col-span-5 space-y-4 sticky top-6">
          <div class="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl">
            <div class="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
              <div>
                <h2 id="appFormTitle" class="font-bold text-lg text-slate-100">Register New App</h2>
                <p class="text-xs text-slate-400">Define or update application credentials</p>
              </div>
              <div class="flex gap-1.5">
                <button type="button" id="presetAgentBuddyBtn" class="text-xs bg-slate-800 hover:bg-slate-700 text-cyan-300 px-2.5 py-1 rounded-lg transition-colors">Preset: AgentBuddy</button>
                <button type="button" id="presetClearBtn" class="text-xs bg-slate-800 hover:bg-slate-700 text-slate-400 px-2.5 py-1 rounded-lg transition-colors">Clear</button>
              </div>
            </div>
            <div class="space-y-3.5">
              <div class="space-y-1">
                <label class="text-[11px] text-slate-400 font-medium">Application ID (Unique Slug)</label>
                <input id="createAppId" type="text" placeholder="e.g. agentbuddy" class="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm outline-none focus:border-cyan-400 font-mono" />
              </div>
              <div class="space-y-1">
                <label class="text-[11px] text-slate-400 font-medium">Display Name</label>
                <input id="createAppName" type="text" placeholder="e.g. AgentBuddy Web & Desktop" class="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm outline-none focus:border-cyan-400" />
              </div>
              <div class="space-y-1">
                <label class="text-[11px] text-slate-400 font-medium">Application Base URL</label>
                <input id="createAppUrl" type="text" placeholder="https://app.example.com" class="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm outline-none focus:border-cyan-400 font-mono" />
              </div>
              <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div class="sm:col-span-2 space-y-1">
                  <label class="text-[11px] text-slate-400 font-medium">Description</label>
                  <input id="createAppDescription" type="text" placeholder="App purpose..." class="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm outline-none focus:border-cyan-400" />
                </div>
                <div class="space-y-1">
                  <label class="text-[11px] text-slate-400 font-medium">Status</label>
                  <select id="createAppStatus" class="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm outline-none focus:border-cyan-400">
                    <option value="active">active</option>
                    <option value="inactive">inactive</option>
                  </select>
                </div>
              </div>
              <div class="flex gap-2 pt-2">
                <button id="createAppBtn" type="button" class="flex-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold py-2.5 px-4 rounded-xl text-sm transition-colors shadow-md shadow-emerald-500/10">
                  Register App
                </button>
                <button id="cancelAppEditBtn" type="button" class="hidden px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm font-semibold transition-colors">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 🔑 TAB PANE: LICENSE MINTER -->
    <div id="paneLicenses" class="tab-content-pane hidden">
      <div class="max-w-3xl mx-auto">
        <section class="bg-gradient-to-b from-slate-900 to-slate-900/80 border-2 border-cyan-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
          <div class="flex items-center justify-between pb-4 border-b border-slate-800">
            <div class="flex items-center gap-3">
              <span class="text-2xl p-2 rounded-2xl bg-cyan-950/80 border border-cyan-800/80">🔑</span>
              <div>
                <h2 class="font-bold text-xl text-cyan-300">Generate Cryptographic App License</h2>
                <p class="text-xs text-slate-400">Mint signed JWT licenses with custom expiration for AgentBuddy or any registered app</p>
              </div>
            </div>
            <span class="text-xs bg-cyan-950 text-cyan-400 px-3 py-1 rounded-full border border-cyan-800 font-mono font-semibold">JWT v4</span>
          </div>

          <div class="space-y-4">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label class="block text-xs font-semibold text-slate-300 mb-1.5">Target User</label>
                <select id="genLicenseUserSelect" class="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-cyan-400 font-sans">
                  <option value="">-- Select Loaded User --</option>
                </select>
                <input id="genLicenseUserCustom" type="text" placeholder="or enter custom username" class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs outline-none focus:border-cyan-400 mt-2 font-mono" />
              </div>

              <div>
                <label class="block text-xs font-semibold text-slate-300 mb-1.5">Target Application</label>
                <select id="genLicenseAppSelect" class="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-cyan-400 font-sans">
                  <option value="agentbuddy">agentbuddy (AgentBuddy)</option>
                  <option value="*">* (All Active Apps)</option>
                </select>
                <input id="genLicenseAppCustom" type="text" placeholder="or enter custom appId" class="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs outline-none focus:border-cyan-400 mt-2 font-mono" />
              </div>
            </div>

            <!-- Duration Selector -->
            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-1.5">License Duration (Days)</label>
              <div class="flex flex-wrap gap-2 mb-2.5">
                <button type="button" class="license-preset-btn px-3 py-1.5 text-xs rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium transition-colors" data-days="30">30 Days</button>
                <button type="button" class="license-preset-btn px-3 py-1.5 text-xs rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium transition-colors" data-days="90">90 Days</button>
                <button type="button" class="license-preset-btn px-3 py-1.5 text-xs rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium transition-colors" data-days="365">1 Year (365d)</button>
                <button type="button" class="license-preset-btn px-3 py-1.5 text-xs rounded-lg bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-bold transition-all shadow-md shadow-cyan-500/10" data-days="lifetime">✨ Lifetime (Year 2099)</button>
              </div>
              <div class="flex items-center gap-2">
                <input id="genLicenseDays" type="text" value="lifetime" placeholder="e.g. 30, 90, 365, or lifetime" class="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-cyan-400 font-mono" />
                <span class="text-xs text-slate-400 font-mono">days</span>
              </div>
            </div>

            <button id="generateLicenseBtn" type="button" class="w-full bg-gradient-to-r from-cyan-500 via-teal-400 to-emerald-400 hover:from-cyan-400 hover:to-emerald-300 text-slate-950 font-extrabold py-3 px-4 rounded-2xl text-sm transition-all shadow-lg hover:shadow-cyan-500/20">
              Generate License Token
            </button>

            <!-- Output Box -->
            <div id="licenseResultBox" class="hidden pt-4 border-t border-slate-800 space-y-3">
              <div class="flex items-center justify-between text-xs">
                <span id="licenseExpiryBadge" class="text-emerald-400 font-semibold font-mono">Valid until: 2099-12-31</span>
                <button id="copyLicenseBtn" type="button" class="bg-slate-800 hover:bg-cyan-600 hover:text-white text-slate-300 px-3.5 py-1.5 rounded-lg font-semibold transition-colors">Copy License Token</button>
              </div>
              <textarea id="licenseOutputToken" readonly rows="4" class="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-cyan-300 font-mono select-all focus:outline-none focus:border-cyan-500"></textarea>
              <p class="text-xs text-slate-500">Paste directly into AgentBuddy or use via <code class="text-slate-400">Authorization: Bearer &lt;token&gt;</code>.</p>
            </div>
          </div>
        </section>

        <!-- Hidden Quick Role Form (for API compatibility) -->
        <div class="hidden">
          <input id="roleUsername" type="text" />
          <select id="roleValue"><option value="user">user</option><option value="admin">admin</option></select>
          <button id="roleBtn" type="button"></button>
        </div>
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
    const manageUserBadge = document.getElementById('manageUserBadge');

    const appFormTitle = document.getElementById('appFormTitle');
    const createAppIdInput = document.getElementById('createAppId');
    const createAppNameInput = document.getElementById('createAppName');
    const createAppUrlInput = document.getElementById('createAppUrl');
    const createAppDescriptionInput = document.getElementById('createAppDescription');
    const createAppStatusInput = document.getElementById('createAppStatus');
    const createAppBtn = document.getElementById('createAppBtn');
    const cancelAppEditBtn = document.getElementById('cancelAppEditBtn');

    const toggleAddUserBtn = document.getElementById('toggleAddUserBtn');
    const addUserPanel = document.getElementById('addUserPanel');
    const newUserName = document.getElementById('newUserName');
    const newUserUsername = document.getElementById('newUserUsername');
    const newUserEmail = document.getElementById('newUserEmail');
    const newUserPassword = document.getElementById('newUserPassword');
    const newUserRole = document.getElementById('newUserRole');
    const newUserAppsInput = document.getElementById('newUserAppsInput');
    const cancelAddUserBtn = document.getElementById('cancelAddUserBtn');
    const submitCreateUserBtn = document.getElementById('submitCreateUserBtn');

    const manageUserRoleSelect = document.getElementById('manageUserRoleSelect');
    const saveUserRoleBtn = document.getElementById('saveUserRoleBtn');
    const manageUserPasswordInput = document.getElementById('manageUserPasswordInput');
    const saveUserPasswordBtn = document.getElementById('saveUserPasswordBtn');
    const deleteManageUserBtn = document.getElementById('deleteManageUserBtn');
    const drawerTogglePasswordBtn = document.getElementById('drawerTogglePasswordBtn');
    const drawerGenPasswordBtn = document.getElementById('drawerGenPasswordBtn');
    const drawerCopyPasswordBtn = document.getElementById('drawerCopyPasswordBtn');
    const drawerPasswordFeedback = document.getElementById('drawerPasswordFeedback');

    const passwordModalBackdrop = document.getElementById('passwordModalBackdrop');
    const modalTargetUsername = document.getElementById('modalTargetUsername');
    const modalTargetEmail = document.getElementById('modalTargetEmail');
    const modalNewPasswordInput = document.getElementById('modalNewPasswordInput');
    const modalTogglePasswordBtn = document.getElementById('modalTogglePasswordBtn');
    const modalGenPasswordBtn = document.getElementById('modalGenPasswordBtn');
    const modalCopyPasswordBtn = document.getElementById('modalCopyPasswordBtn');
    const modalPasswordAlert = document.getElementById('modalPasswordAlert');
    const modalCancelPasswordBtn = document.getElementById('modalCancelPasswordBtn');
    const modalSubmitPasswordBtn = document.getElementById('modalSubmitPasswordBtn');
    const closePasswordModalBtn = document.getElementById('closePasswordModalBtn');

    const activeGrantStatusBadge = document.getElementById('activeGrantStatusBadge');
    const activeGrantDetails = document.getElementById('activeGrantDetails');
    const grantRemainingDaysText = document.getElementById('grantRemainingDaysText');
    const grantExpiresAtText = document.getElementById('grantExpiresAtText');
    const grantSourceText = document.getElementById('grantSourceText');
    const grantAppsText = document.getElementById('grantAppsText');

    const extendAppId = document.getElementById('extendAppId');
    const extendDaysInput = document.getElementById('extendDaysInput');
    const extendLicenseBtn = document.getElementById('extendLicenseBtn');
    const extendResultBox = document.getElementById('extendResultBox');
    const extendResultMsg = document.getElementById('extendResultMsg');
    const extendedTokenInput = document.getElementById('extendedTokenInput');
    const copyExtendedTokenBtn = document.getElementById('copyExtendedTokenBtn');

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
      selectedUser: null,
      selectedUserApps: [],
      editingAppId: null,
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
      const searchInput = document.getElementById('searchUsersInput');
      const query = searchInput ? searchInput.value.trim().toLowerCase() : '';
      const filtered = state.users.filter(function (u) {
        if (!query) return true;
        return (
          (u.username && u.username.toLowerCase().includes(query)) ||
          (u.email && u.email.toLowerCase().includes(query)) ||
          (u.role && u.role.toLowerCase().includes(query)) ||
          ((u.projects || []).some(function (p) { return p.toLowerCase().includes(query); }))
        );
      });

      if (filtered.length === 0) {
        usersTable.innerHTML = '<tr><td colspan="6" class="py-12 text-center text-slate-500 text-sm font-sans">No users found matching your search.</td></tr>';
        return;
      }

      usersTable.innerHTML = filtered.map(function (u) {
        const rolePill = u.role === 'admin'
          ? 'bg-violet-500/20 text-violet-300 border border-violet-700/80 font-bold'
          : 'bg-slate-800 text-slate-300 border border-slate-700/60 font-medium';

        let licensePill = '<span class="text-slate-500 text-xs">-</span>';
        if (u.licenseStatus) {
          if (u.licenseStatus.isLifetime) {
            licensePill = '<span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-700">✨ Lifetime</span>';
          } else if (u.licenseStatus.hasActiveGrant) {
            licensePill = '<span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-700 font-mono">' + u.licenseStatus.remainingDays + 'd left</span>';
          } else if (u.licenseStatus.expiresAt) {
            licensePill = '<span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/20 text-rose-300 border border-rose-800">Expired</span>';
          }
        }

        const appPills = (u.projects && u.projects.length > 0)
          ? u.projects.map(function (p) {
              return '<span class="inline-block px-2 py-0.5 rounded text-xs font-mono bg-cyan-950/60 border border-cyan-800/80 text-cyan-300 mr-1.5 my-0.5">' + escapeHtml(p) + '</span>';
            }).join('')
          : '<span class="text-slate-500 text-xs font-sans">None</span>';

        const initial = (u.username || 'U')[0].toUpperCase();

        return (
          '<tr class="hover:bg-slate-900/90 transition-colors border-b border-slate-800/40" data-action="manage-user" data-username="' + escapeHtml(u.username) + '">' +
            '<td class="py-3.5 px-4">' +
              '<div class="flex items-center gap-3">' +
                '<div class="w-8 h-8 rounded-full bg-gradient-to-tr from-cyan-900 to-slate-800 border border-cyan-700/50 flex items-center justify-center text-xs font-bold text-cyan-300 font-mono shrink-0">' + initial + '</div>' +
                '<div>' +
                  '<p class="font-bold text-slate-100 hover:text-cyan-300 font-mono text-xs sm:text-sm cursor-pointer">' + escapeHtml(u.username) + '</p>' +
                  (u.name ? '<p class="text-[11px] text-slate-400 font-sans">' + escapeHtml(u.name) + '</p>' : '') +
                '</div>' +
              '</div>' +
            '</td>' +
            '<td class="py-3.5 px-4 text-slate-300 font-sans hover:text-cyan-300 cursor-pointer text-xs sm:text-sm">' + escapeHtml(u.email) + '</td>' +
            '<td class="py-3.5 px-4"><span class="px-2.5 py-0.5 rounded-full text-[11px] ' + rolePill + '">' + escapeHtml(u.role) + '</span></td>' +
            '<td class="py-3.5 px-4">' + licensePill + '</td>' +
            '<td class="py-3.5 px-4 max-w-xs">' + appPills + '</td>' +
            '<td class="py-3.5 px-4 text-right">' +
              '<div class="flex items-center justify-end gap-1.5 flex-wrap">' +
                '<button class="px-2.5 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-semibold transition-colors flex items-center gap-1" data-action="reset-password" data-username="' + escapeHtml(u.username) + '" data-email="' + escapeHtml(u.email || '') + '" title="Reset password for ' + escapeHtml(u.username) + '">' +
                  '<span>🔑 Password</span>' +
                '</button>' +
                '<button class="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-cyan-600 hover:text-white text-slate-300 text-xs font-semibold transition-colors flex items-center gap-1 border border-slate-700 hover:border-cyan-500" data-action="manage-user" data-username="' + escapeHtml(u.username) + '">' +
                  '<span>⚙️ Manage</span>' +
                '</button>' +
                '<button class="px-2.5 py-1.5 rounded-xl bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 border border-rose-800 text-xs font-semibold transition-colors" data-action="delete-user" data-username="' + escapeHtml(u.username) + '">Delete</button>' +
              '</div>' +
            '</td>' +
          '</tr>'
        );
      }).join('');
    }

    function renderApps() {
      appsList.innerHTML = state.apps.map(function (app) {
        const nextStatus = app.status === 'active' ? 'inactive' : 'active';
        const pill = app.status === 'active'
          ? 'text-emerald-300 bg-emerald-950/80 border-emerald-700'
          : 'text-rose-300 bg-rose-950/80 border-rose-800';
        const buttonClass = app.status === 'active'
          ? 'bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-800'
          : 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-800';

        return (
          '<li class="p-4 sm:p-5 rounded-2xl border border-slate-800 bg-slate-950 hover:border-slate-700 transition-colors shadow-sm">' +
            '<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">' +
              '<div class="space-y-1">' +
                '<div class="flex items-center gap-2">' +
                  '<span class="font-bold text-sm sm:text-base text-slate-100 font-mono">' + escapeHtml(app.appId) + '</span>' +
                  '<span class="px-2.5 py-0.5 border rounded-full text-[10px] font-semibold uppercase ' + pill + '">' + escapeHtml(app.status) + '</span>' +
                '</div>' +
                '<p class="text-slate-300 text-xs sm:text-sm font-medium">' + escapeHtml(app.name) + '</p>' +
                (app.description ? '<p class="text-slate-400 text-xs">' + escapeHtml(app.description) + '</p>' : '') +
                (app.appUrl ? '<a href="' + escapeHtml(app.appUrl) + '" target="_blank" class="text-cyan-400 hover:underline text-xs flex items-center gap-1 font-mono mt-1">' + escapeHtml(app.appUrl) + ' ↗</a>' : '') +
              '</div>' +
              '<div class="flex items-center gap-2 shrink-0 pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-800">' +
                '<button class="px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ' + buttonClass + '" data-action="toggle-app" data-app-id="' + escapeHtml(app.appId) + '" data-next-status="' + nextStatus + '">Set ' + nextStatus + '</button>' +
                '<button class="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 transition-colors" data-action="edit-app" data-app-id="' + escapeHtml(app.appId) + '">Edit</button>' +
                (app.appId !== 'admin-console' ? '<button class="px-3 py-1.5 rounded-xl text-xs font-semibold bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 border border-rose-800 transition-colors" data-action="delete-app" data-app-id="' + escapeHtml(app.appId) + '">Delete</button>' : '') +
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

      if (extendAppId) {
        const curExtApp = extendAppId.value;
        extendAppId.innerHTML = '<option value="agentbuddy">agentbuddy (AgentBuddy)</option>' +
          '<option value="*">* (All Apps)</option>' +
          state.apps.map(function (a) {
            return '<option value="' + escapeHtml(a.appId) + '">' + escapeHtml(a.appId) + ' (' + escapeHtml(a.name) + ')</option>';
          }).join('');
        if (curExtApp) extendAppId.value = curExtApp;
      }
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

    function editApp(appId) {
      const app = state.apps.find(function (a) { return a.appId === appId; });
      if (!app) return;
      state.editingAppId = appId;
      if (appFormTitle) appFormTitle.textContent = 'Edit Application (' + appId + ')';
      if (createAppIdInput) {
        createAppIdInput.value = app.appId;
        createAppIdInput.disabled = true;
      }
      if (createAppNameInput) createAppNameInput.value = app.name || '';
      if (createAppUrlInput) createAppUrlInput.value = app.appUrl || '';
      if (createAppDescriptionInput) createAppDescriptionInput.value = app.description || '';
      if (createAppStatusInput) createAppStatusInput.value = app.status || 'active';
      if (createAppBtn) createAppBtn.textContent = 'Update Application';
      if (cancelAppEditBtn) cancelAppEditBtn.classList.remove('hidden');
      if (createAppNameInput) createAppNameInput.focus();
    }

    function cancelAppEdit() {
      state.editingAppId = null;
      if (appFormTitle) appFormTitle.textContent = 'Register / Update Application';
      if (createAppIdInput) {
        createAppIdInput.disabled = false;
        createAppIdInput.value = '';
      }
      if (createAppNameInput) createAppNameInput.value = '';
      if (createAppUrlInput) createAppUrlInput.value = '';
      if (createAppDescriptionInput) createAppDescriptionInput.value = '';
      if (createAppStatusInput) createAppStatusInput.value = 'active';
      if (createAppBtn) createAppBtn.textContent = 'Register Application';
      if (cancelAppEditBtn) cancelAppEditBtn.classList.add('hidden');
    }

    async function deleteApp(appId) {
      if (!appId) return;
      if (appId === 'admin-console') {
        alert('System application "admin-console" cannot be deleted.');
        return;
      }
      if (!confirm('Are you sure you want to delete app "' + appId + '"? This will remove the app and unassign it from all users.')) {
        return;
      }
      try {
        await api('/api/users/apps/' + encodeURIComponent(appId), { method: 'DELETE' });
        statusText.textContent = 'App "' + appId + '" deleted successfully.';
        if (state.editingAppId === appId) cancelAppEdit();
        await loadDashboard();
      } catch (err) {
        alert('Delete app error: ' + err.message);
      }
    }

    document.getElementById('presetClearBtn').addEventListener('click', function () {
      cancelAppEdit();
    });

    if (cancelAppEditBtn) {
      cancelAppEditBtn.addEventListener('click', cancelAppEdit);
    }

    createAppBtn.addEventListener('click', async function () {
      const appId = createAppIdInput.value.trim();
      const name = createAppNameInput.value.trim();
      const appUrl = createAppUrlInput.value.trim();
      const description = createAppDescriptionInput.value.trim();
      const status = createAppStatusInput.value;

      if (state.editingAppId) {
        if (!name || !appUrl) {
          alert('App Name and App URL are required.');
          return;
        }
        try {
          await api('/api/users/apps/' + encodeURIComponent(state.editingAppId), {
            method: 'PUT',
            body: JSON.stringify({ name, appUrl, description, status }),
          });
          statusText.textContent = 'App "' + state.editingAppId + '" updated successfully.';
          cancelAppEdit();
          await loadDashboard();
        } catch (err) {
          alert('App update error: ' + err.message);
        }
      } else {
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
          cancelAppEdit();
          await loadDashboard();
        } catch (err) {
          alert('App creation error: ' + err.message);
        }
      }
    });

    // User App Access & License Editor
    function renderActiveGrantStatus(grant) {
      if (!grant) {
        activeGrantStatusBadge.className = 'text-xs px-2.5 py-0.5 rounded-full font-bold bg-slate-800 text-slate-400';
        activeGrantStatusBadge.textContent = 'No redeemed trial';
        activeGrantDetails.classList.add('hidden');
        return;
      }

      activeGrantDetails.classList.remove('hidden');
      if (grant.isLifetime) {
        activeGrantStatusBadge.className = 'text-xs px-2.5 py-0.5 rounded-full font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-700';
        activeGrantStatusBadge.textContent = '✨ Lifetime Active';
        grantRemainingDaysText.textContent = 'Lifetime (Never Expires)';
        grantRemainingDaysText.className = 'text-base font-bold text-emerald-400 font-mono';
      } else if (!grant.isExpired) {
        activeGrantStatusBadge.className = 'text-xs px-2.5 py-0.5 rounded-full font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-700';
        activeGrantStatusBadge.textContent = grant.remainingDays + ' Days Active';
        grantRemainingDaysText.textContent = grant.remainingDays + ' Days (' + grant.remainingHours + 'h remaining)';
        grantRemainingDaysText.className = 'text-base font-bold text-cyan-400 font-mono';
      } else {
        activeGrantStatusBadge.className = 'text-xs px-2.5 py-0.5 rounded-full font-bold bg-rose-500/20 text-rose-300 border border-rose-800';
        activeGrantStatusBadge.textContent = 'Expired';
        grantRemainingDaysText.textContent = 'Expired';
        grantRemainingDaysText.className = 'text-base font-bold text-rose-400 font-mono';
      }

      grantExpiresAtText.textContent = grant.expiresAt ? new Date(grant.expiresAt).toLocaleString() : 'N/A';
      grantSourceText.textContent = grant.source || 'portfolio_redeem';
      grantAppsText.textContent = (grant.apps && grant.apps.length > 0) ? grant.apps.join(', ') : 'agentbuddy';

      if (grant.apps && grant.apps[0] && extendAppId) {
        extendAppId.value = grant.apps[0];
      }
    }

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
      statusText.textContent = 'Loading apps & license for ' + normalized + '...';
      try {
        const payload = await api('/api/users/admin/users/' + encodeURIComponent(normalized) + '/apps');
        state.selectedUsername = payload.user.username;
        state.selectedUser = payload.user;
        state.selectedUserApps = payload.assignedApps || [];
        manageUsernameInput.value = state.selectedUsername;
        manageHint.textContent = 'Managing access & license for: ' + state.selectedUsername + ' (' + (payload.user.email || '') + ')';
        if (manageUserBadge) {
          manageUserBadge.textContent = state.selectedUsername;
          manageUserBadge.classList.remove('hidden');
        }
        if (manageUserRoleSelect) {
          manageUserRoleSelect.value = payload.user.role || 'user';
        }
        if (manageUserPasswordInput) {
          manageUserPasswordInput.value = '';
        }
        renderUserAppsEditor();
        renderActiveGrantStatus(payload.activeGrant);
        openUserDrawer();
        statusText.textContent = 'Permissions and license loaded for ' + state.selectedUsername;
      } catch (err) {
        alert('Error: ' + err.message);
      }
    }

    async function extendUserLicense(days) {
      if (!state.selectedUsername) {
        alert('Select a user first (click Manage next to any user or enter username/email).');
        return;
      }
      const daysValue = days !== undefined ? days : (extendDaysInput ? extendDaysInput.value.trim() : '30');
      const appId = extendAppId ? extendAppId.value : 'agentbuddy';

      statusText.textContent = 'Extending license for ' + state.selectedUsername + '...';
      try {
        const res = await api('/api/users/admin/users/' + encodeURIComponent(state.selectedUsername) + '/licenses/extend', {
          method: 'POST',
          body: JSON.stringify({
            days: daysValue,
            appId: appId,
          }),
        });

        statusText.textContent = res.message;
        if (extendResultBox && extendResultMsg && extendedTokenInput) {
          extendResultBox.classList.remove('hidden');
          extendResultMsg.textContent = res.message;
          extendedTokenInput.value = res.licenseToken || '';
        }

        // Reload the user apps and trial details
        await loadUserApps(state.selectedUsername);
        // Refresh dashboard users list
        await loadDashboard();
      } catch (err) {
        alert('Extend error: ' + err.message);
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

    async function deleteUser(username) {
      const target = String(username || '').trim();
      if (!target) return;
      if (!confirm('Are you sure you want to permanently delete user "' + target + '"? This will remove all associated license grants and personal tokens.')) {
        return;
      }
      try {
        await api('/api/users/admin/users/' + encodeURIComponent(target), { method: 'DELETE' });
        statusText.textContent = 'User "' + target + '" deleted successfully.';
        if (state.selectedUsername && state.selectedUsername.toLowerCase() === target.toLowerCase()) {
          closeUserDrawer();
          state.selectedUsername = '';
          state.selectedUser = null;
          state.selectedUserApps = [];
          manageUsernameInput.value = '';
          manageHint.textContent = 'Manage trial days, license validity, and permissions.';
          if (manageUserBadge) manageUserBadge.classList.add('hidden');
          if (manageUserRoleSelect) manageUserRoleSelect.value = 'user';
          if (manageUserPasswordInput) manageUserPasswordInput.value = '';
          renderUserAppsEditor();
          renderActiveGrantStatus(null);
        }
        await loadDashboard();
      } catch (err) {
        alert('Delete user error: ' + err.message);
      }
    }

    // Role Update (Quick Card)
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

    // Add User Panel Listeners
    if (toggleAddUserBtn && addUserPanel) {
      toggleAddUserBtn.addEventListener('click', function () {
        addUserPanel.classList.toggle('hidden');
      });
    }
    if (cancelAddUserBtn && addUserPanel) {
      cancelAddUserBtn.addEventListener('click', function () {
        addUserPanel.classList.add('hidden');
      });
    }
    if (submitCreateUserBtn) {
      submitCreateUserBtn.addEventListener('click', async function () {
        const name = newUserName.value.trim();
        const username = newUserUsername.value.trim();
        const email = newUserEmail.value.trim();
        const password = newUserPassword.value.trim();
        const role = newUserRole.value;
        const apps = (newUserAppsInput.value || '')
          .split(',')
          .map(function (s) { return s.trim(); })
          .filter(Boolean);

        if (!username || !email || !password) {
          alert('Username, email, and password are required.');
          return;
        }

        submitCreateUserBtn.disabled = true;
        submitCreateUserBtn.textContent = 'Creating...';
        try {
          await api('/api/users/admin/users', {
            method: 'POST',
            body: JSON.stringify({ name, username, email, password, role, apps }),
          });
          statusText.textContent = 'User "' + username + '" created successfully.';
          newUserName.value = '';
          newUserUsername.value = '';
          newUserEmail.value = '';
          newUserPassword.value = '';
          newUserAppsInput.value = '';
          if (addUserPanel) addUserPanel.classList.add('hidden');
          await loadDashboard();
        } catch (err) {
          alert('Create user error: ' + err.message);
        } finally {
          submitCreateUserBtn.disabled = false;
          submitCreateUserBtn.textContent = 'Create User Account';
        }
      });
    }

    // User Account Settings (in Manage Panel)
    if (saveUserRoleBtn) {
      saveUserRoleBtn.addEventListener('click', async function () {
        if (!state.selectedUsername) {
          alert('Select a user first.');
          return;
        }
        const role = manageUserRoleSelect.value;
        try {
          await api('/api/users/admin/role/' + encodeURIComponent(state.selectedUsername), {
            method: 'PUT',
            body: JSON.stringify({ role: role }),
          });
          statusText.textContent = 'Role updated to "' + role + '" for ' + state.selectedUsername;
          await loadDashboard();
        } catch (err) {
          alert('Role update error: ' + err.message);
        }
      });
    }

    // Secure Password Generator Helper
    function generateSecurePassword(length) {
      const len = length || 14;
      const chars = 'abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$%&*_-';
      let pwd = '';
      if (window.crypto && window.crypto.getRandomValues) {
        const arr = new Uint32Array(len);
        window.crypto.getRandomValues(arr);
        for (let i = 0; i < len; i++) {
          pwd += chars[arr[i] % chars.length];
        }
      } else {
        for (let i = 0; i < len; i++) {
          pwd += chars[Math.floor(Math.random() * chars.length)];
        }
      }
      return pwd;
    }

    // Password Reset Modal Handlers
    function openPasswordModal(username, email) {
      state.passwordModalUsername = username;
      if (modalTargetUsername) modalTargetUsername.textContent = '@' + username;
      if (modalTargetEmail) modalTargetEmail.textContent = email || 'No email specified';
      if (modalNewPasswordInput) {
        modalNewPasswordInput.value = '';
        modalNewPasswordInput.type = 'password';
      }
      if (modalTogglePasswordBtn) modalTogglePasswordBtn.textContent = '👁️';
      if (modalCopyPasswordBtn) {
        modalCopyPasswordBtn.classList.add('hidden');
        modalCopyPasswordBtn.classList.remove('inline-flex');
      }
      if (modalPasswordAlert) {
        modalPasswordAlert.className = 'hidden';
        modalPasswordAlert.textContent = '';
      }
      if (passwordModalBackdrop) {
        passwordModalBackdrop.classList.remove('hidden');
        passwordModalBackdrop.classList.add('flex');
      }
      if (modalNewPasswordInput) {
        setTimeout(function () { modalNewPasswordInput.focus(); }, 50);
      }
    }

    function closePasswordModal() {
      if (passwordModalBackdrop) {
        passwordModalBackdrop.classList.add('hidden');
        passwordModalBackdrop.classList.remove('flex');
      }
      state.passwordModalUsername = null;
    }

    if (closePasswordModalBtn) closePasswordModalBtn.addEventListener('click', closePasswordModal);
    if (modalCancelPasswordBtn) modalCancelPasswordBtn.addEventListener('click', closePasswordModal);
    if (passwordModalBackdrop) {
      passwordModalBackdrop.addEventListener('click', function (e) {
        if (e.target === passwordModalBackdrop) closePasswordModal();
      });
    }

    if (modalTogglePasswordBtn && modalNewPasswordInput) {
      modalTogglePasswordBtn.addEventListener('click', function () {
        const isPwd = modalNewPasswordInput.type === 'password';
        modalNewPasswordInput.type = isPwd ? 'text' : 'password';
        modalTogglePasswordBtn.textContent = isPwd ? '🔒' : '👁️';
      });
    }

    if (modalGenPasswordBtn && modalNewPasswordInput) {
      modalGenPasswordBtn.addEventListener('click', function () {
        const generated = generateSecurePassword(14);
        modalNewPasswordInput.value = generated;
        modalNewPasswordInput.type = 'text';
        if (modalTogglePasswordBtn) modalTogglePasswordBtn.textContent = '🔒';
        if (modalCopyPasswordBtn) {
          modalCopyPasswordBtn.classList.remove('hidden');
          modalCopyPasswordBtn.classList.add('inline-flex');
        }
      });
    }

    if (modalCopyPasswordBtn && modalNewPasswordInput) {
      modalCopyPasswordBtn.addEventListener('click', function () {
        if (!modalNewPasswordInput.value) return;
        navigator.clipboard.writeText(modalNewPasswordInput.value);
        modalCopyPasswordBtn.textContent = '✅ Copied!';
        setTimeout(function () {
          modalCopyPasswordBtn.textContent = '📋 Copy';
        }, 2000);
      });
    }

    if (modalSubmitPasswordBtn) {
      modalSubmitPasswordBtn.addEventListener('click', async function () {
        const targetUser = state.passwordModalUsername;
        if (!targetUser) {
          alert('Target user is missing.');
          return;
        }
        const newPassword = modalNewPasswordInput ? modalNewPasswordInput.value.trim() : '';
        if (!newPassword || newPassword.length < 6) {
          if (modalPasswordAlert) {
            modalPasswordAlert.className = 'p-3 rounded-xl text-xs bg-rose-950/80 border border-rose-800 text-rose-300';
            modalPasswordAlert.textContent = 'Password must be at least 6 characters long.';
          }
          return;
        }

        modalSubmitPasswordBtn.disabled = true;
        modalSubmitPasswordBtn.innerHTML = '<span>Saving...</span>';

        try {
          const res = await api('/api/users/admin/users/' + encodeURIComponent(targetUser) + '/password', {
            method: 'PUT',
            body: JSON.stringify({ password: newPassword }),
          });

          if (modalPasswordAlert) {
            modalPasswordAlert.className = 'p-3 rounded-xl text-xs bg-emerald-950/80 border border-emerald-800 text-emerald-300 font-medium';
            modalPasswordAlert.textContent = res.message || 'Password updated successfully!';
          }
          statusText.textContent = 'Password reset successfully for ' + targetUser;
          setTimeout(function () {
            closePasswordModal();
          }, 1500);
        } catch (err) {
          if (modalPasswordAlert) {
            modalPasswordAlert.className = 'p-3 rounded-xl text-xs bg-rose-950/80 border border-rose-800 text-rose-300';
            modalPasswordAlert.textContent = 'Error: ' + err.message;
          }
        } finally {
          modalSubmitPasswordBtn.disabled = false;
          modalSubmitPasswordBtn.innerHTML = '<span>Update Password</span>';
        }
      });
    }

    // Drawer Password Reset Controls
    if (drawerTogglePasswordBtn && manageUserPasswordInput) {
      drawerTogglePasswordBtn.addEventListener('click', function () {
        const isPwd = manageUserPasswordInput.type === 'password';
        manageUserPasswordInput.type = isPwd ? 'text' : 'password';
        drawerTogglePasswordBtn.textContent = isPwd ? '🔒' : '👁️';
      });
    }

    if (drawerGenPasswordBtn && manageUserPasswordInput) {
      drawerGenPasswordBtn.addEventListener('click', function () {
        const generated = generateSecurePassword(14);
        manageUserPasswordInput.value = generated;
        manageUserPasswordInput.type = 'text';
        if (drawerTogglePasswordBtn) drawerTogglePasswordBtn.textContent = '🔒';
        if (drawerCopyPasswordBtn) {
          drawerCopyPasswordBtn.classList.remove('hidden');
          drawerCopyPasswordBtn.classList.add('inline-flex');
        }
      });
    }

    if (drawerCopyPasswordBtn && manageUserPasswordInput) {
      drawerCopyPasswordBtn.addEventListener('click', function () {
        if (!manageUserPasswordInput.value) return;
        navigator.clipboard.writeText(manageUserPasswordInput.value);
        drawerCopyPasswordBtn.textContent = '✅ Copied!';
        setTimeout(function () {
          drawerCopyPasswordBtn.textContent = '📋 Copy';
        }, 2000);
      });
    }

    if (saveUserPasswordBtn) {
      saveUserPasswordBtn.addEventListener('click', async function () {
        if (!state.selectedUsername) {
          alert('Select a user first.');
          return;
        }
        const newPassword = manageUserPasswordInput.value.trim();
        if (!newPassword || newPassword.length < 6) {
          alert('Password must be at least 6 characters long.');
          return;
        }
        saveUserPasswordBtn.disabled = true;
        try {
          const res = await api('/api/users/admin/users/' + encodeURIComponent(state.selectedUsername) + '/password', {
            method: 'PUT',
            body: JSON.stringify({ password: newPassword }),
          });
          statusText.textContent = res.message || 'Password reset successfully for ' + state.selectedUsername;
          if (drawerPasswordFeedback) {
            drawerPasswordFeedback.textContent = '✓ ' + (res.message || 'Password updated successfully!');
            drawerPasswordFeedback.classList.remove('hidden');
            setTimeout(function () { drawerPasswordFeedback.classList.add('hidden'); }, 4000);
          }
          manageUserPasswordInput.value = '';
          manageUserPasswordInput.type = 'password';
          if (drawerTogglePasswordBtn) drawerTogglePasswordBtn.textContent = '👁️';
          if (drawerCopyPasswordBtn) drawerCopyPasswordBtn.classList.add('hidden');
          alert('Password updated successfully for ' + state.selectedUsername);
        } catch (err) {
          alert('Password reset error: ' + err.message);
        } finally {
          saveUserPasswordBtn.disabled = false;
        }
      });
    }

    if (deleteManageUserBtn) {
      deleteManageUserBtn.addEventListener('click', function () {
        if (!state.selectedUsername) {
          alert('Select a user first.');
          return;
        }
        deleteUser(state.selectedUsername);
      });
    }

    // Event Listeners
    document.getElementById('connectBtn').addEventListener('click', loadDashboard);
    document.getElementById('refreshBtn').addEventListener('click', loadDashboard);
    document.getElementById('loadUserAppsBtn').addEventListener('click', function () {
      loadUserApps(manageUsernameInput.value);
    });
    document.getElementById('saveUserAppsBtn').addEventListener('click', saveUserApps);

    // Preset extend buttons
    document.querySelectorAll('.preset-extend-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        const days = this.getAttribute('data-days');
        if (extendDaysInput) extendDaysInput.value = days;
        extendUserLicense(days);
      });
    });

    if (extendLicenseBtn) {
      extendLicenseBtn.addEventListener('click', function () {
        extendUserLicense();
      });
    }

    if (copyExtendedTokenBtn) {
      copyExtendedTokenBtn.addEventListener('click', function () {
        if (!extendedTokenInput || !extendedTokenInput.value) return;
        extendedTokenInput.select();
        navigator.clipboard.writeText(extendedTokenInput.value);
        copyExtendedTokenBtn.textContent = 'Copied!';
        setTimeout(function () { copyExtendedTokenBtn.textContent = 'Copy Token'; }, 2000);
      });
    }

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
      const pwdBtn = e.target.closest('[data-action="reset-password"]');
      if (pwdBtn) {
        e.stopPropagation();
        const username = pwdBtn.getAttribute('data-username');
        const email = pwdBtn.getAttribute('data-email');
        if (username) openPasswordModal(username, email);
        return;
      }
      const delBtn = e.target.closest('[data-action="delete-user"]');
      if (delBtn) {
        e.stopPropagation();
        const username = delBtn.getAttribute('data-username');
        if (username) deleteUser(username);
        return;
      }
      const target = e.target.closest('[data-action="manage-user"]');
      if (target) {
        const username = target.getAttribute('data-username');
        if (username) loadUserApps(username);
      }
    });

    appsList.addEventListener('click', async function (e) {
      const editBtn = e.target.closest('button[data-action="edit-app"]');
      if (editBtn) {
        const appId = editBtn.getAttribute('data-app-id');
        if (appId) editApp(appId);
        return;
      }
      const delBtn = e.target.closest('button[data-action="delete-app"]');
      if (delBtn) {
        const appId = delBtn.getAttribute('data-app-id');
        if (appId) deleteApp(appId);
        return;
      }
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

    // User Drawer Open/Close Helpers
    function openUserDrawer() {
      const drawer = document.getElementById('userDrawer');
      const backdrop = document.getElementById('drawerBackdrop');
      if (drawer) {
        drawer.classList.remove('translate-x-full');
        drawer.classList.add('translate-x-0');
      }
      if (backdrop) {
        backdrop.classList.remove('hidden');
      }
    }

    function closeUserDrawer() {
      const drawer = document.getElementById('userDrawer');
      const backdrop = document.getElementById('drawerBackdrop');
      if (drawer) {
        drawer.classList.remove('translate-x-0');
        drawer.classList.add('translate-x-full');
      }
      if (backdrop) {
        backdrop.classList.add('hidden');
      }
    }

    const closeDrawerBtn = document.getElementById('closeDrawerBtn');
    if (closeDrawerBtn) closeDrawerBtn.addEventListener('click', closeUserDrawer);
    const drawerBackdrop = document.getElementById('drawerBackdrop');
    if (drawerBackdrop) drawerBackdrop.addEventListener('click', closeUserDrawer);
    window.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        closeUserDrawer();
        closePasswordModal();
      }
    });

    // Realtime User Search
    const searchUsersInput = document.getElementById('searchUsersInput');
    if (searchUsersInput) {
      searchUsersInput.addEventListener('input', renderUsers);
    }

    // Top Navigation Tabs
    const tabNavUsers = document.getElementById('tabNavUsers');
    const tabNavApps = document.getElementById('tabNavApps');
    const tabNavLicenses = document.getElementById('tabNavLicenses');
    const paneUsers = document.getElementById('paneUsers');
    const paneApps = document.getElementById('paneApps');
    const paneLicenses = document.getElementById('paneLicenses');

    function switchMainTab(activeTab) {
      const tabs = [
        { btn: tabNavUsers, pane: paneUsers, id: 'users' },
        { btn: tabNavApps, pane: paneApps, id: 'apps' },
        { btn: tabNavLicenses, pane: paneLicenses, id: 'licenses' },
      ];

      tabs.forEach(function (t) {
        if (!t.btn || !t.pane) return;
        if (t.id === activeTab) {
          t.pane.classList.remove('hidden');
          t.btn.className = 'tab-nav-btn px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20';
          const badge = t.btn.querySelector('span[id$="Badge"]');
          if (badge) {
            badge.className = 'text-[11px] px-2 py-0.5 rounded-full bg-slate-950/20 text-slate-950 font-mono font-bold';
          }
        } else {
          t.pane.classList.add('hidden');
          t.btn.className = 'tab-nav-btn px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800/70';
          const badge = t.btn.querySelector('span[id$="Badge"]');
          if (badge) {
            badge.className = 'text-[11px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-mono font-bold';
          }
        }
      });
    }

    if (tabNavUsers) tabNavUsers.addEventListener('click', function () { switchMainTab('users'); });
    if (tabNavApps) tabNavApps.addEventListener('click', function () { switchMainTab('apps'); });
    if (tabNavLicenses) tabNavLicenses.addEventListener('click', function () { switchMainTab('licenses'); });

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
