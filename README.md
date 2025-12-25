# Voice-Based Reminder & Alarm App

A mobile-first web application designed to be an intelligent voice-based alarm and reminder system. Unlike traditional alarms, this app reads your custom messages aloud using Text-to-Speech (TTS), ensuring you know exactly what the reminder is for.

**Note**: This is the initial Web App version. A Flutter APK conversion is planned for native mobile background capabilities.

## 🚀 Features

*   **Voice Alarms**: Set a time and a message, and the app will speak it aloud when due.
*   **Countdown Timer**: A timer that speaks a custom message upon completion.
*   **Notes Module**: Keep track of quick thoughts and tasks.
*   **History Logs**: View a log of all triggered alarms and timers.
*   **Dark/Light Mode**: Beautiful UI with theme toggling.
*   **Mobile-First Design**: Optimized for touch interactions and small screens.

## 🛠️ Tech Stack

*   **Frontend**: HTML5, CSS3 (Variables), Vanilla JavaScript (ES6 Modules).
*   **Audio**: Web Speech API (`SpeechSynthesis`).
*   **Storage**: LocalStorage (persists data across reloads).

## 📦 How to Run

1.  Clone the repository:
    ```bash
    git clone https://github.com/RDJ-187/Voice-reminder-.git
    ```
2.  Open `index.html` in your browser.
    *   *Recommendation*: For the best mobile emulation, use Chrome DevTools ("Toggle Device Toolbar") or serve the file via a local server (like VSCode Live Server) and access it on your phone over Wi-Fi.

## 📱 Future Roadmap (Flutter & APK)

The next phase of this project involves converting the logic to Flutter to enable:
*   **True Background Execution**: Alarms that ring even when the phone is locked.
*   **Wake Locks**: Waking up the device screen for high-priority alerts.
*   **Native Notifications**: Better integration with Android system notifications.

## 📸 Screenshots

*(Add screenshots here after running the app)*

---
Developed by [Your Name/Team]
