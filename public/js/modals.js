// ==========================================================
// MODALS MANAGEMENT & DATA RENDERING
// ==========================================================

let cachedRooms = [];
let cachedMess = null;
let cachedRules = [];
let cachedInfo = null;

function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';

    // Lazy load content depending on modal
    if (modalId === 'modal-rooms') loadRoomsModal();
    if (modalId === 'modal-mess') loadMessModal();
    if (modalId === 'modal-rules') loadRulesModal();
    if (modalId === 'modal-warden') loadWardenModal();
  }
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.remove('active');
    document.body.style.overflow = '';
  }
}

// Close when clicking on backdrop
window.addEventListener('click', (e) => {
  if (e.target.classList.contains('modal-overlay')) {
    e.target.classList.remove('active');
    document.body.style.overflow = '';
  }
});

// Escape key closes modals
window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    document.querySelectorAll('.modal-overlay.active').forEach(m => m.classList.remove('active'));
    document.body.style.overflow = '';
  }
});

// ==========================================================
// 1. COMPLAINT REGISTRATION & TRACKING
// ==========================================================

async function handleComplaintSubmit(event) {
  event.preventDefault();
  const submitBtn = document.getElementById('compSubmitBtn');
  submitBtn.disabled = true;
  submitBtn.innerText = "Submitting...";

  const payload = {
    student_name: document.getElementById('compStudentName').value,
    student_id: document.getElementById('compStudentID').value,
    room_number: document.getElementById('compRoomNo').value,
    category: document.getElementById('compCategory').value,
    priority: document.getElementById('compPriority').value,
    description: document.getElementById('compDescription').value
  };

  try {
    const res = await fetch('/api/complaints', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    if (data.success) {
      document.getElementById('complaintForm').style.display = 'none';
      document.getElementById('complaintConfirmationBox').style.display = 'block';
      document.getElementById('confirmedTicketId').innerText = data.complaint_id;

      // Add a message from the bot into the chat indicating confirmation
      appendBotMessage(
        `### ✅ **Complaint Successfully Registered!**\n\n` +
        `- **Ticket ID**: \`${data.complaint_id}\`\n` +
        `- **Student**: ${payload.student_name} (${payload.student_id})\n` +
        `- **Room**: ${payload.room_number}\n` +
        `- **Category**: ${payload.category}\n` +
        `- **Description**: "${payload.description}"\n\n` +
        `Our hostel maintenance team has been notified. You can track this ticket anytime using the **Track Ticket** button!`,
        [data.complaint_id, "Track Ticket", "Hostel Rules"]
      );
    } else {
      alert("Error submitting complaint: " + (data.error || "Unknown error"));
    }
  } catch (err) {
    console.error(err);
    alert("Connection error while submitting complaint.");
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerText = "Submit & Generate Ticket";
  }
}

function copyComplaintId() {
  const id = document.getElementById('confirmedTicketId').innerText;
  navigator.clipboard.writeText(id);
  alert(`Ticket ID ${id} copied to clipboard!`);
}

function viewComplaintInTracker() {
  const id = document.getElementById('confirmedTicketId').innerText;
  closeModal('modal-complaint');
  openModal('modal-track');
  document.getElementById('trackInputId').value = id;
  lookupComplaintById();
}

async function lookupComplaintById() {
  const id = document.getElementById('trackInputId').value.trim();
  const resultArea = document.getElementById('ticketResultArea');
  if (!id) {
    alert("Please enter a Complaint ID (e.g. HD1021)");
    return;
  }

  resultArea.style.display = 'block';
  resultArea.innerHTML = `<div style="text-align:center; padding:20px; color:#64748b;">Searching ticket ${id}...</div>`;

  try {
    const res = await fetch(`/api/complaints/track/${encodeURIComponent(id)}`);
    const data = await res.json();

    if (!data.success || !data.complaint) {
      resultArea.innerHTML = `
        <div style="background:#fee2e2; border:1px solid #fca5a5; padding:16px; border-radius:var(--radius-sm); color:#991b1b; text-align:center;">
          ❌ No complaint found matching ticket <strong>${id}</strong>. Please check your ID and try again.
        </div>
      `;
      return;
    }

    const c = data.complaint;
    const statusClass = c.status === 'Resolved' ? 'available' : c.status === 'In Progress' ? 'occupied' : 'maintenance';

    resultArea.innerHTML = `
      <div style="background:#fff9fb; border:1.5px solid #fbcfe8; border-radius:var(--radius-md); padding:20px;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:14px; border-bottom:1px solid #fadce8; padding-bottom:10px;">
          <div>
            <span style="font-size:1.2rem; font-weight:800; color:#831843;">${c.id}</span>
            <span style="font-size:0.8rem; color:#9d788b; margin-left:8px;">(${new Date(c.created_at).toLocaleDateString()})</span>
          </div>
          <span class="status-badge ${statusClass}">${c.status}</span>
        </div>

        <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:14px; font-size:0.875rem;">
          <div><strong style="color:#6b4356;">Student:</strong> ${c.student_name} (${c.student_id})</div>
          <div><strong style="color:#6b4356;">Room:</strong> ${c.room_number}</div>
          <div><strong style="color:#6b4356;">Category:</strong> ${c.category}</div>
          <div><strong style="color:#6b4356;">Priority:</strong> ${c.priority || 'Medium'}</div>
        </div>

        <div style="background:#ffffff; border:1px solid #fadce8; border-radius:var(--radius-sm); padding:12px; margin-bottom:14px; font-size:0.9rem;">
          <div style="font-size:0.75rem; text-transform:uppercase; font-weight:700; color:#9d788b; margin-bottom:4px;">Issue Description:</div>
          <div>${c.description}</div>
        </div>

        <div style="background:#fdf2f8; border:1.5px solid #fbcfe8; border-radius:var(--radius-sm); padding:12px; font-size:0.875rem; color:#9d174d;">
          <div style="font-size:0.75rem; text-transform:uppercase; font-weight:700; margin-bottom:4px;">Technician / Admin Remarks:</div>
          <div>${c.admin_notes || 'Ticket logged. Under assessment by maintenance supervisor.'}</div>
        </div>
      </div>
    `;
  } catch (err) {
    resultArea.innerHTML = `<div style="color:red;">Error fetching ticket status.</div>`;
  }
}

function quickTrack(id) {
  document.getElementById('trackInputId').value = id;
  lookupComplaintById();
}

// ==========================================================
// 2. ROOM AVAILABILITY MODAL
// ==========================================================

async function loadRoomsModal() {
  const container = document.getElementById('roomsListGrid');
  const counter = document.getElementById('roomCounterText');
  container.innerHTML = `<div style="grid-column: 1/-1; text-align:center; padding:30px; color:#64748b;">Loading verified hostel rooms...</div>`;

  try {
    const res = await fetch('/api/rooms');
    const data = await res.json();
    cachedRooms = data.rooms || [];
    filterRooms();
  } catch (err) {
    container.innerHTML = `<div style="grid-column: 1/-1; color:red; text-align:center;">Failed to load rooms.</div>`;
  }
}

function filterRooms() {
  const sharingFilter = document.getElementById('filterSharing').value;
  const blockFilter = document.getElementById('filterBlock').value;
  const statusFilter = document.getElementById('filterStatus').value;

  const filtered = cachedRooms.filter(r => {
    if (sharingFilter !== 'All' && r.sharing !== sharingFilter) return false;
    if (blockFilter !== 'All' && !r.block.includes(blockFilter)) return false;
    if (statusFilter !== 'All' && r.status !== statusFilter) return false;
    return true;
  });

  const container = document.getElementById('roomsListGrid');
  const counter = document.getElementById('roomCounterText');
  const availCount = cachedRooms.filter(r => r.status === 'Available').length;
  
  counter.innerHTML = `Showing <strong>${filtered.length}</strong> room(s) (Total Available: <strong>${availCount}</strong>)`;

  if (filtered.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1/-1; text-align:center; padding:40px; color:#64748b; background:#f8fafc; border-radius:var(--radius-md);">
        No rooms match the selected criteria. Try changing filters or check other sharing options.
      </div>
    `;
    return;
  }

  container.innerHTML = filtered.map(r => {
    const statusClass = r.status === 'Available' ? 'available' : r.status === 'Occupied' ? 'occupied' : 'maintenance';
    return `
      <div class="room-card">
        <div class="room-header">
          <div class="room-number">${r.number}</div>
          <span class="status-badge ${statusClass}">${r.status}</span>
        </div>

        <div class="room-detail-row">
          <span>Block & Floor:</span>
          <strong>${r.block}, ${r.floor}</strong>
        </div>

        <div class="room-detail-row">
          <span>Sharing Type:</span>
          <strong>${r.sharing} Sharing ${r.ac ? '(❄️ AC)' : '(Non-AC)'}</strong>
        </div>

        <div class="room-detail-row">
          <span>Semester Fee:</span>
          <strong style="color:#db2777;">${r.fee}</strong>
        </div>

        <div class="room-detail-row">
          <span>Occupancy:</span>
          <span>${r.occupants} / ${r.capacity} Occupied</span>
        </div>

        <div class="room-amenities">
          ${(r.amenities || []).map(a => `<span class="amenity-tag">${a}</span>`).join('')}
        </div>

        <button
          class="card-cta-btn"
          style="margin-top:auto;"
          onclick="selectRoomForChat('${r.number}', '${r.sharing}', '${r.fee}')"
        >
          Ask Bot About Room ${r.number}
        </button>
      </div>
    `;
  }).join('');
}

function selectRoomForChat(roomNo, sharing, fee) {
  closeModal('modal-rooms');
  sendQuickPrompt(`I am interested in Room ${roomNo} (${sharing} sharing, ${fee}). How can I apply for room allotment or room change?`);
}

function askBotAboutRooms() {
  closeModal('modal-rooms');
  sendQuickPrompt('What are all available rooms and their pricing?');
}

// ==========================================================
// 3. MESS TIMINGS & MENU MODAL
// ==========================================================

async function loadMessModal() {
  const dayTabs = document.getElementById('messDayTabs');
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const today = days[new Date().getDay()];

  try {
    const res = await fetch('/api/mess');
    cachedMess = await res.json();
    selectMessDay(today);
  } catch (err) {
    document.getElementById('dayMenuContent').innerHTML = `<div style="color:red;">Error loading mess menu.</div>`;
  }
}

function selectMessDay(day) {
  // Update tab highlights
  document.querySelectorAll('.day-tab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.innerText.trim() === day);
  });

  if (!cachedMess || !cachedMess.weekly_menu) return;
  const menu = cachedMess.weekly_menu[day] || {};
  const timings = cachedMess.timings || {};

  const container = document.getElementById('dayMenuContent');
  container.innerHTML = `
    <div style="font-size:1.1rem; font-weight:700; color:#831843; margin-bottom:14px; display:flex; align-items:center; justify-content:space-between;">
      <span>Menu for ${day}</span>
      <span style="font-size:0.8rem; font-weight:600; color:#be185d; background:#fdf2f8; border:1px solid #fbcfe8; padding:3px 10px; border-radius:var(--radius-full);">Full Board</span>
    </div>

    <div class="meal-block">
      <div class="meal-title">
        <span>🌅 Breakfast</span>
        <span class="meal-time">${timings.breakfast || '7:30 AM - 9:30 AM'}</span>
      </div>
      <div class="meal-items">${menu.breakfast || 'Breakfast options'}</div>
    </div>

    <div class="meal-block">
      <div class="meal-title">
        <span>☀️ Lunch</span>
        <span class="meal-time">${timings.lunch || '12:30 PM - 2:30 PM'}</span>
      </div>
      <div class="meal-items">${menu.lunch || 'Lunch options'}</div>
    </div>

    <div class="meal-block">
      <div class="meal-title">
        <span>☕ Evening Snacks & Chai</span>
        <span class="meal-time">${timings.snacks || '5:00 PM - 6:30 PM'}</span>
      </div>
      <div class="meal-items">${menu.snacks || 'Snacks options'}</div>
    </div>

    <div class="meal-block">
      <div class="meal-title">
        <span>🌙 Dinner</span>
        <span class="meal-time">${timings.dinner || '7:30 PM - 9:30 PM'}</span>
      </div>
      <div class="meal-items">${menu.dinner || 'Dinner options'}</div>
    </div>
  `;
}

// ==========================================================
// 4. RULES MODAL
// ==========================================================

async function loadRulesModal() {
  const container = document.getElementById('rulesListContainer');
  container.innerHTML = `<div style="text-align:center; padding:30px; color:#64748b;">Loading hostel code of conduct...</div>`;

  try {
    const res = await fetch('/api/rules');
    cachedRules = await res.json();

    container.innerHTML = cachedRules.map(r => `
      <div style="background:#fff9fb; border:1px solid #fbcfe8; border-radius:var(--radius-sm); padding:16px;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
          <span style="font-size:0.95rem; font-weight:700; color:#831843;">${r.title}</span>
          <span style="font-size:0.75rem; font-weight:700; background:#fdf2f8; color:#be185d; border:1px solid #fbcfe8; padding:2px 8px; border-radius:var(--radius-full);">${r.category}</span>
        </div>
        <p style="font-size:0.88rem; color:#4a2336; line-height:1.5;">${r.description}</p>
      </div>
    `).join('');
  } catch (err) {
    container.innerHTML = `<div style="color:red;">Error loading rules.</div>`;
  }
}

// ==========================================================
// 5. WARDEN & DIRECTORY MODAL
// ==========================================================

async function loadWardenModal() {
  const body = document.getElementById('wardenDirectoryBody');
  body.innerHTML = `<div style="text-align:center; padding:20px; color:#64748b;">Loading directory...</div>`;

  try {
    const res = await fetch('/api/info');
    cachedInfo = await res.json();

    body.innerHTML = `
      <div style="margin-bottom: 20px;">
        <h4 style="font-size:0.95rem; font-weight:700; color:#831843; margin-bottom:12px;">Hostel Wardens</h4>
        <div style="display:flex; flex-direction:column; gap:10px;">
          ${(cachedInfo.wardens || []).map(w => `
            <div style="background:#fff9fb; border:1px solid #fbcfe8; border-radius:var(--radius-sm); padding:14px;">
              <div style="font-weight:700; color:#2a1520; font-size:0.95rem;">${w.name}</div>
              <div style="font-size:0.8rem; color:#db2777; font-weight:600; margin-bottom:4px;">${w.role} (${w.block})</div>
              <div style="font-size:0.825rem; color:#6b4356; display:flex; flex-direction:column; gap:2px;">
                <div>📞 <strong>Phone:</strong> <a href="tel:${w.phone}" style="color:#f43f5e; text-decoration:none;">${w.phone}</a></div>
                <div>✉️ <strong>Email:</strong> ${w.email}</div>
                <div>📍 <strong>Office:</strong> ${w.office} (Hours: ${w.office_hours})</div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>

      <div>
        <h4 style="font-size:0.95rem; font-weight:700; color:#831843; margin-bottom:12px;">24x7 Emergency Desks</h4>
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px;">
          ${(cachedInfo.emergency_contacts || []).map(e => `
            <div style="background:#fdf2f8; border:1.5px solid #fbcfe8; border-radius:var(--radius-sm); padding:10px; font-size:0.825rem;">
              <strong style="color:#9d174d; display:block; margin-bottom:2px;">${e.title}</strong>
              <div style="color:#2a1520; font-weight:600;">${e.number}</div>
              ${e.intercom ? `<div style="font-size:0.75rem; color:#9d788b;">Intercom: ${e.intercom}</div>` : ''}
            </div>
          `).join('')}
        </div>
      </div>
    `;
  } catch (err) {
    body.innerHTML = `<div style="color:red;">Error loading contacts directory.</div>`;
  }
}
