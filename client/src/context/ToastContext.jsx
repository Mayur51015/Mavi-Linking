import React, { createContext, useCallback, useContext, useRef, useState } from 'react';
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

// Lets code outside the React tree (e.g. the axios interceptor) trigger a
// toast without needing a hook.
let externalNotify = null;
export function notify(type, message) {
  if (externalNotify) externalNotify(type, message);
}

const ICONS = {
  success: <CheckCircle2 size={20} />,
  error: <XCircle size={20} />,
  warning: <AlertTriangle size={20} />,
  info: <Info size={20} />,
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const idRef = useRef(0);

  const remove = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const push = useCallback((type, message, duration = 5000) => {
    const id = ++idRef.current;
    setToasts((prev) => [...prev, { id, type, message }]);
    if (duration > 0) setTimeout(() => remove(id), duration);
  }, [remove]);

  externalNotify = push;

  const value = {
    success: (msg, duration) => push('success', msg, duration),
    error: (msg, duration) => push('error', msg, duration),
    warning: (msg, duration) => push('warning', msg, duration),
    info: (msg, duration) => push('info', msg, duration),
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toast-container" role="status" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`toast toast-${t.type}`}>
            <span className="toast-icon">{ICONS[t.type]}</span>
            <span className="toast-message">{t.message}</span>
            <button className="toast-close" onClick={() => remove(t.id)} aria-label="Dismiss">
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within a ToastProvider');
  return ctx;
};