import { useState, useRef, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../hooks/useSocket';
import { useVoice } from '../hooks/useVoice';
import ThreeOrb from '../components/ThreeOrb/ThreeOrb';
import toast from 'react-hot-toast';
import { Mic, MicOff, Send, ChevronDown, Zap, Volume2 } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import api from '../api/axios';

const Home = () => {
  const { user, token } = useAuth();
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [orbState, setOrbState] = useState('idle');
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  const [sessionId] = useState(() => uuidv4());
  const [voiceMode, setVoiceMode] = useState(true);
  const [audioLevel, setAudioLevel] = useState(0);
  const [isAutoSpeak, setIsAutoSpeak] = useState(true);
  const [showScrollBtn, setShowScrollBtn] = useState(false);

  const chatEndRef = useRef(null);
  const chatContainerRef = useRef(null);
  const pressTimer = useRef(null);
  const streamBufferRef = useRef('');

  // Refs for Hands-free Voice Loop
  const wakeWordRecRef = useRef(null);
  const isListeningWakeWordRef = useRef(false);
  const silenceTimerRef = useRef(null);
  const speechDetectedRef = useRef(false);


  // ─── Socket setup ───
  const { sendMessage, sendVoice } = useSocket(token, {
    onChunk: (delta) => {
      streamBufferRef.current += delta;
      setStreamingText(streamBufferRef.current);
    },
    onDone: async ({ message, usedRAG }) => {
      const finalContent = streamBufferRef.current;
      streamBufferRef.current = '';
      setStreamingText('');
      setIsStreaming(false);
      setOrbState('idle');

      const assistantMsg = {
        _id: message?._id || Date.now().toString(),
        role: 'assistant',
        content: finalContent,
        usedRAG,
        createdAt: new Date(),
      };
      setMessages((prev) => [...prev, assistantMsg]);

      // Auto-speak if voice mode
      if (voiceMode && isAutoSpeak) {
        setOrbState('speaking');
        await speakText(finalContent);
        setOrbState('idle');
      }
    },
    onTypingStart: () => {
      setOrbState('thinking');
      setIsStreaming(true);
      streamBufferRef.current = '';
    },
    onTypingStop: () => {
      if (!streamBufferRef.current) setIsStreaming(false);
    },
    onError: (msg) => {
      setIsStreaming(false);
      setOrbState('error');
      toast.error(msg);
      setTimeout(() => setOrbState('idle'), 2000);
    },
    onTranscript: (transcript) => {
      setMessages((prev) => [...prev, {
        _id: Date.now().toString(),
        role: 'user',
        content: `🎤 ${transcript}`,
        createdAt: new Date(),
      }]);
    },
    onVoiceDone: ({ content }) => {
      // Voice response text handled by onDone
    },
  });

  // ─── Voice setup ───
  const { isRecording, startRecording, stopRecording, speakText, audioLevel: voiceAudioLevel, startContinuousListening } = useVoice({
    onRecordingStart: () => {
      setOrbState('listening');
    },
    onRecordingStop: () => {
      setOrbState('thinking');
    },
    onError: (msg) => {
      toast.error(msg);
      setOrbState('idle');
    },
  });

  // Track audio level for orb
  useEffect(() => {
    setAudioLevel(voiceAudioLevel);
  }, [voiceAudioLevel]);

    // Refs and States for Hands-free Voice Loop
  const isListeningRef = useRef(false);
  const recognitionRef = useRef(null);
  const sessionActiveTimerRef = useRef(null);
  const [isSessionActive, setIsSessionActive] = useState(false);

  // Restart active session timer
  const refreshSessionTimer = useCallback(() => {
    setIsSessionActive(true);
    if (sessionActiveTimerRef.current) clearTimeout(sessionActiveTimerRef.current);
    sessionActiveTimerRef.current = setTimeout(() => {
      setIsSessionActive(false);
      console.log("⏰ Voice session timed out. Wake word required again.");
    }, 15000); // 15 seconds window
  }, []);

  // ─── Hands-free voice listening effect ───
  useEffect(() => {
    if (!voiceMode || orbState !== 'idle') {
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch (e) {}
        recognitionRef.current = null;
      }
      isListeningRef.current = false;
      return;
    }

    if (!isListeningRef.current) {
      console.log("📡 Starting continuous speech recognition...");
      const rec = startContinuousListening(async (transcript) => {
        console.log("🔊 Recognized Speech:", transcript);
        const lower = transcript.toLowerCase();
        
        const wakeWords = ['jarvis', 'जार्विस', 'hey jarvis', 'he jarvis', 'bhai', 'yaar', 'service', 'sarvis', 'charvis', 'job is', 'java', 'travis', 'charles', 'hey buddy', 'buddy'];
        let hasWakeWord = false;
        let query = '';
        
        for (const w of wakeWords) {
          const index = lower.indexOf(w);
          if (index !== -1) {
            hasWakeWord = true;
            query = transcript.substring(index + w.length).trim();
            break;
          }
        }
        
        // If session is active OR wake word is detected
        if (isSessionActive || hasWakeWord) {
          refreshSessionTimer();
          
          const finalQuery = hasWakeWord ? query : transcript;
          
          if (!finalQuery) {
            // Just wake word detected, say greeting
            try { rec.stop(); } catch (e) {} // Stop listening while speaking
            
            setOrbState('speaking');
            const phrases = [
              "hey buddy im here tell whats wrong",
              "bol be!",
              "haan bhai, bol?",
              "kya hukum hai boss?",
              "kya help chahiye bhai?"
            ];
            const randomPhrase = phrases[0]; // Prioritize the user's favorite phrase!
            
            setMessages((prev) => [...prev, {
              _id: Date.now().toString(),
              role: 'assistant',
              content: randomPhrase,
              createdAt: new Date(),
            }]);
            
            await speakText(randomPhrase);
            setOrbState('idle'); // Will auto-trigger listening restart
            return;
          }
          
          // User spoke a full query!
          try { rec.stop(); } catch (e) {} // Stop listening while processing + speaking
          
          // Send query
          const userMsg = {
            _id: Date.now().toString(),
            role: 'user',
            content: finalQuery,
            createdAt: new Date(),
          };
          setMessages((prev) => [...prev, userMsg]);
          sendMessage(finalQuery, sessionId);
        }
      });
      
      recognitionRef.current = rec;
      isListeningRef.current = true;
    }

    return () => {
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch (e) {}
        recognitionRef.current = null;
      }
      isListeningRef.current = false;
    };
  }, [voiceMode, orbState, isSessionActive, startContinuousListening, speakText, sendMessage, sessionId, refreshSessionTimer]);

  // Auto-scroll
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingText]);

  // Unlock browser audio autoplay restrictions on first click/touch
  useEffect(() => {
    const unlockAudio = () => {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        try {
          const ctx = new AudioContext();
          if (ctx.state === 'suspended') ctx.resume();
          const buffer = ctx.createBuffer(1, 1, 22050);
          const source = ctx.createBufferSource();
          source.buffer = buffer;
          source.connect(ctx.destination);
          source.start(0);
          console.log("🔊 Audio Autoplay unlocked successfully.");
        } catch (e) {
          console.error("Audio Context unlock error:", e);
        }
      }
      window.removeEventListener('click', unlockAudio);
      window.removeEventListener('touchstart', unlockAudio);
    };
    window.addEventListener('click', unlockAudio);
    window.addEventListener('touchstart', unlockAudio);
    return () => {
      window.removeEventListener('click', unlockAudio);
      window.removeEventListener('touchstart', unlockAudio);
    };
  }, []);

  // Load chat history on mount
  useEffect(() => {
    const loadHistory = async () => {
      try {
        const res = await api.get(`/chat/history?sessionId=${sessionId}&limit=20`);
        if (res.data.messages?.length > 0) {
          setMessages(res.data.messages);
        } else {
          // Welcome message
          setMessages([{
            _id: 'welcome',
            role: 'assistant',
            content: `Yo ${user?.name?.split(' ')[0] || 'bhai'}! 👋 Main J.A.R.V.I.S hun — tera personal AI study buddy.\n\nKya bolna hai? Padhai mein help chahiye, koi doubt hai, ya sirf baat karni hai — bol bhai! 🤖`,
            createdAt: new Date(),
          }]);
        }
      } catch (e) {
        setMessages([{
          _id: 'welcome',
          role: 'assistant',
          content: `Yo ${user?.name?.split(' ')[0] || 'bhai'}! 👋 J.A.R.V.I.S ready hai — kya help chahiye?`,
          createdAt: new Date(),
        }]);
      }
    };
    loadHistory();
  }, []);

  // ─── Send text message ───
  const handleSendText = useCallback(() => {
    const text = inputText.trim();
    if (!text || isStreaming) return;

    const userMsg = {
      _id: Date.now().toString(),
      role: 'user',
      content: text,
      createdAt: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    sendMessage(text, sessionId);
  }, [inputText, isStreaming, sendMessage, sessionId]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendText();
    }
  };

  // ─── Long-press mic (mobile) ───
  const handleMicPressStart = useCallback(async () => {
    pressTimer.current = setTimeout(async () => {
      const mimeType = await startRecording();
      if (mimeType) toast.success('Bol bhai! 🎤', { duration: 1500 });
    }, 150);
  }, [startRecording]);

  const handleMicPressEnd = useCallback(async () => {
    clearTimeout(pressTimer.current);
    if (isRecording) {
      const result = await stopRecording();
      if (result) {
        setOrbState('thinking');
        sendVoice(result.base64, sessionId, result.mimeType);
      }
    }
  }, [isRecording, stopRecording, sendVoice, sessionId]);

  // Scroll detection
  const handleScroll = () => {
    const el = chatContainerRef.current;
    if (!el) return;
    const isNearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 100;
    setShowScrollBtn(!isNearBottom);
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="app-container" style={{ background: 'var(--grad-bg)' }}>
      {/* Header */}
      <div style={{
        position: 'fixed', top: 0, left: '50%', transform: 'translateX(-50%)',
        width: '100%', maxWidth: '480px',
        padding: '16px 20px', zIndex: 50,
        background: 'rgba(5,8,20,0.85)', backdropFilter: 'blur(20px)',
        borderBottom: '1px solid var(--clr-border)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '32px', height: '32px', borderRadius: '50%',
            background: 'var(--grad-primary)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '16px', flexShrink: 0
          }}>🤖</div>
          <div>
            <div style={{ fontSize: '14px', fontWeight: '600', fontFamily: 'Space Grotesk' }}>J.A.R.V.I.S</div>
            <div style={{
              fontSize: '10px',
              color: isSessionActive ? 'var(--clr-accent-green)' : 'var(--clr-text-secondary)',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              transition: 'color 0.3s ease'
            }}>
              <span style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: isSessionActive ? '#10b981' : '#6b7280',
                display: 'inline-block',
                boxShadow: isSessionActive ? '0 0 8px #10b981' : 'none',
                animation: isSessionActive ? 'micPulse 1.2s infinite' : 'none',
                transition: 'all 0.3s ease'
              }} />
              {isSessionActive ? '⚡ Jarvis Active' : '💤 Standby'} — {user?.branch} Sem {user?.semester}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          {/* Auto-speak toggle */}
          <button
            onClick={() => setIsAutoSpeak(!isAutoSpeak)}
            style={{
              background: isAutoSpeak ? 'rgba(99,102,241,0.2)' : 'transparent',
              border: `1px solid ${isAutoSpeak ? 'var(--clr-accent-primary)' : 'var(--clr-border)'}`,
              borderRadius: '8px', padding: '6px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px',
              color: isAutoSpeak ? 'var(--clr-accent-primary)' : 'var(--clr-text-muted)', fontSize: '11px',
            }}
          >
            <Volume2 size={13} />
            {isAutoSpeak ? 'On' : 'Off'}
          </button>
          {/* Voice mode toggle */}
          <button
            onClick={() => setVoiceMode(!voiceMode)}
            style={{
              background: voiceMode ? 'rgba(16,185,129,0.15)' : 'transparent',
              border: `1px solid ${voiceMode ? 'var(--clr-accent-green)' : 'var(--clr-border)'}`,
              borderRadius: '8px', padding: '6px 10px', cursor: 'pointer',
              color: voiceMode ? 'var(--clr-accent-green)' : 'var(--clr-text-muted)', fontSize: '11px',
            }}
          >
            {voiceMode ? '🎙️ Voice' : '⌨️ Text'}
          </button>
        </div>
      </div>

      {/* ─── Orb ─── */}
      <div style={{
        paddingTop: '80px',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        paddingLeft: '20px', paddingRight: '20px'
      }}>
        <div className="orb-container" style={{ maxWidth: '220px', maxHeight: '220px' }}>
          <ThreeOrb state={orbState === 'idle' && isSessionActive ? 'active' : orbState} audioLevel={audioLevel} />
        </div>

        {/* State hint */}
        <div style={{ fontSize: '12px', color: 'var(--clr-text-secondary)', marginTop: '-8px', marginBottom: '16px', textAlign: 'center' }}>
          {orbState === 'idle' && voiceMode && (
            isSessionActive 
              ? '🔥 Jarvis Active — Bol bhai! (No wake word needed)' 
              : '🎙️ Wake Word Active (Say "Jarvis" to start)'
          )}
          {orbState === 'idle' && !voiceMode && '⏸️ Voice is paused. Click mic to resume.'}
          {orbState === 'listening' && '🎤 Sunrela apun...'}
          {orbState === 'thinking' && '🧠 sochne de database pe load aaya...'}
          {orbState === 'speaking' && '🔊 tham na jra...'}
          {orbState === 'error' && '⚠️ kya chhe'}
          <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.25)', marginTop: '4px' }}>
            API: {import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}
          </div>
        </div>
      </div>

      {/* ─── Chat area ─── */}
      <div
        ref={chatContainerRef}
        onScroll={handleScroll}
        style={{
          flex: 1, overflowY: 'auto',
          padding: '0 16px 16px',
          display: 'flex', flexDirection: 'column', gap: '12px',
          paddingBottom: '160px' /* space for bottom input + nav */
        }}
      >
        {messages.map((msg) => (
          <div key={msg._id} style={{
            display: 'flex',
            flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
            alignItems: 'flex-end', gap: '8px'
          }}>
            {/* Avatar */}
            {msg.role === 'assistant' && (
              <div style={{
                width: '28px', height: '28px', borderRadius: '50%',
                background: 'var(--grad-primary)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '14px', flexShrink: 0
              }}>🤖</div>
            )}

            <div style={{
              display: 'flex', flexDirection: 'column', gap: '4px', maxWidth: '85%',
              alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start'
            }}>
              <div className={`message-bubble ${msg.role}`}>
                {msg.content}
              </div>
              <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                <span style={{ fontSize: '10px', color: 'var(--clr-text-muted)' }}>
                  {formatTime(msg.createdAt)}
                </span>
                {msg.usedRAG && (
                  <span style={{
                    fontSize: '10px', color: 'var(--clr-accent-secondary)',
                    display: 'flex', alignItems: 'center', gap: '2px'
                  }}>
                    <Zap size={9} /> notes se
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}

        {/* Streaming message */}
        {isStreaming && (
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px' }}>
            <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--grad-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', flexShrink: 0 }}>🤖</div>
            <div className="message-bubble assistant" style={{ minWidth: '60px' }}>
              {streamingText ? (
                <span>{streamingText}<span style={{ opacity: 0.5, animation: 'typingBounce 1s infinite' }}>▌</span></span>
              ) : (
                <div className="typing-indicator">
                  <span /><span /><span />
                </div>
              )}
            </div>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Scroll to bottom btn */}
      {showScrollBtn && (
        <button
          onClick={() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })}
          style={{
            position: 'fixed', bottom: '160px', right: '20px',
            width: '36px', height: '36px', borderRadius: '50%',
            background: 'var(--clr-bg-secondary)', border: '1px solid var(--clr-border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', zIndex: 40, color: 'var(--clr-text-secondary)'
          }}
        >
          <ChevronDown size={16} />
        </button>
      )}

            {/* ─── Input area ─── */}
      <div style={{
        position: 'fixed', bottom: 'var(--bottom-nav-height)', left: '50%',
        transform: 'translateX(-50%)', width: '100%', maxWidth: '480px',
        padding: '12px 16px',
        background: 'rgba(5,8,20,0.9)', backdropFilter: 'blur(20px)',
        borderTop: '1px solid var(--clr-border)', zIndex: 40,
      }}>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
          {/* Mic Toggle Button (Continuous Hands-Free) */}
          <button
            onClick={() => {
              setVoiceMode(!voiceMode);
              toast(voiceMode ? "Voice loop paused ⏸️" : "Voice loop active (Say 'Jarvis') 🎙️");
            }}
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '50%',
              flexShrink: 0,
              background: voiceMode ? 'rgba(16, 185, 129, 0.15)' : 'var(--clr-bg-card)',
              border: voiceMode ? '1px solid var(--clr-accent-green)' : '1px solid var(--clr-border)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: voiceMode ? 'var(--clr-accent-green)' : 'var(--clr-text-secondary)',
              transition: 'all 0.2s',
              boxShadow: voiceMode ? '0 0 15px rgba(16, 185, 129, 0.3)' : 'none',
              outline: 'none'
            }}
            title={voiceMode ? "Pause Voice Listening" : "Start Voice Listening"}
          >
            {voiceMode ? <Mic size={18} /> : <MicOff size={18} />}
          </button>

          {/* Text Input */}
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={voiceMode ? "Say 'Jarvis' to speak... or type here" : "Type a message here..."}
            rows={1}
            style={{
              flex: 1,
              background: 'var(--glass-bg)',
              border: '1px solid var(--clr-border)',
              borderRadius: '16px',
              padding: '12px 16px',
              color: 'var(--clr-text-primary)',
              fontFamily: 'Inter, sans-serif',
              fontSize: '14px',
              outline: 'none',
              resize: 'none',
              maxHeight: '120px',
              lineHeight: '1.5',
              transition: 'border-color 0.2s',
            }}
            onFocus={(e) => e.target.style.borderColor = 'var(--clr-accent-primary)'}
            onBlur={(e) => e.target.style.borderColor = 'var(--clr-border)'}
          />

          {/* Send Button */}
          <button
            onClick={handleSendText}
            disabled={!inputText.trim() || isStreaming}
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '50%',
              flexShrink: 0,
              background: inputText.trim() && !isStreaming ? 'var(--grad-primary)' : 'var(--clr-bg-card)',
              border: 'none',
              cursor: inputText.trim() ? 'pointer' : 'default',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s',
              transform: inputText.trim() ? 'scale(1)' : 'scale(0.9)',
              boxShadow: inputText.trim() ? '0 4px 15px rgba(99,102,241,0.4)' : 'none',
            }}
          >
            {isStreaming ? <span className="spinner" style={{ width: '16px', height: '16px' }} /> : <Send size={18} color="white" />}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Home;