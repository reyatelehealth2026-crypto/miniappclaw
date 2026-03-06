---
name: brainliftup-memory
description: Local long-term memory for OpenClaw agents via BrainLiftUp Memory Service (FastAPI on http://127.0.0.1:8080). Use this whenever the user says the agent forgets between sessions, wants preferences/protocols remembered, or when you should recall user preferences/protocols/domain knowledge. Performs hybrid retrieval (Qdrant + SQLite FTS5) behind the service. Also use this to store new stable preferences/protocols/decisions after finishing a task.
---

# BrainLiftUp — LocalMemorySystem (Service-backed)

This skill makes *every session* memory-aware by reading/writing to the local Memory Service.

## Endpoints
- Health: `GET http://127.0.0.1:8080/health`
- Upsert: `POST http://127.0.0.1:8080/memories/upsert`
- Query:  `POST http://127.0.0.1:8080/memories/query`

## Namespaces (2-layer)
**Shared (all agents):**
- `shared/preferences`
- `shared/protocols`

**Private (per-agent):**
- `private/<agent>/domain`

Where `<agent>` is one of:
- `main`
- `mint`
- `scribe`
- `blotato-writer`
(or any other agent name you standardize on)

## Mandatory retrieval protocol (do this before answering)
1) Decide the active agent name (e.g., `main`).
2) Call query with namespaces:
   - `shared/preferences`
   - `shared/protocols`
   - `private/<agent>/domain`
3) Prepend the returned `assembled_context` into your working context and apply it.

### Query example (use exec tool)
```bash
curl -s http://127.0.0.1:8080/memories/query \
  -H 'content-type: application/json' \
  -d '{
    "agent_name":"main",
    "query":"<user request / what you need to recall>",
    "namespaces":["shared/preferences","shared/protocols","private/main/domain"],
    "topK":12
  }'
```

## Mandatory write-back protocol (do this after finishing)
If you learn something that will matter again in future sessions, upsert it:
- **Preferences** (tone, format, rules) → `shared/preferences`
- **Protocols** (workflows, safety constraints, how to collaborate) → `shared/protocols`
- **Domain knowledge** specific to an agent → `private/<agent>/domain`

### Upsert example
```bash
curl -s http://127.0.0.1:8080/memories/upsert \
  -H 'content-type: application/json' \
  -d '{
    "namespace":"shared/preferences",
    "type":"preference",
    "content":"<thing to remember>",
    "tags":["workflow"],
    "source":"user",
    "importance":0.95
  }'
```

## Conflict rule
When instructions conflict:
1) shared protocols
2) shared preferences
3) private domain
4) current user message (unless it violates higher rules)

## What NOT to store
- secrets/credentials (API keys, passwords)
- personal identifiers unless user explicitly asks
