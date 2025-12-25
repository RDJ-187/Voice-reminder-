// Main App Entry Point

// --- State Management ---
const state = {
    reminders: [],
    notes: [],
    logs: [],
    timer: {
        intervalId: null,
        remainingSeconds: 0,
        originalSeconds: 0
    },
    theme: 'light'
};

// --- Selectors ---
const DOM = {
    app: document.getElementById('app'),
    views: {
        home: document.getElementById('view-home'),
        add: document.getElementById('view-add'),
        timer: document.getElementById('view-timer'),
        notes: document.getElementById('view-notes'),
        logs: document.getElementById('view-logs'),
    },
    navItems: document.querySelectorAll('.nav-item'),
    pageTitle: document.getElementById('page-title'),
    themeToggle: document.getElementById('theme-toggle'),
    // Forms & Lists
    addReminderForm: document.getElementById('add-reminder-form'),
    reminderList: document.getElementById('reminder-list'),
    homeEmptyState: document.getElementById('home-empty-state'),
    logsList: document.getElementById('logs-list'),
    notesList: document.getElementById('notes-list'),
    noteEditor: document.getElementById('note-editor'),
    // Timer
    timerCountdown: document.getElementById('timer-countdown'),
    timerMinutes: document.getElementById('timer-minutes'),
    timerMessage: document.getElementById('timer-message'),
    btnStartTimer: document.getElementById('start-timer'),
    btnStopTimer: document.getElementById('stop-timer'),
    // Audio
    silentAudio: document.getElementById('silent-audio')
};

// --- Initialization ---
function init() {
    loadData();
    setupEventListeners();
    setupTheme();
    renderReminders();
    renderNotes();
    renderLogs();
    
    // Request Notification Permission
    if ("Notification" in window) {
        Notification.requestPermission();
    }
    
    // Start the Clock/Scheduler
    setInterval(checkReminders, 1000);
}

// --- Data Persistence ---
function loadData() {
    const savedReminders = localStorage.getItem('reminders');
    const savedNotes = localStorage.getItem('notes');
    const savedLogs = localStorage.getItem('logs');
    const savedTheme = localStorage.getItem('theme');

    if (savedReminders) state.reminders = JSON.parse(savedReminders);
    if (savedNotes) state.notes = JSON.parse(savedNotes);
    if (savedLogs) state.logs = JSON.parse(savedLogs);
    if (savedTheme) state.theme = savedTheme;
}

function saveData() {
    localStorage.setItem('reminders', JSON.stringify(state.reminders));
    localStorage.setItem('notes', JSON.stringify(state.notes));
    localStorage.setItem('logs', JSON.stringify(state.logs));
    localStorage.setItem('theme', state.theme);
}

// --- Navigation ---
function navigateTo(targetId) {
    // Hide all views
    Object.values(DOM.views).forEach(view => view.classList.add('hidden'));
    Object.values(DOM.views).forEach(view => view.classList.remove('active'));
    
    // Show target view
    const targetView = document.getElementById(targetId);
    if (targetView) {
        targetView.classList.remove('hidden');
        targetView.classList.add('active');
    }

    // Update Nav
    DOM.navItems.forEach(item => {
        if (item.dataset.target === targetId) {
            item.classList.add('active');
            
            // Update Title based on view
            const span = item.querySelector('span');
            if (span) DOM.pageTitle.textContent = span.textContent;
        } else {
            item.classList.remove('active');
        }
    });

    // Special logic for Add view -> change title
    if (targetId === 'view-add') DOM.pageTitle.textContent = "New Reminder";
}

// --- Theme ---
function setupTheme() {
    document.documentElement.setAttribute('data-theme', state.theme);
    updateThemeIcon();
}

function toggleTheme() {
    state.theme = state.theme === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', state.theme);
    updateThemeIcon();
    saveData();
}

function updateThemeIcon() {
    const icon = DOM.themeToggle.querySelector('i');
    if (state.theme === 'dark') {
        icon.className = 'fas fa-sun';
    } else {
        icon.className = 'fas fa-moon';
    }
}

// --- Scheduler & Logic ---
function checkReminders() {
    const now = new Date();
    
    state.reminders.forEach(reminder => {
        if (!reminder.active) return;
        
        const reminderTime = new Date(reminder.time);
        
        // Check if time is reached (within a small buffer, e.g., this second)
        // We use a flag 'triggered' to prevent double firing, but simpler is comparing minutes/seconds
        if (now >= reminderTime && !reminder.triggered) {
            triggerAlarm(reminder);
        }
    });
}

function triggerAlarm(reminder) {
    reminder.triggered = true;
    reminder.active = false; // Disable after one-time use (or handle recurring later)
    saveData();
    renderReminders(); // Update UI to show it's gone/done

    // 1. Play TTS
    speak(reminder.text);

    // 2. Add to Log
    addLog(reminder.text, 'Alarm', 'Played');

    // 3. Show Notification
    if (Notification.permission === "granted") {
        new Notification("Voice Reminder", {
            body: reminder.text,
            icon: '/icon.png' // todo: add icon
        });
    }

    // 4. Update UI logs
    renderLogs();
}

// --- Text-to-Speech ---
function speak(text) {
    if (!('speechSynthesis' in window)) {
        alert("Text-to-Speech not supported in this browser.");
        return;
    }
    
    // Cancel any current speaking
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    // You can customize voice, rate, pitch here
    // utterance.rate = 1.0;
    
    window.speechSynthesis.speak(utterance);
}

// --- Core Features: Reminders ---
function addReminder(text, timeString) {
    const reminder = {
        id: Date.now(),
        text: text,
        time: timeString, // ISO string from input
        active: true,
        triggered: false
    };
    
    state.reminders.push(reminder);
    // Sort logic could go here
    state.reminders.sort((a, b) => new Date(a.time) - new Date(b.time));
    
    saveData();
    renderReminders();
    navigateTo('view-home');
}

function deleteReminder(id) {
    state.reminders = state.reminders.filter(r => r.id !== id);
    saveData();
    renderReminders();
}

function renderReminders() {
    DOM.reminderList.innerHTML = '';
    
    const activeReminders = state.reminders.filter(r => r.active); // active and not triggered

    if (activeReminders.length === 0) {
        DOM.homeEmptyState.style.display = 'flex';
        return;
    }
    
    DOM.homeEmptyState.style.display = 'none';

    activeReminders.forEach(reminder => {
        const date = new Date(reminder.time);
        const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const dateStr = date.toLocaleDateString();

        const el = document.createElement('li');
        el.className = 'reminder-item';
        el.innerHTML = `
            <div class="reminder-header">
                <span class="reminder-time">${timeStr}</span>
                <button class="delete-btn" onclick="appDeleteReminder(${reminder.id})">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
            <div class="reminder-text">${reminder.text}</div>
            <div style="font-size: 0.8rem; color: var(--text-secondary); margin-top: 4px;">${dateStr}</div>
        `;
        DOM.reminderList.appendChild(el);
    });
}

// Global scope wrapper for onclick in HTML
window.appDeleteReminder = (id) => deleteReminder(id);

// --- Core Features: Timer ---
// Simplified timer logic for MVP
function startTimer() {
    const minutes = parseInt(DOM.timerMinutes.value);
    const message = DOM.timerMessage.value || "Timer finished";
    
    if (!minutes || minutes <= 0) return;

    const seconds = minutes * 60;
    state.timer.remainingSeconds = seconds;
    state.timer.originalSeconds = seconds;
    state.timer.message = message;

    updateTimerDisplay();
    DOM.btnStartTimer.disabled = true;
    DOM.btnStopTimer.disabled = false;
    DOM.timerMinutes.disabled = true;
    
    state.timer.intervalId = setInterval(() => {
        state.timer.remainingSeconds--;
        updateTimerDisplay();

        if (state.timer.remainingSeconds <= 0) {
            stopTimer("finished");
        }
    }, 1000);
}

function stopTimer(reason) {
    clearInterval(state.timer.intervalId);
    state.timer.intervalId = null;
    DOM.btnStartTimer.disabled = false;
    DOM.btnStopTimer.disabled = true;
    DOM.timerMinutes.disabled = false;

    if (reason === "finished") {
        speak(state.timer.message);
        addLog(state.timer.message, "Timer", "Played");
        renderLogs();
    }
}

function updateTimerDisplay() {
    const totalSecs = state.timer.remainingSeconds;
    const h = Math.floor(totalSecs / 3600);
    const m = Math.floor((totalSecs % 3600) / 60);
    const s = totalSecs % 60;
    
    DOM.timerCountdown.textContent = 
        `${h.toString().padStart(2,'0')}:${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}`;
}

// --- Logs ---
function addLog(text, type, status) {
    const log = {
        id: Date.now(),
        text,
        type,
        status, // Played, Missed
        timestamp: new Date().toISOString()
    };
    state.logs.unshift(log); // Add to top
    if (state.logs.length > 50) state.logs.pop(); // Keep last 50
    saveData();
}

function renderLogs() {
    DOM.logsList.innerHTML = '';
    state.logs.forEach(log => {
        const date = new Date(log.timestamp);
        const el = document.createElement('li');
        el.className = 'log-item';
        el.innerHTML = `
             <div class="reminder-header">
                <strong>${log.type}</strong>
                <span class="badge">${log.status}</span>
            </div>
            <div>${log.text}</div>
            <div style="font-size: 0.75rem; color: var(--text-secondary); margin-top: 4px;">
                ${date.toLocaleString()}
            </div>
        `;
        DOM.logsList.appendChild(el);
    });
}

// --- Core Features: Notes ---
// Note: Notes are simple text for now
function renderNotes() {
    DOM.notesList.innerHTML = '';
    state.notes.forEach(note => {
        const el = document.createElement('div');
        el.className = 'note-item';
        el.innerHTML = `
            <h3>${note.title}</h3>
            <p>${note.body}</p>
        `;
        DOM.notesList.appendChild(el);
    });
}

// --- Event Listeners Setup ---
function setupEventListeners() {
    // Navigation
    DOM.navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            const target = e.currentTarget.dataset.target;
            navigateTo(target); // Note: e.target might be the icon, currentTarget is the button
        });
    });

    // Theme
    DOM.themeToggle.addEventListener('click', toggleTheme);

    // Add Reminder
    DOM.addReminderForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const text = DOM.addReminderForm.querySelector('#reminder-text').value;
        const time = DOM.addReminderForm.querySelector('#reminder-time').value;
        if(text && time) {
            addReminder(text, time);
            DOM.addReminderForm.reset();
        }
    });
    
    document.getElementById('cancel-add').addEventListener('click', () => {
        DOM.addReminderForm.reset();
        navigateTo('view-home');
    });

    // Timer
    DOM.btnStartTimer.addEventListener('click', startTimer);
    DOM.btnStopTimer.addEventListener('click', () => stopTimer("manual"));

    // Quick hack for Notes "New" (just alert/simple prompt for MVP or hook up modal later)
    // For now, let's hook up the modal I added to HTML
    document.getElementById('btn-new-note').addEventListener('click', () => {
        DOM.noteEditor.classList.remove('hidden');
    });

    document.getElementById('cancel-note').addEventListener('click', () => {
        DOM.noteEditor.classList.add('hidden');
    });

    document.getElementById('save-note').addEventListener('click', () => {
        const title = document.getElementById('note-title').value;
        const body = document.getElementById('note-body').value;
        if(title || body) {
            state.notes.unshift({ id: Date.now(), title, body });
            saveData();
            renderNotes();
            
            // clear
            document.getElementById('note-title').value = '';
            document.getElementById('note-body').value = '';
            DOM.noteEditor.classList.add('hidden');
        }
    });
    
    // Clear Logs
    document.getElementById('clear-logs').addEventListener('click', () => {
        state.logs = [];
        saveData();
        renderLogs();
    });
}

// Start
document.addEventListener('DOMContentLoaded', init);
