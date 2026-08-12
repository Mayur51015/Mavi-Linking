import React, { createContext, useCallback, useContext, useState } from 'react';
import { AlertTriangle } from 'lucide-react';

const ConfirmContext = createContext(null);

export const ConfirmProvider = ({ children }) => {
  const [state, setState] = useState(null);

  // Returns a Promise<boolean> — resolves true if the user confirms.
  const confirm = useCallback((options) => {
    return new Promise((resolve) => {
      setState({
        title: options?.title || 'Are you sure?',
        message: options?.message || 'This action cannot be undone.',
        confirmLabel: options?.confirmLabel || 'Confirm',
        cancelLabel: options?.cancelLabel || 'Cancel',
        danger: options?.danger !== false,
        resolve,
      });
    });
  }, []);

  const handleClose = (result) => {
    if (state?.resolve) state.resolve(result);
    setState(null);
  };

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {state && (
        <div className="modal-overlay" onClick={() => handleClose(false)}>
          <div className="modal-content confirm-dialog" onClick={(e) => e.stopPropagation()}>
            <div className={`confirm-icon${state.danger ? ' confirm-icon-danger' : ''}`}>
              <AlertTriangle size={22} />
            </div>
            <h3 style={{ marginBottom: '0.5rem' }}>{state.title}</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>{state.message}</p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button
                className="btn"
                style={{ background: 'transparent', border: '1px solid var(--border-color)' }}
                onClick={() => handleClose(false)}
              >
                {state.cancelLabel}
              </button>
              <button
                className={state.danger ? 'btn btn-danger' : 'btn btn-primary'}
                onClick={() => handleClose(true)}
              >
                {state.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
};

export const useConfirm = () => {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error('useConfirm must be used within a ConfirmProvider');
  return ctx;
};