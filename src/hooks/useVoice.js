import { useState, useRef, useCallback } from 'react';
import api from '../api/axios';

export const useVoice = ({ onTranscript, onRecordingStart, onRecordingStop, onError }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const analyzerRef = useRef(null);
  const animFrameRef = useRef(null);
  const streamRef = useRef(null);

  // ─────────────────────────────────────────────
  // Start recording
  // ─────────────────────────────────────────────
  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 16000,
        },
      });

      streamRef.current = stream;

      // Audio level analyzer
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const source = audioCtx.createMediaStreamSource(stream);
      const analyzer = audioCtx.createAnalyser();
      analyzer.fftSize = 256;
      source.connect(analyzer);
      analyzerRef.current = analyzer;

      // Animate audio level
      const updateLevel = () => {
        const data = new Uint8Array(analyzer.frequencyBinCount);
        analyzer.getByteFrequencyData(data);
        const avg = data.reduce((a, b) => a + b) / data.length;
        setAudioLevel(avg / 128); // 0-1 range
        animFrameRef.current = requestAnimationFrame(updateLevel);
      };
      updateLevel();

      // MediaRecorder setup
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : 'audio/mp4';

      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      recorder.start(250); // Collect chunks every 250ms
      setIsRecording(true);
      onRecordingStart?.();

      return mimeType;
    } catch (error) {
      console.error('Mic access error:', error);
      onError?.('Mic ka access nahi mila — browser settings check kar bhai');
      return null;
    }
  }, [onRecordingStart, onError]);

  // ─────────────────────────────────────────────
  // Stop recording and process audio
  // ─────────────────────────────────────────────
  const stopRecording = useCallback(() => {
    return new Promise((resolve) => {
      if (!mediaRecorderRef.current || !isRecording) {
        resolve(null);
        return;
      }

      // Cleanup analyzer
      cancelAnimationFrame(animFrameRef.current);
      setAudioLevel(0);

      mediaRecorderRef.current.onstop = async () => {
        const blob = new Blob(audioChunksRef.current, {
          type: mediaRecorderRef.current.mimeType,
        });

        // Stop stream tracks
        streamRef.current?.getTracks().forEach((t) => t.stop());
        setIsRecording(false);
        onRecordingStop?.();

        if (blob.size < 1000) {
          onError?.('Recording bahut chhoti thi — thoda zyada bol bhai');
          resolve(null);
          return;
        }

        // Convert to base64 for Socket.IO
        const reader = new FileReader();
        reader.onload = () => {
          const base64 = reader.result.split(',')[1];
          resolve({ base64, mimeType: blob.type, blob });
        };
        reader.readAsDataURL(blob);
      };

      mediaRecorderRef.current.stop();
    });
  }, [isRecording, onRecordingStop, onError]);

  // ─────────────────────────────────────────────
  // Play TTS audio from API
  // ─────────────────────────────────────────────
  const speakText = useCallback(async (text) => {
    try {
      setIsProcessing(true);
      const response = await api.post('/voice/speak', { text }, { responseType: 'blob' });
      const audioBlob = new Blob([response.data], { type: 'audio/mpeg' });
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);

      return new Promise((resolve) => {
        audio.onended = () => {
          URL.revokeObjectURL(audioUrl);
          setIsProcessing(false);
          resolve();
        };
        audio.onerror = () => {
          setIsProcessing(false);
          resolve();
        };
        audio.play().catch(() => setIsProcessing(false));
      });
    } catch (error) {
      setIsProcessing(false);
      console.error('TTS error:', error);
    }
  }, []);

  // ─────────────────────────────────────────────
  // Continuous Speech Recognition (Hands-Free)
  // ─────────────────────────────────────────────
  const startContinuousListening = useCallback((onSpeech) => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      console.warn('Web Speech API not supported');
      return null;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = 'en-IN';

    recognition.onresult = (e) => {
      const result = e.results[e.results.length - 1];
      if (result.isFinal) {
        const transcript = result[0].transcript.trim();
        onSpeech(transcript);
      }
    };

    recognition.onerror = (err) => {
      console.error("Speech recognition error:", err.error);
      if (err.error !== 'aborted') {
        setTimeout(() => {
          try { recognition.start(); } catch (e) {}
        }, 1000);
      }
    };

    recognition.start();
    return recognition;
  }, []);

  return {
    isRecording,
    isProcessing,
    audioLevel,
    startRecording,
    stopRecording,
    speakText,
    startContinuousListening,
  };
};
