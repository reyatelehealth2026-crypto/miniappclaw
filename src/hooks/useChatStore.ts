import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ChatMessage {
  id: string;
  text: string;
  role: 'user' | 'assistant';
  timestamp: number;
  status: 'sending' | 'sent' | 'streaming' | 'done' | 'error';
}

interface ChatState {
  socket: Socket | null;
  messages: ChatMessage[];
  isConnected: boolean;
  isTyping: boolean;
  quickActions: string[];
  greeting: string;
  error: string | null;
  streamingMessageId: string | null;

  // Actions
  connect: (agentId: string, userId: string | null, accessToken: string | null) => void;
  disconnect: () => void;
  sendMessage: (text: string) => void;
  clearChat: () => void;
  resetError: () => void;
}

const WS_URL = import.meta.env.VITE_WS_URL ?? 'http://localhost:3000';

export const useChatStore = create<ChatState>((set, get) => ({
  socket: null,
  messages: [],
  isConnected: false,
  isTyping: false,
  quickActions: [],
  greeting: '',
  error: null,
  streamingMessageId: null,

  connect: (agentId: string, userId: string | null, accessToken: string | null) => {
    // Prevent duplicate connections
    const existing = get().socket;
    if (existing?.connected) {
      existing.disconnect();
    }

    const socket = io(WS_URL, {
      auth: { agentId, userId, accessToken },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    });

    socket.on('connect', () => {
      set({ isConnected: true, error: null });
      socket.emit('chat:init');
    });

    socket.on('disconnect', () => {
      set({ isConnected: false });
    });

    socket.on('connect_error', (err) => {
      console.error('Socket connection error:', err);
      set({ error: 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ กรุณาลองใหม่อีกครั้ง' });
    });

    // ── Chat events ──────────────────────────────────────────────────────
    socket.on('chat:history', (data: {
      greeting: string;
      quickActions: string[];
      messages: Array<{ id: string; text: string; role: 'user' | 'assistant'; timestamp: number }>;
    }) => {
      const historyMessages: ChatMessage[] = data.messages.map((m) => ({
        ...m,
        status: 'done' as const,
      }));
      set({
        greeting: data.greeting,
        quickActions: data.quickActions,
        messages: historyMessages,
      });
    });

    socket.on('chat:ack', (data: { messageId: string }) => {
      set((state) => ({
        messages: state.messages.map((m) =>
          m.id === data.messageId ? { ...m, status: 'sent' as const } : m,
        ),
      }));
    });

    socket.on('chat:typing', (data: { isTyping: boolean }) => {
      set({ isTyping: data.isTyping });
    });

    socket.on('chat:stream', (data: {
      messageId: string;
      chunk: string;
      fullText: string;
      done: boolean;
    }) => {
      set((state) => {
        const existingIdx = state.messages.findIndex((m) => m.id === data.messageId);
        if (existingIdx >= 0) {
          // Update existing streaming message
          const updated = [...state.messages];
          updated[existingIdx] = {
            ...updated[existingIdx]!,
            text: data.fullText,
            status: data.done ? 'done' : 'streaming',
          };
          return {
            messages: updated,
            streamingMessageId: data.done ? null : data.messageId,
            isTyping: !data.done ? state.isTyping : false,
          };
        } else {
          // New streaming message from agent
          return {
            messages: [
              ...state.messages,
              {
                id: data.messageId,
                text: data.fullText,
                role: 'assistant' as const,
                timestamp: Date.now(),
                status: data.done ? 'done' : 'streaming',
              },
            ],
            streamingMessageId: data.done ? null : data.messageId,
            isTyping: !data.done ? state.isTyping : false,
          };
        }
      });
    });

    socket.on('chat:error', (data: { message: string }) => {
      set({ error: data.message, isTyping: false });
    });

    socket.on('chat:cleared', () => {
      set({ messages: [] });
    });

    socket.on('error', (data: { message: string }) => {
      set({ error: data.message });
    });

    set({ socket, messages: [], greeting: '', quickActions: [], error: null });
  },

  disconnect: () => {
    const socket = get().socket;
    if (socket) {
      socket.disconnect();
      set({ socket: null, isConnected: false });
    }
  },

  sendMessage: (text: string) => {
    const { socket } = get();
    if (!socket?.connected || !text.trim()) return;

    const messageId = `msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const userMessage: ChatMessage = {
      id: messageId,
      text: text.trim(),
      role: 'user',
      timestamp: Date.now(),
      status: 'sending',
    };

    set((state) => ({ messages: [...state.messages, userMessage] }));
    socket.emit('chat:message', { text: text.trim(), messageId });
  },

  clearChat: () => {
    const { socket } = get();
    if (socket?.connected) {
      socket.emit('chat:clear');
    }
    set({ messages: [] });
  },

  resetError: () => set({ error: null }),
}));
