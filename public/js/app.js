// ==========================================================
// APP INITIALIZATION & GLOBAL HELPERS
// ==========================================================

document.addEventListener('DOMContentLoaded', () => {
  initGreeting();
  preloadHostelData();
});

function initGreeting() {
  const greetingEl = document.getElementById('welcomeGreeting');
  if (!greetingEl) return;

  const hour = new Date().getHours();
  let timeStr = "Hello";
  if (hour < 12) timeStr = "Good morning";
  else if (hour < 17) timeStr = "Good afternoon";
  else timeStr = "Good evening";

  greetingEl.innerText = `${timeStr}, Student! Welcome to AI Hostel Helpdesk`;
}

async function preloadHostelData() {
  try {
    // Pre-cache hostel info
    const res = await fetch('/api/info');
    if (res.ok) {
      cachedInfo = await res.json();
    }
  } catch (err) {
    console.warn("Could not pre-fetch hostel info:", err.message);
  }
}
