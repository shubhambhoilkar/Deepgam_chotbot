import React, { useState, useEffect, useRef } from 'react';

export default function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  const ws = useRef(null);
  const recognitionRef = useRef(null);

  // WebSocket Connection
  useEffect(() => {
    const wsURL = new WebSocket(`${import.meta.env.VITE_WS_URL || 'ws://localhost:5173/ws'}`);
    ws.current = new WebSocket(wsURL);

    ws.current.onopen = () => {
      console.log('WebSocket connected.');
      setIsConnected(true);
    };

    ws.current.onmessage = (event) => {
      console.log('Message from server:', event.data);
      setMessages((prev) => [...prev, { sender: 'bot', text: event.data }]);
    };

    ws.current.onclose = () => {
      console.log('WebSocket closed.');
      setIsConnected(false);
      // Optional: Reconnect logic
    };

    ws.current.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    return () => ws.current.close();
  }, []);

  // Speech Recognition Setup
  const startListening = () => {
    if (!('webkitSpeechRecognition' in window)) {
      alert('Speech recognition not supported in this browser.');
      return;
    }

    const SpeechRecognition = window.webkitSpeechRecognition;
    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.lang = 'en-US';
    recognitionRef.current.interimResults = false;
    recognitionRef.current.maxAlternatives = 1;

    recognitionRef.current.onstart = () => {
      setIsListening(true);
      console.log('Voice recognition started. Speak now.');
    };

    recognitionRef.current.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      console.log('Voice input:', transcript);
      setInput(''); // Clear input box
      sendMessage(transcript);
    };

    recognitionRef.current.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
    };

    recognitionRef.current.onend = () => {
      console.log('Voice recognition ended.');
      setIsListening(false);
    };

    recognitionRef.current.start();
  };

  const sendMessage = (textToSend) => {
    const text = textToSend || input.trim();
    if (text === '') return;

    const newMessages = [...messages, { sender: 'user', text }];
    setMessages(newMessages);

    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(text);
    } else {
      console.error('WebSocket not connected.');
    }

    setInput('');
  };

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <h1>Sam's Voice Chatbot</h1>
      <p>Status: {isConnected ? '🟢 Connected' : '🔴 Disconnected'}</p>

      <div style={{ border: '1px solid #ccc', padding: '10px', height: '400px', overflowY: 'scroll' }}>
        {messages.map((msg, index) => (
          <div key={index} style={{ margin: '10px 0', textAlign: msg.sender === 'user' ? 'right' : 'left' }}>
            <strong>{msg.sender === 'user' ? 'You' : 'Bot'}:</strong> {msg.text}
          </div>
        ))}
      </div>

      <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center' }}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          style={{ width: '60%', padding: '10px' }}
          placeholder="Type your message here"
        />
        <button onClick={() => sendMessage()} style={{ padding: '10px 20px', marginLeft: '10px' }}>
          Send
        </button>
        <button
          onClick={startListening}
          style={{ padding: '10px', marginLeft: '10px', backgroundColor: isListening ? 'red' : 'green', color: 'white' }}
        >
          {isListening ? 'Listening...' : '🎤 Speak'}
        </button>
      </div>
    </div>
  );
}
