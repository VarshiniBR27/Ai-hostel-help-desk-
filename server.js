require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./db');
const aiService = require('./ai-service');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// ==========================================
// 0. DOWNLOAD PROJECT ZIP API
// ==========================================
app.get(['/download', '/api/download'], (req, res) => {
  const zipFile = path.join(__dirname, 'ai-hostel-helpdesk.zip');
  res.download(zipFile, 'ai-hostel-helpdesk.zip', (err) => {
    if (err && !res.headersSent) {
      res.status(404).send("Download file not found.");
    }
  });
});

// ==========================================
// 1. AI CHAT API
// ==========================================
app.post('/api/chat', async (req, res) => {
  try {
    const { message, history } = req.body;
    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({ error: "Message cannot be empty." });
    }

    const aiResponse = await aiService.processMessage(message, history || []);
    res.json(aiResponse);
  } catch (error) {
    console.error("Chat API error:", error);
    res.status(500).json({
      reply: "I apologize, but I encountered a temporary glitch while processing your request. Please try asking again, or check the quick buttons above!",
      suggestions: ["Mess Timings", "Hostel Rules", "Available Rooms", "Contact Warden"]
    });
  }
});

// ==========================================
// 2. HOSTEL INFO & DIRECTORY API
// ==========================================
app.get('/api/info', (req, res) => {
  try {
    const info = db.getHostelInfo();
    res.json(info);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/info', (req, res) => {
  try {
    const updated = db.updateHostelInfo(req.body);
    res.json({ success: true, hostel_info: updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 3. HOSTEL RULES API
// ==========================================
app.get('/api/rules', (req, res) => {
  try {
    const rules = db.getRules();
    res.json(rules);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/rules', (req, res) => {
  try {
    const { category, title, description } = req.body;
    if (!title || !description) {
      return res.status(400).json({ error: "Title and description are required." });
    }
    const newRule = db.addRule({ category: category || "General", title, description });
    res.status(201).json({ success: true, rule: newRule });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/rules/:id', (req, res) => {
  try {
    const updated = db.updateRule(req.params.id, req.body);
    if (!updated) return res.status(404).json({ error: "Rule not found." });
    res.json({ success: true, rule: updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/rules/:id', (req, res) => {
  try {
    const success = db.deleteRule(req.params.id);
    if (!success) return res.status(404).json({ error: "Rule not found." });
    res.json({ success: true, message: "Rule deleted successfully." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 4. MESS SCHEDULE & MENU API
// ==========================================
app.get('/api/mess', (req, res) => {
  try {
    const mess = db.getMessSchedule();
    res.json(mess);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/mess/timings', (req, res) => {
  try {
    const updated = db.updateMessTimings(req.body);
    res.json({ success: true, mess_schedule: updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/mess/menu/:day', (req, res) => {
  try {
    const day = req.params.day;
    const updated = db.updateMessMenu(day, req.body);
    res.json({ success: true, menu: updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 5. ROOM AVAILABILITY & SHARING API
// ==========================================
app.get('/api/rooms', (req, res) => {
  try {
    let rooms = db.getRooms();
    const { status, sharing, block, ac } = req.query;

    if (status) {
      rooms = rooms.filter(r => r.status.toLowerCase() === status.toLowerCase());
    }
    if (sharing) {
      rooms = rooms.filter(r => r.sharing.toLowerCase() === sharing.toLowerCase());
    }
    if (block) {
      rooms = rooms.filter(r => r.block.toLowerCase().includes(block.toLowerCase()));
    }
    if (ac !== undefined) {
      const isAc = ac === 'true';
      rooms = rooms.filter(r => r.ac === isAc);
    }

    res.json({
      total: rooms.length,
      available_count: rooms.filter(r => r.status === 'Available').length,
      rooms: rooms
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/rooms', (req, res) => {
  try {
    const { number, block, floor, sharing, ac, fee, amenities, capacity, occupants, status } = req.body;
    if (!number || !block || !sharing) {
      return res.status(400).json({ error: "Room number, block, and sharing type are required." });
    }
    const newRoom = db.addRoom({
      number,
      block,
      floor: floor || "1st Floor",
      sharing,
      ac: Boolean(ac),
      fee: fee || "₹35,000 / sem",
      amenities: amenities || ["Bed", "Study Table", "Wardrobe"],
      capacity: Number(capacity) || (sharing === "Single" ? 1 : sharing === "Double" ? 2 : 3),
      occupants: Number(occupants) || 0,
      status: status || "Available"
    });
    res.status(201).json({ success: true, room: newRoom });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/rooms/:id', (req, res) => {
  try {
    const updated = db.updateRoom(req.params.id, req.body);
    if (!updated) return res.status(404).json({ error: "Room not found." });
    res.json({ success: true, room: updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/rooms/:id', (req, res) => {
  try {
    const ok = db.deleteRoom(req.params.id);
    if (!ok) return res.status(404).json({ error: "Room not found." });
    res.json({ success: true, message: "Room deleted successfully." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 6. COMPLAINTS REGISTRATION & TRACKING API
// ==========================================
app.get('/api/complaints', (req, res) => {
  try {
    let complaints = db.getComplaints();
    const { status, category, search } = req.query;

    if (status && status !== 'All') {
      complaints = complaints.filter(c => c.status.toLowerCase() === status.toLowerCase());
    }
    if (category && category !== 'All') {
      complaints = complaints.filter(c => c.category.toLowerCase() === category.toLowerCase());
    }
    if (search) {
      const q = search.toLowerCase();
      complaints = complaints.filter(c =>
        c.id.toLowerCase().includes(q) ||
        c.student_name.toLowerCase().includes(q) ||
        c.student_id.toLowerCase().includes(q) ||
        c.room_number.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q)
      );
    }

    res.json({
      total: complaints.length,
      pending: complaints.filter(c => c.status === 'Pending').length,
      in_progress: complaints.filter(c => c.status === 'In Progress').length,
      resolved: complaints.filter(c => c.status === 'Resolved').length,
      complaints
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/complaints/track/:id', (req, res) => {
  try {
    const complaint = db.getComplaintById(req.params.id);
    if (!complaint) {
      return res.status(404).json({ error: `No complaint found with ID ${req.params.id}` });
    }
    res.json({ success: true, complaint });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/complaints', (req, res) => {
  try {
    const { student_name, student_id, room_number, category, description, priority } = req.body;
    if (!student_name || !student_id || !room_number || !description) {
      return res.status(400).json({ error: "Student name, ID, room number, and description are required." });
    }

    const complaint = db.createComplaint({
      student_name,
      student_id,
      room_number,
      category,
      description,
      priority
    });

    res.status(201).json({
      success: true,
      message: "Your complaint has been successfully registered!",
      complaint_id: complaint.id,
      complaint: complaint,
      confirmation_text: `Your complaint has been successfully registered!\nComplaint ID: ${complaint.id}\nOur hostel management team will review your complaint.`
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.patch('/api/complaints/:id/status', (req, res) => {
  try {
    const { status, admin_notes, priority } = req.body;
    const updated = db.updateComplaintStatus(req.params.id, { status, admin_notes, priority });
    if (!updated) {
      return res.status(404).json({ error: "Complaint not found." });
    }
    res.json({ success: true, complaint: updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 7. ADMIN AUTH & CONFIG API
// ==========================================
app.post('/api/admin/login', (req, res) => {
  const { pin } = req.body;
  const config = db.getAdminConfig();
  if (pin === config.pin) {
    res.json({ success: true, token: "admin-auth-session-key", message: "Admin authenticated." });
  } else {
    res.status(401).json({ success: false, error: "Invalid Admin PIN. (Default is admin123)" });
  }
});

app.get('/api/admin/settings', (req, res) => {
  try {
    const config = db.getAdminConfig();
    // Mask API key for security
    const maskedKey = config.gemini_api_key
      ? `${config.gemini_api_key.slice(0, 4)}••••••••${config.gemini_api_key.slice(-4)}`
      : "";
    res.json({
      bot_name: config.bot_name,
      gemini_model: config.gemini_model,
      system_tone: config.system_tone,
      has_gemini_key: Boolean(config.gemini_api_key),
      masked_key: maskedKey
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/admin/settings', (req, res) => {
  try {
    const { bot_name, gemini_api_key, gemini_model, system_tone, new_pin } = req.body;
    const updates = {};
    if (bot_name) updates.bot_name = bot_name;
    if (gemini_model) updates.gemini_model = gemini_model;
    if (system_tone) updates.system_tone = system_tone;
    if (gemini_api_key !== undefined) updates.gemini_api_key = gemini_api_key.trim();
    if (new_pin && new_pin.trim().length >= 4) updates.pin = new_pin.trim();

    const updatedConfig = db.updateAdminConfig(updates);
    res.json({ success: true, message: "Admin settings updated successfully." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/admin/test-ai', async (req, res) => {
  try {
    const { key } = req.body;
    const apiKeyToTest = key || db.getAdminConfig().gemini_api_key || process.env.GEMINI_API_KEY;
    if (!apiKeyToTest) {
      return res.status(400).json({ success: false, error: "No Gemini API key provided." });
    }
    const testResult = await aiService.callGeminiAPI(apiKeyToTest, [
      { role: 'user', content: 'Say "Hostel AI is connected and active!" in 8 words or less.' }
    ]);
    res.json({ success: true, reply: testResult });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Fallback to SPA index.html
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start Server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`====================================================`);
  console.log(`🚀 AI HOSTEL HELP DESK Server running on port ${PORT}`);
  console.log(`📍 Web URL: http://localhost:${PORT}`);
  console.log(`🔑 Admin Default PIN: admin123`);
  console.log(`====================================================`);
});
