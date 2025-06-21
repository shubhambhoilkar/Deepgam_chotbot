import Reactjs, { useState, useEffect, useRef } from 'react';

export default function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [listeningTimeout, setListeningTimeout] = useState(null);

  const ws = useRef(null);
  const recognitionRef = useRef(null);

  // WebSocket Connection
  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss': 'ws'; 
    ws.current = new WebSocket(`ws://${window.location.hostname}:9900/ws`);

    ws.current.onopen = () => {
      console.log('WebSocket connected.');
      setIsConnected(true);
    };

    ws.current.onmessage = (event) => {
      console.log('Message from server:', event.data);
      try {
        const data = JSON.parse(event.data);
        setMessages((prev) => [...prev, { sender: 'bot', text: data.text, audio: data.audio }]);
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    };

    ws.current.onclose = () => {
      console.log('WebSocket closed.');
      setIsConnected(false);
    };

    ws.current.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    return () => ws.current.close();
  }, []);

  // Continuous Speech Recognition Setup
  useEffect(() => {
    if (!('webkitSpeechRecognition' || !navigator.mediaDevices.getUserMedia)) {   //if (!('webkitSpeechRecognition' in window))
      alert('Speech recognition not supported in this browser.');
      return;
    }

    const SpeechRecognition = window.webkitSpeechRecognition;
    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.lang = 'en-US';
    recognitionRef.current.interimResults = false;
    recognitionRef.current.maxAlternatives = 1;
    recognitionRef.current.continuous = false; // Browser quirk: continuous doesn't always work, so we restart manually.

    recognitionRef.current.onstart = () => {
      setIsListening(true);
      console.log('Voice recognition started.');
    };

    recognitionRef.current.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      console.log('Voice input:', transcript);
      setInput('');

      // Clear previous timeout if any
      if (listeningTimeout) {
        clearTimeout(listeningTimeout);
      }

      // Hold and send the latest request after a short delay (e.g., 1 second)
      const timeout = setTimeout(() => {
        sendMessage(transcript);
      }, 1000); // Adjust delay as needed
      setListeningTimeout(timeout);
    };

    recognitionRef.current.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      // Restart recognition automatically
      restartListening();
    };

    recognitionRef.current.onend = () => {
      console.log('Voice recognition ended.');
      // Restart recognition automatically
      restartListening();
    };

    startListening();

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (listeningTimeout) {
        clearTimeout(listeningTimeout);
      }
    };
  }, []);

  const restartListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.start();
    }
  };

  const startListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.start();
    }
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
      <p>Voice Listening: {isListening ? '🎤 Active' : '⏹️ Inactive (Auto-restarting)'}</p>

      <div style={{ border: '1px solid #ccc', padding: '10px', height: '400px', overflowY: 'scroll' }}>
        {messages.map((msg, index) => (
          <div key={index} style={{ margin: '10px 0', textAlign: msg.sender === 'user' ? 'right' : 'left' }}>
            <strong>{msg.sender === 'user' ? 'You' : 'Bot'}:</strong> {msg.text}

            {msg.audio && (
              <audio controls autoPlay style={{ display: 'block', marginTop: '5px' }}>
                <source src={`data:audio/mp3;base64,${msg.audio}`} type="audio/mpeg" />
                Your browser does not support the audio element.
              </audio>
            )}
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
        <button onClick={startListening} style={{ padding: '10px 20px', marginLeft: '10px', backgroundColor: 'green', color: 'white', border: 'none', borderRadius: '5px' }}>
          🎤 Start Listening
        </button>
      </div>
    </div>
  );
}
