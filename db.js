const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'hostel_data.json');

// Initial comprehensive seed data
const initialSeedData = {
  hostel_info: {
    name: "Apex University Hostels",
    tagline: "Your Safe, Smart & Vibrant Home on Campus",
    curfew_weekdays: "9:30 PM",
    curfew_weekends: "10:00 PM",
    gates_open: "6:00 AM",
    attendance_time: "9:45 PM daily roll-call",
    wifi_ssid_5g: "HostelNet-Secure_5G",
    wifi_ssid_2g: "HostelNet-Std_2.4G",
    wifi_portal_url: "http://hostel.wifi.login",
    wifi_default_dns: "8.8.8.8, 1.1.1.1",
    wardens: [
      {
        id: "w1",
        name: "Dr. Rajesh Sharma",
        role: "Chief Hostel Warden",
        block: "All Blocks",
        phone: "+91 98765 43210",
        email: "chiefwarden@hostel.edu",
        office: "Central Hostel Admin Office, Room 101",
        office_hours: "3:00 PM - 6:00 PM (Mon-Sat)"
      },
      {
        id: "w2",
        name: "Prof. Amit Verma",
        role: "Assistant Warden (Boys)",
        block: "Block A & Block C (Boys Hostel)",
        phone: "+91 98765 43211",
        email: "amit.verma@hostel.edu",
        office: "Block A Ground Floor Warden Cabin",
        office_hours: "4:00 PM - 7:00 PM"
      },
      {
        id: "w3",
        name: "Dr. Priya Nair",
        role: "Assistant Warden (Girls)",
        block: "Block B (Girls Hostel)",
        phone: "+91 98765 43212",
        email: "priya.nair@hostel.edu",
        office: "Block B Ground Floor Warden Cabin",
        office_hours: "4:00 PM - 7:00 PM"
      }
    ],
    emergency_contacts: [
      { title: "24x7 Security Main Gate", number: "+91 98765 43220", intercom: "100" },
      { title: "Campus Health Center & Doctor", number: "+91 98765 43230", intercom: "102", hours: "8:00 AM - 9:00 PM" },
      { title: "Campus Emergency Ambulance", number: "108 / +91 98765 43231", intercom: "108" },
      { title: "Maintenance Desk (Electrician/Plumber)", number: "+91 98765 43225", intercom: "105", hours: "9:00 AM - 7:00 PM" },
      { title: "Mess Supervisor (Mr. Ramesh Patil)", number: "+91 98765 43240", intercom: "104" }
    ],
    facilities: [
      { name: "RO Drinking Water", description: "Purified RO cold & normal water dispensers on every floor near central staircase." },
      { name: "Laundry Facility", description: "Automatic washing machines in basement (6:00 AM - 10:00 PM). Token system available at security desk." },
      { name: "Gym & Recreation Room", description: "Indoor table tennis, carrom, chess, and gym on 1st Floor Block A & B (6:00 AM - 8:30 AM & 5:00 PM - 9:00 PM)." },
      { name: "Reading & Study Room", description: "24x7 Air-conditioned study room on Ground Floor with high-speed LAN ports." },
      { name: "First Aid & Infirmary", description: "Ground floor Block A & B, stocked with basic medicines, thermometer, and BP apparatus." }
    ]
  },

  mess_schedule: {
    timings: {
      breakfast: "7:30 AM - 9:30 AM",
      lunch: "12:30 PM - 2:30 PM",
      snacks: "5:00 PM - 6:30 PM",
      dinner: "7:30 PM - 9:30 PM"
    },
    weekly_menu: {
      Monday: {
        breakfast: "Idli, Sambar, Coconut Chutney, Boiled Eggs / Banana, Tea & Coffee",
        lunch: "Rajma Masala, Steamed Basmati Rice, Chapati, Boondi Raita, Green Salad",
        snacks: "Veg Puff / Samosa, Green Chutney, Hot Masala Tea / Coffee",
        dinner: "Dal Makhani, Mix Veg Curry, Tandoori Roti, Jeera Rice, Gulab Jamun"
      },
      Tuesday: {
        breakfast: "Aloo Paratha, Curd, Pickle, Fresh Fruits, Tea & Coffee",
        lunch: "Chole Bhature / Rice, Dal Fry, Jeera Rice, Kachumber Salad, Buttermilk",
        snacks: "Poha with Sev & Roasted Peanuts, Lemon, Ginger Tea",
        dinner: "Paneer Butter Masala, Yellow Dal Tadka, Phulka, Steamed Rice, Fruit Custard"
      },
      Wednesday: {
        breakfast: "Masala Dosa, Sambar, Tomato Chutney, Boiled Sprouted Moong, Milk & Tea",
        lunch: "Kadhi Pakora, Steamed Rice, Bhindi Do Pyaza, Chapati, Papad",
        snacks: "Bread Pakora / Onion Pakoda, Mint Chutney, Cardamom Tea",
        dinner: "Chicken Curry / Shahi Paneer (for Veg), Dal Fry, Steamed Rice, Paratha, Ice Cream"
      },
      Thursday: {
        breakfast: "Puri Bhaji (Aloo Masala), Sooji Halwa, Fresh Cut Papaya, Tea & Coffee",
        lunch: "Dal Palak, Aloo Gobi Matar, Phulka, Steamed Rice, Curd, Pickle",
        snacks: "Pav Bhaji, Chopped Onions, Lemon, Hot Tea / Coffee",
        dinner: "Kashmiri Dum Aloo, Dal Tadka, Chapati, Veg Pulao, Rasgulla"
      },
      Friday: {
        breakfast: "Uttapam, Coconut & Tomato Chutney, Sambar, Boiled Egg / Apple, Tea",
        lunch: "Paneer Kolhapuri, Dal Maharani, Chapati, Peas Pulao, Cucumber Raita",
        snacks: "Sweet Corn Chaat / Veg Cutlet, Tea & Cold Coffee",
        dinner: "Egg Curry / Malai Kofta, Dal Fry, Tawa Roti, Jeera Rice, Kheer"
      },
      Saturday: {
        breakfast: "Upma with Coconut Chutney, Bread Butter Jam, Boiled Corn, Tea & Coffee",
        lunch: "Veg Biryani / Chicken Biryani, Mirchi Ka Salan, Onion Raita, Boiled Egg, Salad",
        snacks: "Bhel Puri / Sev Puri, Tangy Tamarind Chutney, Masala Chai",
        dinner: "Chana Dal Fry, Baingan Bharta, Missi Roti, Steamed Rice, Moong Dal Halwa"
      },
      Sunday: {
        breakfast: "Chole Kulche, Sweet Lassi, Banana, Tea & Filter Coffee",
        lunch: "Special Feast: Paneer Tikka Masala, Dal Makhani, Butter Naan, Veg Fried Rice, Gulab Jamun",
        snacks: "Biscuits & Cookies, Filter Coffee, Lemon Tea",
        dinner: "Light Khichdi / Dal Fry, Jeera Aloo, Chapati, Steamed Rice, Papad, Cut Fruits"
      }
    },
    special_notes: "Sick diet (Khichdi, Curd, Boiled Veggies, Toast) can be requested 2 hours prior by notifying the Mess Supervisor."
  },

  rules: [
    {
      id: "R101",
      category: "Entry & Curfew",
      title: "Hostel Entry & Exit Timings",
      description: "Hostel main gates open at 6:00 AM and close at 9:30 PM (Sunday-Thursday) and 10:00 PM (Friday-Saturday). All residents must enter the hostel premises before curfew time."
    },
    {
      id: "R102",
      category: "Attendance",
      title: "Night Roll-Call & Attendance",
      description: "Mandatory biometric attendance and warden roll-call takes place daily at 9:45 PM in the floor common lobbies. Unauthorized absence attracts a fine of ₹500 and parent notification."
    },
    {
      id: "R103",
      category: "Visitors",
      title: "Visitor Policy & Hours",
      description: "Visitors and parents are allowed only in the Visitor Lounge on the Ground Floor between 10:00 AM and 6:00 PM. No opposite-gender visitors or external guests are permitted in student living corridors under any circumstances."
    },
    {
      id: "R104",
      category: "Leave Procedure",
      title: "Leave Application & Out-Pass",
      description: "For overnight leave or weekend outstation travel, students must submit a digital leave application on the hostel portal at least 24 hours prior. Gate pass is granted after automated/manual parent approval via registered mobile number."
    },
    {
      id: "R105",
      category: "Hostel ID Card",
      title: "ID Card Mandatory",
      description: "Every student must carry their biometric RFID Hostel ID Card. Entry through turnstiles requires physical scanning. Lost ID must be immediately reported to the Warden office for deactivation and reissue (₹200 fee)."
    },
    {
      id: "R106",
      category: "Discipline",
      title: "Cleanliness & Zero-Tolerance Items",
      description: "Possession or consumption of alcohol, tobacco, narcotics, or prohibited hazardous items is strictly forbidden and results in immediate expulsion. Room inspections are conducted randomly."
    },
    {
      id: "R107",
      category: "Appliances",
      title: "Electrical Appliances Restriction",
      description: "High-power electrical appliances such as immersion rods, electric heaters, induction stoves, and hotplates are strictly prohibited due to fire safety regulations. Laptops, mobile chargers, and electric kettles (up to 500W) are permitted."
    },
    {
      id: "R108",
      category: "Quiet Hours",
      title: "Silence & Study Hours",
      description: "Quiet hours must be maintained between 11:00 PM and 6:00 AM to facilitate study and sleep. Loud music, shouting, or noisy group gatherings in corridors are strictly prohibited."
    }
  ],

  rooms: [
    { id: "RM-101", number: "A-101", block: "Block A (Boys)", floor: "1st Floor", sharing: "Single", ac: true, capacity: 1, occupants: 0, status: "Available", fee: "₹65,000 / sem", amenities: ["Attached Bath", "Balcony", "Study Desk", "High-speed LAN", "AC"] },
    { id: "RM-102", number: "A-102", block: "Block A (Boys)", floor: "1st Floor", sharing: "Single", ac: false, capacity: 1, occupants: 0, status: "Available", fee: "₹48,000 / sem", amenities: ["Attached Bath", "Study Desk", "Ceiling Fan", "LAN"] },
    { id: "RM-103", number: "A-103", block: "Block A (Boys)", floor: "1st Floor", sharing: "Double", ac: true, capacity: 2, occupants: 1, status: "Available", fee: "₹42,000 / sem", amenities: ["Twin Beds", "Study Tables", "AC", "Shared Attached Bath"] },
    { id: "RM-104", number: "A-104", block: "Block A (Boys)", floor: "1st Floor", sharing: "Double", ac: false, capacity: 2, occupants: 2, status: "Occupied", fee: "₹34,000 / sem", amenities: ["Twin Beds", "Study Tables", "Shared Bath"] },
    { id: "RM-105", number: "A-105", block: "Block A (Boys)", floor: "1st Floor", sharing: "Triple", ac: false, capacity: 3, occupants: 2, status: "Available", fee: "₹26,000 / sem", amenities: ["3 Beds", "Individual Wardrobes", "Shared Bath", "Ceiling Fan"] },
    { id: "RM-201", number: "A-201", block: "Block A (Boys)", floor: "2nd Floor", sharing: "Single", ac: true, capacity: 1, occupants: 1, status: "Occupied", fee: "₹65,000 / sem", amenities: ["AC", "Attached Bath", "Study Table", "Balcony"] },
    { id: "RM-202", number: "A-202", block: "Block A (Boys)", floor: "2nd Floor", sharing: "Double", ac: true, capacity: 2, occupants: 0, status: "Available", fee: "₹42,000 / sem", amenities: ["AC", "Twin Beds", "Attached Bath"] },
    { id: "RM-203", number: "A-203", block: "Block A (Boys)", floor: "2nd Floor", sharing: "Triple", ac: false, capacity: 3, occupants: 3, status: "Occupied", fee: "₹26,000 / sem", amenities: ["3 Beds", "Wardrobes", "Common Bath"] },
    { id: "RM-204", number: "A-204", block: "Block A (Boys)", floor: "2nd Floor", sharing: "Double", ac: false, capacity: 2, occupants: 0, status: "Under Maintenance", fee: "₹34,000 / sem", amenities: ["Painting & Geyser Repair in Progress"] },
    { id: "RM-301", number: "B-101", block: "Block B (Girls)", floor: "1st Floor", sharing: "Single", ac: true, capacity: 1, occupants: 0, status: "Available", fee: "₹65,000 / sem", amenities: ["Attached Bath", "Balcony", "Study Desk", "AC", "Full Wardrobe"] },
    { id: "RM-302", number: "B-102", block: "Block B (Girls)", floor: "1st Floor", sharing: "Single", ac: false, capacity: 1, occupants: 0, status: "Available", fee: "₹48,000 / sem", amenities: ["Attached Bath", "Study Desk", "Ceiling Fan"] },
    { id: "RM-303", number: "B-103", block: "Block B (Girls)", floor: "1st Floor", sharing: "Double", ac: true, capacity: 2, occupants: 1, status: "Available", fee: "₹42,000 / sem", amenities: ["AC", "Twin Study Setup", "Shared Bath", "Balcony"] },
    { id: "RM-304", number: "B-104", block: "Block B (Girls)", floor: "1st Floor", sharing: "Double", ac: false, capacity: 2, occupants: 2, status: "Occupied", fee: "₹34,000 / sem", amenities: ["Twin Beds", "Shared Bath"] },
    { id: "RM-305", number: "B-201", block: "Block B (Girls)", floor: "2nd Floor", sharing: "Triple", ac: false, capacity: 3, occupants: 1, status: "Available", fee: "₹26,000 / sem", amenities: ["Spacious", "3 Lockers", "Common Bath"] },
    { id: "RM-306", number: "B-202", block: "Block B (Girls)", floor: "2nd Floor", sharing: "Double", ac: true, capacity: 2, occupants: 0, status: "Available", fee: "₹42,000 / sem", amenities: ["AC", "Attached Bath", "Study Desks"] }
  ],

  complaints: [
    {
      id: "HD1021",
      student_name: "Rahul Verma",
      student_id: "STU2024041",
      room_number: "A-103",
      category: "WiFi Problems",
      description: "WiFi is connecting but shows 'No Internet Access' and captive portal page is timing out.",
      status: "In Progress",
      priority: "Medium",
      created_at: "2026-11-03T09:15:00.000Z",
      resolved_at: null,
      admin_notes: "Assigned to network engineer Manoj. Switch port on 1st Floor Block A being rebooted."
    },
    {
      id: "HD1022",
      student_name: "Ananya Iyer",
      student_id: "STU2024118",
      room_number: "B-201",
      category: "Water Supply",
      description: "Hot water geyser in 2nd Floor common bathroom is tripping the circuit breaker.",
      status: "Resolved",
      priority: "High",
      created_at: "2026-11-02T14:30:00.000Z",
      resolved_at: "2026-11-03T11:00:00.000Z",
      admin_notes: "Heating element replaced by plumber team. Tested and working properly."
    },
    {
      id: "HD1023",
      student_name: "Siddharth Rao",
      student_id: "STU2024072",
      room_number: "A-204",
      category: "Electricity Problems",
      description: "Ceiling fan making clicking loud grinding noise and running at very slow speed.",
      status: "In Progress",
      priority: "Low",
      created_at: "2026-11-03T16:45:00.000Z",
      resolved_at: null,
      admin_notes: "Capacitor and bearing replacement scheduled for today afternoon."
    },
    {
      id: "HD1024",
      student_name: "Meera Sen",
      student_id: "STU2024195",
      room_number: "B-103",
      category: "Room Maintenance",
      description: "Study desk drawer latch broken and window curtain rod loose.",
      status: "Pending",
      priority: "Medium",
      created_at: "2026-11-04T06:20:00.000Z",
      resolved_at: null,
      admin_notes: "Received. Carpenter assigned for inspection."
    }
  ],

  admin_config: {
    pin: "admin123",
    bot_name: "HostelBuddy AI",
    gemini_api_key: process.env.GEMINI_API_KEY || "",
    gemini_model: "gemini-2.5-flash",
    system_tone: "friendly, professional, empathetic, and highly resourceful"
  }
};

class HostelDatabase {
  constructor() {
    this.ensureDataFile();
  }

  ensureDataFile() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(DATA_FILE)) {
      this.saveData(initialSeedData);
    }
  }

  loadData() {
    try {
      this.ensureDataFile();
      const raw = fs.readFileSync(DATA_FILE, 'utf8');
      return JSON.parse(raw);
    } catch (err) {
      console.error("Error reading hostel database, recovering to seed data:", err);
      return initialSeedData;
    }
  }

  saveData(data) {
    try {
      const tempFile = `${DATA_FILE}.tmp`;
      fs.writeFileSync(tempFile, JSON.stringify(data, null, 2), 'utf8');
      fs.renameSync(tempFile, DATA_FILE);
      return true;
    } catch (err) {
      console.error("Error writing hostel database:", err);
      return false;
    }
  }

  // --- HOSTEL INFO ---
  getHostelInfo() {
    return this.loadData().hostel_info;
  }

  updateHostelInfo(updatedInfo) {
    const data = this.loadData();
    data.hostel_info = { ...data.hostel_info, ...updatedInfo };
    this.saveData(data);
    return data.hostel_info;
  }

  // --- MESS SCHEDULE ---
  getMessSchedule() {
    return this.loadData().mess_schedule;
  }

  updateMessTimings(timings) {
    const data = this.loadData();
    data.mess_schedule.timings = { ...data.mess_schedule.timings, ...timings };
    this.saveData(data);
    return data.mess_schedule;
  }

  updateMessMenu(day, menuDetails) {
    const data = this.loadData();
    if (!data.mess_schedule.weekly_menu[day]) {
      data.mess_schedule.weekly_menu[day] = {};
    }
    data.mess_schedule.weekly_menu[day] = { ...data.mess_schedule.weekly_menu[day], ...menuDetails };
    this.saveData(data);
    return data.mess_schedule.weekly_menu;
  }

  // --- RULES ---
  getRules() {
    return this.loadData().rules;
  }

  addRule(rule) {
    const data = this.loadData();
    const newId = `R${100 + data.rules.length + 1}`;
    const newRule = { id: newId, ...rule };
    data.rules.push(newRule);
    this.saveData(data);
    return newRule;
  }

  updateRule(id, updatedFields) {
    const data = this.loadData();
    const index = data.rules.findIndex(r => r.id === id);
    if (index !== -1) {
      data.rules[index] = { ...data.rules[index], ...updatedFields };
      this.saveData(data);
      return data.rules[index];
    }
    return null;
  }

  deleteRule(id) {
    const data = this.loadData();
    const filtered = data.rules.filter(r => r.id !== id);
    if (filtered.length !== data.rules.length) {
      data.rules = filtered;
      this.saveData(data);
      return true;
    }
    return false;
  }

  // --- ROOMS ---
  getRooms() {
    return this.loadData().rooms;
  }

  getAvailableRooms() {
    return this.loadData().rooms.filter(r => r.status === "Available");
  }

  addRoom(room) {
    const data = this.loadData();
    const newId = `RM-${Date.now().toString().slice(-4)}`;
    const newRoom = {
      id: newId,
      capacity: Number(room.capacity) || (room.sharing === "Single" ? 1 : room.sharing === "Double" ? 2 : 3),
      occupants: Number(room.occupants) || 0,
      status: room.status || "Available",
      amenities: Array.isArray(room.amenities) ? room.amenities : (room.amenities || "").split(',').map(s => s.trim()).filter(Boolean),
      ...room
    };
    data.rooms.push(newRoom);
    this.saveData(data);
    return newRoom;
  }

  updateRoom(id, updatedFields) {
    const data = this.loadData();
    const idx = data.rooms.findIndex(r => r.id === id || r.number.toLowerCase() === id.toLowerCase());
    if (idx !== -1) {
      if (typeof updatedFields.amenities === 'string') {
        updatedFields.amenities = updatedFields.amenities.split(',').map(s => s.trim()).filter(Boolean);
      }
      data.rooms[idx] = { ...data.rooms[idx], ...updatedFields };
      this.saveData(data);
      return data.rooms[idx];
    }
    return null;
  }

  deleteRoom(id) {
    const data = this.loadData();
    const filtered = data.rooms.filter(r => r.id !== id && r.number.toLowerCase() !== id.toLowerCase());
    if (filtered.length !== data.rooms.length) {
      data.rooms = filtered;
      this.saveData(data);
      return true;
    }
    return false;
  }

  // --- COMPLAINTS ---
  getComplaints() {
    return this.loadData().complaints;
  }

  getComplaintById(id) {
    const normalized = (id || '').trim().toUpperCase();
    return this.loadData().complaints.find(c => c.id.toUpperCase() === normalized);
  }

  createComplaint({ student_name, student_id, room_number, category, description, priority = "Medium" }) {
    const data = this.loadData();
    // Generate sequential ticket number HD1025, HD1026...
    let maxNum = 1024;
    data.complaints.forEach(c => {
      const match = c.id.match(/^HD(\d+)$/i);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxNum) maxNum = num;
      }
    });
    const nextId = `HD${maxNum + 1}`;

    const newComplaint = {
      id: nextId,
      student_name: student_name ? student_name.trim() : "Hostel Student",
      student_id: (student_id || "NOT-PROVIDED").trim().toUpperCase(),
      room_number: (room_number || "GENERAL").trim().toUpperCase(),
      category: category || "Other hostel-related problems",
      description: description ? description.trim() : "No details provided",
      status: "Pending",
      priority: priority,
      created_at: new Date().toISOString(),
      resolved_at: null,
      admin_notes: "Complaint received by AI Helpdesk. Awaiting team dispatch."
    };

    data.complaints.unshift(newComplaint); // newest first
    this.saveData(data);
    return newComplaint;
  }

  updateComplaintStatus(id, { status, admin_notes, priority }) {
    const data = this.loadData();
    const idx = data.complaints.findIndex(c => c.id.toUpperCase() === (id || '').trim().toUpperCase());
    if (idx !== -1) {
      if (status) data.complaints[idx].status = status;
      if (admin_notes !== undefined) data.complaints[idx].admin_notes = admin_notes;
      if (priority) data.complaints[idx].priority = priority;
      if (status === "Resolved" && !data.complaints[idx].resolved_at) {
        data.complaints[idx].resolved_at = new Date().toISOString();
      }
      this.saveData(data);
      return data.complaints[idx];
    }
    return null;
  }

  // --- ADMIN CONFIG & AI SETTINGS ---
  getAdminConfig() {
    return this.loadData().admin_config;
  }

  updateAdminConfig(updatedConfig) {
    const data = this.loadData();
    data.admin_config = { ...data.admin_config, ...updatedConfig };
    this.saveData(data);
    return data.admin_config;
  }
}

module.exports = new HostelDatabase();
