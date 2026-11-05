// ==========================================================
// CHAT INTERFACE & CONVERSATION CONTROLLER
// Meta AI / ChatGPT Inspired Real-time Engine
// ==========================================================

let conversationHistory = [];
let isWaitingForResponse = false;
let speechRecognitionInstance = null;
let isRecordingVoice = false;

// Format Markdown to Clean Safe HTML
function renderMarkdown(text) {
  if (!text) return "";

  let html = text
    // Escape HTML brackets
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  // Markdown Tables
  html = html.replace(/\|(.+)\|(\r?\n)\|([-:| ]+)\|(\r?\n)((?:\|.+?\|(?:\r?\n)?)+)/g, (match, headerRow, nl1, divider, nl2, bodyRows) => {
    const headers = headerRow.split('|').map(s => s.trim()).filter(Boolean);
    const headerHtml = `<thead><tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr></thead>`;
    
    const rows = bodyRows.trim().split('\n').map(row => {
      const cells = row.split('|').map(s => s.trim()).filter(Boolean);
      return `<tr>${cells.map(c => `<td>${c}</td>`).join('')}</tr>`;
    }).join('');

    return `<table>${headerHtml}<tbody>${rows}</tbody></table>`;
  });

  // Headers (### Header)
  html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
  html = html.replace(/^## (.*$)/gim, '<h2 style="font-size:1.15rem; color:#831843; margin:10px 0;">$1</h2>');

  // Bold (**bold**)
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

  // Inline Code (`code`)
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

  // Unordered Lists (- item or * item)
  html = html.replace(/^\s*[-*]\s+(.*$)/gim, '<li>$1</li>');
  html = html.replace(/(<li>.*<\/li>(\r?\n)?)+/g, '<ul>$&</ul>');

  // Links [text](url)
  html = html.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" style="color:#f43f5e; text-decoration:underline;">$1</a>');

  // Paragraphs
  html = html.split('\n\n').map(p => {
    if (p.startsWith('<h3>') || p.startsWith('<h2>') || p.startsWith('<ul>') || p.startsWith('<table>')) {
      return p;
    }
    return `<p>${p.replace(/\n/g, '<br>')}</p>`;
  }).join('');

  return html;
}

// Append User Message to Chat
function appendUserMessage(text) {
  const container = document.getElementById('chatMessages');
  const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const row = document.createElement('div');
  row.className = 'message-row user';
  row.innerHTML = `
    <div class="message-avatar">You</div>
    <div class="message-bubble-wrapper">
      <div class="message-author">You</div>
      <div class="message-bubble">
        <p>${text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\n/g, '<br>')}</p>
      </div>
      <div class="message-footer">
        <span class="message-time">${timeStr}</span>
      </div>
    </div>
  `;

  container.appendChild(row);
  scrollToBottom();
}

// Append Bot Message to Chat
function appendBotMessage(markdownText, suggestions = [], actionType = null, actionData = null) {
  const container = document.getElementById('chatMessages');
  const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const messageId = `msg-${Date.now()}`;

  const row = document.createElement('div');
  row.className = 'message-row bot';
  row.id = messageId;

  let actionHtml = '';
  if (actionType === 'complaint_prompt') {
    actionHtml = `
      <div class="chat-action-card">
        <div style="font-weight:700; color:#831843; font-size:0.95rem; margin-bottom:4px;">
          ⚡ Instant Complaint Assistant
        </div>
        <div style="font-size:0.85rem; color:#6b4356; margin-bottom:8px;">
          Detected Category: <strong>${actionData?.category || 'Room Maintenance'}</strong>
        </div>
        <button class="card-cta-btn" onclick="openComplaintWithCategory('${actionData?.category || 'Room Maintenance'}')">
          Open Pre-Filled Complaint Form
        </button>
      </div>
    `;
  } else if (actionType === 'room_list') {
    actionHtml = `
      <div class="chat-action-card">
        <button class="card-cta-btn" onclick="openModal('modal-rooms')">
          Explore Live Rooms & Pricing
        </button>
      </div>
    `;
  } else if (actionType === 'menu_view') {
    actionHtml = `
      <div class="chat-action-card">
        <button class="card-cta-btn" onclick="openModal('modal-mess')">
          View Interactive Weekly Menu
        </button>
      </div>
    `;
  }

  let suggestionsHtml = '';
  if (suggestions && suggestions.length > 0) {
    suggestionsHtml = `
      <div class="bot-suggestions">
        ${suggestions.map(s => `<button class="suggestion-pill" onclick="sendQuickPrompt('${s.replace(/'/g, "\\'")}')">${s}</button>`).join('')}
      </div>
    `;
  }

  row.innerHTML = `
    <div class="message-avatar">AI</div>
    <div class="message-bubble-wrapper">
      <div class="message-author">HostelBuddy AI</div>
      <div class="message-bubble">
        ${renderMarkdown(markdownText)}
        ${actionHtml}
      </div>
      ${suggestionsHtml}
      <div class="message-footer">
        <span class="message-time">${timeStr}</span>
        <div class="message-actions">
          <button class="msg-action-btn" onclick="copyMessageText('${messageId}')" title="Copy text">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
            Copy
          </button>
          <button class="msg-action-btn" onclick="speakMessageText('${messageId}')" title="Listen to response">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>
            Speak
          </button>
        </div>
      </div>
    </div>
  `;

  container.appendChild(row);
  scrollToBottom();
}

function openComplaintWithCategory(category) {
  openModal('modal-complaint');
  const catSelect = document.getElementById('compCategory');
  if (catSelect) {
    for (let i = 0; i < catSelect.options.length; i++) {
      if (catSelect.options[i].value.toLowerCase().includes(category.toLowerCase())) {
        catSelect.selectedIndex = i;
        break;
      }
    }
  }
}

function showTypingIndicator() {
  const ind = document.getElementById('typingIndicatorContainer');
  ind.style.display = 'block';
  scrollToBottom();
}

function hideTypingIndicator() {
  const ind = document.getElementById('typingIndicatorContainer');
  ind.style.display = 'none';
}

function scrollToBottom() {
  const container = document.getElementById('chatMessages');
  container.scrollTop = container.scrollHeight;
}

// Send Message Handler
async function sendMessage(text) {
  const trimmed = (text || "").trim();
  if (!trimmed || isWaitingForResponse) return;

  // Append user message
  appendUserMessage(trimmed);
  conversationHistory.push({ role: 'user', content: trimmed });

  // Clear input
  const input = document.getElementById('chatInput');
  input.value = '';
  autoResizeTextarea(input);

  // Disable send button while processing
  isWaitingForResponse = true;
  document.getElementById('sendBtn').disabled = true;
  showTypingIndicator();

  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: trimmed,
        history: conversationHistory.slice(-10) // keep last 10 messages for context
      })
    });

    const data = await res.json();
    hideTypingIndicator();

    const botReply = data.reply || "I received your message. How else can I help?";
    conversationHistory.push({ role: 'assistant', content: botReply });

    appendBotMessage(botReply, data.suggestions, data.action_type, data.action_data);

  } catch (err) {
    console.error("Chat error:", err);
    hideTypingIndicator();
    appendBotMessage(
      "I'm sorry, I encountered a temporary connection issue. Please check your internet or try asking again!",
      ["Hostel Rules", "Mess Timings", "Contact Warden"]
    );
  } finally {
    isWaitingForResponse = false;
    document.getElementById('sendBtn').disabled = false;
    input.focus();
  }
}

function handleChatSubmit(e) {
  e.preventDefault();
  const input = document.getElementById('chatInput');
  sendMessage(input.value);
}

function handleKeyDown(e) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    handleChatSubmit(e);
  }
}

function sendQuickPrompt(promptText) {
  sendMessage(promptText);
}

function autoResizeTextarea(textarea) {
  textarea.style.height = 'auto';
  textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
}

function clearChatHistory() {
  if (confirm("Clear conversation history and restart chat?")) {
    conversationHistory = [];
    const container = document.getElementById('chatMessages');
    // Keep only the welcome hero
    const welcome = document.getElementById('welcomeHero');
    container.innerHTML = '';
    if (welcome) container.appendChild(welcome);
  }
}

// Copy Message Content to Clipboard
function copyMessageText(rowId) {
  const row = document.getElementById(rowId);
  if (!row) return;
  const bubble = row.querySelector('.message-bubble');
  const text = bubble ? bubble.innerText : "";
  navigator.clipboard.writeText(text);
  alert("Message copied to clipboard!");
}

// Text-to-Speech (Speak Message aloud)
function speakMessageText(rowId) {
  if (!('speechSynthesis' in window)) {
    alert("Speech synthesis is not supported on this browser.");
    return;
  }
  const row = document.getElementById(rowId);
  if (!row) return;
  const bubble = row.querySelector('.message-bubble');
  const text = bubble ? bubble.innerText : "";

  window.speechSynthesis.cancel(); // stop any current speech
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 1.0;
  utterance.pitch = 1.0;
  window.speechSynthesis.speak(utterance);
}

// Speech-to-Text (Voice Typing)
function toggleSpeechRecognition() {
  const micBtn = document.getElementById('micBtn');

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    alert("Voice input is not supported in this browser. Please use Google Chrome or Microsoft Edge.");
    return;
  }

  if (isRecordingVoice && speechRecognitionInstance) {
    speechRecognitionInstance.stop();
    isRecordingVoice = false;
    micBtn.classList.remove('recording');
    return;
  }

  speechRecognitionInstance = new SpeechRecognition();
  speechRecognitionInstance.continuous = false;
  speechRecognitionInstance.interimResults = false;
  speechRecognitionInstance.lang = 'en-US';

  speechRecognitionInstance.onstart = () => {
    isRecordingVoice = true;
    micBtn.classList.add('recording');
  };

  speechRecognitionInstance.onresult = (event) => {
    const transcript = event.results[0][0].transcript;
    const input = document.getElementById('chatInput');
    input.value = (input.value ? input.value + ' ' : '') + transcript;
    autoResizeTextarea(input);
  };

  speechRecognitionInstance.onerror = (e) => {
    console.error("Speech recognition error:", e);
    isRecordingVoice = false;
    micBtn.classList.remove('recording');
  };

  speechRecognitionInstance.onend = () => {
    isRecordingVoice = false;
    micBtn.classList.remove('recording');
  };

  speechRecognitionInstance.start();
}
