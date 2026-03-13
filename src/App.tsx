import { Routes, Route } from 'react-router-dom';
import AgentSelection from './pages/AgentSelection';
import ChatSession from './pages/ChatSession';

function App() {
  return (
    <Routes>
      <Route path="/" element={<AgentSelection />} />
      <Route path="/chat/:agentId" element={<ChatSession />} />
    </Routes>
  );
}

export default App;
