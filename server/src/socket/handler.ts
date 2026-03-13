import type { Server, Socket } from 'socket.io';
import { getAgentDef } from '../config/agents.js';
import { streamAgentReply } from '../services/agentService.js';
import { saveMessage, getHistory } from '../services/chatStore.js';

/** Conversation tracked per socket */
interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
}

const conversations = new Map<string, ConversationMessage[]>();

export function setupSocketHandlers(io: Server) {
  io.on('connection', (socket: Socket) => {
    console.log(`🔌 Client connected: ${socket.id}`);

    const userId = socket.handshake.auth?.userId as string | undefined;
    const agentId = socket.handshake.auth?.agentId as string | undefined;
    const accessToken = socket.handshake.auth?.accessToken as string | undefined;

    if (!agentId) {
      socket.emit('error', { message: 'agentId is required' });
      socket.disconnect();
      return;
    }

    const agent = getAgentDef(agentId);
    if (!agent) {
      socket.emit('error', { message: `Unknown agent: ${agentId}` });
      socket.disconnect();
      return;
    }

    const conversationKey = `${userId ?? socket.id}:${agentId}`;

    // ── Load or create conversation ──────────────────────────────────────
    socket.on('chat:init', async () => {
      let history: ConversationMessage[] = conversations.get(conversationKey) ?? [];
      if (history.length === 0) {
        const stored = await getHistory(conversationKey);
        history = stored.map((m: { role: 'user' | 'assistant'; content: string }) => ({
          role: m.role,
          content: m.content,
        }));
      }
      conversations.set(conversationKey, history);

      // Send agent greeting + history
      socket.emit('chat:history', {
        agentId: agent.id,
        greeting: agent.greeting,
        quickActions: agent.quickActions,
        messages: history.map((m, i) => ({
          id: `hist-${i}`,
          text: m.content,
          role: m.role,
          timestamp: Date.now(),
        })),
      });
    });

    // ── Handle user message ──────────────────────────────────────────────
    socket.on('chat:message', async (data: { text: string; messageId: string }) => {
      const { text, messageId } = data;

      if (!text?.trim()) return;

      // Persist user message
      const history = conversations.get(conversationKey) ?? [];
      history.push({ role: 'user', content: text });
      conversations.set(conversationKey, history);
      await saveMessage(conversationKey, 'user', text);

      // Acknowledge receipt
      socket.emit('chat:ack', { messageId });

      // Stream agent response
      socket.emit('chat:typing', { agentId: agent.id, isTyping: true });

      try {
        const replyId = `reply-${Date.now()}`;
        let fullReply = '';

        await streamAgentReply(
          agent,
          history,
          accessToken ?? null,
          // onChunk callback — stream partial text to client
          (chunk: string) => {
            fullReply += chunk;
            socket.emit('chat:stream', {
              messageId: replyId,
              chunk,
              fullText: fullReply,
              done: false,
            });
          },
        );

        // Finalize
        socket.emit('chat:stream', {
          messageId: replyId,
          chunk: '',
          fullText: fullReply,
          done: true,
        });

        // Persist assistant reply
        history.push({ role: 'assistant', content: fullReply });
        conversations.set(conversationKey, history);
        await saveMessage(conversationKey, 'assistant', fullReply);
      } catch (err) {
        console.error('Agent reply failed:', err);
        socket.emit('chat:error', {
          message: 'Failed to get response from agent. Please try again.',
        });
      } finally {
        socket.emit('chat:typing', { agentId: agent.id, isTyping: false });
      }
    });

    // ── Clear conversation ───────────────────────────────────────────────
    socket.on('chat:clear', () => {
      conversations.delete(conversationKey);
      socket.emit('chat:cleared', { agentId: agent.id });
    });

    socket.on('disconnect', () => {
      console.log(`🔌 Client disconnected: ${socket.id}`);
    });
  });
}
