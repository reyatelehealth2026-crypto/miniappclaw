import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { LiffProvider } from './components/layout/LiffProvider'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <LiffProvider>
      <App />
    </LiffProvider>
  </React.StrictMode>,
)
