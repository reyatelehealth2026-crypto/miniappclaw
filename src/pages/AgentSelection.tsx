import { useNavigate } from 'react-router-dom';
import { QrCode, LogOut, UserPlus, Smartphone, Globe } from 'lucide-react';
import { agents } from '../config/agents';
import { useLiff } from '../components/layout/LiffProvider';
import { useLiffActions } from '../hooks/useLiffActions';

export default function AgentSelection() {
  const navigate = useNavigate();
  const { profile, isFriend, context, environment, miniApp } = useLiff();
  const { scanQrCode, openUrl, logout } = useLiffActions();

  const handleScanQr = async () => {
    const result = await scanQrCode();
    if (result) {
      navigate(`/chat/factchecker?q=${encodeURIComponent(result)}`);
    }
  };

  const getGreeting = () => {
    if (context?.type === 'utou') return 'เปิดจากแชทส่วนตัว';
    if (context?.type === 'group') return 'เปิดจากกลุ่มแชท';
    if (context?.type === 'room') return 'เปิดจากห้องแชท';
    return `ต้องการความช่วยเหลือด้านไหน, ${profile?.displayName || 'ผู้ใช้'}?`;
  };

  const isMiniApp = miniApp?.isMiniApp ?? false;

  return (
    <div className="min-h-screen bg-[#F4F5F6] p-4 flex flex-col pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
      {/* ── Friendship banner ─────────────────────────────────────────── */}
      {isFriend === false && (
        <div className="bg-[#06C755] text-white rounded-2xl p-4 mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <UserPlus size={20} />
            <div>
              <p className="font-semibold text-sm">เพิ่มเป็นเพื่อน!</p>
              <p className="text-xs opacity-90">รับการแจ้งเตือนเมื่อ Agent ทำงานเสร็จ</p>
            </div>
          </div>
          <button
            onClick={() => openUrl('https://line.me/R/ti/p/@openclaw', false)}
            className="bg-white text-[#06C755] px-4 py-1.5 rounded-full text-xs font-bold shrink-0"
          >
            เพิ่ม
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
          {/* QR scan (Mini App only) */}
          {miniApp?.canScanCode && (
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

      {/* ── Mode indicator ────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <span className={`text-xs px-3 py-1 rounded-full font-medium flex items-center gap-1 ${
          isMiniApp
            ? 'bg-[#06C755]/10 text-[#06C755]'
            : 'bg-blue-50 text-blue-600'
        }`}>
          {isMiniApp ? <Smartphone size={12} /> : <Globe size={12} />}
          {isMiniApp ? 'LINE Mini App' : 'LIFF Browser'}
        </span>
        {environment && (
          <span className="text-xs text-gray-400 px-2 py-0.5 bg-white rounded-full">
            {environment.os === 'ios' ? '🍎' : environment.os === 'android' ? '🤖' : '🌐'} {environment.os}
          </span>
        )}
        {context?.viewType && (
          <span className="text-xs text-gray-400 px-2 py-0.5 bg-white rounded-full">
            📐 {context.viewType}
          </span>
        )}
      </div>

      {/* ── Mini App exclusive features banner ────────────────────────── */}
      {isMiniApp && (
        <div className="bg-white rounded-2xl p-4 mb-4 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
          <p className="text-xs font-semibold text-gray-700 mb-2">🔥 Mini App Features</p>
          <div className="flex flex-wrap gap-2">
            {miniApp?.canShareTargetPicker && (
              <span className="text-[10px] bg-green-50 text-green-700 px-2 py-1 rounded-full">แชร์ไปแชท</span>
            )}
            {miniApp?.canSendMessages && (
              <span className="text-[10px] bg-blue-50 text-blue-700 px-2 py-1 rounded-full">ส่งไปแชทปัจจุบัน</span>
            )}
            {miniApp?.canScanCode && (
              <span className="text-[10px] bg-purple-50 text-purple-700 px-2 py-1 rounded-full">สแกน QR</span>
            )}
            {miniApp?.isFriend && (
              <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-1 rounded-full">Push Notification</span>
            )}
          </div>
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
      {!isMiniApp && (
        <div className="flex justify-center pb-4">
          <button
            onClick={logout}
            className="flex items-center gap-2 text-xs text-gray-400 hover:text-gray-600 py-2 px-4 transition-colors"
          >
            <LogOut size={14} />
            <span>ออกจากระบบ</span>
          </button>
        </div>
      )}
    </div>
  );
}
