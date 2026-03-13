import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import { LiffProvider } from './components/layout/LiffProvider';
import App from './App.tsx';
import './index.css';

// LiffProvider gates rendering until LIFF init completes,
// so HashRouter won't mount (and change the URL hash) during init.
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <LiffProvider>
      <HashRouter>
        <App />
      </HashRouter>
    </LiffProvider>
  </StrictMode>,
);
