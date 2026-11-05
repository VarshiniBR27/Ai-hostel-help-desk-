const db = require('./db');

class AIService {
  constructor() {
    this.modelName = "gemini-2.5-flash";
  }

  getSystemContext() {
    const info = db.getHostelInfo();
    const mess = db.getMessSchedule();
    const rules = db.getRules();
    const rooms = db.getRooms();
    const availableRooms = rooms.filter(r => r.status === "Available");
    const complaints = db.getComplaints();

    // Get current day of week
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const today = days[new Date().getDay()];

    const singleAvail = availableRooms.filter(r => r.sharing === 'Single').length;
    const doubleAvail = availableRooms.filter(r => r.sharing === 'Double').length;
    const tripleAvail = availableRooms.filter(r => r.sharing === 'Triple').length;

    return `
You are "HostelBuddy AI", the modern, highly intelligent, friendly, and helpful virtual hostel assistant for ${info.name}.
You help college students with instant answers to all their hostel, mess, room, wifi, maintenance, and administrative queries.

CRITICAL INSTRUCTIONS:
- You must respond naturally like ChatGPT or Meta AI: warm, empathetic, clear, well-structured, and helpful.
- Support markdown formatting (bolding, bullet points, clean tables where appropriate).
- Always use the real data provided below. NEVER invent room availability numbers or fake hostel rules.
- If a student reports a broken appliance, maintenance issue, water problem, or wifi problem, provide helpful initial troubleshooting and actively invite them to raise an official complaint ticket (which assigns an immediate HD ID like HD1025).
- If you genuinely do not know something specific, be polite, explain honestly, and guide them directly to the Warden or Admin desk with the exact phone numbers below.

LIVE HOSTEL DATABASE SNAPSHOT:
1. GENERAL TIMINGS & CURFEW:
- Main Gate Opens: ${info.gates_open}
- Weekday Curfew (Sun-Thu): ${info.curfew_weekdays}
- Weekend Curfew (Fri-Sat): ${info.curfew_weekends}
- Roll Call / Attendance: ${info.attendance_time}
- ID Card: Mandatory RFID ID card must be tapped at security turnstile for entry/exit.

2. MESS TIMINGS & MENU:
- Breakfast: ${mess.timings.breakfast}
- Lunch: ${mess.timings.lunch}
- Snacks & Tea: ${mess.timings.snacks}
- Dinner: ${mess.timings.dinner}
- Today is: ${today}
- Today's Menu:
  * Breakfast: ${mess.weekly_menu[today]?.breakfast || "Standard Continental & South Indian"}
  * Lunch: ${mess.weekly_menu[today]?.lunch || "Dal, Sabzi, Roti, Rice, Salad"}
  * Evening Snacks: ${mess.weekly_menu[today]?.snacks || "Snacks & Chai"}
  * Dinner: ${mess.weekly_menu[today]?.dinner || "Special Dinner & Dessert"}
- Special Sick Diet: ${mess.special_notes}
- Mess Rebate: Available for authorized leave of 3 or more consecutive days (apply 2 days in advance).

3. WIFI & INTERNET DETAILS:
- 5GHz High-Speed SSID: ${info.wifi_ssid_5g}
- 2.4GHz Standard SSID: ${info.wifi_ssid_2g}
- Login Portal URL: ${info.wifi_portal_url} (or http://neverssl.com if portal does not popup automatically)
- Credentials: Use your Student Portal ID & Password
- DNS Settings if slow or error: Primary ${info.wifi_default_dns.split(',')[0]}, Secondary ${info.wifi_default_dns.split(',')[1]}
- Fair Usage Policy: High speed up to 15GB/day per student account.

4. ROOM AVAILABILITY (LIVE REAL DATA FROM SYSTEM):
- Total Registered Rooms: ${rooms.length}
- Available Rooms Now: ${availableRooms.length}
  * Single Sharing Available: ${singleAvail} room(s)
  * Double Sharing Available: ${doubleAvail} room(s)
  * Triple Sharing Available: ${tripleAvail} room(s)
- Sample Available Rooms:
${availableRooms.slice(0, 6).map(r => `  - Room ${r.number} (${r.block}, ${r.floor}): ${r.sharing} Sharing, ${r.ac ? 'AC' : 'Non-AC'}, Fee: ${r.fee}`).join('\n')}
- Room Change Request: Allowed during semester exchange window or on approved medical grounds through the Chief Warden's office.

5. WARDEN & CONTACT DIRECTORY:
${info.wardens.map(w => `- ${w.role}: ${w.name} | Phone: ${w.phone} | Office: ${w.office} (Hours: ${w.office_hours})`).join('\n')}
- Emergency Security Gate (24x7): ${info.emergency_contacts[0].number} (Intercom: ${info.emergency_contacts[0].intercom})
- Campus Doctor / Health Center: ${info.emergency_contacts[1].number}
- Ambulance: ${info.emergency_contacts[2].number}

6. FACILITIES:
${info.facilities.map(f => `- ${f.name}: ${f.description}`).join('\n')}

7. HOSTEL RULES SUMMARY:
${rules.map(r => `- [${r.category}] ${r.title}: ${r.description}`).join('\n')}
`;
  }

  // Check if an external Gemini API is configured
  async callGeminiAPI(apiKey, messages) {
    const config = db.getAdminConfig();
    const model = config.gemini_model || this.modelName;
    const systemPrompt = this.getSystemContext();

    // Format conversation history for Gemini API v1beta
    const contents = [];

    // Push previous messages
    for (const msg of messages) {
      contents.push({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }]
      });
    }

    const payload = {
      systemInstruction: {
        parts: [{ text: systemPrompt }]
      },
      contents: contents,
      generationConfig: {
        temperature: 0.7,
        topP: 0.95,
        maxOutputTokens: 1000
      }
    };

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal
    });

    clearTimeout(timeout);

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Gemini API error (${res.status}): ${errText}`);
    }

    const json = await res.json();
    const replyText = json.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!replyText) throw new Error("Empty response from Gemini API");

    return replyText;
  }

  // Built-in Smart Conversational AI Fallback
  // Understands greetings, typos, natural language, hostel queries, and live database context
  generateIntelligentResponse(userMessage, conversationHistory = []) {
    const rawMsg = (userMessage || "").trim();
    const msg = rawMsg.toLowerCase();
    const info = db.getHostelInfo();
    const mess = db.getMessSchedule();
    const rules = db.getRules();
    const rooms = db.getRooms();
    const complaints = db.getComplaints();

    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const currentDay = days[new Date().getDay()];

    // Follow-up chips generator helper
    const result = {
      reply: "",
      action_type: null, // 'complaint_prompt', 'room_list', 'menu_view', 'rules_view', etc.
      action_data: null,
      suggestions: []
    };

    // Helper: fuzzy search helper
    const hasWord = (...words) => words.some(w => msg.includes(w));
    const hasAll = (...words) => words.every(w => msg.includes(w));

    // 1. GREETINGS & PLEASANTRIES (Natural conversations)
    if (/^(hi|hello|hey|heyy|heya|hiya|hola|namaste|yo|greetings)(\b|[!.,\s])/i.test(msg)) {
      const greetings = [
        `Hello! 👋 Welcome to **AI Hostel Helpdesk**. How can I assist you with your hostel life today?`,
        `Hey there! Great to see you. I'm your virtual hostel assistant. What can I help you with today?`,
        `Hi! Welcome to the Hostel Helpdesk. Whether it's mess menus, room availability, WiFi issues, or rules, I'm here for you! How can I help?`
      ];
      result.reply = greetings[Math.floor(Math.random() * greetings.length)];
      result.suggestions = ["What are the mess timings?", "Hostel entry & curfew rules", "Check available rooms", "WiFi is not working"];
      return result;
    }

    if (/good\s*(morning|afternoon|evening|day)/i.test(msg)) {
      let timeGreet = "Good day";
      if (msg.includes("morning")) timeGreet = "Good morning! ☀️ Hope you're having an energizing start to your day.";
      else if (msg.includes("afternoon")) timeGreet = "Good afternoon! 🌤️ Hope your classes and day are going smoothly.";
      else if (msg.includes("evening")) timeGreet = "Good evening! 🌆 Hope you had a productive day.";
      
      result.reply = `${timeGreet} How can I help you with your hostel needs today?`;
      result.suggestions = ["What is for lunch/dinner today?", "Hostel gate closing time", "Raise a complaint"];
      return result;
    }

    if (hasWord("how are you", "how are u", "how r u", "how're you", "how do you do")) {
      result.reply = `I'm doing great, thank you for asking! 😊 I'm always active and ready to help you navigate hostel life at **${info.name}**. What's on your mind today?`;
      result.suggestions = ["Check room availability", "Today's mess menu", "Contact Warden"];
      return result;
    }

    if (hasWord("thank", "thanks", "thx", "appreciate", "helpful", "good job", "awesome")) {
      result.reply = `You're very welcome! 😊 Always happy to help. Let me know if you need anything else regarding mess, rooms, WiFi, or hostel rules. Have a wonderful time!`;
      result.suggestions = ["Hostel Rules", "Mess Timings", "Contact Details"];
      return result;
    }

    if (/^(bye|goodbye|see you|cya|take care|tata|gn|good night)(\b|[!.,\s])/i.test(msg)) {
      result.reply = `Goodbye! 👋 Have a great rest of your day, and remember to enter before the ${info.curfew_weekdays} curfew tonight. Take care!`;
      result.suggestions = ["Hostel Rules", "Mess Timings"];
      return result;
    }

    if (hasWord("who are you", "what are you", "what can you do", "introduce yourself", "your name")) {
      result.reply = `I am **HostelBuddy AI**, the official virtual assistant for **${info.name}**! 🎓🤖\n\nI can assist you with:\n- 🍽️ **Mess Details**: Timings, daily and weekly food menus, special sick diet.\n- 📋 **Hostel Rules**: Curfew timings, attendance, gate passes, visitor policy.\n- 📶 **WiFi & Internet**: Network login, DNS troubleshooting, password help.\n- 🛏️ **Rooms**: Real-time room availability (Single, Double, Triple sharing) and room change guidelines.\n- 🛠️ **Complaints**: Instant ticket registration (e.g. \`HD1025\`) and live status tracking.\n- 📞 **Warden Directory**: Emergency contacts, doctor hours, and maintenance desks.\n\nWhat would you like to explore?`;
      result.suggestions = ["Check Available Rooms", "Today's Mess Menu", "WiFi Troubleshooting", "Raise a Complaint"];
      return result;
    }

    // 2. COMPLAINT TRACKING BY ID (e.g., HD1021, HD1025)
    const ticketMatch = msg.match(/hd\s*(\d{4})/i);
    if (ticketMatch || hasWord("track complaint", "check complaint", "complaint status", "ticket status")) {
      if (ticketMatch) {
        const ticketId = `HD${ticketMatch[1]}`;
        const complaint = db.getComplaintById(ticketId);
        if (complaint) {
          result.reply = `### 📋 Complaint Status: **${complaint.id}**\n\n` +
            `- **Student**: ${complaint.student_name} (${complaint.student_id})\n` +
            `- **Room**: ${complaint.room_number}\n` +
            `- **Category**: ${complaint.category}\n` +
            `- **Issue Description**: "${complaint.description}"\n` +
            `- **Current Status**: **${complaint.status.toUpperCase()}** ${complaint.status === 'Resolved' ? '✅' : complaint.status === 'In Progress' ? '⚙️' : '⏳'}\n` +
            `- **Priority**: ${complaint.priority}\n` +
            `- **Registered At**: ${new Date(complaint.created_at).toLocaleString()}\n` +
            `- **Admin/Technician Remarks**: ${complaint.admin_notes || "Under review by hostel maintenance team."}\n\n` +
            (complaint.status === 'Resolved' ? `🎉 This issue was marked as resolved on ${new Date(complaint.resolved_at).toLocaleString()}.` : `Our team is working on resolving this as quickly as possible!`);
          result.action_type = "complaint_status";
          result.action_data = complaint;
          result.suggestions = ["Raise another complaint", "Contact Electrician/Plumber", "Hostel Rules"];
          return result;
        } else {
          result.reply = `I searched our records for complaint ticket **${ticketId}**, but couldn't find an active record with that ID. 🔍\n\nPlease check your Complaint ID number, or use the **Track Ticket** button above to browse. If you wish to register a new complaint, I can help you right away!`;
          result.suggestions = ["Raise a new complaint", "Contact Warden Office"];
          return result;
        }
      } else {
        result.reply = `To track your complaint status, please provide your **Complaint ID** (for example: \`HD1025\`), or click the **Track Ticket** button at the top!`;
        result.suggestions = ["HD1021", "HD1022", "Raise a new complaint"];
        return result;
      }
    }

    // 3. COMPLAINT REGISTRATION & MAINTENANCE BREAKDOWNS INTENT
    if (hasWord(
      "complaint", "issue", "problem", "broken", "not working", "damage", "damaged",
      "faulty", "leak", "leaking", "smell", "repair", "replace", "fix", "making noise",
      "noise in room", "not cooling", "no power", "spark", "flicker", "clogged", "overflowing",
      "fan", "geyser", "tap", "light not", "switchboard", "socket", "power cut"
    ) && !hasWord("track", "status", "rules", "rule", "mess timings")) {
      // Determine probable category
      let probableCategory = "Room Maintenance";
      if (hasWord("wifi", "wi-fi", "internet", "net", "slow", "disconnect", "portal")) probableCategory = "WiFi Problems";
      else if (hasWord("water", "geyser", "tap", "flush", "drain", "pipe", "cooler", "drinking water", "leak", "leaking")) probableCategory = "Water Supply";
      else if (hasWord("fan", "light", "tube", "bulb", "switch", "plug", "socket", "power", "electricity", "current", "ac", "air conditioner", "spark", "noise")) probableCategory = "Electricity Problems";
      else if (hasWord("bathroom", "toilet", "washroom", "dirty", "clean", "hygiene", "garbage", "trash", "smell")) probableCategory = "Bathroom Cleaning";
      else if (hasWord("food", "mess", "taste", "uncooked", "stale", "fly", "insects", "meal")) probableCategory = "Food Quality";
      else if (hasWord("roommate", "fighting", "shouting", "disturb", "loud")) probableCategory = "Roommate Issues";
      else if (hasWord("theft", "stolen", "security", "guard", "bully", "ragging", "harass")) probableCategory = "Security Problems";
      else if (hasWord("theft", "stolen", "security", "guard", "bully", "ragging", "harass")) probableCategory = "Security Problems";

      result.reply = `I understand you are experiencing an issue (**${probableCategory}**). 🛠️\n\nI can help you lodge an official complaint ticket right away so our maintenance team can be dispatched. You can either:\n\n1. Click the **[⚡ Open Complaint Form]** button below to submit your details.\n2. Or reply directly with your:\n   - **Name**\n   - **Student ID**\n   - **Room Number**\n   - **Short Description of the issue**\n\nOnce submitted, you will receive a unique ticket ID (like \`HD1025\`) that you can track anytime!`;
      result.action_type = "complaint_prompt";
      result.action_data = { category: probableCategory };
      result.suggestions = ["Open Complaint Form", "WiFi Troubleshooting", "Contact Warden"];
      return result;
    }

    // 4. MESS INFORMATION & TIMINGS & FOOD MENU
    if (hasWord("mess", "food", "menu", "breakfast", "lunch", "dinner", "snack", "snacks", "eat", "meal", "chai", "tea", "roti", "curry", "rice", "sweet")) {
      // Check if asking about timings specifically
      if (hasWord("timing", "timings", "time", "hours", "when")) {
        result.reply = `### 🍽️ **Official Mess Timings at ${info.name}**\n\n` +
          `| Meal | Timings |\n` +
          `| :--- | :--- |\n` +
          `| 🌅 **Breakfast** | \`${mess.timings.breakfast}\` |\n` +
          `| ☀️ **Lunch** | \`${mess.timings.lunch}\` |\n` +
          `| ☕ **Evening Snacks & Tea** | \`${mess.timings.snacks}\` |\n` +
          `| 🌙 **Dinner** | \`${mess.timings.dinner}\` |\n\n` +
          `💡 *Note: Entry to the mess hall closes 15 minutes before closing time. Sick diet is also available upon 2 hours advance notice!*`;
        result.suggestions = ["What is today's menu?", "Weekly food menu", "Sick diet options", "Mess rebate rules"];
        return result;
      }

      // Check if asking for a specific day's menu
      let targetDay = currentDay;
      for (const d of days) {
        if (msg.includes(d.toLowerCase())) {
          targetDay = d;
          break;
        }
      }
      if (msg.includes("tomorrow")) {
        const tomorrowIndex = (new Date().getDay() + 1) % 7;
        targetDay = days[tomorrowIndex];
      }

      if (hasWord("weekly", "all week", "full menu", "whole week")) {
        result.reply = `### 📅 **Weekly Mess Menu Overview**\n\nClick the **View Weekly Menu** button to explore our complete interactive Monday to Sunday menu, or ask me for any specific day (e.g. *"What is the menu for Wednesday?"*)!`;
        result.action_type = "menu_view";
        result.action_data = mess.weekly_menu;
        result.suggestions = ["Today's Menu", "Tomorrow's Menu", "Mess Timings"];
        return result;
      }

      const dayMenu = mess.weekly_menu[targetDay] || mess.weekly_menu["Monday"];
      result.reply = `### 🍽️ **Mess Menu for ${targetDay}** ${targetDay === currentDay ? '(Today)' : ''}\n\n` +
        `- 🌅 **Breakfast (${mess.timings.breakfast})**:\n  ${dayMenu.breakfast}\n\n` +
        `- ☀️ **Lunch (${mess.timings.lunch})**:\n  ${dayMenu.lunch}\n\n` +
        `- ☕ **Snacks & Tea (${mess.timings.snacks})**:\n  ${dayMenu.snacks}\n\n` +
        `- 🌙 **Dinner (${mess.timings.dinner})**:\n  ${dayMenu.dinner}\n\n` +
        `🥗 *Special Diet*: ${mess.special_notes}`;
      result.action_type = "menu_view";
      result.suggestions = ["Tomorrow's Menu", "Mess Timings", "Mess Rebate / Holidays", "Report Food Quality"];
      return result;
    }

    // 5. WIFI & INTERNET PROBLEMS & PASSWORD
    if (hasWord("wifi", "wi-fi", "internet", "network", "lan", "connection", "portal", "password", "ssid", "slow net", "disconnect")) {
      if (hasWord("password", "login", "credentials", "how to connect", "ssid")) {
        result.reply = `### 📶 **Hostel Wi-Fi Login & Credentials**\n\n` +
          `- **5GHz High-Speed SSID**: \`${info.wifi_ssid_5g}\` (Recommended for streaming & downloads)\n` +
          `- **2.4GHz Standard SSID**: \`${info.wifi_ssid_2g}\` (Better range through hostel walls)\n` +
          `- **Login Portal URL**: [${info.wifi_portal_url}](${info.wifi_portal_url})\n` +
          `- **Username**: Your Student Registration ID (e.g. \`STU2024...\`)\n` +
          `- **Password**: Your University Student ERP portal password\n\n` +
          `⚠️ *Remember to disable "Private MAC Address" or "Randomized MAC" on your device settings for the hostel network so your session stays active.*`;
        result.suggestions = ["WiFi not connecting troubleshooting", "Slow internet fix", "Raise a WiFi complaint"];
        return result;
      }

      // General WiFi troubleshooting
      result.reply = `### 📶 **WiFi Troubleshooting Guide**\n\n` +
        `If you are experiencing issues with the hostel internet, please try these quick fixes:\n\n` +
        `1. **Captive Portal Not Opening?**\n` +
        `   - Open your browser in Incognito mode and type \`http://neverssl.com\` or \`http://1.1.1.1\` to force the login portal redirect.\n\n` +
        `2. **WiFi Shows "Connected, No Internet"?**\n` +
        `   - Your daily quota (15 GB/day) may have hit the threshold, or the session timed out. Visit \`${info.wifi_portal_url}\` to re-authenticate.\n\n` +
        `3. **Slow Speed or High Ping?**\n` +
        `   - Switch from \`${info.wifi_ssid_2g}\` to **\`${info.wifi_ssid_5g}\`**.\n` +
        `   - Configure custom DNS on your laptop/phone: **Primary: 8.8.8.8**, **Secondary: 1.1.1.1**.\n\n` +
        `4. **Frequent Disconnections?**\n` +
        `   - Go to WiFi Settings on your phone/laptop > Select HostelNet > Change MAC Address Type from "Randomized" to **"Device / Phone MAC"**.\n\n` +
        `If your problem persists, I can file a priority maintenance ticket for you right away!`;
      result.action_type = "wifi_help";
      result.suggestions = ["Raise a WiFi Complaint", "WiFi Password / Login Details", "Contact IT Desk"];
      return result;
    }

    // 6. ROOM AVAILABILITY AND SHARING (Uses REAL data from DB!)
    if (hasWord("sharing", "single", "double", "triple", "occupancy", "vacant", "availab", "bed", "allotment", "hostel fee", "room change", "room swap", "roommate", "which room", "room availability") || (hasWord("room", "rooms") && hasWord("available", "vacant", "check", "see", "show", "get", "find", "list", "price", "cost", "fee", "change"))) {
      const availableRooms = rooms.filter(r => r.status === "Available");
      const singleAvail = availableRooms.filter(r => r.sharing === 'Single');
      const doubleAvail = availableRooms.filter(r => r.sharing === 'Double');
      const tripleAvail = availableRooms.filter(r => r.sharing === 'Triple');

      if (hasWord("change", "swap", "shift", "transfer")) {
        result.reply = `### 🔄 **Hostel Room Change Procedure**\n\n` +
          `1. **Eligibility**: Room change requests are entertained during the designated window (first 2 weeks of each semester) or on valid medical/compassionate grounds.\n` +
          `2. **Mutual Swap**: If you and another student mutually agree to exchange rooms, both must submit a co-signed application to the Warden.\n` +
          `3. **Procedure**:\n` +
          `   - Obtain the Room Reallocation Form from the Chief Warden's office.\n` +
          `   - Attach written justification (or medical certificate if applicable).\n` +
          `   - Submit to **${info.wardens[0].name}** (Chief Warden) between ${info.wardens[0].office_hours}.\n` +
          `   - Once approved, security will update your biometric door & gate record.`;
        result.suggestions = ["Check Available Rooms", "Contact Chief Warden", "Roommate dispute help"];
        return result;
      }

      if (hasWord("roommate", "partner", "conflict", "problem with roommate")) {
        result.reply = `### 🤝 **Roommate Mediation & Support**\n\n` +
          `Living with roommates is a significant part of university life. If you're experiencing conflicts:\n\n` +
          `1. **Initial Step**: Have an open, calm conversation about quiet hours, cleaning schedules, and study timings.\n` +
          `2. **Floor Counselor**: You can reach out to your Floor Resident Assistant or Assistant Warden (**${info.wardens[1].name}** for Boys / **${info.wardens[2].name}** for Girls).\n` +
          `3. **Formal Escalation**: If issues persist (e.g. repeated disruption, bullying, hygiene negligence), submit a confidential complaint ticket under **"Roommate & Noise Issues"** and our hostel administration will intervene.`;
        result.suggestions = ["Raise a confidential complaint", "Contact Assistant Warden"];
        return result;
      }

      // Live Room Availability response using real DB data
      result.reply = `### 🛏️ **Live Room Availability at ${info.name}**\n\n` +
        `Here is the verified, real-time availability from our hostel administration database:\n\n` +
        `- **Total Available Rooms**: **${availableRooms.length}**\n` +
        `- 🟢 **Single-Sharing**: **${singleAvail.length}** room(s) available (₹48,000 - ₹65,000 / sem)\n` +
        `- 🟢 **Double-Sharing**: **${doubleAvail.length}** room(s) available (₹34,000 - ₹42,000 / sem)\n` +
        `- 🟢 **Triple-Sharing**: **${tripleAvail.length}** room(s) available (₹26,000 / sem)\n\n` +
        `**Featured Available Rooms Right Now:**\n` +
        availableRooms.slice(0, 4).map(r => `• **Room ${r.number}** (${r.block}, ${r.floor}) — **${r.sharing} Sharing**, ${r.ac ? '❄️ AC' : 'Non-AC'}, Fee: \`${r.fee}\` (Amenities: ${r.amenities.slice(0, 3).join(', ')})`).join('\n') +
        `\n\n*Click the **Explore Rooms** button below to view the full inventory, filter by block/sharing type, or request allocation!*`;
      result.action_type = "room_list";
      result.action_data = availableRooms;
      result.suggestions = ["Single sharing rooms only", "Double sharing with AC", "How to apply for room change", "Hostel Rules"];
      return result;
    }

    // 7. HOSTEL RULES, ENTRY, EXIT, TIMINGS, CURFEW, VISITORS, LEAVE
    if (hasWord("rule", "rules", "curfew", "timing", "entry", "exit", "gate", "leave", "outpass", "out-pass", "visitor", "visitors", "parent", "guest", "id card", "cleanliness", "discipline", "alcohol", "smoking", "appliance", "heater", "quiet hour", "attendance", "roll call")) {
      if (hasWord("curfew", "entry", "exit", "gate", "night", "late")) {
        result.reply = `### 🚪 **Hostel Entry & Night Curfew Timings**\n\n` +
          `- 🌅 **Main Gates Open**: **${info.gates_open}**\n` +
          `- 🌙 **Night Curfew (Sunday - Thursday)**: **${info.curfew_weekdays}**\n` +
          `- 🌙 **Night Curfew (Friday - Saturday)**: **${info.curfew_weekends}**\n` +
          `- 📋 **Mandatory Roll-Call / Biometric Attendance**: **${info.attendance_time}**\n\n` +
          `⚠️ **Late Entry Policy**: Late arrival requires signing the security register and immediate automated SMS to registered parents. 3 late entries in a semester lead to disciplinary action.`;
        result.suggestions = ["How to apply for night leave?", "Visitor policy", "Hostel ID Card rules"];
        return result;
      }

      if (hasWord("leave", "outpass", "out-pass", "permission", "go home", "weekend", "vacation")) {
        result.reply = `### 📝 **Hostel Leave & Out-Pass Procedure**\n\n` +
          `1. **Digital Application**: Submit your leave request on the hostel student portal at least **24 hours prior** to departure.\n` +
          `2. **Parent Consent**: An automated verification link/SMS is sent to your registered guardian's mobile number. Once they click 'Approve', the out-pass is validated.\n` +
          `3. **Security Gate**: Scan your RFID Hostel ID Card at the security gate turnstile. The security guard will verify your approved digital pass.\n` +
          `4. **Mess Rebate**: If your leave exceeds 3 consecutive days, your mess account will automatically qualify for a billing rebate!`;
        result.suggestions = ["Curfew timings", "Mess rebate rules", "Contact Warden"];
        return result;
      }

      if (hasWord("visitor", "parent", "guest", "friend", "outside")) {
        result.reply = `### 👥 **Visitor & Guest Policy**\n\n` +
          `- **Visiting Hours**: **10:00 AM – 6:00 PM** daily.\n` +
          `- **Designated Area**: Parents and visitors may only meet students in the **Ground Floor Visitor Lounge**.\n` +
          `- **Residential Corridors**: Strict policy — NO outside guests or opposite-gender visitors are permitted in hostel rooms/floors.\n` +
          `- **Overnight Stay for Parents**: Guest rooms on campus are available upon 48-hour prior booking through the Chief Warden's office at ₹800/night.`;
        result.suggestions = ["Hostel Rules", "Contact Chief Warden", "Curfew timings"];
        return result;
      }

      // General rules summary
      result.reply = `### 📋 **Key Hostel Rules & Discipline Guidelines**\n\n` +
        rules.slice(0, 5).map(r => `• **${r.title}**: ${r.description}`).join('\n\n') +
        `\n\n*Click the **Hostel Rules** button above to view all formal hostel guidelines.*`;
      result.action_type = "rules_view";
      result.suggestions = ["Curfew & Timings", "Leave Application Process", "Visitor Policy", "ID Card Rules"];
      return result;
    }

    // 8. GENERAL STUDENT QUESTIONS & FACILITIES (Drinking water, Warden, Doctor, Laundry, Gym, Maintenance)
    if (hasWord("water", "drinking water", "water cooler", "ro")) {
      result.reply = `### 💧 **Drinking Water Facilities**\n\n` +
        `- Purified **Commercial RO Water Dispensers** (with both Cold & Normal water options) are situated on **every floor** near the central staircase in both Block A and Block B.\n` +
        `- Water filters are serviced and sanitized bi-weekly.\n` +
        `- If a dispenser is leaking or dispensing warm water, please let me know and I will file an instant maintenance ticket!`;
      result.suggestions = ["Report water cooler issue", "Mess timings", "Contact Plumber Desk"];
      return result;
    }

    if (hasWord("warden", "chief warden", "contact", "phone", "office", "call", "management", "administration")) {
      result.reply = `### 📞 **Hostel Administration & Warden Directory**\n\n` +
        info.wardens.map(w => `• **${w.role}**: **${w.name}**\n  - Phone: \`${w.phone}\` | Email: \`${w.email}\`\n  - Office: ${w.office}\n  - Available Hours: *${w.office_hours}*`).join('\n\n') +
        `\n\n🚨 **24x7 Emergency Security Desk**: \`${info.emergency_contacts[0].number}\` (Intercom: ${info.emergency_contacts[0].intercom})`;
      result.action_type = "warden_info";
      result.suggestions = ["Hostel Rules", "Raise a Complaint", "Medical / Health Center"];
      return result;
    }

    if (hasWord("doctor", "health", "hospital", "clinic", "ambulance", "sick", "ill", "medicine", "fever", "injury")) {
      result.reply = `### 🏥 **Campus Health Center & Emergency Care**\n\n` +
        `- **Campus Doctor**: Dr. Anita Roy (Health Center, Ground Floor Admin Wing)\n` +
        `- **Clinic Hours**: 8:00 AM - 9:00 PM\n` +
        `- **Emergency Intercom**: \`102\` | Direct Phone: \`${info.emergency_contacts[1].number}\`\n` +
        `- **24x7 Ambulance on Campus**: Call **108** or \`${info.emergency_contacts[2].number}\`\n` +
        `- **First-Aid Box**: Available at the Ground Floor Security Desk of both Block A and Block B with basic first-aid supplies and thermometer.\n` +
        `- **Mess Sick Diet**: If you are unwell, request light Khichdi, curd, and toast by informing the Mess Supervisor.`;
      result.suggestions = ["Request sick diet", "Emergency Security Contact", "Apply for medical leave"];
      return result;
    }

    if (hasWord("laundry", "wash", "washing machine", "clothes", "dryer", "gym", "sports", "study room")) {
      result.reply = `### 🏢 **Hostel Amenities & Facilities**\n\n` +
        info.facilities.map(f => `• **${f.name}**: ${f.description}`).join('\n\n');
      result.suggestions = ["Hostel Rules", "Mess Timings", "Check Available Rooms"];
      return result;
    }

    // 9. SMART NATURAL CONVERSATION FALLBACK
    // If none of the specific modules matched, analyze sentence semantics and give a helpful, contextual response
    result.reply = `Thank you for reaching out! While I'm looking into your query about *"**${rawMsg.slice(0, 50)}**"*, here is how I can best assist you right away:\n\n` +
      `- 📋 **Hostel Rules & Curfew**: Gates open at ${info.gates_open}, curfew is ${info.curfew_weekdays}.\n` +
      `- 🍽️ **Today's Meals**: Breakfast (${mess.timings.breakfast}), Lunch (${mess.timings.lunch}), Dinner (${mess.timings.dinner}).\n` +
      `- 📶 **WiFi Support**: Connect to \`${info.wifi_ssid_5g}\` with your student credentials.\n` +
      `- 🛏️ **Room Availability**: We currently have **${rooms.filter(r => r.status === 'Available').length} verified rooms available**.\n` +
      `- 🛠️ **Hostel Complaints**: You can register a ticket for quick technician dispatch.\n\n` +
      `Could you please clarify your request, or pick one of the quick options below? If it's an urgent matter, Chief Warden **${info.wardens[0].name}** can be reached at \`${info.wardens[0].phone}\`.`;
    result.suggestions = ["Hostel Rules", "Today's Mess Menu", "Available Rooms", "WiFi Help", "Raise a Complaint", "Contact Warden"];
    return result;
  }

  // Master handler that tries Gemini first (if key configured), else falls back seamlessly
  async processMessage(userMessage, conversationHistory = []) {
    const config = db.getAdminConfig();
    const apiKey = config.gemini_api_key || process.env.GEMINI_API_KEY;

    if (apiKey && apiKey.trim().length > 10) {
      try {
        const geminiReply = await this.callGeminiAPI(apiKey.trim(), [
          ...conversationHistory,
          { role: 'user', content: userMessage }
        ]);

        return {
          reply: geminiReply,
          source: 'gemini-ai',
          action_type: null,
          action_data: null,
          suggestions: ["Mess Timings", "Available Rooms", "Raise Complaint", "Hostel Rules"]
        };
      } catch (err) {
        console.warn("Gemini API call failed or timed out, seamlessly engaging smart local engine:", err.message);
        // Fall back gracefully to high-intelligence local conversational engine
      }
    }

    const localResult = this.generateIntelligentResponse(userMessage, conversationHistory);
    localResult.source = 'hostel-ai-engine';
    return localResult;
  }
}

module.exports = new AIService();
