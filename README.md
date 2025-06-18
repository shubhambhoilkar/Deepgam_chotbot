# Deepgam_chotbot
Deepgram chatbot having voice assistant

📄 README for Basic Version (Manual and Speech Input)
Sam's Voice Chatbot - Basic Version
This is a basic voice chatbot where the user can interact with the bot by:

Typing messages

Clicking the "Speak" button to send voice input (one press per message)

🚀 Features
WebSocket-based real-time chatbot.

Manual speech recognition (you must press "Speak" for each new voice input).

Displays bot responses and audio replies.

Real-time connection status.

🛠️ Setup Instructions
Clone the repository.

Run the backend WebSocket server on port 9900.

Run the frontend using:

bash
Copy
Edit
npm install
npm run dev
Open your browser at http://localhost:5173.

🗣️ How to Use
Type a message and click Send.

To speak, click "Speak" → Speak your input → Speech will be processed.

The bot will respond with text and audio.

Each time you want to speak, you must click the "Speak" button again.

🔧 Tech Stack
React.js

WebSocket

Web Speech API (Speech Recognition)

✅ Known Limitations
Speech Button Must Be Pressed Each Time

No continuous listening.

No debounce or message hold.
