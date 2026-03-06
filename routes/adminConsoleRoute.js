const express = require('express');

const router = express.Router();

router.get('/3vc17cs006', (_req, res) => {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(`<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>AgentBuddy Admin</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="min-h-screen bg-slate-950 text-slate-100">
  <div class="max-w-7xl mx-auto px-4 py-8">
    <div class="flex items-center justify-between gap-4 mb-6">
      <div>
        <p class="text-xs tracking-widest uppercase text-cyan-300">AgentBuddy</p>
        <h1 class="text-3xl font-bold">Admin Console</h1>
        <p class="text-slate-400 text-sm mt-1">Hidden route: <code class="text-cyan-300">/3vc17cs006</code></p>
      </div>
      <button id="refreshBtn" class="bg-cyan-500 hover:bg-cyan-400 text-slate-950 px-4 py-2 rounded-lg font-semibold">Refresh</button>
    </div>

    <section class="bg-slate-900/80 border border-slate-800 rounded-xl p-4 mb-6">
      <label class="block text-sm text-slate-300 mb-2">Admin Access Token</label>
      <div class="flex flex-col md:flex-row gap-3">
        <input id="tokenInput" type="password" placeholder="Paste Bearer token" class="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 outline-none focus:border-cyan-400" />
        <button id="connectBtn" class="bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-4 py-2 rounded-lg font-semibold">Connect</button>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
        <input id="breakGlassInput" type="password" placeholder="Optional break-glass token" class="bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 outline-none focus:border-cyan-400" />
        <input id="testRunIdInput" type="text" placeholder="Optional test run id (e.g. run-001)" class="bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 outline-none focus:border-cyan-400" />
      </div>
      <p id="statusText" class="text-xs text-slate-400 mt-2">Not connected</p>
    </section>

    <section class="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
      <article class="bg-slate-900 border border-slate-800 rounded-xl p-4">
        <p class="text-sm text-slate-400">Total Users</p>
        <p id="totalUsers" class="text-2xl font-bold mt-1">-</p>
      </article>
      <article class="bg-slate-900 border border-slate-800 rounded-xl p-4">
        <p class="text-sm text-slate-400">Admin Users</p>
        <p id="adminUsers" class="text-2xl font-bold mt-1">-</p>
      </article>
      <article class="bg-slate-900 border border-slate-800 rounded-xl p-4">
        <p class="text-sm text-slate-400">Total Apps</p>
        <p id="totalApps" class="text-2xl font-bold mt-1">-</p>
      </article>
      <article class="bg-slate-900 border border-slate-800 rounded-xl p-4">
        <p class="text-sm text-slate-400">Active Apps</p>
        <p id="activeApps" class="text-2xl font-bold mt-1">-</p>
      </article>
      <article class="bg-slate-900 border border-slate-800 rounded-xl p-4">
        <p class="text-sm text-slate-400">Inactive Apps</p>
        <p id="inactiveApps" class="text-2xl font-bold mt-1">-</p>
      </article>
    </section>

    <section class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div class="bg-slate-900 border border-slate-800 rounded-xl p-4">
        <h2 class="font-semibold mb-3">Users</h2>
        <div class="overflow-auto max-h-[28rem] border border-slate-800 rounded-lg">
          <table class="w-full text-sm">
            <thead class="bg-slate-950 sticky top-0">
              <tr>
                <th class="text-left p-2">Username</th>
                <th class="text-left p-2">Email</th>
                <th class="text-left p-2">Role</th>
                <th class="text-left p-2">Apps</th>
                <th class="text-left p-2">Action</th>
              </tr>
            </thead>
            <tbody id="usersTable"></tbody>
          </table>
        </div>
      </div>

      <div class="space-y-6">
        <div class="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <h2 class="font-semibold mb-3">Apps</h2>
          <ul id="appsList" class="space-y-2 text-sm"></ul>
        </div>

        <div class="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <h2 class="font-semibold mb-3">Create App</h2>
          <div class="space-y-3">
            <input id="createAppId" type="text" placeholder="appId (example: agentbuddy)" class="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 outline-none focus:border-cyan-400" />
            <input id="createAppName" type="text" placeholder="name (example: AgentBuddy)" class="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 outline-none focus:border-cyan-400" />
            <input id="createAppUrl" type="text" placeholder="appUrl (example: https://app.example.com)" class="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 outline-none focus:border-cyan-400" />
            <input id="createAppDescription" type="text" placeholder="description (optional)" class="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 outline-none focus:border-cyan-400" />
            <select id="createAppStatus" class="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 outline-none focus:border-cyan-400">
              <option value="active">active</option>
              <option value="inactive">inactive</option>
            </select>
            <button id="createAppBtn" class="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-4 py-2 rounded-lg font-semibold">Create App</button>
          </div>
        </div>

        <div class="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <h2 class="font-semibold mb-3">Update User Role</h2>
          <div class="space-y-3">
            <input id="roleUsername" type="text" placeholder="username" class="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 outline-none focus:border-cyan-400" />
            <select id="roleValue" class="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 outline-none focus:border-cyan-400">
              <option value="user">user</option>
              <option value="admin">admin</option>
            </select>
            <button id="roleBtn" class="w-full bg-violet-500 hover:bg-violet-400 text-white px-4 py-2 rounded-lg font-semibold">Update Role</button>
          </div>
        </div>

        <div class="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <h2 class="font-semibold mb-2">Manage User App Access</h2>
          <p id="manageHint" class="text-xs text-slate-400 mb-3">Choose a user and set exactly which apps they can access.</p>
          <div class="flex gap-2 mb-3">
            <input id="manageUsername" type="text" placeholder="username" class="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 outline-none focus:border-cyan-400" />
            <button id="loadUserAppsBtn" class="bg-cyan-500 hover:bg-cyan-400 text-slate-950 px-4 py-2 rounded-lg font-semibold">Load</button>
          </div>
          <div id="userAppsEditor" class="max-h-48 overflow-auto border border-slate-800 rounded-lg p-3 space-y-2 bg-slate-950"></div>
          <button id="saveUserAppsBtn" class="w-full mt-3 bg-amber-500 hover:bg-amber-400 text-slate-950 px-4 py-2 rounded-lg font-semibold">Save User App Access</button>
        </div>
      </div>
    </section>
  </div>

  <script>
    const tokenInput = document.getElementById('tokenInput');
    const breakGlassInput = document.getElementById('breakGlassInput');
    const testRunIdInput = document.getElementById('testRunIdInput');
    const statusText = document.getElementById('statusText');
    const usersTable = document.getElementById('usersTable');
    const appsList = document.getElementById('appsList');
    const userAppsEditor = document.getElementById('userAppsEditor');
    const manageHint = document.getElementById('manageHint');
    const manageUsernameInput = document.getElementById('manageUsername');

    const totalUsers = document.getElementById('totalUsers');
    const adminUsers = document.getElementById('adminUsers');
    const totalApps = document.getElementById('totalApps');
    const activeApps = document.getElementById('activeApps');
    const inactiveApps = document.getElementById('inactiveApps');

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

    function renderUsers() {
      usersTable.innerHTML = state.users.map(function (u) {
        return (
          '<tr class="border-t border-slate-800">' +
            '<td class="p-2 font-medium">' + escapeHtml(u.username) + '</td>' +
            '<td class="p-2">' + escapeHtml(u.email) + '</td>' +
            '<td class="p-2">' + escapeHtml(u.role) + '</td>' +
            '<td class="p-2">' + escapeHtml((u.projects || []).join(', ')) + '</td>' +
            '<td class="p-2">' +
              '<button class="px-2 py-1 rounded bg-cyan-600 hover:bg-cyan-500 text-xs font-semibold" data-action="manage-user" data-username="' + escapeHtml(u.username) + '">Manage</button>' +
            '</td>' +
          '</tr>'
        );
      }).join('');
    }

    function renderApps() {
      appsList.innerHTML = state.apps.map(function (app) {
        const nextStatus = app.status === 'active' ? 'inactive' : 'active';
        const pill = app.status === 'active'
          ? 'text-emerald-300 border-emerald-700'
          : 'text-rose-300 border-rose-700';
        const buttonClass = app.status === 'active'
          ? 'bg-rose-500 hover:bg-rose-400'
          : 'bg-emerald-500 hover:bg-emerald-400';
        return (
          '<li class="p-3 rounded-lg border border-slate-800 bg-slate-950">' +
            '<div class="flex items-start justify-between gap-2">' +
              '<div>' +
                '<p class="font-semibold">' + escapeHtml(app.appId) + '</p>' +
                '<p class="text-slate-300 text-xs">' + escapeHtml(app.name) + '</p>' +
                '<p class="text-slate-500 text-xs mt-1">' + escapeHtml(app.appUrl || '') + '</p>' +
              '</div>' +
              '<div class="text-right">' +
                '<span class="inline-block px-2 py-1 border rounded text-xs ' + pill + '">' + escapeHtml(app.status) + '</span>' +
                '<div class="mt-2">' +
                  '<button class="px-2 py-1 rounded text-xs font-semibold text-slate-950 ' + buttonClass + '" data-action="toggle-app" data-app-id="' + escapeHtml(app.appId) + '" data-next-status="' + nextStatus + '">Set ' + nextStatus + '</button>' +
                '</div>' +
              '</div>' +
            '</div>' +
          '</li>'
        );
      }).join('');
    }

    function renderUserAppsEditor() {
      if (!state.selectedUsername) {
        userAppsEditor.innerHTML = '<p class="text-slate-500 text-xs">No user selected.</p>';
        return;
      }

      const selectedSet = new Set(state.selectedUserApps);
      userAppsEditor.innerHTML = state.apps.map(function (app) {
        const checked = selectedSet.has(app.appId) ? 'checked' : '';
        return (
          '<label class="flex items-center gap-2 text-sm">' +
            '<input type="checkbox" class="accent-cyan-500" value="' + escapeHtml(app.appId) + '" ' + checked + ' />' +
            '<span>' + escapeHtml(app.appId) + ' <span class="text-slate-500">(' + escapeHtml(app.status) + ')</span></span>' +
          '</label>'
        );
      }).join('');
    }

    async function loadDashboard() {
      if (!tokenInput.value.trim()) {
        statusText.textContent = 'Token required';
        return;
      }

      statusText.textContent = 'Loading...';
      try {
        const [summary, users, apps] = await Promise.all([
          api('/api/users/admin/summary'),
          api('/api/users/admin/users?limit=300'),
          api('/api/users/apps'),
        ]);

        totalUsers.textContent = summary.totalUsers;
        adminUsers.textContent = summary.adminUsers;
        totalApps.textContent = summary.totalApps;
        activeApps.textContent = summary.activeApps;
        inactiveApps.textContent = summary.inactiveApps;

        state.users = users.users || [];
        state.apps = apps.apps || [];

        renderUsers();
        renderApps();
        renderUserAppsEditor();

        statusText.textContent = 'Connected';
      } catch (error) {
        statusText.textContent = 'Error: ' + error.message;
      }
    }

    async function loadUserApps(username) {
      const normalized = String(username || '').trim().toLowerCase();
      if (!normalized) {
        statusText.textContent = 'Username is required';
        return;
      }

      statusText.textContent = 'Loading user apps...';
      try {
        const payload = await api('/api/users/admin/users/' + encodeURIComponent(normalized) + '/apps');
        state.selectedUsername = payload.user.username;
        state.selectedUserApps = payload.assignedApps || [];
        manageUsernameInput.value = state.selectedUsername;
        manageHint.textContent = 'Editing app access for: ' + state.selectedUsername;
        renderUserAppsEditor();
        statusText.textContent = 'User apps loaded';
      } catch (error) {
        statusText.textContent = 'Error: ' + error.message;
      }
    }

    async function saveUserApps() {
      if (!state.selectedUsername) {
        statusText.textContent = 'Load a user first';
        return;
      }

      const selectedApps = Array.from(userAppsEditor.querySelectorAll('input[type="checkbox"]:checked'))
        .map(function (checkbox) { return checkbox.value; });

      statusText.textContent = 'Saving user app access...';
      try {
        await api('/api/users/admin/users/' + encodeURIComponent(state.selectedUsername) + '/apps', {
          method: 'PUT',
          body: JSON.stringify({ apps: selectedApps }),
        });
        state.selectedUserApps = selectedApps;
        statusText.textContent = 'User app access updated';
        await loadDashboard();
      } catch (error) {
        statusText.textContent = 'Error: ' + error.message;
      }
    }

    document.getElementById('connectBtn').addEventListener('click', loadDashboard);
    document.getElementById('refreshBtn').addEventListener('click', loadDashboard);
    document.getElementById('loadUserAppsBtn').addEventListener('click', function () {
      loadUserApps(manageUsernameInput.value);
    });
    document.getElementById('saveUserAppsBtn').addEventListener('click', saveUserApps);

    document.getElementById('roleBtn').addEventListener('click', async function () {
      const username = document.getElementById('roleUsername').value.trim();
      const role = document.getElementById('roleValue').value;
      if (!username) {
        statusText.textContent = 'Username is required';
        return;
      }
      try {
        await api('/api/users/admin/role/' + encodeURIComponent(username), {
          method: 'PUT',
          body: JSON.stringify({ role: role }),
        });
        statusText.textContent = 'Role updated';
        await loadDashboard();
      } catch (error) {
        statusText.textContent = 'Error: ' + error.message;
      }
    });

    document.getElementById('createAppBtn').addEventListener('click', async function () {
      const appId = document.getElementById('createAppId').value.trim();
      const name = document.getElementById('createAppName').value.trim();
      const appUrl = document.getElementById('createAppUrl').value.trim();
      const description = document.getElementById('createAppDescription').value.trim();
      const status = document.getElementById('createAppStatus').value;

      if (!appId || !name || !appUrl) {
        statusText.textContent = 'appId, name, and appUrl are required';
        return;
      }

      try {
        await api('/api/users/apps', {
          method: 'POST',
          body: JSON.stringify({ appId: appId, name: name, appUrl: appUrl, description: description, status: status }),
        });
        statusText.textContent = 'App created';
        await loadDashboard();
      } catch (error) {
        statusText.textContent = 'Error: ' + error.message;
      }
    });

    usersTable.addEventListener('click', function (event) {
      const button = event.target.closest('button[data-action="manage-user"]');
      if (!button) {
        return;
      }
      const username = button.getAttribute('data-username');
      loadUserApps(username);
    });

    appsList.addEventListener('click', async function (event) {
      const button = event.target.closest('button[data-action="toggle-app"]');
      if (!button) {
        return;
      }

      const appId = button.getAttribute('data-app-id');
      const nextStatus = button.getAttribute('data-next-status');
      if (!appId || !nextStatus) {
        return;
      }

      try {
        await api('/api/users/apps/' + encodeURIComponent(appId) + '/status', {
          method: 'PUT',
          body: JSON.stringify({ status: nextStatus }),
        });
        statusText.textContent = 'App status updated';
        await loadDashboard();
      } catch (error) {
        statusText.textContent = 'Error: ' + error.message;
      }
    });
  </script>
</body>
</html>`);
});

module.exports = router;
