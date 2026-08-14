import React, { useEffect, useRef, useState } from 'react';

const GoogleSignInButton = ({ onSuccess, onError, text = 'signin_with', requestedRole = 'user', disabled = false }) => {
  const buttonRef = useRef(null);
  const rawClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
  const clientId = rawClientId.trim();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const handleCredentialResponse = (response) => {
      setLoading(false);
      if (response && response.credential) {
        onSuccess(response.credential);
      } else if (onError) {
        onError('Google Sign-In credential response was empty.');
      }
    };

    const initializeGoogleSignIn = () => {
      if (!clientId) return;
      if (window.google && window.google.accounts && window.google.accounts.id) {
        try {
          window.google.accounts.id.initialize({
            client_id: clientId,
            callback: handleCredentialResponse,
            auto_select: false,
          });

          if (buttonRef.current) {
            buttonRef.current.innerHTML = '';
            window.google.accounts.id.renderButton(buttonRef.current, {
              theme: 'filled_black',
              size: 'large',
              text: text,
              width: '100%',
              shape: 'rectangular',
            });
          }
        } catch (err) {
          console.warn('Google GSI button error:', err);
        }
      }
    };

    if (window.google && window.google.accounts) {
      initializeGoogleSignIn();
    } else {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = initializeGoogleSignIn;
      document.body.appendChild(script);
    }
  }, [clientId, text, onSuccess, onError]);

  const buttonLabel = text === 'signup_with' ? 'Sign up with Google' : 'Continue with Google';

  return (
    <div className="google-btn-container">
      <button
        type="button"
        className={`google-btn-liquid-glass ${disabled || loading ? 'disabled' : ''}`}
        disabled={disabled || loading}
        aria-label={buttonLabel}
      >
        <div className="google-icon-wrapper">
          <svg width="18" height="18" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
          </svg>
        </div>
        <span className="google-btn-text">
          {loading ? 'Connecting to Google...' : buttonLabel}
        </span>
        <div ref={buttonRef} className="google-gis-overlay" aria-hidden="true" />
      </button>
    </div>
  );
};

export default GoogleSignInButton;
