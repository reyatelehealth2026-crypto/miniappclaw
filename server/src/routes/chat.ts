import { Router } from 'express';
import { getAgentDef } from '../config/agents.js';
import { streamAgentReply } from '../services/agentService.js';
import { saveMessage, getHistory, clearHistory } from '../services/chatStore.js';

export const chatRouter = Router();

/**
 * POST /api/chat/message
 * Non-streaming REST endpoint for environments where WebSocket isn't available.
 */
chatRouter.post('/message', async (req, res) => {
  const { agentId, userId, text, accessToken } = req.body as {
    agentId?: string;
    userId?: string;
    text?: string;
    accessToken?: string;
  };

  if (!agentId || !text?.trim()) {
    res.status(400).json({ error: 'agentId and text are required' });
    return;
  }

  const agent = getAgentDef(agentId);
  if (!agent) {
    res.status(404).json({ error: `Unknown agent: ${agentId}` });
    return;
  }

  const conversationKey = `${userId ?? 'anonymous'}:${agentId}`;
  const history = await getHistory(conversationKey);
  history.push({ role: 'user', content: text });
  await saveMessage(conversationKey, 'user', text);

  try {
    let fullReply = '';
    await streamAgentReply(agent, history, accessToken ?? null, (chunk) => {
      fullReply += chunk;
    });

    await saveMessage(conversationKey, 'assistant', fullReply);
    res.json({ reply: fullReply, agentId });
  } catch (err) {
    console.error('Chat error:', err);
    res.status(500).json({ error: 'Failed to generate reply' });
  }
});

/**
 * GET /api/chat/history/:userId/:agentId
 */
chatRouter.get('/history/:userId/:agentId', async (req, res) => {
  const { userId, agentId } = req.params;
  const conversationKey = `${userId}:${agentId}`;
  const messages = await getHistory(conversationKey);
  res.json({ messages });
});

/**
 * DELETE /api/chat/history/:userId/:agentId
 */
chatRouter.delete('/history/:userId/:agentId', async (req, res) => {
  const { userId, agentId } = req.params;
  const conversationKey = `${userId}:${agentId}`;
  await clearHistory(conversationKey);
  res.json({ cleared: true });
});
