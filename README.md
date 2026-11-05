# 🏢 AI HOSTEL HELP DESK

> A modern, fully functional, AI-powered virtual assistant and resolution center for college students, inspired by ChatGPT and Meta AI.

---

## 🌟 Overview

**AI HOSTEL HELP DESK** is designed to provide 24x7 intelligent, natural-language assistance for college hostel residents. Students can ask questions in their own words about daily food menus, room vacancies, curfew timings, out-pass leave procedures, and WiFi troubleshooting, or easily file and track maintenance complaints with unique ticket IDs (`HD1025`).

The application features a **dual-engine AI system**:
1. **Google Gemini Generative AI Engine**: Direct integration with Google Gemini (`gemini-2.5-flash` or `gemini-1.5-flash`) for advanced multi-turn conversations.
2. **Built-in Smart Conversational Engine**: Works out-of-the-box with zero API keys required, providing instant, natural, typo-tolerant conversational answers using the live hostel database.

---

## 🚀 Key Features

### 1. 💬 Modern ChatGPT / Meta AI Style Interface
- **Natural Language Dialogue**: Understands casual greetings, pleasantries, follow-ups, and phrasing variations.
- **Smart Formatting**: Clean markdown tables, bullet points, badges, and clickable action cards.
- **AI Typing Indicator**: Smooth animated pulsing dots showing AI response generation.
- **Voice Typing**: Web Speech API speech-to-text dictation button.
- **Text-to-Speech**: Listen to any assistant response aloud with one click.
- **Quick Suggestion Chips**: Contextual follow-up prompt pills beneath each message.
- **Clear Chat**: Easily reset the conversation thread anytime.

### 2. 🍽️ Mess Timings & Interactive Weekly Menu
- **Official Timings**:
  - 🌅 Breakfast: `7:30 AM - 9:30 AM`
  - ☀️ Lunch: `12:30 PM - 2:30 PM`
  - ☕ Snacks & Chai: `5:00 PM - 6:30 PM`
  - 🌙 Dinner: `7:30 PM - 9:30 PM`
- **Weekly Food Menu**: Day-wise tabbed viewer for Monday through Sunday.
- **Special Diets**: Sick diet requests (Khichdi, curd, toast) and mess rebate rules (authorized leave $\ge$ 3 days).

### 3. 🛏️ Live Room Availability & Sharing (Admin Controlled)
- **Verified Room Data**: Never displays fabricated room counts; queries actual administrator database.
- **Room Types**: Single-Sharing, Double-Sharing, Triple-Sharing, with AC and Non-AC filters.
- **Room Details**: Room number, block, floor, fee per semester, amenities, and current occupancy.
- **Procedures**: Complete guidelines for room change requests, mutual swaps, and roommate dispute resolution.

### 4. 📶 WiFi & Internet Troubleshooting
- **Network Credentials**: SSIDs (`HostelNet-Secure_5G` & `HostelNet-Std_2.4G`), captive portal login URL (`http://hostel.wifi.login`).
- **Guided Fixes**: Captive portal redirection (`neverssl.com`), quota limits (15 GB/day), DNS configuration (`8.8.8.8` & `1.1.1.1`), and randomized MAC address fix.
- **Instant Escalation**: Direct one-click prompt to raise a technical complaint ticket.

### 5. ⚠️ Complaint Registration & Live Ticket Tracker
- **Categories**: WiFi Problems, Water Supply, Electricity, Room Maintenance, Bathroom Cleaning, Food Quality, Roommate Issues, Security, and General.
- **Ticket Generation**: Generates unique IDs (e.g. `HD1025`) with immediate confirmation:
  > *"Your complaint has been successfully registered! Complaint ID: HD1025. Our hostel management team will review your complaint."*
- **Real-Time Tracking**: Students can enter any `HDxxxx` ID to view current status (`Pending`, `In Progress`, `Resolved`), priority, and technician notes.

### 6. 📋 Hostel Rules & Policies
- Full guidelines on **Entry & Night Curfew Timings** (9:30 PM weekdays, 10:00 PM weekends).
- **Biometric Attendance & Roll-Call** (9:45 PM daily).
- **Visitor Policy** (10:00 AM - 6:00 PM in ground floor lounge; zero tolerance for unauthorized room entry).
- **Leave & Digital Out-Pass** application workflow with automated parent consent.
- **Hostel ID Card** requirements and prohibited high-wattage electrical appliances.

### 7. 📞 Administration & Emergency Directory
- Chief Warden: **Dr. Rajesh Sharma** (+91 98765 43210, Admin Rm 101).
- Assistant Wardens for Boys & Girls blocks with office hours.
- 24x7 Security Gate desk (Intercom `100`), Campus Doctor & Health Clinic (Intercom `102`), and Ambulance (`108`).

### 8. ⚙️ Hostel Administrator Control Center
- **Security**: PIN-protected (`Default: admin123`).
- **Overview Dashboard**: Occupancy rate, total complaints, resolution rate, and pending metrics.
- **Complaints Manager**: Filter by status and category, update ticket status (`Pending` $\to$ `In Progress` $\to$ `Resolved`), and add technician remarks.
- **Room Inventory CRUD**: Add new rooms, toggle availability/maintenance, or remove rooms.
- **Mess Menu Manager**: Edit breakfast, lunch, snacks, and dinner for any day of the week, plus timings.
- **Rules Editor**: Add, edit, or delete official regulations.
- **AI Settings**: Input/update Google Gemini API key live, select model, test connection, or update PIN.

---

## 🛠️ Technology Stack

- **Frontend**: Modern HTML5, Responsive CSS3 (CSS Grid & Flexbox, Blue & White Palette), Vanilla JavaScript (Modular ES6).
- **Backend**: Node.js & Express.
- **Database**: Persistent JSON/Relational-style datastore with atomic writes in `data/hostel_data.json`.
- **AI Integration**: Google Gemini API (`gemini-2.5-flash`) + Intelligent Built-in Fallback NLP Processor.

---

## 📦 How to Run

### 1. Start the Server
```bash
cd "C:\Users\brvar\.gemini\antigravity\scratch\ai-hostel-helpdesk"
npm start
```

### 2. Access the Application
Open your web browser and navigate to:
```
http://localhost:3000
```

### 3. Admin Access
Click **Admin Panel** in the top navigation bar.
- **Default PIN**: `admin123`

---

## 🔑 (Optional) Configuring Google Gemini API Key

You can configure a Gemini API key in either of two easy ways:
1. **Via the Admin Dashboard**: Open Admin Panel $\to$ AI Engine & Settings $\to$ paste your key $\to$ Click "Test AI Connection" $\to$ "Save Settings".
2. **Via `.env` file**: Create a `.env` file in the project root:
   ```env
   PORT=3000
   GEMINI_API_KEY=your_gemini_api_key_here
   ```
*(Note: If no API key is provided, the application runs automatically using the smart built-in conversational engine without any setup!)*
