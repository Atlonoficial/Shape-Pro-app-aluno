import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { NativeIntegration } from '@/components/native/NativeIntegration'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <NativeIntegration />
    <App />
  </StrictMode>,
)
