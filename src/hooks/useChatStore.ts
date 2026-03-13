import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';
import { getAgent } from '../config/agents';

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
  activeAgentId: string | null;
  messages: ChatMessage[];
  isConnected: boolean;
  isTyping: boolean;
  quickActions: string[];
  greeting: string;
  error: string | null;
  notice: string | null;
  connectionMode: 'socket' | 'mock';
  streamingMessageId: string | null;

  // Actions
  connect: (agentId: string, userId: string | null, accessToken: string | null) => void;
  disconnect: () => void;
  sendMessage: (text: string) => void;
  clearChat: () => void;
  resetError: () => void;
}

type ChatStateSetter = (
  partial: Partial<ChatState> | ((state: ChatState) => Partial<ChatState>),
) => void;

const WS_URL = import.meta.env.VITE_WS_URL ?? 'http://localhost:3000';
const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api';
const SERVER_NOTICE = 'เซิร์ฟเวอร์แชทยังไม่พร้อม ระบบจึงเปลี่ยนเป็นโหมดตัวอย่างชั่วคราว';

let activeConnectionAttempt = 0;
let mockReplyTimer: ReturnType<typeof setTimeout> | null = null;

function clearMockReplyTimer() {
  if (mockReplyTimer) {
    clearTimeout(mockReplyTimer);
    mockReplyTimer = null;
  }
}

function getHealthUrl() {
  const normalizedApiUrl = API_URL.replace(/\/$/, '');
  if (normalizedApiUrl.endsWith('/api')) {
    return `${normalizedApiUrl}/health`;
  }

  return `${WS_URL.replace(/\/$/, '')}/api/health`;
}

async function isServerAvailable() {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), 1500);

  try {
    const response = await fetch(getHealthUrl(), {
      method: 'GET',
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
      },
    });

    return response.ok;
  } catch {
    return false;
  } finally {
    window.clearTimeout(timeoutId);
  }
}

function buildMockReply(agentId: string, input: string) {
  const prompt = input.trim();

  const responses: Record<string, string> = {
    verzey: `📋 ผมช่วยแตกงานจาก "${prompt}" ได้ทันที\n\n1. สรุปเป้าหมายหลัก\n2. แตกเป็น milestone\n3. จัดลำดับงานสำคัญ\n4. กำหนดเจ้าของงานและกำหนดส่ง\n\nถ้าต้องการ ผมช่วยต่อเป็น timeline แบบสั้นให้ได้ครับ`,
    coder: `💻 สำหรับ "${prompt}" ผมแนะนำให้เริ่มจาก\n\n- ตรวจ requirements และ edge cases\n- แยก component / state ให้ชัด\n- เขียน flow แบบเล็กก่อนแล้วค่อยต่อยอด\n- ทดสอบกรณี error และ loading state\n\nถ้าส่งรายละเอียดเพิ่ม ผมช่วยแตกเป็น implementation plan ได้ครับ`,
    factchecker: `🔎 ประเด็น "${prompt}" ควรตรวจแบบนี้\n\n1. หาแหล่งข้อมูลต้นทาง\n2. เทียบอย่างน้อย 2-3 แหล่ง\n3. เช็กวันที่และบริบท\n4. สรุปสิ่งที่ยืนยันได้กับสิ่งที่ยังไม่แน่ชัด\n\nส่งข้อความหรือบทความมาได้ ผมจะช่วยสรุปให้ครับ`,
    headpilot: `🧭 ถ้ามองเรื่อง "${prompt}" เชิงกลยุทธ์ ผมจะแนะนำให้ดู\n\n- เป้าหมายธุรกิจ\n- ความเสี่ยงหลัก\n- ทางเลือกที่คุ้มที่สุด\n- ตัวชี้วัดความสำเร็จ\n\nถ้าต้องการ ผมช่วยจัดเป็น action plan 3 ระยะได้ครับ`,
    'project-management': `📌 เรื่อง "${prompt}" สามารถจัดการต่อได้ด้วย\n\n- task list ที่ชัดเจน\n- owner ของแต่ละงาน\n- milestone รายสัปดาห์\n- check-in เพื่อกันงานค้าง\n\nบอก scope เพิ่มอีกนิด ผมจะช่วยแตกงานให้ครับ`,
    storyteller: `✍️ สำหรับ "${prompt}" ผมแนะนำโครงแบบนี้\n\n1. เปิดเรื่องให้ชัด\n2. ใส่ conflict หรือ pain point\n3. ขยายด้วยตัวอย่าง\n4. ปิดด้วย takeaway หรือ call to action\n\nถ้าต้องการ ผมช่วยร่างฉบับแรกให้ได้ครับ`,
    visionary: `💡 หัวข้อ "${prompt}" น่าสนใจมาก ผมมองโอกาสไว้แบบนี้\n\n- ทดลองมุมมองใหม่\n- ลดข้อจำกัดเดิม\n- แตกเป็น prototype เล็ก\n- เก็บ feedback เร็ว\n\nอยากให้ผมช่วย brainstorm ต่อเป็นรายการไอเดียไหมครับ`,
    visualarch: `🎨 ถ้าเป็น "${prompt}" ผมจะเริ่มจาก\n\n- define user goal\n- วาง flow และ hierarchy\n- ทำ wireframe แบบเร็ว\n- คุมสี ตัวอักษร และ spacing ให้สม่ำเสมอ\n\nถ้าต้องการ ผมช่วยสรุปแนวทาง UI/UX ให้ต่อได้ครับ`,
  };

  return responses[agentId] ?? `ผมได้รับข้อความ "${prompt}" แล้ว ตอนนี้ระบบกำลังทำงานในโหมดตัวอย่าง หากต้องการ ผมช่วยสรุปหรือแตกงานต่อจากข้อความนี้ได้ครับ`;
}

function startMockSession(set: ChatStateSetter, agentId: string) {
  const agent = getAgent(agentId);
  set({
    socket: null,
    activeAgentId: agentId,
    isConnected: true,
    isTyping: false,
    messages: [],
    greeting: agent?.greeting ?? 'สวัสดีครับ ตอนนี้ระบบกำลังทำงานในโหมดตัวอย่าง',
    quickActions: agent?.quickActions ?? [],
    error: null,
    notice: SERVER_NOTICE,
    connectionMode: 'mock',
    streamingMessageId: null,
  });
}

export const useChatStore = create<ChatState>((set, get) => ({
  socket: null,
  activeAgentId: null,
  messages: [],
  isConnected: false,
  isTyping: false,
  quickActions: [],
  greeting: '',
  error: null,
  notice: null,
  connectionMode: 'socket',
  streamingMessageId: null,

  connect: (agentId: string, userId: string | null, accessToken: string | null) => {
    activeConnectionAttempt += 1;
    const attemptId = activeConnectionAttempt;

    // Prevent duplicate connections
    const existing = get().socket;
    clearMockReplyTimer();

    if (existing) {
      existing.disconnect();
    }

    set({
      socket: null,
      activeAgentId: agentId,
      messages: [],
      greeting: '',
      quickActions: [],
      error: null,
      notice: null,
      isConnected: false,
      isTyping: false,
      connectionMode: 'socket',
      streamingMessageId: null,
    });

    void (async () => {
      const serverAvailable = await isServerAvailable();

      if (attemptId !== activeConnectionAttempt) {
        return;
      }

      if (!serverAvailable) {
        startMockSession(set, agentId);
        return;
      }

      const socket = io(WS_URL, {
        auth: { agentId, userId, accessToken },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 2,
        reconnectionDelay: 1500,
        timeout: 3000,
      });

      socket.on('connect', () => {
        if (attemptId !== activeConnectionAttempt) {
          socket.disconnect();
          return;
        }

        set({
          socket,
          activeAgentId: agentId,
          isConnected: true,
          error: null,
          notice: null,
          connectionMode: 'socket',
        });
        socket.emit('chat:init');
      });

      socket.on('disconnect', () => {
        if (get().connectionMode === 'socket') {
          set({ isConnected: false });
        }
      });

      socket.on('connect_error', () => {
        socket.disconnect();
        if (attemptId !== activeConnectionAttempt) {
          return;
        }

        startMockSession(set, agentId);
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
          }

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
    })();
  },

  disconnect: () => {
    activeConnectionAttempt += 1;
    clearMockReplyTimer();
    const socket = get().socket;
    if (socket) {
      socket.disconnect();
    }

    set({
      socket: null,
      activeAgentId: null,
      isConnected: false,
      isTyping: false,
      streamingMessageId: null,
      connectionMode: 'socket',
    });
  },

  sendMessage: (text: string) => {
    const { socket, connectionMode, activeAgentId } = get();
    if (!text.trim()) return;

    const messageId = `msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const userMessage: ChatMessage = {
      id: messageId,
      text: text.trim(),
      role: 'user',
      timestamp: Date.now(),
      status: 'sending',
    };

    if (connectionMode === 'mock') {
      clearMockReplyTimer();
      set((state) => ({
        messages: [...state.messages, { ...userMessage, status: 'sent' }],
        isTyping: true,
        error: null,
      }));

      const replyText = buildMockReply(activeAgentId ?? 'factchecker', text);

      mockReplyTimer = setTimeout(() => {
        set((state) => ({
          messages: [
            ...state.messages,
            {
              id: `reply-${Date.now()}`,
              text: replyText,
              role: 'assistant',
              timestamp: Date.now(),
              status: 'done',
            },
          ],
          isTyping: false,
          streamingMessageId: null,
        }));
        mockReplyTimer = null;
      }, 700);
      return;
    }

    if (!socket?.connected) return;

    set((state) => ({ messages: [...state.messages, userMessage] }));
    socket.emit('chat:message', { text: text.trim(), messageId });
  },

  clearChat: () => {
    clearMockReplyTimer();
    const { socket, connectionMode } = get();
    if (connectionMode === 'socket' && socket?.connected) {
      socket.emit('chat:clear');
    }
    set({ messages: [], isTyping: false, streamingMessageId: null });
  },

  resetError: () => set({ error: null }),
}));
