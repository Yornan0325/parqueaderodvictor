import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

import { BrowserRouter } from 'react-router-dom'
import { ThemeProvider } from './components/theme-provider.tsx'

import { Toaster } from 'sonner'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { PrinterProvider } from './hooks/use-printer'

const queryClient = new QueryClient()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <PrinterProvider>
        <ThemeProvider 
          attribute="class"
          defaultTheme="dark"
          enableSystem
          storageKey="vite-ui-theme"
        >
          <QueryClientProvider client={queryClient}>
            <App />
          </QueryClientProvider>
          <Toaster position="top-right" richColors closeButton />
        </ThemeProvider>
      </PrinterProvider>
    </BrowserRouter>
  </StrictMode>,
)
