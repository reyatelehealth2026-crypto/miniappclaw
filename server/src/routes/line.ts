import { Router } from 'express';
import axios from 'axios';

export const lineRouter = Router();

/**
 * POST /api/line/verify-token
 * Verifies a LIFF access token with LINE's API
 */
lineRouter.post('/verify-token', async (req, res) => {
  const { accessToken } = req.body as { accessToken?: string };
  if (!accessToken) {
    res.status(400).json({ error: 'accessToken is required' });
    return;
  }

  try {
    const response = await axios.get('https://api.line.me/oauth2/v2.1/verify', {
      params: { access_token: accessToken },
    });
    res.json({ valid: true, data: response.data });
  } catch (err) {
    console.error('Token verification failed:', err);
    res.status(401).json({ valid: false, error: 'Invalid token' });
  }
});

/**
 * POST /api/line/send-push
 * Sends a push message via LINE Messaging API (requires channel access token)
 */
lineRouter.post('/send-push', async (req, res) => {
  const { userId, message } = req.body as { userId?: string; message?: string };
  const channelToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;

  if (!channelToken) {
    res.status(500).json({ error: 'LINE_CHANNEL_ACCESS_TOKEN not configured' });
    return;
  }
  if (!userId || !message) {
    res.status(400).json({ error: 'userId and message are required' });
    return;
  }

  try {
    await axios.post(
      'https://api.line.me/v2/bot/message/push',
      {
        to: userId,
        messages: [{ type: 'text', text: message }],
      },
      {
        headers: {
          Authorization: `Bearer ${channelToken}`,
          'Content-Type': 'application/json',
        },
      },
    );
    res.json({ sent: true });
  } catch (err) {
    console.error('Push message failed:', err);
    res.status(500).json({ error: 'Failed to send push message' });
  }
});

/**
 * POST /api/line/notify-completion
 * Sends a rich notification when an agent completes a long-running task
 */
lineRouter.post('/notify-completion', async (req, res) => {
  const { userId, agentName, agentColor, summary, liffUrl } = req.body as {
    userId?: string;
    agentName?: string;
    agentColor?: string;
    summary?: string;
    liffUrl?: string;
  };
  const channelToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;

  if (!channelToken) {
    res.status(500).json({ error: 'LINE_CHANNEL_ACCESS_TOKEN not configured' });
    return;
  }
  if (!userId || !agentName || !summary) {
    res.status(400).json({ error: 'userId, agentName, and summary are required' });
    return;
  }

  const flexMessage = {
    type: 'flex',
    altText: `${agentName} has completed your request`,
    contents: {
      type: 'bubble',
      header: {
        type: 'box',
        layout: 'vertical',
        contents: [
          { type: 'text', text: `🤖 ${agentName}`, weight: 'bold', color: '#FFFFFF', size: 'md' },
          { type: 'text', text: 'Task Completed ✅', color: '#FFFFFFCC', size: 'xs', margin: 'sm' },
        ],
        backgroundColor: agentColor ?? '#06C755',
        paddingAll: '16px',
      },
      body: {
        type: 'box',
        layout: 'vertical',
        contents: [
          { type: 'text', text: summary, wrap: true, size: 'sm', color: '#333333' },
        ],
        paddingAll: '16px',
      },
      footer: liffUrl
        ? {
            type: 'box',
            layout: 'vertical',
            contents: [
              {
                type: 'button',
                action: { type: 'uri', label: 'Open in App', uri: liffUrl },
                style: 'primary',
                color: agentColor ?? '#06C755',
              },
            ],
            paddingAll: '12px',
          }
        : undefined,
    },
  };

  try {
    await axios.post(
      'https://api.line.me/v2/bot/message/push',
      { to: userId, messages: [flexMessage] },
      {
        headers: {
          Authorization: `Bearer ${channelToken}`,
          'Content-Type': 'application/json',
        },
      },
    );
    res.json({ sent: true });
  } catch (err) {
    console.error('Notification failed:', err);
    res.status(500).json({ error: 'Failed to send notification' });
  }
});
