/**
 * Simple in-memory chat store.
 * Replace with Redis/PostgreSQL for production.
 */

interface StoredMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

const store = new Map<string, StoredMessage[]>();

export async function saveMessage(
  conversationKey: string,
  role: 'user' | 'assistant',
  content: string,
): Promise<void> {
  const messages = store.get(conversationKey) ?? [];
  messages.push({ role, content, timestamp: Date.now() });

  // Keep last 100 messages per conversation
  if (messages.length > 100) {
    messages.splice(0, messages.length - 100);
  }

  store.set(conversationKey, messages);
}

export async function getHistory(
  conversationKey: string,
): Promise<Array<{ role: 'user' | 'assistant'; content: string }>> {
  const messages = store.get(conversationKey) ?? [];
  return messages.map((m) => ({ role: m.role, content: m.content }));
}

export async function clearHistory(conversationKey: string): Promise<void> {
  store.delete(conversationKey);
}
