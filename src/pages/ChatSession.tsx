import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Send, Plus, Mic } from 'lucide-react';

const agentData = {
  verzey: { name: 'verzey (The Maestro)', color: 'bg-[#FFB020]' },
  coder: { name: 'Coder (The Architect)', color: 'bg-[#34C759]' },
  factchecker: { name: 'FactChecker (The Investigator)', color: 'bg-[#007AFF]' },
  headpilot: { name: 'HeadPilot (The Navigator)', color: 'bg-[#FF9500]' },
  'project-management': { name: 'Project-Management', color: 'bg-[#5856D6]' },
  storyteller: { name: 'Storyteller (The Narrator)', color: 'bg-[#FF3B30]' },
  visionary: { name: 'Visionary (The Dreamer)', color: 'bg-[#9747FF]' },
  visualarch: { name: 'VisualArch (The Designer)', color: 'bg-[#FF2D55]' }
};

interface ChatSessionProps {
  agentId: string;
  onBack: () => void;
}

export default function ChatSession({ agentId, onBack }: ChatSessionProps) {
  const [messages, setMessages] = useState<{ id: string, text: string, isOwn: boolean }[]>([
    { id: '1', text: `Hello! I am ${agentData[agentId as keyof typeof agentData]?.name || agentId}. How can I assist you today?`, isOwn: false }
  ]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const agent = agentData[agentId as keyof typeof agentData] || { name: agentId, color: 'bg-gray-500' };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const newMessage = { id: Date.now().toString(), text: input, isOwn: true };
    setMessages(prev => [...prev, newMessage]);
    setInput('');

    // Simulate Agent Reply
    setTimeout(() => {
      setMessages(prev => [
        ...prev, 
        { id: (Date.now() + 1).toString(), text: `I received: "${newMessage.text}". (Mock reply)`, isOwn: false }
      ]);
    }, 1000);
  };

  return (
    <div className="flex flex-col h-screen bg-[#F4F5F6]">
      {/* Header */}
      <header className="bg-white px-4 py-3 shadow-sm flex items-center pt-[calc(env(safe-area-inset-top)+12px)]">
        <button onClick={onBack} className="p-2 -ml-2 text-gray-600 hover:text-gray-900">
          <ArrowLeft size={24} />
        </button>
        <div className="flex items-center ml-2">
          <div className={`w-8 h-8 rounded-full ${agent.color} flex items-center justify-center text-white font-bold text-xs`}>
            {agent.name.charAt(0)}
          </div>
          <div className="ml-3">
            <h2 className="font-semibold text-gray-900 text-sm">{agent.name}</h2>
            <p className="text-xs text-green-500">Online</p>
          </div>
        </div>
      </header>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-24">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex w-full ${msg.isOwn ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl ${
              msg.isOwn 
                ? 'bg-[#06C755] text-white rounded-tr-sm' 
                : 'bg-white text-gray-900 shadow-sm rounded-tl-sm'
            }`}>
              <p className="text-[15px] leading-relaxed break-words">{msg.text}</p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="bg-white border-t p-3 pb-[calc(env(safe-area-inset-bottom)+12px)]">
        {/* Quick Actions */}
        <div className="flex space-x-2 overflow-x-auto pb-3 scrollbar-hide">
          {['Summarize', 'Explain code', 'Fix errors'].map((action) => (
            <button key={action} className="whitespace-nowrap px-4 py-1.5 bg-gray-100 rounded-full text-xs text-gray-700 hover:bg-gray-200 font-medium">
              {action}
            </button>
          ))}
        </div>
        
        <form onSubmit={handleSend} className="flex items-end gap-2">
          <button type="button" className="p-2 text-gray-400 hover:text-gray-600 mb-1">
            <Plus size={24} />
          </button>
          
          <div className="flex-1 bg-gray-100 rounded-2xl flex items-center px-4 py-1">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
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
            className={`p-2.5 rounded-full mb-0.5 ${input.trim() ? 'bg-[#06C755] text-white' : 'bg-gray-200 text-gray-400'}`}
          >
            <Send size={20} className="ml-0.5" />
          </button>
        </form>
      </div>
    </div>
  );
}
