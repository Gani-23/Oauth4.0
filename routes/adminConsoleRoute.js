const express = require('express');

const router = express.Router();

router.get('/3vc17cs006', (req, res) => {
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
  <div class="max-w-6xl mx-auto px-4 py-8">
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

    <section class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <article class="bg-slate-900 border border-slate-800 rounded-xl p-4">
        <p class="text-sm text-slate-400">Total Users</p>
        <p id="totalUsers" class="text-2xl font-bold mt-1">-</p>
      </article>
      <article class="bg-slate-900 border border-slate-800 rounded-xl p-4">
        <p class="text-sm text-slate-400">Admin Users</p>
        <p id="adminUsers" class="text-2xl font-bold mt-1">-</p>
      </article>
      <article class="bg-slate-900 border border-slate-800 rounded-xl p-4">
        <p class="text-sm text-slate-400">Apps</p>
        <p id="totalApps" class="text-2xl font-bold mt-1">-</p>
      </article>
    </section>

    <section class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div class="bg-slate-900 border border-slate-800 rounded-xl p-4">
        <h2 class="font-semibold mb-3">Users</h2>
        <div class="overflow-auto max-h-96 border border-slate-800 rounded-lg">
          <table class="w-full text-sm">
            <thead class="bg-slate-950 sticky top-0">
              <tr>
                <th class="text-left p-2">Username</th>
                <th class="text-left p-2">Email</th>
                <th class="text-left p-2">Role</th>
                <th class="text-left p-2">Apps</th>
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
      </div>
    </section>
  </div>

  <script>
    const tokenInput = document.getElementById('tokenInput');
    const statusText = document.getElementById('statusText');
    const breakGlassInput = document.getElementById('breakGlassInput');
    const testRunIdInput = document.getElementById('testRunIdInput');
    const usersTable = document.getElementById('usersTable');
    const appsList = document.getElementById('appsList');
    const totalUsers = document.getElementById('totalUsers');
    const adminUsers = document.getElementById('adminUsers');
    const totalApps = document.getElementById('totalApps');

    const headers = () => {
      const result = {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + tokenInput.value.trim(),
      };
      if (breakGlassInput.value.trim()) {
        result['X-Break-Glass-Token'] = breakGlassInput.value.trim();
      }
      if (testRunIdInput.value.trim()) {
        result['X-Test-Run-Id'] = testRunIdInput.value.trim();
      }
      return result;
    };

    async function api(url, options = {}) {
      const res = await fetch(url, { ...options, headers: { ...headers(), ...(options.headers || {}) } });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || 'Request failed');
      return data;
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
          api('/api/users/admin/users?limit=200'),
          api('/api/users/apps'),
        ]);

        totalUsers.textContent = summary.totalUsers;
        adminUsers.textContent = summary.adminUsers;
        totalApps.textContent = summary.totalApps;

        usersTable.innerHTML = users.users.map((u) => (
          '<tr class="border-t border-slate-800">' +
            '<td class="p-2">' + u.username + '</td>' +
            '<td class="p-2">' + u.email + '</td>' +
            '<td class="p-2">' + u.role + '</td>' +
            '<td class="p-2">' + (u.projects || []).join(', ') + '</td>' +
          '</tr>'
        )).join('');

        appsList.innerHTML = (apps.apps || []).map((app) => (
          '<li class="p-2 rounded-lg border border-slate-800 bg-slate-950 flex items-center justify-between">' +
            '<span><strong>' + app.appId + '</strong> - ' + app.name + '</span>' +
            '<span class="text-xs ' + (app.status === 'active' ? 'text-emerald-300' : 'text-rose-300') + '">' + app.status + '</span>' +
          '</li>'
        )).join('');

        statusText.textContent = 'Connected';
      } catch (err) {
        statusText.textContent = 'Error: ' + err.message;
      }
    }

    document.getElementById('connectBtn').addEventListener('click', loadDashboard);
    document.getElementById('refreshBtn').addEventListener('click', loadDashboard);
    document.getElementById('roleBtn').addEventListener('click', async () => {
      const username = document.getElementById('roleUsername').value.trim();
      const role = document.getElementById('roleValue').value;
      if (!username) {
        statusText.textContent = 'Username is required';
        return;
      }
      try {
        await api('/api/users/admin/role/' + encodeURIComponent(username), {
          method: 'PUT',
          body: JSON.stringify({ role }),
        });
        statusText.textContent = 'Role updated';
        await loadDashboard();
      } catch (err) {
        statusText.textContent = 'Error: ' + err.message;
      }
    });
  </script>
</body>
</html>`);
});

module.exports = router;
