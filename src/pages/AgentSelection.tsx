import { Crown, Code, Search, Compass, ClipboardList, PenTool, Lightbulb, Palette } from 'lucide-react';
import { useLiff } from '../components/layout/LiffProvider';

const agents = [
  { id: 'verzey', name: 'verzey (The Maestro)', role: 'Project Manager', icon: Crown, color: 'text-[#FFB020]', bg: 'bg-[#FFB020]/10' },
  { id: 'coder', name: 'Coder', role: 'Frontend Architect', icon: Code, color: 'text-[#34C759]', bg: 'bg-[#34C759]/10' },
  { id: 'factchecker', name: 'FactChecker', role: 'Research Specialist', icon: Search, color: 'text-[#007AFF]', bg: 'bg-[#007AFF]/10' },
  { id: 'headpilot', name: 'HeadPilot', role: 'Strategic Guide', icon: Compass, color: 'text-[#FF9500]', bg: 'bg-[#FF9500]/10' },
  { id: 'project-management', name: 'Project-Management', role: 'Coordinator', icon: ClipboardList, color: 'text-[#5856D6]', bg: 'bg-[#5856D6]/10' },
  { id: 'storyteller', name: 'Storyteller', role: 'Scriptwriter', icon: PenTool, color: 'text-[#FF3B30]', bg: 'bg-[#FF3B30]/10' },
  { id: 'visionary', name: 'Visionary', role: 'Creative Strategist', icon: Lightbulb, color: 'text-[#9747FF]', bg: 'bg-[#9747FF]/10' },
  { id: 'visualarch', name: 'VisualArch', role: 'UI/UX Designer', icon: Palette, color: 'text-[#FF2D55]', bg: 'bg-[#FF2D55]/10' },
];

export default function AgentSelection({ onSelectAgent }: { onSelectAgent: (id: string) => void }) {
  const { profile } = useLiff();

  return (
    <div className="min-h-screen bg-[#F4F5F6] p-4 flex flex-col pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
      <header className="py-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">OpenClaw Connect</h1>
          <p className="text-sm text-gray-500">Who do you need today, {profile?.displayName || 'guest'}?</p>
        </div>
        <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden shadow-sm border border-gray-100">
          {profile?.pictureUrl ? (
            <img src={profile.pictureUrl} alt="Profile" className="w-full h-full object-cover" />
          ) : (
            <span className="text-xl">👤</span>
          )}
        </div>
      </header>

      <div className="grid grid-cols-2 gap-4 flex-1 pb-10">
        {agents.map((agent) => {
          const Icon = agent.icon;
          return (
            <button
              key={agent.id}
              onClick={() => onSelectAgent(agent.id)}
              className="bg-white rounded-2xl p-4 shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-md transition-shadow flex flex-col items-center justify-center text-center space-y-3 relative overflow-hidden group"
            >
              <div className={`w-14 h-14 rounded-full ${agent.bg} ${agent.color} flex items-center justify-center transition-transform group-hover:scale-110`}>
                <Icon size={28} />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 text-sm">{agent.name.split(' (')[0]}</h3>
                <p className="text-xs text-gray-500 mt-1">{agent.role}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
