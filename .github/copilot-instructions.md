# Copilot instructions for openclaw-connect

## Big picture
- This repo is primarily a Vite + React 19 + TypeScript frontend. The actual app flow is a two-screen LINE LIFF mini-app, not a generic web dashboard.
- App boot starts in `src/main.tsx`, which always wraps the UI in `LiffProvider` before rendering `App`. Treat LIFF initialization as a required gate, not optional plumbing.
- `src/App.tsx` uses local component state (`selectedAgent`) to switch between `AgentSelection` and `ChatSession`; `react-router-dom` is installed but not used yet.
- `src/components/layout/LiffProvider.tsx` is the only real integration point today. It initializes `@line/liff`, loads the LINE profile, triggers `liff.login()` when outside the LINE client, and shows dedicated loading/error full-screen states.
- `src/pages/AgentSelection.tsx` is currently a static agent catalog. The `agents` array is the source of truth for selectable personas and drives labels, icons, and colors.
- `src/pages/ChatSession.tsx` is still prototype-level UI: messages live in local state, quick actions are static, and agent replies are mocked with `setTimeout`.
- There is a `server/` package plus `.env` entries (`VITE_API_URL`, `VITE_WS_URL`), but the frontend does not call them yet. Preserve the current mock-chat behavior unless you are explicitly wiring the next backend integration.

## Working in this codebase
- Install frontend deps with `npm install`, then run `npm run dev` from the repo root.
- Plain local HTTP dev URLs are not enough for actual LIFF startup. LINE endpoint configuration requires HTTPS, so browser-only local runs are fine for UI work, but real LIFF verification needs an HTTPS tunnel or deployed URL.
- Production build is `npm run build` and runs `tsc -b && vite build`; TypeScript strictness matters because `noUnusedLocals` and `noUnusedParameters` are enabled.
- `npm run lint` uses the flat ESLint config in `eslint.config.js`.
- The current build is broken by an unused `React` import in `src/pages/AgentSelection.tsx`; remove unused imports instead of suppressing the rule.
- There are no meaningful automated tests yet. Do not claim test coverage unless you add it.

## Project-specific conventions
- Prefer function components with local hooks over global state. `zustand`, `axios`, `socket.io-client`, and `react-router-dom` are installed but unused in the current frontend.
- Keep the LIFF lifecycle inside `LiffProvider`; components should consume LIFF state through `useLiff()` instead of calling `liff` directly.
- Match the existing mobile-first layout patterns: full-screen containers, LINE-style spacing, safe-area paddings (`env(safe-area-inset-*)`), rounded cards, and subdued gray backgrounds.
- Styling is utility-first. Tailwind v4 is enabled through `@import "tailwindcss"` in `src/index.css` plus `postcss.config.js`; `tailwind.config.js` still defines custom colors such as `line.green` and `agent.*`.
- Existing pages hardcode agent metadata in module-level objects (`agents` / `agentData`). If you add fields, update both screens or centralize the config first.
- Keep loading and failure UX explicit. `LiffProvider` already renders branded full-screen loading and error states; new async flows should feel consistent.

## Integration notes
- Required env var for startup: `VITE_LIFF_ID`. Without it, LIFF initialization fails before the app renders.
- LINE Developers Console endpoint URLs must be HTTPS. Do not assume `http://localhost:*` can be registered as the LIFF endpoint; use local HTTP only for isolated frontend work, and use HTTPS exposure when validating real LIFF login/init behavior.
- `.env` currently includes `VITE_API_URL=http://localhost:3000/api` and `VITE_WS_URL=http://localhost:3000`, which indicate the intended API/WebSocket boundary for future chat work.
- The checked-in `server/` package has dependencies for Express, CORS, dotenv, axios, and Socket.IO, but `server/src` is empty. Treat backend behavior as undefined until implemented.

## When making changes
- First decide whether the change belongs to the current prototype flow (local state, mocked responses) or to a real backend integration; do not mix both accidentally.
- Preserve the current agent-selection → chat-session flow unless the task explicitly introduces routing.
- Clean up leftover Vite template artifacts when touching related files (for example, `src/App.css` is still template code and is not part of the current UI architecture).
