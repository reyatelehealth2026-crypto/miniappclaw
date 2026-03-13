import { Crown, Code, Search, Compass, ClipboardList, PenTool, Lightbulb, Palette } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface AgentConfig {
  id: string;
  name: string;
  fullName: string;
  role: string;
  icon: LucideIcon;
  color: string;
  bg: string;
  headerBg: string;
  hexColor: string;
}

export const agents: AgentConfig[] = [
  { id: 'verzey', name: 'verzey', fullName: 'verzey (The Maestro)', role: 'Project Manager', icon: Crown, color: 'text-[#FFB020]', bg: 'bg-[#FFB020]/10', headerBg: 'bg-[#FFB020]', hexColor: '#FFB020' },
  { id: 'coder', name: 'Coder', fullName: 'Coder (The Architect)', role: 'Frontend Architect', icon: Code, color: 'text-[#34C759]', bg: 'bg-[#34C759]/10', headerBg: 'bg-[#34C759]', hexColor: '#34C759' },
  { id: 'factchecker', name: 'FactChecker', fullName: 'FactChecker (The Investigator)', role: 'Research Specialist', icon: Search, color: 'text-[#007AFF]', bg: 'bg-[#007AFF]/10', headerBg: 'bg-[#007AFF]', hexColor: '#007AFF' },
  { id: 'headpilot', name: 'HeadPilot', fullName: 'HeadPilot (The Navigator)', role: 'Strategic Guide', icon: Compass, color: 'text-[#FF9500]', bg: 'bg-[#FF9500]/10', headerBg: 'bg-[#FF9500]', hexColor: '#FF9500' },
  { id: 'project-management', name: 'Project-Management', fullName: 'Project-Management', role: 'Coordinator', icon: ClipboardList, color: 'text-[#5856D6]', bg: 'bg-[#5856D6]/10', headerBg: 'bg-[#5856D6]', hexColor: '#5856D6' },
  { id: 'storyteller', name: 'Storyteller', fullName: 'Storyteller (The Narrator)', role: 'Scriptwriter', icon: PenTool, color: 'text-[#FF3B30]', bg: 'bg-[#FF3B30]/10', headerBg: 'bg-[#FF3B30]', hexColor: '#FF3B30' },
  { id: 'visionary', name: 'Visionary', fullName: 'Visionary (The Dreamer)', role: 'Creative Strategist', icon: Lightbulb, color: 'text-[#9747FF]', bg: 'bg-[#9747FF]/10', headerBg: 'bg-[#9747FF]', hexColor: '#9747FF' },
  { id: 'visualarch', name: 'VisualArch', fullName: 'VisualArch (The Designer)', role: 'UI/UX Designer', icon: Palette, color: 'text-[#FF2D55]', bg: 'bg-[#FF2D55]/10', headerBg: 'bg-[#FF2D55]', hexColor: '#FF2D55' },
];

export function getAgent(id: string): AgentConfig | undefined {
  return agents.find(a => a.id === id);
}
