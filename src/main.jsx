import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { registerSW } from 'virtual:pwa-register';
import App from './App.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import { ThemeProvider } from './context/ThemeContext.jsx';
import InstallPWA from './components/InstallPWA.jsx';
import ThemeToggle from './components/ThemeToggle.jsx';
import './index.css';

registerSW({ immediate: true });

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <div className="fixed right-3 top-3 z-[100] md:right-4 md:top-4">
            <ThemeToggle />
          </div>
          <App />
          <InstallPWA />
          <Toaster
            position="top-center"
            toastOptions={{
              className:
                '!bg-white !text-slate-900 !border !border-slate-200 dark:!bg-surface-850 dark:!text-slate-100 dark:!border-white/10',
              duration: 3200,
            }}
          />
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>
);
