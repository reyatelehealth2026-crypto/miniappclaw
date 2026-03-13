import type { AgentDef } from '../config/agents.js';

interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
}

/**
 * Generates agent reply using OpenAI-compatible API.
 * Falls back to a local echo-based reply when no API key is configured.
 *
 * Supports streaming via the onChunk callback.
 */
export async function streamAgentReply(
  agent: AgentDef,
  history: ConversationMessage[],
  _accessToken: string | null,
  onChunk: (chunk: string) => void,
): Promise<void> {
  const apiKey = process.env.OPENAI_API_KEY;
  const apiBase = process.env.OPENAI_API_BASE ?? 'https://api.openai.com/v1';
  const model = process.env.OPENAI_MODEL ?? 'gpt-4o-mini';

  // ── Build messages array with system prompt ────────────────────────────
  const messages = [
    { role: 'system' as const, content: agent.systemPrompt },
    ...history.map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content })),
  ];

  if (!apiKey) {
    // Fallback: intelligent echo mode when no API key
    await fallbackReply(agent, history, onChunk);
    return;
  }

  // ── OpenAI-compatible streaming ────────────────────────────────────────
  const response = await fetch(`${apiBase}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      stream: true,
      max_tokens: 2048,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI API error ${response.status}: ${errorText}`);
  }

  const reader = response.body?.getReader();
  if (!reader) throw new Error('No response body');

  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || !trimmed.startsWith('data: ')) continue;
      const data = trimmed.slice(6);
      if (data === '[DONE]') return;

      try {
        const parsed = JSON.parse(data);
        const content = parsed.choices?.[0]?.delta?.content;
        if (content) {
          onChunk(content);
        }
      } catch {
        // Skip malformed JSON lines
      }
    }
  }
}

/**
 * Fallback reply when no AI API is configured.
 * Provides contextual responses based on agent role.
 */
async function fallbackReply(
  agent: AgentDef,
  history: ConversationMessage[],
  onChunk: (chunk: string) => void,
): Promise<void> {
  const lastUserMsg = history.filter((m) => m.role === 'user').pop()?.content ?? '';

  const responses: Record<string, (input: string) => string> = {
    verzey: (input) =>
      `📋 ในฐานะ Project Manager ผมวิเคราะห์คำขอของคุณ:\n\n"${input}"\n\n🎯 ขั้นตอนที่แนะนำ:\n1. กำหนดขอบเขตงานให้ชัดเจน\n2. แบ่งงานเป็น task ย่อย\n3. กำหนด timeline และ deadline\n4. ติดตามความคืบหน้าอย่างสม่ำเสมอ\n\nต้องการให้ช่วยวางแผนเพิ่มเติมไหมครับ?`,
    coder: (input) =>
      `💻 ในฐานะ Frontend Architect ผมพร้อมช่วยเรื่อง:\n\n"${input}"\n\n🔧 แนวทาง:\n- วิเคราะห์ requirements\n- เลือก tech stack ที่เหมาะสม\n- ออกแบบ component architecture\n- เขียนโค้ดที่ clean และ maintainable\n\nส่งโค้ดมาให้ review หรือบอกรายละเอียดเพิ่มเติมได้เลยครับ!`,
    factchecker: (input) =>
      `🔍 ในฐานะ Research Specialist ผมจะช่วยตรวจสอบ:\n\n"${input}"\n\n📊 กระบวนการ:\n1. ค้นหาแหล่งข้อมูลที่น่าเชื่อถือ\n2. ตรวจสอบข้อเท็จจริงกับหลายแหล่ง\n3. วิเคราะห์ความน่าเชื่อถือ\n4. สรุปผลพร้อมอ้างอิง\n\nส่งข้อมูลที่ต้องการตรวจสอบมาเพิ่มเติมได้เลยครับ!`,
    headpilot: (input) =>
      `🧭 ในฐานะ Strategic Guide ผมวิเคราะห์:\n\n"${input}"\n\n🎯 มุมมองเชิงกลยุทธ์:\n- SWOT Analysis\n- Market positioning\n- Competitive advantage\n- Growth opportunities\n\nต้องการให้วิเคราะห์เชิงลึกด้านไหนเพิ่มครับ?`,
    'project-management': (input) =>
      `📊 ในฐานะ Coordinator ผมจัดการให้:\n\n"${input}"\n\n📋 Action Items:\n1. สร้าง Task list\n2. กำหนดผู้รับผิดชอบ\n3. ตั้ง Milestone\n4. ติดตาม Progress\n\nบอกรายละเอียดเพิ่มเติมได้เลยครับ!`,
    storyteller: (input) =>
      `✍️ ในฐานะ Scriptwriter ผมพร้อมสร้างสรรค์:\n\n"${input}"\n\n🎭 แนวทาง:\n- กำหนด target audience\n- สร้าง narrative structure\n- เลือก tone & voice\n- ร่างเนื้อหาฉบับแรก\n\nบอกรายละเอียดเพิ่มเติมได้เลยครับ!`,
    visionary: (input) =>
      `💡 ในฐานะ Creative Strategist ผมเห็นโอกาส:\n\n"${input}"\n\n🚀 Ideas:\n1. มองจากมุมใหม่\n2. หา unconventional solutions\n3. ทดลอง innovative approach\n4. Prototype & iterate\n\nมาระดมไอเดียเพิ่มกันไหมครับ?`,
    visualarch: (input) =>
      `🎨 ในฐานะ UI/UX Designer ผมวิเคราะห์:\n\n"${input}"\n\n🖌️ Design Approach:\n- User research & persona\n- Wireframe & prototype\n- Visual design system\n- Usability testing\n\nบอกรายละเอียดเพิ่มเติมเกี่ยวกับดีไซน์ที่ต้องการได้เลยครับ!`,
  };

  const replyFn = responses[agent.id] ?? ((input: string) => `ผมได้รับข้อความ: "${input}" — กำลังประมวลผลครับ`);
  const fullReply = replyFn(lastUserMsg);

  // Simulate streaming by sending word by word
  const words = fullReply.split('');
  for (let i = 0; i < words.length; i++) {
    onChunk(words[i]!);
    // Small delay to simulate streaming
    await new Promise((resolve) => setTimeout(resolve, 15));
  }
}
