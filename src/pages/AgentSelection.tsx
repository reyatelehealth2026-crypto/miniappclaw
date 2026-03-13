import { useNavigate } from 'react-router-dom';
import { QrCode, LogOut, UserPlus } from 'lucide-react';
import { agents } from '../config/agents';
import { useLiff } from '../components/layout/LiffProvider';
import { useLiffActions } from '../hooks/useLiffActions';

export default function AgentSelection() {
  const navigate = useNavigate();
  const { profile, isFriend, context, environment } = useLiff();
  const { scanQrCode, openUrl, logout, isAvailable } = useLiffActions();

  const handleScanQr = async () => {
    const result = await scanQrCode();
    if (result) {
      // Send scanned content to FactChecker agent for analysis
      navigate(`/chat/factchecker?q=${encodeURIComponent(result)}`);
    }
  };

  const getGreeting = () => {
    if (context?.type === 'utou') return 'Opening from your 1-on-1 chat';
    if (context?.type === 'group') return 'Opening from your group chat';
    if (context?.type === 'room') return 'Opening from your chat room';
    return `Who do you need today, ${profile?.displayName || 'guest'}?`;
  };

  return (
    <div className="min-h-screen bg-[#F4F5F6] p-4 flex flex-col pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
      {/* ── Friendship banner ─────────────────────────────────────────── */}
      {isFriend === false && (
        <div className="bg-[#06C755] text-white rounded-2xl p-4 mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <UserPlus size={20} />
            <div>
              <p className="font-semibold text-sm">Add us as friend!</p>
              <p className="text-xs opacity-90">Get notifications when agents finish tasks</p>
            </div>
          </div>
          <button
            onClick={() => openUrl('https://line.me/R/ti/p/@openclaw', false)}
            className="bg-white text-[#06C755] px-4 py-1.5 rounded-full text-xs font-bold shrink-0"
          >
            Add
          </button>
        </div>
      )}

      {/* ── Header ────────────────────────────────────────────────────── */}
      <header className="py-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">OpenClaw Connect</h1>
          <p className="text-sm text-gray-500">{getGreeting()}</p>
          {profile?.statusMessage && (
            <p className="text-xs text-gray-400 mt-1 italic">"{profile.statusMessage}"</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {/* QR scan */}
          {isAvailable('scanCodeV2') && (
            <button
              onClick={handleScanQr}
              className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm border border-gray-100 text-gray-600 hover:text-[#06C755] transition-colors"
            >
              <QrCode size={20} />
            </button>
          )}

          {/* Profile avatar */}
          <div className="relative">
            <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden shadow-sm border border-gray-100">
              {profile?.pictureUrl ? (
                <img src={profile.pictureUrl} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <span className="text-xl">👤</span>
              )}
            </div>
            {isFriend === true && (
              <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-[#06C755] rounded-full flex items-center justify-center border-2 border-[#F4F5F6]">
                <span className="text-[8px] text-white">✓</span>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ── Environment badges (subtle) ───────────────────────────────── */}
      {environment && (
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          <span className="text-xs text-gray-400 px-2 py-0.5 bg-white rounded-full">
            {environment.os === 'ios' ? '🍎' : environment.os === 'android' ? '🤖' : '🌐'} {environment.os}
          </span>
          <span className="text-xs text-gray-400 px-2 py-0.5 bg-white rounded-full">
            🌍 {environment.language}
          </span>
          {context?.viewType && (
            <span className="text-xs text-gray-400 px-2 py-0.5 bg-white rounded-full">
              📐 {context.viewType}
            </span>
          )}
          {environment.lineVersion && (
            <span className="text-xs text-gray-400 px-2 py-0.5 bg-white rounded-full">
              LINE {environment.lineVersion}
            </span>
          )}
        </div>
      )}

      {/* ── Agent grid ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-4 flex-1 pb-10">
        {agents.map((agent) => {
          const Icon = agent.icon;
          return (
            <button
              key={agent.id}
              onClick={() => navigate(`/chat/${agent.id}`)}
              className="bg-white rounded-2xl p-4 shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-md transition-shadow flex flex-col items-center justify-center text-center space-y-3 relative overflow-hidden group"
            >
              <div
                className={`w-14 h-14 rounded-full ${agent.bg} ${agent.color} flex items-center justify-center transition-transform group-hover:scale-110`}
              >
                <Icon size={28} />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 text-sm">{agent.name}</h3>
                <p className="text-xs text-gray-500 mt-1">{agent.role}</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* ── Footer: logout (external browser only) ────────────────────── */}
      {!environment?.isInClient && (
        <div className="flex justify-center pb-4">
          <button
            onClick={logout}
            className="flex items-center gap-2 text-xs text-gray-400 hover:text-gray-600 py-2 px-4 transition-colors"
          >
            <LogOut size={14} />
            <span>Logout</span>
          </button>
        </div>
      )}
    </div>
  );
}
