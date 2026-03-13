import { useState } from 'react'
import AgentSelection from './pages/AgentSelection'
import ChatSession from './pages/ChatSession'

function App() {
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);

  if (selectedAgent) {
    return <ChatSession agentId={selectedAgent} onBack={() => setSelectedAgent(null)} />;
  }

  return <AgentSelection onSelectAgent={setSelectedAgent} />
}

export default App
