import { useState, useRef, useEffect } from 'react';
import type { FormEvent } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, Plus, Mic, Share2, MessageSquare, QrCode, X, Link2 } from 'lucide-react';
import { getAgent } from '../config/agents';
import { useLiff } from '../components/layout/LiffProvider';
import { useLiffActions } from '../hooks/useLiffActions';

interface Message {
  id: string;
  text: string;
  isOwn: boolean;
}

export default function ChatSession() {
  const { agentId = '' } = useParams<{ agentId: string }>();
  const navigate = useNavigate();
  const { context, environment } = useLiff();
  const { shareAgentResponse, sendToChat, scanQrCode, closeLiff, getPermanentLink, isAvailable } =
    useLiffActions();

  const agent = getAgent(agentId);
  const agentName = agent?.fullName ?? agentId;
  const agentHeaderBg = agent?.headerBg ?? 'bg-gray-500';
  const agentHexColor = agent?.hexColor ?? '#888888';

  const [messages, setMessages] = useState<Message[]>([
    { id: '1', text: `Hello! I am ${agentName}. How can I assist you today?`, isOwn: false },
  ]);
  // Read QR content from hash query param at mount time (avoids setState-in-effect)
  const [input, setInput] = useState(() => {
    const hashQuery = window.location.hash.split('?')[1];
    if (!hashQuery) return '';
    const params = new URLSearchParams(hashQuery);
    const qrContent = params.get('q');
    if (qrContent) {
      // Clean up the URL so the param doesn't persist on reload
      queueMicrotask(() => { window.location.hash = `/chat/${agentId}`; });
      return qrContent;
    }
    return '';
  });
  const [showPlusMenu, setShowPlusMenu] = useState(false);
  const [sharingId, setSharingId] = useState<string | null>(null);
  const [linkCopied, setLinkCopied] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // ── Auto-scroll to latest message ────────────────────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ── Send message ─────────────────────────────────────────────────────────
  const handleSend = (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsg: Message = { id: Date.now().toString(), text: input, isOwn: true };
    setMessages(prev => [...prev, userMsg]);
    setInput('');

    // Mock agent reply (will be replaced with real backend call)
    setTimeout(() => {
      setMessages(prev => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          text: `I received: "${userMsg.text}". (Mock reply from ${agentName})`,
          isOwn: false,
        },
      ]);
    }, 1000);
  };

  // ── Share agent response via shareTargetPicker ───────────────────────────
  const handleShare = async (msg: Message) => {
    setSharingId(msg.id);
    await shareAgentResponse(agentName, agentHexColor, msg.text);
    setSharingId(null);
  };

  // ── Send message directly to current LINE chat ───────────────────────────
  const handleSendToChat = async (msg: Message) => {
    await sendToChat(`[${agentName}]\n${msg.text}`);
  };

  // ── QR scan from plus menu ───────────────────────────────────────────────
  const handleScanQr = async () => {
    setShowPlusMenu(false);
    const result = await scanQrCode();
    if (result) setInput(result);
  };

  // ── Copy permanent link to this agent's chat ─────────────────────────────
  const handleCopyLink = async () => {
    setShowPlusMenu(false);
    const link = await getPermanentLink(`/chat/${agentId}`);
    if (link) {
      try {
        await navigator.clipboard.writeText(link);
        setLinkCopied(true);
        setTimeout(() => setLinkCopied(false), 2000);
      } catch {
        /* clipboard may not be available */
      }
    }
  };

  // ── Feature availability flags ───────────────────────────────────────────
  const isInChatContext =
    context?.type === 'utou' || context?.type === 'group' || context?.type === 'room';
  const canShare = isAvailable('shareTargetPicker');
  const canSend = isAvailable('sendMessages') && isInChatContext;
  const canScan = isAvailable('scanCodeV2');
  const isInLine = environment?.isInClient ?? false;

  return (
    <div className="flex flex-col h-screen bg-[#F4F5F6]">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <header className="bg-white px-4 py-3 shadow-sm flex items-center justify-between pt-[calc(env(safe-area-inset-top)+12px)]">
        <div className="flex items-center">
          <button onClick={() => navigate('/')} className="p-2 -ml-2 text-gray-600 hover:text-gray-900">
            <ArrowLeft size={24} />
          </button>
          <div className="flex items-center ml-2">
            <div
              className={`w-8 h-8 rounded-full ${agentHeaderBg} flex items-center justify-center text-white font-bold text-xs`}
            >
              {agentName.charAt(0)}
            </div>
            <div className="ml-3">
              <h2 className="font-semibold text-gray-900 text-sm">{agent?.name ?? agentId}</h2>
              <p className="text-xs text-green-500">Online</p>
            </div>
          </div>
        </div>

        {/* Close LIFF window (only meaningful inside LINE) */}
        {isInLine && (
          <button onClick={closeLiff} className="p-2 text-gray-400 hover:text-gray-600" title="Close">
            <X size={20} />
          </button>
        )}
      </header>

      {/* ── Messages ────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-24">
        {messages.map(msg => (
          <div key={msg.id} className={`flex w-full ${msg.isOwn ? 'justify-end' : 'justify-start'}`}>
            <div className="flex flex-col max-w-[75%]">
              <div
                className={`px-4 py-2.5 rounded-2xl ${
                  msg.isOwn
                    ? 'bg-[#06C755] text-white rounded-tr-sm'
                    : 'bg-white text-gray-900 shadow-sm rounded-tl-sm'
                }`}
              >
                <p className="text-[15px] leading-relaxed break-words">{msg.text}</p>
              </div>

              {/* Share / Send-to-chat actions on agent messages */}
              {!msg.isOwn && (canShare || canSend) && (
                <div className="flex items-center gap-1 mt-1 ml-1">
                  {canShare && (
                    <button
                      onClick={() => handleShare(msg)}
                      disabled={sharingId === msg.id}
                      className="flex items-center gap-1 text-[11px] text-gray-400 hover:text-[#06C755] px-2 py-1 rounded-full hover:bg-white transition-colors"
                    >
                      <Share2 size={12} />
                      <span>{sharingId === msg.id ? 'Sharing...' : 'Share'}</span>
                    </button>
                  )}
                  {canSend && (
                    <button
                      onClick={() => handleSendToChat(msg)}
                      className="flex items-center gap-1 text-[11px] text-gray-400 hover:text-[#007AFF] px-2 py-1 rounded-full hover:bg-white transition-colors"
                    >
                      <MessageSquare size={12} />
                      <span>Send to Chat</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* ── Plus menu overlay ───────────────────────────────────────────── */}
      {showPlusMenu && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-10" onClick={() => setShowPlusMenu(false)} />
          <div className="absolute bottom-28 left-4 bg-white rounded-2xl shadow-lg border border-gray-100 p-2 z-20 min-w-[200px]">
            {canScan && (
              <button
                onClick={handleScanQr}
                className="flex items-center gap-3 w-full px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 rounded-xl"
              >
                <QrCode size={18} className="text-gray-500" />
                Scan QR Code
              </button>
            )}
            <button
              onClick={handleCopyLink}
              className="flex items-center gap-3 w-full px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 rounded-xl"
            >
              <Link2 size={18} className="text-gray-500" />
              {linkCopied ? '✓ Link Copied!' : 'Copy Agent Link'}
            </button>
          </div>
        </>
      )}

      {/* ── Input area ──────────────────────────────────────────────────── */}
      <div className="bg-white border-t p-3 pb-[calc(env(safe-area-inset-bottom)+12px)]">
        {/* Quick actions */}
        <div className="flex space-x-2 overflow-x-auto pb-3 scrollbar-hide">
          {['Summarize', 'Explain code', 'Fix errors'].map(action => (
            <button
              key={action}
              onClick={() => setInput(action)}
              className="whitespace-nowrap px-4 py-1.5 bg-gray-100 rounded-full text-xs text-gray-700 hover:bg-gray-200 font-medium"
            >
              {action}
            </button>
          ))}
        </div>

        <form onSubmit={handleSend} className="flex items-end gap-2">
          <button
            type="button"
            onClick={() => setShowPlusMenu(v => !v)}
            className={`p-2 mb-1 transition-colors ${showPlusMenu ? 'text-[#06C755]' : 'text-gray-400 hover:text-gray-600'}`}
          >
            <Plus size={24} className={`transition-transform ${showPlusMenu ? 'rotate-45' : ''}`} />
          </button>

          <div className="flex-1 bg-gray-100 rounded-2xl flex items-center px-4 py-1">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onFocus={() => setShowPlusMenu(false)}
              placeholder="Type a message..."
              className="flex-1 bg-transparent py-2 focus:outline-none text-[15px]"
            />
            <button type="button" className="text-gray-400 hover:text-gray-600 ml-2">
              <Mic size={20} />
            </button>
          </div>

          <button
            type="submit"
            disabled={!input.trim()}
            className={`p-2.5 rounded-full mb-0.5 transition-colors ${
              input.trim() ? 'bg-[#06C755] text-white' : 'bg-gray-200 text-gray-400'
            }`}
          >
            <Send size={20} className="ml-0.5" />
          </button>
        </form>
      </div>
    </div>
  );
}
