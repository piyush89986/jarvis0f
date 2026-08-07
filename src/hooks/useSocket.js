import { useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

let socketInstance = null;

export const useSocket = (token, { onChunk, onDone, onTypingStart, onTypingStop, onError, onTranscript, onVoiceDone } = {}) => {
  const socketRef = useRef(null);

  useEffect(() => {
    if (!token) return;

    // Reuse existing connection if possible
    if (socketInstance && socketInstance.connected && socketInstance.auth?.token === token) {
      socketRef.current = socketInstance;
    } else {
      if (socketInstance) socketInstance.disconnect();

      socketInstance = io(SOCKET_URL, {
        auth: { token },
        transports: ['websocket'],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 5,
      });
      socketRef.current = socketInstance;
    }

    const socket = socketRef.current;

    socket.on('chat_chunk', ({ delta }) => onChunk?.(delta));
    socket.on('chat_done', (data) => onDone?.(data));
    socket.on('typing_start', () => onTypingStart?.());
    socket.on('typing_stop', () => onTypingStop?.());
    socket.on('chat_error', ({ message }) => onError?.(message));
    socket.on('transcript_ready', ({ transcript }) => onTranscript?.(transcript));
    socket.on('voice_response_done', (data) => onVoiceDone?.(data));

    return () => {
      socket.off('chat_chunk');
      socket.off('chat_done');
      socket.off('typing_start');
      socket.off('typing_stop');
      socket.off('chat_error');
      socket.off('transcript_ready');
      socket.off('voice_response_done');
    };
  }, [token]);

  const sendMessage = useCallback((content, sessionId, subject) => {
    socketRef.current?.emit('chat_message', { content, sessionId, subject });
  }, []);

  const sendVoice = useCallback((audioBase64, sessionId, mimeType) => {
    socketRef.current?.emit('voice_message', { audioData: audioBase64, sessionId, mimeType });
  }, []);

  const isConnected = () => socketRef.current?.connected || false;

  return { sendMessage, sendVoice, isConnected };
};
