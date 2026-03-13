import { useRef, useEffect } from 'react';
import type { FormEvent } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, Plus, Share2, MessageSquare, QrCode, X, Link2, Trash2, Wifi, WifiOff } from 'lucide-react';
import { getAgent } from '../config/agents';
import { useLiff } from '../components/layout/LiffProvider';
import { useLiffActions } from '../hooks/useLiffActions';
import { useChatStore } from '../hooks/useChatStore';
import { useState } from 'react';

export default function ChatSession() {
  const { agentId = '' } = useParams<{ agentId: string }>();
  const navigate = useNavigate();
  const { profile, accessToken, miniApp } = useLiff();
  const { shareAgentResponse, sendToChat, scanQrCode, closeLiff, getPermanentLink } =
    useLiffActions();

  const agent = getAgent(agentId);
  const agentName = agent?.fullName ?? agentId;
  const agentHeaderBg = agent?.headerBg ?? 'bg-gray-500';
  const agentHexColor = agent?.hexColor ?? '#888888';

  // ── Chat store (real WebSocket connection) ─────────────────────────────
  const {
    messages,
    isConnected,
    isTyping,
    quickActions,
    greeting,
    error: chatError,
    connect,
    disconnect,
    sendMessage,
    clearChat,
    resetError,
  } = useChatStore();

  const [input, setInput] = useState('');
  const [showPlusMenu, setShowPlusMenu] = useState(false);
  const [sharingId, setSharingId] = useState<string | null>(null);
  const [linkCopied, setLinkCopied] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // ── Connect to WebSocket on mount ──────────────────────────────────────
  useEffect(() => {
    connect(agentId, profile?.userId ?? null, accessToken);
    return () => {
      disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agentId, profile?.userId, accessToken]);

  // ── Handle QR content from URL params ──────────────────────────────────
  useEffect(() => {
    const hashQuery = window.location.hash.split('?')[1];
    if (!hashQuery) return;
    const params = new URLSearchParams(hashQuery);
    const qrContent = params.get('q');
    if (qrContent) {
      setInput(qrContent);
      window.location.hash = `/chat/${agentId}`;
    }
  }, [agentId]);

  // ── Auto-scroll to latest message ────────────────────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // ── Send message ─────────────────────────────────────────────────────────
  const handleSend = (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !isConnected) return;
    sendMessage(input);
    setInput('');
    inputRef.current?.focus();
  };

  // ── Quick action ─────────────────────────────────────────────────────────
  const handleQuickAction = (action: string) => {
    if (!isConnected) return;
    sendMessage(action);
  };

  // ── Share agent response via shareTargetPicker (Mini App only) ──────────
  const handleShare = async (msgId: string, text: string) => {
    setSharingId(msgId);
    await shareAgentResponse(agentName, agentHexColor, text);
    setSharingId(null);
  };

  // ── Send message directly to current LINE chat (Mini App only) ─────────
  const handleSendToChat = async (text: string) => {
    await sendToChat(`[${agentName}]\n${text}`);
  };

  // ── QR scan from plus menu (Mini App only) ─────────────────────────────
  const handleScanQr = async () => {
    setShowPlusMenu(false);
    const result = await scanQrCode();
    if (result) setInput(result);
  };

  // ── Copy permanent link ────────────────────────────────────────────────
  const handleCopyLink = async () => {
    setShowPlusMenu(false);
    const link = await getPermanentLink(`/chat/${agentId}`);
    if (link) {
      try {
        await navigator.clipboard.writeText(link);
        setLinkCopied(true);
        setTimeout(() => setLinkCopied(false), 2000);
      } catch { /* clipboard may not be available */ }
    }
  };

  // ── Feature availability flags ───────────────────────────────────────────
  const isMiniApp = miniApp?.isMiniApp ?? false;
  const isInChatContext = miniApp?.launchContext === 'utou' || miniApp?.launchContext === 'group' || miniApp?.launchContext === 'room';
  const canShare = miniApp?.canShareTargetPicker ?? false;
  const canSend = (miniApp?.canSendMessages ?? false) && isInChatContext;
  const canScan = miniApp?.canScanCode ?? false;

  // Dynamic quick actions from server, fallback to agent config
  const activeQuickActions = quickActions.length > 0 ? quickActions : agent?.quickActions ?? [];

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
              {agent ? (() => { const Icon = agent.icon; return <Icon size={16} />; })() : agentName.charAt(0)}
            </div>
            <div className="ml-3">
              <h2 className="font-semibold text-gray-900 text-sm">{agent?.name ?? agentId}</h2>
              <div className="flex items-center gap-1">
                {isConnected ? (
                  <>
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                    <p className="text-xs text-green-500">เชื่อมต่อแล้ว</p>
                  </>
                ) : (
                  <>
                    <div className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                    <p className="text-xs text-gray-400">กำลังเชื่อมต่อ...</p>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {/* Mini App badge */}
          {isMiniApp && (
            <span className="text-[10px] bg-[#06C755]/10 text-[#06C755] px-2 py-0.5 rounded-full font-medium">
              Mini App
            </span>
          )}

          {/* Clear chat */}
          <button
            onClick={clearChat}
            className="p-2 text-gray-400 hover:text-red-500 transition-colors"
            title="ล้างแชท"
          >
            <Trash2 size={18} />
          </button>

          {/* Close LIFF (Mini App only) */}
          {isMiniApp && (
            <button onClick={closeLiff} className="p-2 text-gray-400 hover:text-gray-600" title="ปิด">
              <X size={20} />
            </button>
          )}
        </div>
      </header>

      {/* ── Connection status bar ──────────────────────────────────────── */}
      {!isConnected && (
        <div className="bg-amber-50 px-4 py-2 flex items-center justify-center gap-2 text-amber-700 text-xs">
          <WifiOff size={14} />
          <span>กำลังเชื่อมต่อกับเซิร์ฟเวอร์...</span>
        </div>
      )}

      {/* ── Error banner ──────────────────────────────────────────────── */}
      {chatError && (
        <div className="bg-red-50 px-4 py-2 flex items-center justify-between text-red-700 text-xs">
          <span>{chatError}</span>
          <button onClick={resetError} className="text-red-500 font-medium ml-2">ปิด</button>
        </div>
      )}

      {/* ── Messages ────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-24">
        {/* Greeting (always shown at top) */}
        {greeting && messages.length === 0 && (
          <div className="flex w-full justify-start">
            <div className="flex flex-col max-w-[80%]">
              <div className="px-4 py-2.5 rounded-2xl bg-white text-gray-900 shadow-sm rounded-tl-sm">
                <p className="text-[15px] leading-relaxed">{greeting}</p>
              </div>
            </div>
          </div>
        )}

        {messages.map(msg => (
          <div key={msg.id} className={`flex w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className="flex flex-col max-w-[80%]">
              <div
                className={`px-4 py-2.5 rounded-2xl ${
                  msg.role === 'user'
                    ? 'bg-[#06C755] text-white rounded-tr-sm'
                    : 'bg-white text-gray-900 shadow-sm rounded-tl-sm'
                }`}
              >
                <p className="text-[15px] leading-relaxed break-words whitespace-pre-wrap">{msg.text}</p>
              </div>

              {/* Message status for user messages */}
              {msg.role === 'user' && (
                <div className="flex justify-end mt-0.5 mr-1">
                  <span className="text-[10px] text-gray-400">
                    {msg.status === 'sending' && '⏳ กำลังส่ง...'}
                    {msg.status === 'sent' && '✓ ส่งแล้ว'}
                    {msg.status === 'done' && '✓✓'}
                    {msg.status === 'error' && '❌ ส่งไม่สำเร็จ'}
                  </span>
                </div>
              )}

              {/* Streaming indicator */}
              {msg.role === 'assistant' && msg.status === 'streaming' && (
                <div className="flex items-center gap-1 mt-1 ml-1">
                  <div className="flex gap-0.5">
                    <div className="w-1 h-1 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-1 h-1 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-1 h-1 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              )}

              {/* Share / Send-to-chat actions (Mini App features on agent messages) */}
              {msg.role === 'assistant' && msg.status === 'done' && (canShare || canSend) && (
                <div className="flex items-center gap-1 mt-1 ml-1">
                  {canShare && (
                    <button
                      onClick={() => handleShare(msg.id, msg.text)}
                      disabled={sharingId === msg.id}
                      className="flex items-center gap-1 text-[11px] text-gray-400 hover:text-[#06C755] px-2 py-1 rounded-full hover:bg-white transition-colors"
                    >
                      <Share2 size={12} />
                      <span>{sharingId === msg.id ? 'กำลังแชร์...' : 'แชร์'}</span>
                    </button>
                  )}
                  {canSend && (
                    <button
                      onClick={() => handleSendToChat(msg.text)}
                      className="flex items-center gap-1 text-[11px] text-gray-400 hover:text-[#007AFF] px-2 py-1 rounded-full hover:bg-white transition-colors"
                    >
                      <MessageSquare size={12} />
                      <span>ส่งไปแชท</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {isTyping && !messages.some(m => m.status === 'streaming') && (
          <div className="flex w-full justify-start">
            <div className="px-4 py-3 rounded-2xl bg-white shadow-sm rounded-tl-sm">
              <div className="flex gap-1">
                <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* ── Plus menu overlay ───────────────────────────────────────────── */}
      {showPlusMenu && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setShowPlusMenu(false)} />
          <div className="absolute bottom-28 left-4 bg-white rounded-2xl shadow-lg border border-gray-100 p-2 z-20 min-w-[200px]">
            {/* QR Scan — Mini App only */}
            {canScan && (
              <button
                onClick={handleScanQr}
                className="flex items-center gap-3 w-full px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 rounded-xl"
              >
                <QrCode size={18} className="text-gray-500" />
                สแกน QR Code
              </button>
            )}
            <button
              onClick={handleCopyLink}
              className="flex items-center gap-3 w-full px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 rounded-xl"
            >
              <Link2 size={18} className="text-gray-500" />
              {linkCopied ? '✓ คัดลอกลิงก์แล้ว!' : 'คัดลอกลิงก์ Agent'}
            </button>
            {/* Connection status in menu */}
            <div className="flex items-center gap-3 px-4 py-2 text-xs text-gray-400 border-t border-gray-50 mt-1">
              {isConnected ? <Wifi size={14} className="text-green-500" /> : <WifiOff size={14} className="text-red-400" />}
              <span>{isConnected ? 'เชื่อมต่อแล้ว' : 'ไม่ได้เชื่อมต่อ'}</span>
            </div>
          </div>
        </>
      )}

      {/* ── Input area ──────────────────────────────────────────────────── */}
      <div className="bg-white border-t p-3 pb-[calc(env(safe-area-inset-bottom)+12px)]">
        {/* Quick actions */}
        <div className="flex space-x-2 overflow-x-auto pb-3 scrollbar-hide">
          {activeQuickActions.map(action => (
            <button
              key={action}
              onClick={() => handleQuickAction(action)}
              disabled={!isConnected}
              className="whitespace-nowrap px-4 py-1.5 bg-gray-100 rounded-full text-xs text-gray-700 hover:bg-gray-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
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
              ref={inputRef}
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onFocus={() => setShowPlusMenu(false)}
              placeholder={isConnected ? 'พิมพ์ข้อความ...' : 'กำลังเชื่อมต่อ...'}
              disabled={!isConnected}
              className="flex-1 bg-transparent py-2 focus:outline-none text-[15px] disabled:opacity-50"
            />
          </div>

          <button
            type="submit"
            disabled={!input.trim() || !isConnected}
            className={`p-2.5 rounded-full mb-0.5 transition-colors ${
              input.trim() && isConnected ? 'bg-[#06C755] text-white' : 'bg-gray-200 text-gray-400'
            }`}
          >
            <Send size={20} className="ml-0.5" />
          </button>
        </form>
      </div>
    </div>
  );
}
