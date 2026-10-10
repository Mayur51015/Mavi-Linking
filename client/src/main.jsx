import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { ToastProvider } from './context/ToastContext';
import { ConfirmProvider } from './context/ConfirmContext';

// Ensure legacy theme storage is purged for permanent clean light SaaS mode
try {
  localStorage.removeItem('theme');
  document.documentElement.removeAttribute('data-theme');
} catch {
  /* Ignore browser security errors in restricted iframe/sandbox environments */
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ToastProvider>
      <ConfirmProvider>
        <AuthProvider>
          <NotificationProvider>
            <App />
          </NotificationProvider>
        </AuthProvider>
      </ConfirmProvider>
    </ToastProvider>
  </React.StrictMode>,
);