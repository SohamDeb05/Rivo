import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ThemeProvider } from 'next-themes'
import { GoogleOAuthProvider } from '@react-oauth/google'
import App from './App.tsx'

const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || 'dummy_client_id.apps.googleusercontent.com';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <GoogleOAuthProvider clientId={clientId}>
      <ThemeProvider attribute="class" defaultTheme="dark">
        <App />
      </ThemeProvider>
    </GoogleOAuthProvider>
  </StrictMode>,
)
