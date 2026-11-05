// ==========================================================
// ADMIN DASHBOARD CONTROLLER
// Complete Hostel Management, Complaints, Rooms, Menus, Rules & AI Config
// ==========================================================

let isAdminAuthenticated = false;
let currentAdminTab = 'overview';
let adminComplaintsList = [];
let adminRoomsList = [];
let adminRulesList = [];
let adminMessData = null;

function openAdminModal() {
  openModal('modal-admin');
  if (isAdminAuthenticated) {
    document.getElementById('adminLoginScreen').style.display = 'none';
    document.getElementById('adminDashboardView').style.display = 'block';
    loadAdminTabData(currentAdminTab);
  } else {
    document.getElementById('adminLoginScreen').style.display = 'block';
    document.getElementById('adminDashboardView').style.display = 'none';
  }
}

async function handleAdminLogin(e) {
  e.preventDefault();
  const pin = document.getElementById('adminPinInput').value;

  try {
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin })
    });

    const data = await res.json();
    if (data.success) {
      isAdminAuthenticated = true;
      document.getElementById('adminLoginScreen').style.display = 'none';
      document.getElementById('adminDashboardView').style.display = 'block';
      switchAdminTab('overview');
    } else {
      alert("Invalid Admin PIN! Default is admin123");
    }
  } catch (err) {
    alert("Connection error during login.");
  }
}

function switchAdminTab(tabName) {
  currentAdminTab = tabName;
  document.querySelectorAll('.admin-tab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('onclick').includes(tabName));
  });
  loadAdminTabData(tabName);
}

async function loadAdminTabData(tab) {
  const container = document.getElementById('adminTabContent');
  container.innerHTML = `<div style="text-align:center; padding:30px; color:#64748b;">Loading ${tab} data...</div>`;

  if (tab === 'overview') {
    renderAdminOverview(container);
  } else if (tab === 'complaints') {
    renderAdminComplaints(container);
  } else if (tab === 'rooms') {
    renderAdminRooms(container);
  } else if (tab === 'mess') {
    renderAdminMess(container);
  } else if (tab === 'rules') {
    renderAdminRules(container);
  } else if (tab === 'ai') {
    renderAdminAISettings(container);
  }
}

// ==========================================================
// 1. OVERVIEW TAB
// ==========================================================
async function renderAdminOverview(container) {
  try {
    const [compRes, roomRes] = await Promise.all([
      fetch('/api/complaints'),
      fetch('/api/rooms')
    ]);
    const compData = await compRes.json();
    const roomData = await roomRes.json();

    const complaints = compData.complaints || [];
    const rooms = roomData.rooms || [];
    const availableRooms = rooms.filter(r => r.status === 'Available');

    container.innerHTML = `
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-label">Total Rooms</div>
          <div class="stat-value">${rooms.length}</div>
          <div class="stat-sub">${availableRooms.length} Currently Available</div>
        </div>

        <div class="stat-card">
          <div class="stat-label">Room Occupancy</div>
          <div class="stat-value">${Math.round(((rooms.length - availableRooms.length) / (rooms.length || 1)) * 100)}%</div>
          <div class="stat-sub">${rooms.length - availableRooms.length} Occupied / Maint.</div>
        </div>

        <div class="stat-card">
          <div class="stat-label">Total Complaints</div>
          <div class="stat-value">${complaints.length}</div>
          <div class="stat-sub" style="color:#d97706;">${compData.pending} Pending Action</div>
        </div>

        <div class="stat-card">
          <div class="stat-label">Resolved Rate</div>
          <div class="stat-value">${Math.round((compData.resolved / (complaints.length || 1)) * 100)}%</div>
          <div class="stat-sub">${compData.resolved} Resolved Tickets</div>
        </div>
      </div>

      <div style="background:#ffffff; border:1px solid #fbcfe8; border-radius:var(--radius-md); padding:20px; margin-bottom:20px;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:14px;">
          <h3 style="font-size:1.05rem; font-weight:700; color:#831843;">Recent Student Complaints</h3>
          <button class="prompt-chip" onclick="switchAdminTab('complaints')">Manage All Complaints &rarr;</button>
        </div>

        <div class="table-responsive">
          <table class="admin-table">
            <thead>
              <tr>
                <th>Ticket ID</th>
                <th>Student</th>
                <th>Room</th>
                <th>Category</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              ${complaints.slice(0, 5).map(c => `
                <tr>
                  <td><strong>${c.id}</strong></td>
                  <td>${c.student_name}</td>
                  <td>${c.room_number}</td>
                  <td>${c.category}</td>
                  <td>
                    <span class="status-badge ${c.status === 'Resolved' ? 'available' : c.status === 'In Progress' ? 'occupied' : 'maintenance'}">
                      ${c.status}
                    </span>
                  </td>
                  <td>${new Date(c.created_at).toLocaleDateString()}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  } catch (err) {
    container.innerHTML = `<div style="color:red;">Error loading overview data.</div>`;
  }
}

// ==========================================================
// 2. COMPLAINTS MANAGEMENT TAB
// ==========================================================
async function renderAdminComplaints(container) {
  try {
    const res = await fetch('/api/complaints');
    const data = await res.json();
    adminComplaintsList = data.complaints || [];

    container.innerHTML = `
      <div style="display:flex; flex-wrap:wrap; gap:12px; margin-bottom:18px; align-items:center; justify-content:space-between;">
        <div style="display:flex; gap:10px; flex:1; min-width:280px;">
          <input
            type="text"
            id="adminCompSearch"
            class="form-input"
            placeholder="Search ticket, student name, or room..."
            oninput="filterAdminComplaintsTable()"
          >
          <select id="adminCompStatusFilter" class="form-select" style="max-width:180px;" onchange="filterAdminComplaintsTable()">
            <option value="All">All Statuses</option>
            <option value="Pending">Pending Only</option>
            <option value="In Progress">In Progress</option>
            <option value="Resolved">Resolved</option>
          </select>
        </div>

        <div style="font-size:0.875rem; color:#64748b;">
          Total: <strong>${adminComplaintsList.length}</strong> complaints
        </div>
      </div>

      <div class="table-responsive">
        <table class="admin-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Student Details</th>
              <th>Room</th>
              <th>Category</th>
              <th>Description</th>
              <th>Status</th>
              <th>Priority</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody id="adminComplaintsTbody">
            ${renderComplaintsTableRows(adminComplaintsList)}
          </tbody>
        </table>
      </div>
    `;
  } catch (err) {
    container.innerHTML = `<div style="color:red;">Error loading complaints.</div>`;
  }
}

function renderComplaintsTableRows(list) {
  if (!list || list.length === 0) {
    return `<tr><td colspan="8" style="text-align:center; padding:30px; color:#64748b;">No complaints match the filter.</td></tr>`;
  }

  return list.map(c => `
    <tr>
      <td><strong>${c.id}</strong></td>
      <td>
        <div style="font-weight:600;">${c.student_name}</div>
        <div style="font-size:0.75rem; color:#64748b;">${c.student_id}</div>
      </td>
      <td><strong>${c.room_number}</strong></td>
      <td>${c.category}</td>
      <td style="max-width:240px; font-size:0.825rem;">
        <div>${c.description}</div>
        ${c.admin_notes ? `<div style="font-size:0.75rem; color:#db2777; margin-top:4px;"><em>Admin note:</em> ${c.admin_notes}</div>` : ''}
      </td>
      <td>
        <span class="status-badge ${c.status === 'Resolved' ? 'available' : c.status === 'In Progress' ? 'occupied' : 'maintenance'}">
          ${c.status}
        </span>
      </td>
      <td>
        <span style="font-size:0.75rem; font-weight:700; color:${c.priority === 'High' ? '#dc2626' : '#475569'};">
          ${c.priority || 'Medium'}
        </span>
      </td>
      <td>
        <button class="prompt-chip" onclick="openUpdateStatusDialog('${c.id}', '${c.status}')">
          Update
        </button>
      </td>
    </tr>
  `).join('');
}

function filterAdminComplaintsTable() {
  const q = (document.getElementById('adminCompSearch').value || '').toLowerCase();
  const statusFilter = document.getElementById('adminCompStatusFilter').value;

  const filtered = adminComplaintsList.filter(c => {
    if (statusFilter !== 'All' && c.status !== statusFilter) return false;
    if (q) {
      return c.id.toLowerCase().includes(q) ||
        c.student_name.toLowerCase().includes(q) ||
        c.room_number.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q) ||
        c.category.toLowerCase().includes(q);
    }
    return true;
  });

  document.getElementById('adminComplaintsTbody').innerHTML = renderComplaintsTableRows(filtered);
}

async function openUpdateStatusDialog(id, currentStatus) {
  const newStatus = prompt(`Update status for ${id}\nEnter: Pending, In Progress, or Resolved:`, currentStatus);
  if (!newStatus || !['Pending', 'In Progress', 'Resolved'].includes(newStatus.trim())) {
    if (newStatus) alert("Status must be one of: Pending, In Progress, Resolved");
    return;
  }

  const notes = prompt("Technician / Resolution notes for student:", "Technician inspected and completed the repair work.");

  try {
    const res = await fetch(`/api/complaints/${encodeURIComponent(id)}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: newStatus.trim(),
        admin_notes: notes || "Updated by Admin"
      })
    });

    const data = await res.json();
    if (data.success) {
      alert(`Complaint ${id} updated to ${newStatus}!`);
      renderAdminComplaints(document.getElementById('adminTabContent'));
    } else {
      alert("Failed to update: " + data.error);
    }
  } catch (err) {
    alert("Connection error while updating status.");
  }
}

// ==========================================================
// 3. ROOM INVENTORY TAB
// ==========================================================
async function renderAdminRooms(container) {
  try {
    const res = await fetch('/api/rooms');
    const data = await res.json();
    adminRoomsList = data.rooms || [];

    container.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:18px;">
        <h3 style="font-size:1.05rem; font-weight:700; color:#831843;">Hostel Room Inventory (${adminRoomsList.length} Rooms)</h3>
        <button class="btn-primary" onclick="showAddRoomModal()">+ Add New Room</button>
      </div>

      <div class="table-responsive">
        <table class="admin-table">
          <thead>
            <tr>
              <th>Room No</th>
              <th>Block & Floor</th>
              <th>Sharing</th>
              <th>AC</th>
              <th>Occupancy</th>
              <th>Fee</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${adminRoomsList.map(r => `
              <tr>
                <td><strong>${r.number}</strong></td>
                <td>${r.block}, ${r.floor}</td>
                <td>${r.sharing}</td>
                <td>${r.ac ? '❄️ AC' : 'Non-AC'}</td>
                <td>${r.occupants} / ${r.capacity}</td>
                <td>${r.fee}</td>
                <td>
                  <span class="status-badge ${r.status === 'Available' ? 'available' : r.status === 'Occupied' ? 'occupied' : 'maintenance'}">
                    ${r.status}
                  </span>
                </td>
                <td>
                  <button class="prompt-chip" onclick="toggleRoomStatus('${r.id}', '${r.status}')">Toggle Status</button>
                  <button class="prompt-chip" style="color:#dc2626;" onclick="deleteRoom('${r.id}')">Delete</button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  } catch (err) {
    container.innerHTML = `<div style="color:red;">Error loading rooms.</div>`;
  }
}

async function showAddRoomModal() {
  const number = prompt("Enter Room Number (e.g. A-301):");
  if (!number) return;
  const block = prompt("Enter Block (e.g. Block A (Boys) or Block B (Girls)):", "Block A (Boys)");
  const floor = prompt("Enter Floor (e.g. 1st Floor, 2nd Floor):", "2nd Floor");
  const sharing = prompt("Sharing Type (Single, Double, or Triple):", "Double");
  const isAc = confirm("Is this room Air Conditioned (AC)? Click OK for Yes, Cancel for No.");
  const fee = prompt("Semester Fee (e.g. ₹42,000 / sem):", "₹42,000 / sem");

  try {
    const res = await fetch('/api/rooms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        number,
        block,
        floor,
        sharing,
        ac: isAc,
        fee,
        amenities: ["Bed", "Study Table", "Wardrobe", isAc ? "AC" : "Ceiling Fan"],
        status: "Available"
      })
    });

    const data = await res.json();
    if (data.success) {
      alert(`Room ${number} added successfully!`);
      renderAdminRooms(document.getElementById('adminTabContent'));
    }
  } catch (err) {
    alert("Error adding room.");
  }
}

async function toggleRoomStatus(id, current) {
  const next = current === 'Available' ? 'Occupied' : current === 'Occupied' ? 'Under Maintenance' : 'Available';
  try {
    await fetch(`/api/rooms/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: next })
    });
    renderAdminRooms(document.getElementById('adminTabContent'));
  } catch (err) {
    alert("Error updating room.");
  }
}

async function deleteRoom(id) {
  if (!confirm("Are you sure you want to remove this room from the hostel database?")) return;
  try {
    await fetch(`/api/rooms/${encodeURIComponent(id)}`, { method: 'DELETE' });
    renderAdminRooms(document.getElementById('adminTabContent'));
  } catch (err) {
    alert("Error deleting room.");
  }
}

// ==========================================================
// 4. MESS & FOOD MENU TAB
// ==========================================================
async function renderAdminMess(container) {
  try {
    const res = await fetch('/api/mess');
    adminMessData = await res.json();
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

    container.innerHTML = `
      <div style="background:#ffffff; border:1px solid #fbcfe8; border-radius:var(--radius-md); padding:20px; margin-bottom:20px;">
        <h3 style="font-size:1.05rem; font-weight:700; color:#831843; margin-bottom:12px;">Official Meal Timings</h3>
        <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap:12px;">
          <div class="form-group">
            <label class="form-label">Breakfast</label>
            <input type="text" id="adminTimeBreakfast" class="form-input" value="${adminMessData.timings.breakfast}">
          </div>
          <div class="form-group">
            <label class="form-label">Lunch</label>
            <input type="text" id="adminTimeLunch" class="form-input" value="${adminMessData.timings.lunch}">
          </div>
          <div class="form-group">
            <label class="form-label">Evening Snacks</label>
            <input type="text" id="adminTimeSnacks" class="form-input" value="${adminMessData.timings.snacks}">
          </div>
          <div class="form-group">
            <label class="form-label">Dinner</label>
            <input type="text" id="adminTimeDinner" class="form-input" value="${adminMessData.timings.dinner}">
          </div>
        </div>
        <button class="btn-primary" onclick="saveAdminMessTimings()">Save Meal Timings</button>
      </div>

      <div style="background:#ffffff; border:1px solid #e2e8f0; border-radius:var(--radius-md); padding:20px;">
        <h3 style="font-size:1.05rem; font-weight:700; color:#1e3a8a; margin-bottom:14px;">Weekly Food Menus</h3>
        <div class="mess-day-tabs" style="margin-bottom:14px;">
          ${days.map(d => `<button class="day-tab-btn ${d === 'Monday' ? 'active' : ''}" onclick="selectAdminMessEditorDay('${d}')">${d}</button>`).join('')}
        </div>

        <div id="adminDayMenuEditor">
          ${renderAdminDayEditorForm('Monday')}
        </div>
      </div>
    `;
  } catch (err) {
    container.innerHTML = `<div style="color:red;">Error loading mess data.</div>`;
  }
}

function selectAdminMessEditorDay(day) {
  document.querySelectorAll('#adminDashboardView .day-tab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.innerText.trim() === day);
  });
  document.getElementById('adminDayMenuEditor').innerHTML = renderAdminDayEditorForm(day);
}

function renderAdminDayEditorForm(day) {
  const m = adminMessData.weekly_menu[day] || {};
  return `
    <div style="display:flex; flex-direction:column; gap:12px;">
      <div class="form-group">
        <label class="form-label">🌅 Breakfast (${day})</label>
        <input type="text" class="form-input" id="editMenuBreakfast" value="${m.breakfast || ''}">
      </div>
      <div class="form-group">
        <label class="form-label">☀️ Lunch (${day})</label>
        <input type="text" class="form-input" id="editMenuLunch" value="${m.lunch || ''}">
      </div>
      <div class="form-group">
        <label class="form-label">☕ Evening Snacks (${day})</label>
        <input type="text" class="form-input" id="editMenuSnacks" value="${m.snacks || ''}">
      </div>
      <div class="form-group">
        <label class="form-label">🌙 Dinner (${day})</label>
        <input type="text" class="form-input" id="editMenuDinner" value="${m.dinner || ''}">
      </div>
      <button class="btn-primary" style="align-self:flex-start;" onclick="saveAdminDayMenu('${day}')">
        Update ${day} Menu
      </button>
    </div>
  `;
}

async function saveAdminMessTimings() {
  const timings = {
    breakfast: document.getElementById('adminTimeBreakfast').value,
    lunch: document.getElementById('adminTimeLunch').value,
    snacks: document.getElementById('adminTimeSnacks').value,
    dinner: document.getElementById('adminTimeDinner').value
  };

  try {
    await fetch('/api/mess/timings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(timings)
    });
    alert("Official mess timings updated successfully!");
  } catch (err) {
    alert("Error updating mess timings.");
  }
}

async function saveAdminDayMenu(day) {
  const menuDetails = {
    breakfast: document.getElementById('editMenuBreakfast').value,
    lunch: document.getElementById('editMenuLunch').value,
    snacks: document.getElementById('editMenuSnacks').value,
    dinner: document.getElementById('editMenuDinner').value
  };

  try {
    await fetch(`/api/mess/menu/${encodeURIComponent(day)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(menuDetails)
    });
    alert(`${day} menu updated successfully!`);
  } catch (err) {
    alert("Error updating menu.");
  }
}

// ==========================================================
// 5. RULES & POLICIES TAB
// ==========================================================
async function renderAdminRules(container) {
  try {
    const res = await fetch('/api/rules');
    adminRulesList = await res.json();

    container.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:18px;">
        <h3 style="font-size:1.05rem; font-weight:700; color:#831843;">Hostel Rules & Policies</h3>
        <button class="btn-primary" onclick="showAddRuleModal()">+ Add New Rule</button>
      </div>

      <div style="display:flex; flex-direction:column; gap:12px;">
        ${adminRulesList.map(r => `
          <div style="background:#ffffff; border:1px solid #fbcfe8; border-radius:var(--radius-sm); padding:16px;">
            <div style="display:flex; justify-content:space-between; align-items:flex-start;">
              <div>
                <span class="status-badge occupied" style="margin-right:8px;">${r.category}</span>
                <strong style="color:#831843; font-size:1rem;">${r.title}</strong>
                <p style="color:#334155; font-size:0.9rem; margin-top:6px;">${r.description}</p>
              </div>
              <button class="prompt-chip" style="color:#dc2626; flex-shrink:0;" onclick="deleteRule('${r.id}')">Delete</button>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  } catch (err) {
    container.innerHTML = `<div style="color:red;">Error loading rules.</div>`;
  }
}

async function showAddRuleModal() {
  const category = prompt("Enter Category (e.g. Entry & Curfew, Attendance, Visitors, Leave):", "General");
  if (!category) return;
  const title = prompt("Enter Rule Title:");
  if (!title) return;
  const description = prompt("Enter Detailed Description:");
  if (!description) return;

  try {
    await fetch('/api/rules', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ category, title, description })
    });
    alert("New rule added successfully!");
    renderAdminRules(document.getElementById('adminTabContent'));
  } catch (err) {
    alert("Error adding rule.");
  }
}

async function deleteRule(id) {
  if (!confirm("Are you sure you want to delete this rule?")) return;
  try {
    await fetch(`/api/rules/${encodeURIComponent(id)}`, { method: 'DELETE' });
    renderAdminRules(document.getElementById('adminTabContent'));
  } catch (err) {
    alert("Error deleting rule.");
  }
}

// ==========================================================
// 6. AI & SYSTEM SETTINGS TAB
// ==========================================================
async function renderAdminAISettings(container) {
  try {
    const res = await fetch('/api/admin/settings');
    const settings = await res.json();

    container.innerHTML = `
      <div style="background:#ffffff; border:1px solid #fbcfe8; border-radius:var(--radius-md); padding:24px; max-width:700px;">
        <h3 style="font-size:1.15rem; font-weight:700; color:#831843; margin-bottom:12px;">🤖 AI Engine & Model Configuration</h3>
        <p style="font-size:0.875rem; color:#64748b; margin-bottom:20px;">
          The chatbot has a dual-engine architecture. It includes an intelligent built-in conversational AI with full database awareness that works instantly offline, and can also connect directly to Google Gemini API for advanced generative dialogue.
        </p>

        <form onsubmit="handleSaveAISettings(event)">
          <div class="form-group">
            <label class="form-label">Virtual Assistant Bot Name</label>
            <input type="text" id="settingBotName" class="form-input" value="${settings.bot_name || 'HostelBuddy AI'}">
          </div>

          <div class="form-group">
            <label class="form-label">Google Gemini API Key</label>
            <input
              type="password"
              id="settingApiKey"
              class="form-input"
              placeholder="${settings.has_gemini_key ? settings.masked_key : 'Enter your Gemini API key (optional)...'}"
            >
            <div style="font-size:0.75rem; color:#64748b; margin-top:4px;">
              ${settings.has_gemini_key ? '✅ Gemini API Key is configured.' : 'ℹ️ No API key set. Running in built-in smart engine mode.'}
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Gemini Model</label>
            <select id="settingModel" class="form-select">
              <option value="gemini-2.5-flash" ${settings.gemini_model === 'gemini-2.5-flash' ? 'selected' : ''}>gemini-2.5-flash (Fast, Recommended)</option>
              <option value="gemini-1.5-flash" ${settings.gemini_model === 'gemini-1.5-flash' ? 'selected' : ''}>gemini-1.5-flash</option>
              <option value="gemini-1.5-pro" ${settings.gemini_model === 'gemini-1.5-pro' ? 'selected' : ''}>gemini-1.5-pro</option>
            </select>
          </div>

          <div class="form-group">
            <label class="form-label">New Admin Security PIN (Optional)</label>
            <input type="password" id="settingNewPin" class="form-input" placeholder="Leave blank to keep current PIN">
          </div>

          <div style="display:flex; gap:12px; margin-top:20px;">
            <button type="submit" class="btn-primary">Save Settings</button>
            <button type="button" class="btn-secondary" onclick="testAIConnection()">Test AI Connection</button>
          </div>
        </form>

        <div id="aiTestResult" style="margin-top:16px;"></div>
      </div>
    `;
  } catch (err) {
    container.innerHTML = `<div style="color:red;">Error loading settings.</div>`;
  }
}

async function handleSaveAISettings(e) {
  e.preventDefault();
  const botName = document.getElementById('settingBotName').value;
  const apiKey = document.getElementById('settingApiKey').value;
  const model = document.getElementById('settingModel').value;
  const newPin = document.getElementById('settingNewPin').value;

  const payload = {
    bot_name: botName,
    gemini_model: model
  };
  if (apiKey) payload.gemini_api_key = apiKey;
  if (newPin) payload.new_pin = newPin;

  try {
    const res = await fetch('/api/admin/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (data.success) {
      alert("Settings successfully saved!");
      renderAdminAISettings(document.getElementById('adminTabContent'));
    }
  } catch (err) {
    alert("Error saving settings.");
  }
}

async function testAIConnection() {
  const resultDiv = document.getElementById('aiTestResult');
  const tempKey = document.getElementById('settingApiKey').value;

  resultDiv.innerHTML = `<div style="color:#2563eb; font-size:0.875rem;">Testing AI connection...</div>`;

  try {
    const res = await fetch('/api/admin/test-ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key: tempKey })
    });
    const data = await res.json();
    if (data.success) {
      resultDiv.innerHTML = `
        <div style="background:#ecfdf5; border:1px solid #a7f3d0; padding:12px; border-radius:var(--radius-sm); color:#065f46; font-size:0.875rem;">
          ✅ AI Connection Successful!<br><strong>Model Reply:</strong> "${data.reply}"
        </div>
      `;
    } else {
      resultDiv.innerHTML = `
        <div style="background:#fef2f2; border:1px solid #fecaca; padding:12px; border-radius:var(--radius-sm); color:#991b1b; font-size:0.875rem;">
          ❌ AI Test Failed: ${data.error}
        </div>
      `;
    }
  } catch (err) {
    resultDiv.innerHTML = `<div style="color:red; font-size:0.875rem;">Connection error during test.</div>`;
  }
}
