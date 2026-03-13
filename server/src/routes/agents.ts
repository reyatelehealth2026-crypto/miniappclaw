import { Router } from 'express';
import { agentDefs, getAgentDef } from '../config/agents.js';

export const agentRouter = Router();

/**
 * GET /api/agents — list all agents
 */
agentRouter.get('/', (_req, res) => {
  const publicAgents = agentDefs.map((a) => ({
    id: a.id,
    name: a.name,
    fullName: a.fullName,
    role: a.role,
    hexColor: a.hexColor,
    greeting: a.greeting,
    quickActions: a.quickActions,
  }));
  res.json({ agents: publicAgents });
});

/**
 * GET /api/agents/:id — get single agent
 */
agentRouter.get('/:id', (req, res) => {
  const agent = getAgentDef(req.params.id);
  if (!agent) {
    res.status(404).json({ error: 'Agent not found' });
    return;
  }
  res.json({
    id: agent.id,
    name: agent.name,
    fullName: agent.fullName,
    role: agent.role,
    hexColor: agent.hexColor,
    greeting: agent.greeting,
    quickActions: agent.quickActions,
  });
});
