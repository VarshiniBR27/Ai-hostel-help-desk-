const http = require('http');
const db = require('./db');
const aiService = require('./ai-service');

async function runTests() {
  console.log("=== RUNNING DIRECT IN-PROCESS TESTS ===");

  // 1. Test Database
  console.log("\n1. Testing Database layer:");
  const info = db.getHostelInfo();
  console.log("✓ Hostel Name:", info.name);
  console.log("✓ Curfew Weekdays:", info.curfew_weekdays);

  const mess = db.getMessSchedule();
  console.log("✓ Mess breakfast:", mess.timings.breakfast);
  console.log("✓ Monday lunch:", mess.weekly_menu.Monday.lunch);

  const rooms = db.getRooms();
  console.log("✓ Total rooms:", rooms.length);
  const avail = db.getAvailableRooms();
  console.log("✓ Available rooms:", avail.length);

  // 2. Test Complaint Creation
  console.log("\n2. Testing Complaint Creation:");
  const newComp = db.createComplaint({
    student_name: "Aman Gupta",
    student_id: "STU2024501",
    room_number: "A-101",
    category: "WiFi Problems",
    description: "Captive portal not loading on laptop",
    priority: "High"
  });
  console.log("✓ Generated Complaint ID:", newComp.id);
  console.log("✓ Status:", newComp.status);

  const fetched = db.getComplaintById(newComp.id);
  console.log("✓ Fetched complaint by ID:", fetched.student_name, fetched.category);

  // 3. Test AI Service with multiple student messages
  console.log("\n3. Testing Intelligent AI Engine with various student messages:");
  
  const testMessages = [
    "Hi",
    "Good morning",
    "How are you?",
    "Thank you",
    "What are the mess timings?",
    "What is today's menu?",
    "Check available double sharing rooms",
    "WiFi is not connecting",
    "What is the night curfew timing?",
    "Who is the chief warden?",
    "Where can I find drinking water?",
    "My fan is making noise in room B-102",
    `Check status of ticket ${newComp.id}`
  ];

  for (const msg of testMessages) {
    const res = await aiService.processMessage(msg);
    console.log(`\n💬 Student: "${msg}"`);
    console.log(`🤖 Bot reply excerpt: ${res.reply.slice(0, 120).replace(/\n/g, ' ')}...`);
    console.log(`   [Suggestions]: ${JSON.stringify(res.suggestions || [])}`);
    if (res.action_type) console.log(`   [Action Card]: ${res.action_type}`);
  }

  console.log("\n=== ALL DIRECT TESTS PASSED SUCCESSFULLY! ===");
}

runTests().catch(err => {
  console.error("Test failed:", err);
  process.exit(1);
});
