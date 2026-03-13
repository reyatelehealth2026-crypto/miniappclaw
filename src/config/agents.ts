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
  greeting: string;
  quickActions: string[];
}

export const agents: AgentConfig[] = [
  {
    id: 'verzey', name: 'verzey', fullName: 'verzey (The Maestro)', role: 'Project Manager',
    icon: Crown, color: 'text-[#FFB020]', bg: 'bg-[#FFB020]/10', headerBg: 'bg-[#FFB020]', hexColor: '#FFB020',
    greeting: 'สวัสดีครับ! ผม verzey ผู้จัดการโปรเจกต์ พร้อมช่วยวางแผนและจัดการงานครับ',
    quickActions: ['วางแผนโปรเจกต์', 'สร้าง Timeline', 'จัดลำดับความสำคัญ'],
  },
  {
    id: 'coder', name: 'Coder', fullName: 'Coder (The Architect)', role: 'Frontend Architect',
    icon: Code, color: 'text-[#34C759]', bg: 'bg-[#34C759]/10', headerBg: 'bg-[#34C759]', hexColor: '#34C759',
    greeting: 'สวัสดีครับ! ผม Coder สถาปนิกซอฟต์แวร์ พร้อมช่วยเรื่องโค้ดครับ',
    quickActions: ['Review โค้ด', 'Debug ปัญหา', 'ออกแบบ Architecture'],
  },
  {
    id: 'factchecker', name: 'FactChecker', fullName: 'FactChecker (The Investigator)', role: 'Research Specialist',
    icon: Search, color: 'text-[#007AFF]', bg: 'bg-[#007AFF]/10', headerBg: 'bg-[#007AFF]', hexColor: '#007AFF',
    greeting: 'สวัสดีครับ! ผม FactChecker นักวิจัย พร้อมช่วยตรวจสอบข้อเท็จจริงครับ',
    quickActions: ['ตรวจสอบข้อเท็จจริง', 'ค้นคว้าข้อมูล', 'สรุปบทความ'],
  },
  {
    id: 'headpilot', name: 'HeadPilot', fullName: 'HeadPilot (The Navigator)', role: 'Strategic Guide',
    icon: Compass, color: 'text-[#FF9500]', bg: 'bg-[#FF9500]/10', headerBg: 'bg-[#FF9500]', hexColor: '#FF9500',
    greeting: 'สวัสดีครับ! ผม HeadPilot นักกลยุทธ์ พร้อมช่วยวางแผนธุรกิจครับ',
    quickActions: ['วิเคราะห์ตลาด', 'วางกลยุทธ์', 'แผนการเติบโต'],
  },
  {
    id: 'project-management', name: 'Project-Management', fullName: 'Project-Management', role: 'Coordinator',
    icon: ClipboardList, color: 'text-[#5856D6]', bg: 'bg-[#5856D6]/10', headerBg: 'bg-[#5856D6]', hexColor: '#5856D6',
    greeting: 'สวัสดีครับ! ผม Project-Management ผู้ประสานงาน พร้อมช่วยบริหารโปรเจกต์ครับ',
    quickActions: ['ติดตามงาน', 'จัดสรรทรัพยากร', 'ประเมินความเสี่ยง'],
  },
  {
    id: 'storyteller', name: 'Storyteller', fullName: 'Storyteller (The Narrator)', role: 'Scriptwriter',
    icon: PenTool, color: 'text-[#FF3B30]', bg: 'bg-[#FF3B30]/10', headerBg: 'bg-[#FF3B30]', hexColor: '#FF3B30',
    greeting: 'สวัสดีครับ! ผม Storyteller นักเล่าเรื่อง พร้อมช่วยสร้างสรรค์เนื้อหาครับ',
    quickActions: ['เขียนบทความ', 'สร้าง Content', 'เล่าเรื่อง'],
  },
  {
    id: 'visionary', name: 'Visionary', fullName: 'Visionary (The Dreamer)', role: 'Creative Strategist',
    icon: Lightbulb, color: 'text-[#9747FF]', bg: 'bg-[#9747FF]/10', headerBg: 'bg-[#9747FF]', hexColor: '#9747FF',
    greeting: 'สวัสดีครับ! ผม Visionary นักกลยุทธ์เชิงสร้างสรรค์ พร้อมช่วยคิดนอกกรอบครับ',
    quickActions: ['ระดมไอเดีย', 'คิด Innovation', 'วิเคราะห์แนวโน้ม'],
  },
  {
    id: 'visualarch', name: 'VisualArch', fullName: 'VisualArch (The Designer)', role: 'UI/UX Designer',
    icon: Palette, color: 'text-[#FF2D55]', bg: 'bg-[#FF2D55]/10', headerBg: 'bg-[#FF2D55]', hexColor: '#FF2D55',
    greeting: 'สวัสดีครับ! ผม VisualArch นักออกแบบ UI/UX พร้อมช่วยออกแบบครับ',
    quickActions: ['ออกแบบ UI', 'วิเคราะห์ UX', 'สร้าง Design System'],
  },
];

export function getAgent(id: string): AgentConfig | undefined {
  return agents.find(a => a.id === id);
}
