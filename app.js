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
    // Dashboard & Toast (Phase 2)
    heroDashboard: document.getElementById('hero-dashboard'),
    heroCountdown: document.getElementById('hero-countdown'),
    heroMessage: document.getElementById('hero-message'),
    toastContainer: document.getElementById('toast-container'),
    // Timer
    timerCountdown: document.getElementById('timer-countdown'),
    timerMinutes: document.getElementById('timer-minutes'),
    timerMessage: document.getElementById('timer-message'),
    btnStartTimer: document.getElementById('start-timer'),
    btnStopTimer: document.getElementById('stop-timer'),
    timerProgress: document.getElementById('timer-progress'), // Phase 4
    // Alarm Overlay (Phase 4)
    alarmOverlay: document.getElementById('alarm-overlay'),
    alarmText: document.getElementById('alarm-text-display'),
    btnStopAlarm: document.getElementById('btn-stop-alarm'),
    btnSnoozeAlarm: document.getElementById('btn-snooze-alarm'),
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
    setInterval(() => {
        checkReminders();
        updateDashboard();
    }, 1000);
    updateDashboard(); // Initial call
}

// --- Phase 2: Action Feedback ---
function showToast(message) {
    if (!DOM.toastContainer) return; // safety
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `<i class="fas fa-info-circle"></i> <span>${message}</span>`;

    DOM.toastContainer.appendChild(toast);

    // Remove after 3s
    setTimeout(() => {
        toast.classList.add('toast-out');
        toast.addEventListener('animationend', () => {
            toast.remove();
        });
    }, 3000);
}

// --- Phase 2: Smart Dashboard ---
function updateDashboard() {
    if (!DOM.heroDashboard) return;

    const now = new Date();
    // Find next active reminder
    const upcoming = state.reminders
        .filter(r => r.active && new Date(r.time) > now)
        .sort((a, b) => new Date(a.time) - new Date(b.time))[0];

    if (upcoming) {
        DOM.heroDashboard.classList.remove('hidden');
        if (DOM.homeEmptyState) DOM.homeEmptyState.style.display = 'none';

        DOM.heroMessage.textContent = upcoming.text;

        const diff = new Date(upcoming.time) - now;
        const h = Math.floor(diff / (1000 * 60 * 60));
        const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const s = Math.floor((diff % (1000 * 60)) / 1000);

        if (h < 0) { // Safety check if diff is negative
            DOM.heroDashboard.classList.add('hidden');
            return;
        }

        DOM.heroCountdown.textContent =
            `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    } else {
        DOM.heroDashboard.classList.add('hidden');
        if (state.reminders.filter(r => r.active).length === 0 && DOM.homeEmptyState) {
            DOM.homeEmptyState.style.display = 'flex';
        }
    }
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
    reminder.active = false;
    saveData();
    renderReminders();

    // 1. Play TTS
    speak(reminder.text);

    // 2. Show Full Screen Overlay (Phase 4)
    if (DOM.alarmOverlay) {
        DOM.alarmOverlay.classList.remove('hidden');
        DOM.alarmText.textContent = reminder.text;

        // Setup stop/snooze context
        // We can temporarily store the current reminder text/id if needed for snooze
        state.activeAlarm = reminder;
    }

    // 3. Add to Log
    addLog(reminder.text, 'Alarm', 'Played');

    // 4. Notification
    if (Notification.permission === "granted") {
        new Notification("Voice Reminder", { body: reminder.text });
    }

    renderLogs();
}

function stopAlarmUI() {
    if (DOM.alarmOverlay) DOM.alarmOverlay.classList.add('hidden');
    window.speechSynthesis.cancel();
}

function snoozeAlarmUI() {
    stopAlarmUI();
    // Reschedule for 5 mins
    if (state.activeAlarm) {
        const now = new Date();
        now.setMinutes(now.getMinutes() + 5);
        addReminder(state.activeAlarm.text, now.toISOString().slice(0, 16));
        showToast('Snoozed for 5 mins');
    }
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

    addLog(text, 'Alarm', 'Scheduled'); // LOGGING ADDED
    showToast('Alarm Scheduled');

    saveData();
    renderReminders();
    navigateTo('view-home');
}

function deleteReminder(id) {
    state.reminders = state.reminders.filter(r => r.id !== id);
    saveData();
    renderReminders();
    showToast('Reminder Deleted');
}

function renderReminders() {
    DOM.reminderList.innerHTML = '';

    const activeReminders = state.reminders.filter(r => r.active); // active and not triggered

    if (activeReminders.length === 0) {
        DOM.reminderList.innerHTML = `
            <div class="empty-state-container" style="text-align:center; padding: 40px 20px; opacity:0; animation: fadeIn 0.5s forwards;">
                <i class="fas fa-couch" style="font-size: 4rem; color: var(--text-secondary); margin-bottom: 16px;"></i>
                <h3 style="margin-bottom: 8px;">All caught up!</h3>
                <p style="color: var(--text-secondary); margin-bottom: 24px;">No upcoming reminders.</p>
                <button class="btn-primary" onclick="navigateTo('view-add')">
                    <i class="fas fa-plus"></i> Add one
                </button>
            </div>
        `;
        DOM.homeEmptyState.style.display = 'none'; // Hide the old static one
        return;
    }

    // Safety cleanup if we switch back
    if (DOM.homeEmptyState) DOM.homeEmptyState.style.display = 'none';

    activeReminders.forEach(reminder => {
        const date = new Date(reminder.time);
        const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const dateStr = date.toLocaleDateString();

        const el = document.createElement('li');
        el.className = 'reminder-item';
        // HTML Structure for Swipe: [Background Action] + [Foreground Content]
        el.innerHTML = `
            <div class="swipe-action">
                <i class="fas fa-trash"></i>
            </div>
            <div class="reminder-content" id="rem-content-${reminder.id}">
                <div class="reminder-header">
                    <span class="reminder-time">${timeStr}</span>
                     <!-- Keep click delete for desktop fallback -->
                    <button class="delete-btn" onclick="appDeleteReminder(${reminder.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
                <div class="reminder-text">${reminder.text}</div>
                <div style="font-size: 0.8rem; color: var(--text-secondary); margin-top: 4px;">${dateStr}</div>
            </div>
        `;

        // --- Swipe Logic (Phase 5) ---
        const content = el.querySelector('.reminder-content');
        let startX, currentX;

        content.addEventListener('touchstart', (e) => {
            startX = e.touches[0].clientX;
            content.style.transition = 'none'; // Instant movement
        });

        content.addEventListener('touchmove', (e) => {
            currentX = e.touches[0].clientX;
            const diff = currentX - startX;
            if (diff < 0) { // Only swipe left
                content.style.transform = `translateX(${diff}px)`;
            }
        });

        content.addEventListener('touchend', (e) => {
            const diff = currentX - startX;
            content.style.transition = 'transform 0.3s ease-out';

            if (diff < -100) { // Threshold to delete
                content.style.transform = `translateX(-100%)`; // Fly out
                setTimeout(() => deleteReminder(reminder.id), 300);
            } else {
                content.style.transform = `translateX(0)`; // Snap back
            }
        });

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
        `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;

    // Phase 4: SVG Ring Progress
    if (DOM.timerProgress && state.timer.originalSeconds > 0) {
        const percent = totalSecs / state.timer.originalSeconds;
        // Circumference is 2 * PI * 100 approx 628
        const offset = 628 - (628 * percent);
        DOM.timerProgress.style.strokeDashoffset = offset;
    }
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
            <div style="display:flex; justify-content:space-between; align-items: flex-start; margin-bottom: 8px;">
                 <h3 style="margin:0; flex:1;">${note.title}</h3>
                 <div style="display:flex; gap: 8px;">
                    <!-- Phase 5: Convert to Reminder -->
                    <button class="delete-btn" style="color:var(--primary-color);" onclick="convertNoteToReminder('${note.body.replace(/'/g, "\\'")}')">
                        <i class="fas fa-bell"></i>
                    </button>
                    <button class="delete-btn" onclick="event.stopPropagation(); appDeleteNote(${note.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                 </div>
            </div>
            <p>${note.body}</p>
        `;
        DOM.notesList.appendChild(el);
    });
}

function convertNoteToReminder(text) {
    navigateTo('view-add');
    const input = document.getElementById('reminder-text');
    if (input) input.value = text;
}

function deleteNote(id) {
    state.notes = state.notes.filter(n => n.id !== id);
    saveData();
    renderNotes();
    showToast('Note Deleted');
}

window.appDeleteNote = (id) => deleteNote(id);

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
        if (text && time) {
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

    // Alarm Overlay Actions (Phase 4)
    if (DOM.btnStopAlarm) DOM.btnStopAlarm.addEventListener('click', stopAlarmUI);
    if (DOM.btnSnoozeAlarm) DOM.btnSnoozeAlarm.addEventListener('click', snoozeAlarmUI);

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
        if (title || body) {
            state.notes.unshift({ id: Date.now(), title, body });
            saveData();
            renderNotes();

            // clear
            document.getElementById('note-title').value = '';
            document.getElementById('note-body').value = '';
            DOM.noteEditor.classList.add('hidden');
            showToast('Note Saved');
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
