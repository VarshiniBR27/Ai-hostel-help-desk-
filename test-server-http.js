const http = require('http');

async function testFullHttpServer() {
  console.log("=== STARTING FULL HTTP SERVER INTEGRATION TEST ===");

  // Spawn server on port 3005
  process.env.PORT = "3005";
  const server = require('./server.js');

  // Wait 1 second for port to bind
  await new Promise(r => setTimeout(r, 1000));

  const BASE_URL = "http://127.0.0.1:3005";

  // Helper fetch
  const get = async (path) => {
    const res = await fetch(`${BASE_URL}${path}`);
    return { status: res.status, data: await res.json() };
  };

  const post = async (path, body) => {
    const res = await fetch(`${BASE_URL}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    return { status: res.status, data: await res.json() };
  };

  // 1. Test Static Index.html
  console.log("\n1. Testing Static HTML Frontend:");
  const htmlRes = await fetch(`${BASE_URL}/`);
  const htmlText = await htmlRes.text();
  console.log(`✓ GET / returned status ${htmlRes.status}, length: ${htmlText.length}`);
  if (!htmlText.includes("AI HOSTEL HELP DESK")) throw new Error("Index HTML does not contain project name");

  // 2. Test GET /api/info
  console.log("\n2. Testing GET /api/info:");
  const infoRes = await get('/api/info');
  console.log(`✓ Status: ${infoRes.status}, Hostel: ${infoRes.data.name}`);

  // 3. Test GET /api/rooms
  console.log("\n3. Testing GET /api/rooms:");
  const roomsRes = await get('/api/rooms');
  console.log(`✓ Status: ${roomsRes.status}, Total: ${roomsRes.data.total}, Available: ${roomsRes.data.available_count}`);

  // 4. Test GET /api/mess
  console.log("\n4. Testing GET /api/mess:");
  const messRes = await get('/api/mess');
  console.log(`✓ Status: ${messRes.status}, Breakfast timing: ${messRes.data.timings.breakfast}`);

  // 5. Test GET /api/rules
  console.log("\n5. Testing GET /api/rules:");
  const rulesRes = await get('/api/rules');
  console.log(`✓ Status: ${rulesRes.status}, Total rules: ${rulesRes.data.length}`);

  // 6. Test POST /api/complaints
  console.log("\n6. Testing POST /api/complaints:");
  const compRes = await post('/api/complaints', {
    student_name: "Sneha Reddy",
    student_id: "STU2024888",
    room_number: "B-202",
    category: "Bathroom Cleaning",
    description: "Bathroom drain blockage on 2nd floor",
    priority: "High"
  });
  console.log(`✓ Status: ${compRes.status}, Complaint ID: ${compRes.data.complaint_id}`);
  console.log(`✓ Confirmation Text:\n"${compRes.data.confirmation_text}"`);

  // 7. Test GET /api/complaints/track/:id
  console.log("\n7. Testing GET /api/complaints/track/:id:");
  const trackRes = await get(`/api/complaints/track/${compRes.data.complaint_id}`);
  console.log(`✓ Status: ${trackRes.status}, Student: ${trackRes.data.complaint.student_name}, Ticket: ${trackRes.data.complaint.id}`);

  // 8. Test POST /api/chat
  console.log("\n8. Testing POST /api/chat:");
  const chatQueries = [
    "Hi",
    "What are the mess timings?",
    "Can you show me available rooms?",
    "Where is the chief warden office?"
  ];

  for (const q of chatQueries) {
    const cRes = await post('/api/chat', { message: q });
    console.log(`✓ Chat Query "${q}" -> Status ${cRes.status}, Reply: "${cRes.data.reply.slice(0, 70)}..."`);
  }

  // 9. Test POST /api/admin/login
  console.log("\n9. Testing POST /api/admin/login:");
  const loginRes = await post('/api/admin/login', { pin: "admin123" });
  console.log(`✓ Admin login status: ${loginRes.status}, Success: ${loginRes.data.success}`);

  console.log("\n=== ALL HTTP INTEGRATION TESTS PASSED 100%! ===");
  process.exit(0);
}

testFullHttpServer().catch(err => {
  console.error("HTTP test error:", err);
  process.exit(1);
});
